'use strict';

/**
 * FGA Owner Dashboard API — /api/fga/dashboard
 *
 * Returns live data for the owner's real-time overview.
 * All values are computed from live database queries — no fake statistics.
 */

const router    = require('express').Router();
const mongoose  = require('mongoose');
const fgaAuth   = require('../middleware/fgaAuth');
const analytics = require('../analytics/analyticsService');
const FGALead   = require('../models/FGALead');
const FGAActivity = require('../models/FGAActivity');
const FGAMessage  = require('../models/FGAMessage');
const scheduler   = require('../scheduler/schedulerService');

// Lazy references to existing platform models (avoid circular dependency on boot)
function getPro() { return require('../../../models/Pro'); }
function getJobReq() { return require('../../../models/JobRequest'); }

// ── Helpers ───────────────────────────────────────────────────────────────────

function _todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── GET /api/fga/dashboard/summary ────────────────────────────────────────────
router.get('/summary', fgaAuth, async (req, res) => {
  try {
    const today = _todayStart();
    const Pro       = getPro();
    const JobRequest = getJobReq();

    const [
      todayLeads,
      todaySignups,
      todayJobs,
      totalLeads,
      analyticsToday,
      recentActivity,
    ] = await Promise.all([
      FGALead.countDocuments({ createdAt: { $gte: today } }),
      Pro.countDocuments({ createdAt: { $gte: today } }),
      JobRequest.countDocuments({ createdAt: { $gte: today } }),
      FGALead.countDocuments({ isActive: true }),
      analytics.getToday(),
      FGAActivity.find({}).sort({ timestamp: -1 }).limit(10).lean(),
    ]);

    return res.json({
      ok: true,
      summary: {
        today: {
          leads:         todayLeads,
          signups:       todaySignups,
          jobs:          todayJobs,
          emailsSent:    analyticsToday?.emailsSent    || 0,
          smsSent:       analyticsToday?.smsSent       || 0,
          subscriptions: analyticsToday?.subscriptionsPurchased || 0,
        },
        totals: {
          leads: totalLeads,
        },
        recentActivity: recentActivity.map(a => ({
          action:    a.action,
          userType:  a.userType,
          status:    a.status,
          timestamp: a.timestamp,
        })),
        schedulerJobs: scheduler.list(),
        generatedAt: new Date(),
      },
    });
  } catch (err) {
    console.error('[FGA:Dashboard] GET /summary error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET /api/fga/dashboard/health ─────────────────────────────────────────────
router.get('/health', fgaAuth, async (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const mongoStatus = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

  return res.json({
    ok: true,
    health: {
      mongo:       mongoStatus[mongoState] || 'unknown',
      sendgrid:    !!process.env.SENDGRID_API_KEY,
      twilio:      !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
      stripe:      !!process.env.STRIPE_SECRET_KEY,
      cloudinary:  !!process.env.CLOUDINARY_CLOUD_NAME,
      checkr:      !!process.env.CHECKR_API_KEY,
      fgaEnabled:  process.env.FGA_ENABLED === 'true',
      environment: process.env.NODE_ENV || 'development',
      uptime:      Math.round(process.uptime()),
      generatedAt: new Date(),
    },
  });
});

// ── GET /api/fga/dashboard/notifications ──────────────────────────────────────
router.get('/notifications', fgaAuth, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const msgs = await FGAMessage.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({ ok: true, notifications: msgs, count: msgs.length });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET /api/fga/dashboard/queue ──────────────────────────────────────────────
router.get('/queue', fgaAuth, async (req, res) => {
  const jobs = scheduler.list();
  return res.json({ ok: true, queue: jobs, count: jobs.length });
});

module.exports = router;
