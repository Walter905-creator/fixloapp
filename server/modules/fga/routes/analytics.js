'use strict';

/**
 * FGA Analytics API — /api/fga/analytics
 *
 * Exposes historical and real-time analytics data to admin consumers.
 */

const router    = require('express').Router();
const fgaAuth   = require('../middleware/fgaAuth');
const analytics = require('../analytics/analyticsService');
const FGAActivity = require('../models/FGAActivity');
const FGAMessage  = require('../models/FGAMessage');

// ── GET /api/fga/analytics/today ──────────────────────────────────────────────
router.get('/today', fgaAuth, async (req, res) => {
  try {
    const snapshot = await analytics.getToday();
    return res.json({ ok: true, analytics: snapshot || {} });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET /api/fga/analytics/range?from=YYYY-MM-DD&to=YYYY-MM-DD ───────────────
router.get('/range', fgaAuth, async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await analytics.getRange(from, to);
    return res.json({ ok: true, analytics: data, count: data.length });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET /api/fga/analytics/communication ──────────────────────────────────────
router.get('/communication', fgaAuth, async (req, res) => {
  try {
    const days = Math.min(Number(req.query.days) || 7, 90);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [byChannel, byStatus] = await Promise.all([
      FGAMessage.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$channel', count: { $sum: 1 } } },
      ]),
      FGAMessage.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    return res.json({ ok: true, byChannel, byStatus, days });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET /api/fga/analytics/activity ──────────────────────────────────────────
router.get('/activity', fgaAuth, async (req, res) => {
  try {
    const days = Math.min(Number(req.query.days) || 7, 30);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const limit = Math.min(Number(req.query.limit) || 100, 500);

    const entries = await FGAActivity.find({ timestamp: { $gte: since } })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return res.json({ ok: true, activity: entries, count: entries.length });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
