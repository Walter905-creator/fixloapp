/**
 * FGE Referral System Routes
 *
 * Every recruiter and contractor receives:
 *  - A unique referral code
 *  - A unique referral link
 *  - A referral dashboard showing clicks, signups, conversions, commissions
 *
 * These routes augment the existing referral system (routes/referrals.js,
 * routes/commissionReferrals.js) with FGE-level analytics. They delegate
 * actual commission logic to the existing models (Referral, CommissionReferral).
 *
 * GET  /api/fge/referral/overview   – high-level stats (admin)
 * GET  /api/fge/referral/leaderboard – top referrers
 * GET  /api/fge/referral/links       – list all referral links
 */

'use strict';

const router = require('express').Router();
const requireAuth = require('../../../middleware/requireAuth');
const requireAdmin = require('../../../middleware/requireAdmin');

// Use existing models that already track referrals
let CommissionReferral;
try { CommissionReferral = require('../../../models/CommissionReferral'); } catch (_) {}

router.use(requireAuth, requireAdmin);

// ─── Overview ────────────────────────────────────────────────────────────────

router.get('/overview', async (req, res) => {
  try {
    const stats = {};

    if (CommissionReferral) {
      const [total, converted, pending] = await Promise.all([
        CommissionReferral.countDocuments({}),
        CommissionReferral.countDocuments({ status: 'converted' }),
        CommissionReferral.countDocuments({ status: 'pending' }),
      ]);
      stats.commissionReferrals = { total, converted, pending };
    }

    return res.json({ ok: true, stats });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Leaderboard ──────────────────────────────────────────────────────────────

router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    let leaderboard = [];

    if (CommissionReferral) {
      leaderboard = await CommissionReferral.aggregate([
        { $match: { status: 'converted' } },
        { $group: { _id: '$referrerId', conversions: { $sum: 1 }, totalCommission: { $sum: '$commissionAmount' } } },
        { $sort: { conversions: -1 } },
        { $limit: Number(limit) },
      ]);
    }

    return res.json({ ok: true, leaderboard });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Links ───────────────────────────────────────────────────────────────────

router.get('/links', async (req, res) => {
  try {
    const links = [];

    if (CommissionReferral) {
      // Group by referral code to show unique links
      const codes = await CommissionReferral.aggregate([
        { $group: { _id: '$referralCode', clicks: { $sum: 1 }, conversions: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } } } },
        { $sort: { clicks: -1 } },
        { $limit: 100 },
      ]);
      links.push(...codes);
    }

    return res.json({ ok: true, links });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
