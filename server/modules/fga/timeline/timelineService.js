'use strict';

/**
 * FGA Timeline Service
 *
 * Provides a simple API for appending and querying timeline entries
 * for any FGA Lead.
 */

const FGATimeline = require('../models/FGATimeline');

/**
 * Append a new entry to a lead's timeline.
 *
 * @param {object} opts
 * @param {*}       opts.leadId      - FGALead._id
 * @param {string}  opts.eventType   - FGA event type string
 * @param {object}  [opts.actor]     - { type, id, label }
 * @param {object}  [opts.metadata]  - Free-form extra data
 * @returns {Promise<FGATimeline>}
 */
async function append(opts = {}) {
  const { leadId, eventType, actor = {}, metadata = {} } = opts;

  if (!leadId || !eventType) {
    console.warn('[FGA:Timeline] ⚠️ append() called without leadId or eventType — skipped');
    return null;
  }

  try {
    const entry = await FGATimeline.create({
      leadId,
      eventType,
      actor: {
        type:  actor.type  || 'system',
        id:    actor.id    || null,
        label: actor.label || 'System',
      },
      metadata,
      timestamp: new Date(),
    });
    return entry;
  } catch (err) {
    // Avoid user-controlled data in format-string position
    console.error('[FGA:Timeline] ❌ Failed to append timeline entry:', err.message);
    return null;
  }
}

/**
 * Retrieve the complete timeline for a lead, newest first.
 *
 * @param {*}      leadId  - FGALead._id
 * @param {number} [limit] - Max entries to return (default: 100)
 * @returns {Promise<FGATimeline[]>}
 */
async function getTimeline(leadId, limit = 100) {
  return FGATimeline.find({ leadId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
}

/**
 * Count timeline entries of a specific event type for a lead.
 *
 * @param {*}      leadId     - FGALead._id
 * @param {string} eventType  - Event type to count
 * @returns {Promise<number>}
 */
async function countByType(leadId, eventType) {
  return FGATimeline.countDocuments({ leadId, eventType });
}

module.exports = { append, getTimeline, countByType };
