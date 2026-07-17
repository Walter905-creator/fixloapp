'use strict';

/**
 * Fixlo Growth Automation (FGA) — Main Module
 *
 * This is the backbone of the Fixlo platform growth system.
 * It wires together:
 *   - Universal Lead Engine
 *   - Event Bus
 *   - Growth Timeline
 *   - Communication Center
 *   - Notification Center
 *   - Automation Scheduler
 *   - CRM Foundation
 *   - Activity Logger
 *   - Analytics Foundation
 *   - Owner Dashboard API
 *   - Admin Tools API
 *
 * Route prefix: /api/fga/*
 *
 * To activate: set FGA_ENABLED=true in server .env
 * To disable:  remove or set FGA_ENABLED=false — nothing breaks.
 *
 * All routes require admin authentication.
 * Existing functionality is NOT modified — FGA only adds new paths.
 */

const router = require('express').Router();

// ── Sub-routers ───────────────────────────────────────────────────────────────
const leadsRouter     = require('./routes/leads');
const dashboardRouter = require('./routes/dashboard');
const analyticsRouter = require('./routes/analytics');
const adminRouter     = require('./routes/admin');

// ── Core services (exported for use by other modules) ─────────────────────────
const eventBus   = require('./events/eventBus');
const FGA_EVENTS = require('./events/eventTypes');
const leadSvc    = require('./services/leadService');
const comm       = require('./communication/communicationCenter');
const timeline   = require('./timeline/timelineService');
const crm        = require('./crm/crmService');
const analytics  = require('./analytics/analyticsService');
const actLogger  = require('./services/activityLogger');
const scheduler  = require('./scheduler/schedulerService');
const notifCenter = require('./notifications/notificationCenter');

// ── Feature flag gate ─────────────────────────────────────────────────────────
router.use((req, res, next) => {
  if (process.env.FGA_ENABLED !== 'true') {
    return res.status(503).json({
      ok: false,
      error: 'FGA module is disabled',
      hint: 'Set FGA_ENABLED=true to enable the Growth Automation system',
    });
  }
  return next();
});

// ── Mount sub-routers ─────────────────────────────────────────────────────────
router.use('/leads',     leadsRouter);
router.use('/dashboard', dashboardRouter);
router.use('/analytics', analyticsRouter);
router.use('/admin',     adminRouter);

// ── Health check (no auth required — useful for monitoring) ───────────────────
router.get('/health', (req, res) => {
  res.json({
    ok: true,
    module:    'FGA',
    version:   '1.0.0',
    enabled:   process.env.FGA_ENABLED === 'true',
    timestamp: new Date(),
  });
});

// ── Scheduler: register built-in FGA jobs ─────────────────────────────────────
function _registerBuiltInJobs() {
  // Daily analytics snapshot cleanup (ensure today's doc exists)
  scheduler.register({
    name:     'fga-analytics-heartbeat',
    schedule: '24h',
    handler:  async () => {
      await analytics.increment('leadsTotal', 0); // no-op increment to upsert today's doc
    },
  });

  // Daily CRM profile sync check (placeholder — extend in future phases)
  scheduler.register({
    name:     'fga-crm-daily-check',
    schedule: '24h',
    handler:  async () => {
      console.log('[FGA:Scheduler] CRM daily check completed');
    },
  });
}

// ── Module initialiser ────────────────────────────────────────────────────────

/**
 * Initialize all FGA subsystems.
 * Must be called AFTER MongoDB connects.
 *
 * @example
 *   const fga = require('./modules/fga');
 *   mongoose.connection.once('open', () => fga.initialize());
 */
function initialize() {
  if (process.env.FGA_ENABLED !== 'true') {
    console.log('ℹ️  FGA module is disabled. Set FGA_ENABLED=true to enable.');
    return;
  }

  console.log('🚀 Initializing Fixlo Growth Automation (FGA)...');

  try {
    notifCenter.initialize();
    console.log('✅ FGA Notification Center initialized');
  } catch (err) {
    console.error('❌ FGA Notification Center failed:', err.message);
  }

  try {
    _registerBuiltInJobs();
    scheduler.start();
    console.log('✅ FGA Scheduler started');
  } catch (err) {
    console.error('❌ FGA Scheduler failed:', err.message);
  }

  console.log('✅ Fixlo Growth Automation (FGA) ready');
}

// ── Public exports ────────────────────────────────────────────────────────────
module.exports = {
  router,
  initialize,

  // Core services — importable by any other server module
  eventBus,
  FGA_EVENTS,
  leadSvc,
  comm,
  timeline,
  crm,
  analytics,
  actLogger,
  scheduler,
};
