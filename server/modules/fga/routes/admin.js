'use strict';

/**
 * FGA Admin Tools API — /api/fga/admin
 *
 * Advanced admin operations: CRM lookup, message history, activity search.
 */

const router       = require('express').Router();
const fgaAuth      = require('../middleware/fgaAuth');
const FGACRMProfile = require('../models/FGACRMProfile');
const FGAMessage    = require('../models/FGAMessage');
const FGAActivity   = require('../models/FGAActivity');
const crmSvc        = require('../crm/crmService');

// Escape user-supplied strings before using them in MongoDB $regex queries
// to prevent NoSQL injection via malformed patterns.
function escapeRegex(str) {
  return typeof str === 'string'
    ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    : '';
}

// Max results per page
const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

// ── GET /api/fga/admin/crm — search CRM profiles ─────────────────────────────
router.get('/crm', fgaAuth, async (req, res) => {
  try {
    const { email, name, profileType, limit = DEFAULT_LIMIT, skip = 0 } = req.query;
    const query = {};
    if (profileType && typeof profileType === 'string') query.profileType = profileType;
    if (email) query.email = { $regex: escapeRegex(email), $options: 'i' };
    if (name)  query.name  = { $regex: escapeRegex(name),  $options: 'i' };

    const [profiles, total] = await Promise.all([
      FGACRMProfile.find(query)
        .sort({ lastActivityAt: -1 })
        .skip(Number(skip) || 0)
        .limit(Math.min(Number(limit) || DEFAULT_LIMIT, MAX_LIMIT))
        .lean(),
      FGACRMProfile.countDocuments(query),
    ]);

    return res.json({ ok: true, profiles, total });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET /api/fga/admin/crm/:profileType/:linkedId ─────────────────────────────
router.get('/crm/:profileType/:linkedId', fgaAuth, async (req, res) => {
  try {
    const { profileType, linkedId } = req.params;
    const profile = await crmSvc.getProfile(profileType, linkedId);
    if (!profile) return res.status(404).json({ ok: false, error: 'CRM profile not found' });
    return res.json({ ok: true, profile });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── PATCH /api/fga/admin/crm/:profileType/:linkedId — add tag/note ────────────
router.patch('/crm/:profileType/:linkedId', fgaAuth, async (req, res) => {
  try {
    const { profileType, linkedId } = req.params;
    const { tag, note } = req.body || {};
    await crmSvc.annotate(profileType, linkedId, { tag, note });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET /api/fga/admin/messages — communication history ───────────────────────
router.get('/messages', fgaAuth, async (req, res) => {
  try {
    const { channel, status, leadId, limit = DEFAULT_LIMIT, skip = 0 } = req.query;
    const query = {};
    if (channel && typeof channel === 'string') query.channel = channel;
    if (status  && typeof status  === 'string') query.status  = status;
    if (leadId  && typeof leadId  === 'string') query.leadId  = leadId;

    const [messages, total] = await Promise.all([
      FGAMessage.find(query)
        .sort({ createdAt: -1 })
        .skip(Number(skip) || 0)
        .limit(Math.min(Number(limit) || DEFAULT_LIMIT, MAX_LIMIT))
        .lean(),
      FGAMessage.countDocuments(query),
    ]);

    return res.json({ ok: true, messages, total });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET /api/fga/admin/activity — activity log ────────────────────────────────
router.get('/activity', fgaAuth, async (req, res) => {
  try {
    const { userId, userType, action, status, limit = DEFAULT_LIMIT, skip = 0 } = req.query;
    const query = {};
    if (userId   && typeof userId   === 'string') query.userId   = userId;
    if (userType && typeof userType === 'string') query.userType = userType;
    if (action   && typeof action   === 'string') query.action   = { $regex: escapeRegex(action), $options: 'i' };
    if (status   && typeof status   === 'string') query.status   = status;

    const [entries, total] = await Promise.all([
      FGAActivity.find(query)
        .sort({ timestamp: -1 })
        .skip(Number(skip) || 0)
        .limit(Math.min(Number(limit) || DEFAULT_LIMIT, MAX_LIMIT))
        .lean(),
      FGAActivity.countDocuments(query),
    ]);

    return res.json({ ok: true, activity: entries, total });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
