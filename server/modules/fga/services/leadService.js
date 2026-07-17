'use strict';

/**
 * FGA Lead Service
 *
 * All CRUD operations for FGALead.  Every mutating operation:
 *   1. Persists the change to MongoDB
 *   2. Appends a timeline entry
 *   3. Publishes the appropriate FGA event
 *   4. Increments analytics counters
 */

const { randomUUID } = require('crypto');
const mongoose = require('mongoose');

const FGALead     = require('../models/FGALead');
const eventBus    = require('../events/eventBus');
const FGA_EVENTS  = require('../events/eventTypes');
const timeline    = require('../timeline/timelineService');
const analytics   = require('../analytics/analyticsService');

// ── Helpers ───────────────────────────────────────────────────────────────────

const ANALYTICS_FIELD_MAP = {
  homeowner:    'leadsHomeowner',
  professional: 'leadsProfessional',
  recruiter:    'leadsRecruiter',
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Create a new lead.
 *
 * @param {object} data  - Lead fields (see FGALead schema)
 * @param {object} [actorCtx] - { type, id, label } for timeline
 * @returns {Promise<FGALead>}
 */
async function create(data = {}, actorCtx = {}) {
  const lead = await FGALead.create({
    ...data,
    uuid: data.uuid || randomUUID(),
  });

  // Timeline
  await timeline.append({
    leadId:    lead._id,
    eventType: FGA_EVENTS.LEAD_CREATED,
    actor:     actorCtx,
    metadata:  { source: lead.source, leadType: lead.leadType },
  });

  // Analytics
  await analytics.increment('leadsTotal');
  const typeField = ANALYTICS_FIELD_MAP[lead.leadType];
  if (typeField) await analytics.increment(typeField);

  // Event
  await eventBus.publish(FGA_EVENTS.LEAD_CREATED, {
    leadId:   lead._id,
    uuid:     lead.uuid,
    leadType: lead.leadType,
    source:   lead.source,
    email:    lead.email,
    phone:    lead.phone,
    name:     lead.name,
  });

  return lead;
}

/**
 * Update a lead's fields.
 *
 * @param {*}       leadId  - FGALead._id
 * @param {object}  updates - Fields to update
 * @param {object}  [actorCtx]
 * @returns {Promise<FGALead|null>}
 */
async function update(leadId, updates = {}, actorCtx = {}) {
  const lead = await FGALead.findByIdAndUpdate(
    leadId,
    { $set: updates },
    { new: true }
  );
  if (!lead) return null;

  await timeline.append({
    leadId:    lead._id,
    eventType: FGA_EVENTS.LEAD_UPDATED,
    actor:     actorCtx,
    metadata:  { updatedFields: Object.keys(updates) },
  });

  await eventBus.publish(FGA_EVENTS.LEAD_UPDATED, { leadId: lead._id, updates });
  return lead;
}

/**
 * Assign a lead to a recruiter.
 *
 * @param {*}       leadId       - FGALead._id
 * @param {*}       recruiterId  - RecruiterProfile._id
 * @param {object}  [actorCtx]
 * @returns {Promise<FGALead|null>}
 */
async function assign(leadId, recruiterId, actorCtx = {}) {
  const lead = await FGALead.findByIdAndUpdate(
    leadId,
    { $set: { assignedRecruiter: recruiterId } },
    { new: true }
  );
  if (!lead) return null;

  await timeline.append({
    leadId:    lead._id,
    eventType: FGA_EVENTS.LEAD_ASSIGNED,
    actor:     actorCtx,
    metadata:  { recruiterId },
  });

  await eventBus.publish(FGA_EVENTS.LEAD_ASSIGNED, { leadId: lead._id, recruiterId });
  return lead;
}

/**
 * Deactivate a lead (soft delete).
 *
 * @param {*}       leadId  - FGALead._id
 * @param {string}  reason  - Why it was deactivated
 * @param {object}  [actorCtx]
 * @returns {Promise<FGALead|null>}
 */
async function deactivate(leadId, reason = '', actorCtx = {}) {
  const lead = await FGALead.findByIdAndUpdate(
    leadId,
    {
      $set: {
        isActive:      false,
        deactivatedAt: new Date(),
        deactivatedBy: actorCtx.label || 'admin',
        status:        'inactive',
      },
    },
    { new: true }
  );
  if (!lead) return null;

  await timeline.append({
    leadId:    lead._id,
    eventType: FGA_EVENTS.LEAD_DEACTIVATED,
    actor:     actorCtx,
    metadata:  { reason },
  });

  await eventBus.publish(FGA_EVENTS.LEAD_DEACTIVATED, { leadId: lead._id, reason });
  return lead;
}

/**
 * Merge duplicate lead into a target lead.
 *
 * @param {*}  sourceLeadId  - Lead to merge FROM (will be deactivated)
 * @param {*}  targetLeadId  - Lead to merge INTO
 * @param {object} [actorCtx]
 */
async function merge(sourceLeadId, targetLeadId, actorCtx = {}) {
  const [source, target] = await Promise.all([
    FGALead.findById(sourceLeadId),
    FGALead.findById(targetLeadId),
  ]);
  if (!source || !target) throw new Error('Lead not found');

  // Merge tags
  const mergedTags = [...new Set([...target.tags, ...source.tags])];
  await FGALead.findByIdAndUpdate(targetLeadId, {
    $set: { tags: mergedTags },
  });

  // Deactivate source
  await FGALead.findByIdAndUpdate(sourceLeadId, {
    $set: {
      isActive:        false,
      status:          'duplicate',
      deactivatedAt:   new Date(),
      mergedIntoLeadId: targetLeadId,
    },
  });

  await timeline.append({
    leadId:    targetLeadId,
    eventType: FGA_EVENTS.LEAD_MERGED,
    actor:     actorCtx,
    metadata:  { mergedFromLeadId: sourceLeadId },
  });

  await eventBus.publish(FGA_EVENTS.LEAD_MERGED, { sourceLeadId, targetLeadId });
}

/**
 * Find a lead by UUID.
 *
 * @param {string} uuid
 * @returns {Promise<FGALead|null>}
 */
async function findByUUID(uuid) {
  return FGALead.findOne({ uuid }).lean();
}

/**
 * Search leads with explicit allowlist filters.
 * Accepts only pre-validated filter objects from callers (admin routes).
 *
 * @param {object} filters      - Named filter conditions (string values only)
 * @param {string} [searchQuery] - Optional full-text search across name/email/phone
 * @param {object} [options]    - { limit, skip, sort }
 * @returns {Promise<{ leads: FGALead[], total: number }>}
 */
async function search(filters = {}, searchQuery, options = {}) {
  // Build a clean query with only permitted top-level keys to prevent
  // arbitrary operator injection from reaching MongoDB.
  const ALLOWED_FIELDS = new Set([
    'status', 'leadType', 'source', 'email', 'phone', 'name',
    'city', 'state', 'zip', 'tags', 'isActive', 'assignedRecruiter',
  ]);
  const safeQuery = { isActive: true };
  for (const [key, value] of Object.entries(filters)) {
    if (ALLOWED_FIELDS.has(key)) {
      safeQuery[key] = value;
    }
  }

  // Full-text search across name/email/phone — built internally, not from caller
  if (searchQuery && typeof searchQuery === 'string' && searchQuery.length > 0) {
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = { $regex: escaped, $options: 'i' };
    safeQuery.$or = [
      { name:  pattern },
      { email: pattern },
      { phone: pattern },
    ];
  }

  const limit = Math.min(options.limit || 50, 200);
  const skip  = options.skip  || 0;
  const sort  = options.sort  || { createdAt: -1 };

  const [leads, total] = await Promise.all([
    FGALead.find(safeQuery).sort(sort).skip(skip).limit(limit).lean(),
    FGALead.countDocuments(safeQuery),
  ]);

  return { leads, total };
}

module.exports = { create, update, assign, deactivate, merge, findByUUID, search };
