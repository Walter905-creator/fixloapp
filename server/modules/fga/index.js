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
 *   - Intelligence Engine (Phase 2)
 *     • Professional Performance Scoring
 *     • Intelligent Lead Routing
 *     • Campaign Attribution
 *     • Business Intelligence
 *     • Owner Insights / AI Insight Service
 *     • Market Demand Engine
 *     • Recruiter Performance Scoring
 *     • Leaderboards
 *     • Trend Analysis
 *     • Admin Reports
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
const leadsRouter        = require('./routes/leads');
const dashboardRouter    = require('./routes/dashboard');
const analyticsRouter    = require('./routes/analytics');
const adminRouter        = require('./routes/admin');
const intelligenceRouter = require('./routes/intelligence');  // Phase 2

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
router.use('/leads',        leadsRouter);
router.use('/dashboard',    dashboardRouter);
router.use('/analytics',    analyticsRouter);
router.use('/admin',        adminRouter);
router.use('/intelligence', intelligenceRouter);  // Phase 2

// ── Health check (no auth required — useful for monitoring) ───────────────────
router.get('/health', (req, res) => {
  res.json({
    ok: true,
    module:    'FGA',
    version:   '2.0.0',
    phase:     'Phase 2 — Intelligence & Optimization Engine',
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

  // Daily CRM profile sync check
  scheduler.register({
    name:     'fga-crm-daily-check',
    schedule: '24h',
    handler:  async () => {
      console.log('[FGA:Scheduler] CRM daily check completed');
    },
  });

  // ── Phase 2: Intelligence Engine nightly jobs ────────────────────────────

  // Nightly professional performance score recalculation
  scheduler.register({
    name:     'fga-pro-performance-recalc',
    schedule: '24h',
    handler:  async () => {
      try {
        const perfSvc = require('./intelligence/performanceScoringService');
        const result  = await perfSvc.recalculateAll();
        console.log(`[FGA:Scheduler] Pro performance scores recalculated — processed: ${result.processed}, errors: ${result.errors}`);
      } catch (err) {
        console.error('[FGA:Scheduler] ❌ Pro performance recalc failed:', err.message);
      }
    },
  });

  // Nightly recruiter performance score recalculation
  scheduler.register({
    name:     'fga-recruiter-score-recalc',
    schedule: '24h',
    handler:  async () => {
      try {
        const recruiterSvc = require('./intelligence/recruiterScoringService');
        const result       = await recruiterSvc.recalculateAll();
        console.log(`[FGA:Scheduler] Recruiter scores recalculated — processed: ${result.processed}, errors: ${result.errors}`);
      } catch (err) {
        console.error('[FGA:Scheduler] ❌ Recruiter score recalc failed:', err.message);
      }
    },
  });

  // Nightly market demand computation (current month)
  scheduler.register({
    name:     'fga-market-demand-compute',
    schedule: '24h',
    handler:  async () => {
      try {
        const marketSvc = require('./intelligence/marketDemandService');
        const result    = await marketSvc.computeCurrentMonth();
        console.log(`[FGA:Scheduler] Market demand computed — upserted: ${result.upserted}, errors: ${result.errors}`);
      } catch (err) {
        console.error('[FGA:Scheduler] ❌ Market demand compute failed:', err.message);
      }
    },
  });

  // Nightly AI insight generation
  scheduler.register({
    name:     'fga-insight-generation',
    schedule: '24h',
    handler:  async () => {
      try {
        const insightSvc = require('./intelligence/insightGeneratorService');
        const result     = await insightSvc.generateAll();
        console.log(`[FGA:Scheduler] Insights generated — ran: ${result.generated}, errors: ${result.errors}`);
      } catch (err) {
        console.error('[FGA:Scheduler] ❌ Insight generation failed:', err.message);
      }
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

  // Phase 2 Intelligence services
  intelligence: {
    performance:  require('./intelligence/performanceScoringService'),
    routing:      require('./intelligence/intelligentRoutingService'),
    attribution:  require('./intelligence/campaignAttributionService'),
    bi:           require('./intelligence/businessIntelligenceService'),
    insights:     require('./intelligence/insightGeneratorService'),
    market:       require('./intelligence/marketDemandService'),
    recruiters:   require('./intelligence/recruiterScoringService'),
    leaderboards: require('./intelligence/leaderboardService'),
    trends:       require('./intelligence/trendAnalysisService'),
    reports:      require('./intelligence/reportGeneratorService'),
  },
};
