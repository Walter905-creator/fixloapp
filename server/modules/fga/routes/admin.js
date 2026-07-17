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

// ── GET /api/fga/admin/crm — search CRM profiles ─────────────────────────────
router.get('/crm', fgaAuth, async (req, res) => {
  try {
    const { email, name, profileType, limit = 50, skip = 0 } = req.query;
    const query = {};
    if (profileType) query.profileType = profileType;
    if (email) query.email = { $regex: email, $options: 'i' };
    if (name)  query.name  = { $regex: name,  $options: 'i' };

    const [profiles, total] = await Promise.all([
      FGACRMProfile.find(query)
        .sort({ lastActivityAt: -1 })
        .skip(Number(skip) || 0)
        .limit(Math.min(Number(limit) || 50, 200))
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
    const { channel, status, leadId, limit = 50, skip = 0 } = req.query;
    const query = {};
    if (channel) query.channel = channel;
    if (status)  query.status  = status;
    if (leadId)  query.leadId  = leadId;

    const [messages, total] = await Promise.all([
      FGAMessage.find(query)
        .sort({ createdAt: -1 })
        .skip(Number(skip) || 0)
        .limit(Math.min(Number(limit) || 50, 200))
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
    const { userId, userType, action, status, limit = 50, skip = 0 } = req.query;
    const query = {};
    if (userId)   query.userId   = userId;
    if (userType) query.userType = userType;
    if (action)   query.action   = { $regex: action, $options: 'i' };
    if (status)   query.status   = status;

    const [entries, total] = await Promise.all([
      FGAActivity.find(query)
        .sort({ timestamp: -1 })
        .skip(Number(skip) || 0)
        .limit(Math.min(Number(limit) || 50, 200))
        .lean(),
      FGAActivity.countDocuments(query),
    ]);

    return res.json({ ok: true, activity: entries, total });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
