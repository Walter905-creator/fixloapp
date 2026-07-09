/**
 * FGE Analytics Routes
 * GET  /api/fge/analytics/snapshot      – today's metrics
 * GET  /api/fge/analytics/range         – date-range aggregation
 * POST /api/fge/analytics/record        – write a daily snapshot (internal/cron use)
 * GET  /api/fge/analytics/top-cities    – top cities by visits
 * GET  /api/fge/analytics/top-services  – top services by requests
 */

'use strict';

const router = require('express').Router();
const requireAuth = require('../../../middleware/requireAuth');
const requireAdmin = require('../../../middleware/requireAdmin');
const FGEAnalytics = require('../models/FGEAnalytics');
const { posInt } = require('../middleware/sanitize');

router.use(requireAuth, requireAdmin);

// ─── Today's snapshot ─────────────────────────────────────────────────────────

router.get('/snapshot', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const snapshot = await FGEAnalytics.findOne({ date: { $gte: today } }).lean();
    return res.json({ ok: true, snapshot: snapshot || null });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Date-range aggregation ───────────────────────────────────────────────────

router.get('/range', async (req, res) => {
  try {
    const { from, to, groupBy = 'day' } = req.query;
    if (!from || !to) return res.status(400).json({ ok: false, error: 'from and to dates required.' });

    const records = await FGEAnalytics.find({
      date: { $gte: new Date(from), $lte: new Date(to) },
    })
      .sort({ date: 1 })
      .lean();

    // Calculate totals & averages across the range
    const totals = records.reduce(
      (acc, r) => {
        acc.visitors += r.visitors;
        acc.conversions += r.conversions;
        acc.revenue += r.revenue;
        acc.newHomeowners += r.newHomeowners;
        acc.newContractors += r.newContractors;
        acc.newRecruiters += r.newRecruiters;
        acc.gscImpressions += r.gscImpressions;
        acc.gscClicks += r.gscClicks;
        return acc;
      },
      {
        visitors: 0,
        conversions: 0,
        revenue: 0,
        newHomeowners: 0,
        newContractors: 0,
        newRecruiters: 0,
        gscImpressions: 0,
        gscClicks: 0,
      }
    );

    return res.json({ ok: true, records, totals, count: records.length });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Record (internal) ────────────────────────────────────────────────────────

router.post('/record', async (req, res) => {
  try {
    const { date, ...data } = req.body;
    const day = date ? new Date(date) : new Date();
    day.setHours(0, 0, 0, 0);

    const record = await FGEAnalytics.findOneAndUpdate(
      { date: day },
      { date: day, ...data },
      { upsert: true, new: true }
    );

    return res.json({ ok: true, record });
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message });
  }
});

// ─── Top cities ───────────────────────────────────────────────────────────────

router.get('/top-cities', async (req, res) => {
  try {
    const days = posInt(req.query.days, 30);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const records = await FGEAnalytics.find({ date: { $gte: since } })
      .select('topCities')
      .lean();

    // Aggregate city visits across all records
    const cityMap = {};
    for (const rec of records) {
      for (const c of rec.topCities || []) {
        const key = `${c.city}-${c.state}`;
        cityMap[key] = (cityMap[key] || { city: c.city, state: c.state, visits: 0 });
        cityMap[key].visits += c.visits;
      }
    }

    const sorted = Object.values(cityMap).sort((a, b) => b.visits - a.visits).slice(0, 20);
    return res.json({ ok: true, cities: sorted });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Top services ─────────────────────────────────────────────────────────────

router.get('/top-services', async (req, res) => {
  try {
    const days = posInt(req.query.days, 30);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const records = await FGEAnalytics.find({ date: { $gte: since } })
      .select('topServices')
      .lean();

    const svcMap = {};
    for (const rec of records) {
      for (const s of rec.topServices || []) {
        svcMap[s.service] = (svcMap[s.service] || { service: s.service, requests: 0 });
        svcMap[s.service].requests += s.requests;
      }
    }

    const sorted = Object.values(svcMap).sort((a, b) => b.requests - a.requests).slice(0, 20);
    return res.json({ ok: true, services: sorted });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
