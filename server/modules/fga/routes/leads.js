'use strict';

/**
 * FGA Leads API — /api/fga/leads
 *
 * All routes require admin authentication.
 * Provides CRUD + search + admin tools for FGA Leads.
 */

const router     = require('express').Router();
const mongoose   = require('mongoose');
const fgaAuth    = require('../middleware/fgaAuth');
const leadSvc    = require('../services/leadService');
const FGALead    = require('../models/FGALead');
const timeline   = require('../timeline/timelineService');
const actLogger  = require('../services/activityLogger');
const comm       = require('../communication/communicationCenter');

// ── Helper ───────────────────────────────────────────────────────────────────

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ── GET /api/fga/leads — search/filter leads ─────────────────────────────────
router.get('/', fgaAuth, async (req, res) => {
  try {
    const {
      status, leadType, source, email, phone, name,
      city, state, tag, q,
      limit = 50, skip = 0,
    } = req.query;

    const filters = {};
    if (status)   filters.status   = status;
    if (leadType) filters.leadType = leadType;
    if (source)   filters.source   = source;
    if (email)    filters.email    = { $regex: email, $options: 'i' };
    if (phone)    filters.phone    = { $regex: phone, $options: 'i' };
    if (name)     filters.name     = { $regex: name,  $options: 'i' };
    if (city)     filters.city     = { $regex: city,  $options: 'i' };
    if (state)    filters.state    = state;
    if (tag)      filters.tags     = tag;
    if (q) {
      filters.$or = [
        { name:  { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }

    const result = await leadSvc.search(filters, {
      limit: Math.min(Number(limit) || 50, 200),
      skip:  Number(skip) || 0,
    });

    return res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[FGA:Leads] GET / error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── POST /api/fga/leads — create a new lead (manual admin entry) ──────────────
router.post('/', fgaAuth, async (req, res) => {
  try {
    const {
      leadType, source = 'admin_manual', name, email, phone,
      trade, city, state, zip, campaign, utm, tags, metadata,
    } = req.body || {};

    if (!leadType) {
      return res.status(400).json({ ok: false, error: 'leadType is required' });
    }

    const lead = await leadSvc.create(
      { leadType, source, name, email, phone, trade, city, state, zip, campaign, utm, tags, metadata },
      { type: 'admin', id: req.user?.id, label: req.user?.email || 'Admin' }
    );

    await actLogger.log(req, {
      action:     'lead.created',
      resource:   'FGALead',
      resourceId: lead._id,
      userId:     req.user?.id,
      userType:   'admin',
    });

    return res.status(201).json({ ok: true, lead });
  } catch (err) {
    console.error('[FGA:Leads] POST / error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET /api/fga/leads/:id — get one lead ────────────────────────────────────
router.get('/:id', fgaAuth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ ok: false, error: 'Invalid lead ID' });
    }
    const lead = await FGALead.findById(req.params.id).lean();
    if (!lead) return res.status(404).json({ ok: false, error: 'Lead not found' });
    return res.json({ ok: true, lead });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── PATCH /api/fga/leads/:id — update a lead ─────────────────────────────────
router.patch('/:id', fgaAuth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ ok: false, error: 'Invalid lead ID' });
    }

    // Strip protected fields
    const { uuid, _id, createdAt, ...updates } = req.body || {};

    const lead = await leadSvc.update(
      req.params.id,
      updates,
      { type: 'admin', id: req.user?.id, label: req.user?.email || 'Admin' }
    );
    if (!lead) return res.status(404).json({ ok: false, error: 'Lead not found' });

    return res.json({ ok: true, lead });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── POST /api/fga/leads/:id/deactivate ───────────────────────────────────────
router.post('/:id/deactivate', fgaAuth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ ok: false, error: 'Invalid lead ID' });
    }

    const { reason = '' } = req.body || {};
    const lead = await leadSvc.deactivate(
      req.params.id,
      reason,
      { type: 'admin', id: req.user?.id, label: req.user?.email || 'Admin' }
    );
    if (!lead) return res.status(404).json({ ok: false, error: 'Lead not found' });

    return res.json({ ok: true, lead });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── POST /api/fga/leads/merge — merge two leads ───────────────────────────────
router.post('/merge', fgaAuth, async (req, res) => {
  try {
    const { sourceLeadId, targetLeadId } = req.body || {};
    if (!isValidId(sourceLeadId) || !isValidId(targetLeadId)) {
      return res.status(400).json({ ok: false, error: 'sourceLeadId and targetLeadId must be valid IDs' });
    }
    if (sourceLeadId === targetLeadId) {
      return res.status(400).json({ ok: false, error: 'Cannot merge a lead with itself' });
    }

    await leadSvc.merge(
      sourceLeadId,
      targetLeadId,
      { type: 'admin', id: req.user?.id, label: req.user?.email || 'Admin' }
    );

    return res.json({ ok: true, message: 'Leads merged successfully', targetLeadId });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET /api/fga/leads/:id/timeline — get lead timeline ──────────────────────
router.get('/:id/timeline', fgaAuth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ ok: false, error: 'Invalid lead ID' });
    }
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const entries = await timeline.getTimeline(req.params.id, limit);
    return res.json({ ok: true, timeline: entries, count: entries.length });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── POST /api/fga/leads/:id/resend-email ─────────────────────────────────────
router.post('/:id/resend-email', fgaAuth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ ok: false, error: 'Invalid lead ID' });
    }

    const lead = await FGALead.findById(req.params.id).lean();
    if (!lead) return res.status(404).json({ ok: false, error: 'Lead not found' });
    if (!lead.email) return res.status(400).json({ ok: false, error: 'Lead has no email address' });

    const { subject, html } = req.body || {};
    if (!subject || !html) {
      return res.status(400).json({ ok: false, error: 'subject and html are required' });
    }

    const msg = await comm.sendEmail({
      to:            lead.email,
      subject,
      html,
      leadId:        lead._id,
      triggerEvent:  'admin_resend',
      recipientType: lead.leadType,
    });

    return res.json({ ok: true, message: 'Email queued', status: msg?.status });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── POST /api/fga/leads/:id/resend-sms ───────────────────────────────────────
router.post('/:id/resend-sms', fgaAuth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ ok: false, error: 'Invalid lead ID' });
    }

    const lead = await FGALead.findById(req.params.id).lean();
    if (!lead) return res.status(404).json({ ok: false, error: 'Lead not found' });
    if (!lead.phone) return res.status(400).json({ ok: false, error: 'Lead has no phone number' });

    const { body } = req.body || {};
    if (!body) return res.status(400).json({ ok: false, error: 'body is required' });

    const msg = await comm.sendSms({
      to:            lead.phone,
      body,
      leadId:        lead._id,
      triggerEvent:  'admin_resend',
      recipientType: lead.leadType,
    });

    return res.json({ ok: true, message: 'SMS queued', status: msg?.status });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
