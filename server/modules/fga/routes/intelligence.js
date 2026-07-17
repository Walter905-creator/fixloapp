'use strict';

/**
 * FGA Intelligence API — /api/fga/intelligence
 *
 * Phase 2 routes exposing:
 *   /performance   — Professional performance scores
 *   /routing       — Intelligent lead routing analytics
 *   /campaigns     — Campaign attribution & ROI
 *   /bi            — Business intelligence aggregations
 *   /insights      — Owner insight recommendations
 *   /market        — Market demand engine
 *   /recruiters    — Recruiter performance scores
 *   /leaderboards  — All leaderboard endpoints
 *   /trends        — Trend analysis (7d / 30d / 90d)
 *   /reports       — Downloadable admin reports
 *
 * All endpoints are admin-only (fgaAuth).
 */

const router  = require('express').Router();
const fgaAuth = require('../middleware/fgaAuth');

const perfSvc      = require('../intelligence/performanceScoringService');
const routingSvc   = require('../intelligence/intelligentRoutingService');
const attrSvc      = require('../intelligence/campaignAttributionService');
const biSvc        = require('../intelligence/businessIntelligenceService');
const insightSvc   = require('../intelligence/insightGeneratorService');
const marketSvc    = require('../intelligence/marketDemandService');
const recruiterSvc = require('../intelligence/recruiterScoringService');
const lbSvc        = require('../intelligence/leaderboardService');
const trendSvc     = require('../intelligence/trendAnalysisService');
const reportSvc    = require('../intelligence/reportGeneratorService');

const FGARoutingAttempt = require('../models/FGARoutingAttempt');
const FGAProScore       = require('../models/FGAProScore');

// ── Error wrapper ─────────────────────────────────────────────────────────────

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(err => {
      console.error('[FGA:Intelligence]', err.message);
      res.status(500).json({ ok: false, error: err.message });
    });
  };
}

// =============================================================================
// 1. PROFESSIONAL PERFORMANCE
// =============================================================================

// GET /api/fga/intelligence/performance — top-scoring pros
router.get('/performance', fgaAuth, asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const pros  = await perfSvc.getTopPros(limit);
  res.json({ ok: true, pros, count: pros.length });
}));

// GET /api/fga/intelligence/performance/:proId — single pro score
router.get('/performance/:proId', fgaAuth, asyncHandler(async (req, res) => {
  const { proId } = req.params;
  const score = await perfSvc.getScore(proId);
  if (!score) return res.status(404).json({ ok: false, error: 'No score found for this pro' });
  res.json({ ok: true, score });
}));

// POST /api/fga/intelligence/performance/:proId/recalculate — force recalc
router.post('/performance/:proId/recalculate', fgaAuth, asyncHandler(async (req, res) => {
  const { proId } = req.params;
  const score = await perfSvc.calculateScore(proId);
  res.json({ ok: true, score });
}));

// POST /api/fga/intelligence/performance/recalculate-all — batch recalc (all pros)
router.post('/performance/recalculate-all', fgaAuth, asyncHandler(async (req, res) => {
  const result = await perfSvc.recalculateAll();
  res.json({ ok: true, ...result });
}));

// =============================================================================
// 2. INTELLIGENT ROUTING
// =============================================================================

// GET /api/fga/intelligence/routing/lead/:leadId — routing log for a lead
router.get('/routing/lead/:leadId', fgaAuth, asyncHandler(async (req, res) => {
  const log = await routingSvc.getLeadRoutingLog(req.params.leadId);
  res.json({ ok: true, attempts: log, count: log.length });
}));

// GET /api/fga/intelligence/routing/stats — routing outcome stats
router.get('/routing/stats', fgaAuth, asyncHandler(async (req, res) => {
  const days  = Math.min(Number(req.query.days) || 30, 90);
  const since = new Date(Date.now() - days * 86400000);

  const [byOutcome, avgScore] = await Promise.all([
    FGARoutingAttempt.aggregate([
      { $match: { notifiedAt: { $gte: since } } },
      { $group: { _id: '$outcome', count: { $sum: 1 } } },
    ]),
    FGARoutingAttempt.aggregate([
      { $match: { notifiedAt: { $gte: since } } },
      { $group: { _id: null, avg: { $avg: '$routingScore' } } },
    ]),
  ]);

  res.json({ ok: true, byOutcome, avgRoutingScore: avgScore[0]?.avg || 0, days });
}));

// =============================================================================
// 3. CAMPAIGN ATTRIBUTION
// =============================================================================

// GET /api/fga/intelligence/campaigns/roi — ROI by source
router.get('/campaigns/roi', fgaAuth, asyncHandler(async (req, res) => {
  const from = req.query.from ? new Date(req.query.from) : null;
  const to   = req.query.to   ? new Date(req.query.to)   : null;
  const data = await attrSvc.getROIBySource({ from, to });
  res.json({ ok: true, data });
}));

// GET /api/fga/intelligence/campaigns/funnel — funnel by UTM campaign
router.get('/campaigns/funnel', fgaAuth, asyncHandler(async (req, res) => {
  const data = await attrSvc.getFunnelByCampaign();
  res.json({ ok: true, data });
}));

// GET /api/fga/intelligence/campaigns/:proId — attribution for one pro
router.get('/campaigns/:proId', fgaAuth, asyncHandler(async (req, res) => {
  const record = await attrSvc.getAttribution(req.params.proId);
  if (!record) return res.status(404).json({ ok: false, error: 'No attribution record found' });
  res.json({ ok: true, attribution: record });
}));

// =============================================================================
// 4. BUSINESS INTELLIGENCE
// =============================================================================

// GET /api/fga/intelligence/bi/trades — top performing trades
router.get('/bi/trades', fgaAuth, asyncHandler(async (req, res) => {
  const days = Math.min(Number(req.query.days) || 30, 90);
  const data = await biSvc.getTopTrades(days);
  res.json({ ok: true, data, days });
}));

// GET /api/fga/intelligence/bi/cities — top performing cities
router.get('/bi/cities', fgaAuth, asyncHandler(async (req, res) => {
  const days = Math.min(Number(req.query.days) || 30, 90);
  const data = await biSvc.getTopCities(days);
  res.json({ ok: true, data, days });
}));

// GET /api/fga/intelligence/bi/states/growth — fastest growing states
router.get('/bi/states/growth', fgaAuth, asyncHandler(async (req, res) => {
  const days = Math.min(Number(req.query.days) || 30, 90);
  const data = await biSvc.getFastestGrowingStates(days);
  res.json({ ok: true, data, days });
}));

// GET /api/fga/intelligence/bi/campaigns/best — best marketing campaigns
router.get('/bi/campaigns/best', fgaAuth, asyncHandler(async (req, res) => {
  const data = await biSvc.getBestCampaigns();
  res.json({ ok: true, data });
}));

// GET /api/fga/intelligence/bi/recruiters/top — top recruiters
router.get('/bi/recruiters/top', fgaAuth, asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const data  = await biSvc.getTopRecruiters(limit);
  res.json({ ok: true, data, count: data.length });
}));

// GET /api/fga/intelligence/bi/revenue/by-source — revenue by acquisition source
router.get('/bi/revenue/by-source', fgaAuth, asyncHandler(async (req, res) => {
  const data = await biSvc.getRevenueBySource();
  res.json({ ok: true, data });
}));

// GET /api/fga/intelligence/bi/landing-pages — best converting landing pages
router.get('/bi/landing-pages', fgaAuth, asyncHandler(async (req, res) => {
  const data = await biSvc.getBestLandingPages();
  res.json({ ok: true, data });
}));

// GET /api/fga/intelligence/bi/referrals/best — best referral campaigns
router.get('/bi/referrals/best', fgaAuth, asyncHandler(async (req, res) => {
  const data = await biSvc.getBestReferralCampaigns();
  res.json({ ok: true, data });
}));

// GET /api/fga/intelligence/bi/funnel/leads — lead funnel
router.get('/bi/funnel/leads', fgaAuth, asyncHandler(async (req, res) => {
  const days = Math.min(Number(req.query.days) || 30, 90);
  const data = await biSvc.getLeadFunnel(days);
  res.json({ ok: true, data, days });
}));

// GET /api/fga/intelligence/bi/funnel/subscriptions — subscription funnel
router.get('/bi/funnel/subscriptions', fgaAuth, asyncHandler(async (req, res) => {
  const days = Math.min(Number(req.query.days) || 30, 90);
  const data = await biSvc.getSubscriptionFunnel(days);
  res.json({ ok: true, data, days });
}));

// GET /api/fga/intelligence/bi/funnel/growth — growth funnel (combined)
router.get('/bi/funnel/growth', fgaAuth, asyncHandler(async (req, res) => {
  const days = Math.min(Number(req.query.days) || 30, 90);
  const data = await biSvc.getGrowthFunnel(days);
  res.json({ ok: true, data, days });
}));

// GET /api/fga/intelligence/bi/worst-areas — worst performing areas
router.get('/bi/worst-areas', fgaAuth, asyncHandler(async (req, res) => {
  const days = Math.min(Number(req.query.days) || 30, 90);
  const data = await biSvc.getWorstPerformingAreas(days);
  res.json({ ok: true, data, days });
}));

// =============================================================================
// 5. OWNER INSIGHTS
// =============================================================================

// GET /api/fga/intelligence/insights — active insights for dashboard
router.get('/insights', fgaAuth, asyncHandler(async (req, res) => {
  const { category, severity } = req.query;
  const limit  = Math.min(Number(req.query.limit) || 20, 100);
  const filter = {};
  if (category && typeof category === 'string') filter.category = category;
  if (severity && typeof severity === 'string') filter.severity = severity;
  const data = await insightSvc.getActiveInsights(filter, limit);
  res.json({ ok: true, insights: data, count: data.length });
}));

// POST /api/fga/intelligence/insights/generate — trigger insight generation
router.post('/insights/generate', fgaAuth, asyncHandler(async (req, res) => {
  const result = await insightSvc.generateAll();
  res.json({ ok: true, ...result });
}));

// =============================================================================
// 6. MARKET DEMAND ENGINE
// =============================================================================

// GET /api/fga/intelligence/market — query demand snapshots
router.get('/market', fgaAuth, asyncHandler(async (req, res) => {
  const { trade, city, state, year, month } = req.query;
  const limit  = Math.min(Number(req.query.limit) || 50, 200);
  const filter = {};
  if (trade && typeof trade === 'string') filter.trade = trade;
  if (city  && typeof city  === 'string') filter.city  = city;
  if (state && typeof state === 'string') filter.state = state;
  if (year)  filter.year  = Number(year);
  if (month) filter.month = Number(month);
  const data = await marketSvc.getDemand(filter, limit);
  res.json({ ok: true, data, count: data.length });
}));

// GET /api/fga/intelligence/market/top-trades — top trades by demand
router.get('/market/top-trades', fgaAuth, asyncHandler(async (req, res) => {
  const months = Math.min(Number(req.query.months) || 3, 12);
  const data   = await marketSvc.getTopTradesByDemand(months);
  res.json({ ok: true, data, months });
}));

// POST /api/fga/intelligence/market/compute — trigger computation for current month
router.post('/market/compute', fgaAuth, asyncHandler(async (req, res) => {
  const result = await marketSvc.computeCurrentMonth();
  res.json({ ok: true, ...result });
}));

// =============================================================================
// 7. RECRUITER PERFORMANCE
// =============================================================================

// GET /api/fga/intelligence/recruiters — top-scoring recruiters
router.get('/recruiters', fgaAuth, asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const data  = await recruiterSvc.getTopRecruiters(limit);
  res.json({ ok: true, recruiters: data, count: data.length });
}));

// GET /api/fga/intelligence/recruiters/:recruiterId — single recruiter score
router.get('/recruiters/:recruiterId', fgaAuth, asyncHandler(async (req, res) => {
  const FGARecruiterScore = require('../models/FGARecruiterScore');
  const score = await FGARecruiterScore.findOne({ recruiterId: req.params.recruiterId })
    .populate('recruiterId', 'name email city state recruiterCode')
    .lean();
  if (!score) return res.status(404).json({ ok: false, error: 'No score found for this recruiter' });
  res.json({ ok: true, score });
}));

// POST /api/fga/intelligence/recruiters/:recruiterId/recalculate
router.post('/recruiters/:recruiterId/recalculate', fgaAuth, asyncHandler(async (req, res) => {
  const score = await recruiterSvc.calculateScore(req.params.recruiterId);
  res.json({ ok: true, score });
}));

// POST /api/fga/intelligence/recruiters/recalculate-all
router.post('/recruiters/recalculate-all', fgaAuth, asyncHandler(async (req, res) => {
  const result = await recruiterSvc.recalculateAll();
  res.json({ ok: true, ...result });
}));

// =============================================================================
// 8. LEADERBOARDS
// =============================================================================

// GET /api/fga/intelligence/leaderboards/fastest-responders
router.get('/leaderboards/fastest-responders', fgaAuth, asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const data  = await lbSvc.getFastestResponders(limit);
  res.json({ ok: true, data, count: data.length });
}));

// GET /api/fga/intelligence/leaderboards/acceptance-rate
router.get('/leaderboards/acceptance-rate', fgaAuth, asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const data  = await lbSvc.getHighestAcceptanceRate(limit);
  res.json({ ok: true, data, count: data.length });
}));

// GET /api/fga/intelligence/leaderboards/completion-rate
router.get('/leaderboards/completion-rate', fgaAuth, asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const data  = await lbSvc.getHighestCompletionRate(limit);
  res.json({ ok: true, data, count: data.length });
}));

// GET /api/fga/intelligence/leaderboards/best-reviews
router.get('/leaderboards/best-reviews', fgaAuth, asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const data  = await lbSvc.getBestReviews(limit);
  res.json({ ok: true, data, count: data.length });
}));

// GET /api/fga/intelligence/leaderboards/most-active
router.get('/leaderboards/most-active', fgaAuth, asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const data  = await lbSvc.getMostActivePros(limit);
  res.json({ ok: true, data, count: data.length });
}));

// GET /api/fga/intelligence/leaderboards/top-recruiters
router.get('/leaderboards/top-recruiters', fgaAuth, asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const data  = await lbSvc.getTopRecruiters(limit);
  res.json({ ok: true, data, count: data.length });
}));

// GET /api/fga/intelligence/leaderboards/revenue
router.get('/leaderboards/revenue', fgaAuth, asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const data  = await lbSvc.getHighestRevenueContributors(limit);
  res.json({ ok: true, data, count: data.length });
}));

// GET /api/fga/intelligence/leaderboards/pros — overall pro leaderboard
router.get('/leaderboards/pros', fgaAuth, asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const data  = await lbSvc.getOverallProLeaderboard(limit);
  res.json({ ok: true, data, count: data.length });
}));

// =============================================================================
// 9. TREND ANALYSIS
// =============================================================================

// GET /api/fga/intelligence/trends — full trend report
router.get('/trends', fgaAuth, asyncHandler(async (req, res) => {
  const report = await trendSvc.getTrendReport();
  res.json({ ok: true, ...report });
}));

// GET /api/fga/intelligence/trends/trade/:trade — timeline for specific trade
router.get('/trends/trade/:trade', fgaAuth, asyncHandler(async (req, res) => {
  const data = await trendSvc.getTradeTimeline(req.params.trade);
  res.json({ ok: true, ...data });
}));

// =============================================================================
// 10. ADMIN REPORTS
// =============================================================================

// GET /api/fga/intelligence/reports/pros?format=json|csv
router.get('/reports/pros', fgaAuth, asyncHandler(async (req, res) => {
  const { from, to, format = 'json' } = req.query;
  const report = await reportSvc.generateProsReport({ from, to });
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="pros-report.csv"');
    return res.send(report.csv);
  }
  res.json({ ok: true, ...report });
}));

// GET /api/fga/intelligence/reports/recruiters
router.get('/reports/recruiters', fgaAuth, asyncHandler(async (req, res) => {
  const { format = 'json' } = req.query;
  const report = await reportSvc.generateRecruitersReport();
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="recruiters-report.csv"');
    return res.send(report.csv);
  }
  res.json({ ok: true, ...report });
}));

// GET /api/fga/intelligence/reports/leads
router.get('/reports/leads', fgaAuth, asyncHandler(async (req, res) => {
  const { format = 'json', days } = req.query;
  const report = await reportSvc.generateLeadPerformanceReport({ days: Number(days) || 30 });
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="lead-performance-report.csv"');
    return res.send(report.csv);
  }
  res.json({ ok: true, ...report });
}));

// GET /api/fga/intelligence/reports/subscriptions
router.get('/reports/subscriptions', fgaAuth, asyncHandler(async (req, res) => {
  const { from, to, format = 'json' } = req.query;
  const report = await reportSvc.generateSubscriptionsReport({ from, to });
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="subscriptions-report.csv"');
    return res.send(report.csv);
  }
  res.json({ ok: true, ...report });
}));

// GET /api/fga/intelligence/reports/revenue
router.get('/reports/revenue', fgaAuth, asyncHandler(async (req, res) => {
  const { format = 'json', days } = req.query;
  const report = await reportSvc.generateRevenueReport({ days: Number(days) || 30 });
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="revenue-report.csv"');
    return res.send(report.csv);
  }
  res.json({ ok: true, ...report });
}));

// GET /api/fga/intelligence/reports/response-times
router.get('/reports/response-times', fgaAuth, asyncHandler(async (req, res) => {
  const { format = 'json', days } = req.query;
  const report = await reportSvc.generateResponseTimesReport({ days: Number(days) || 30 });
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="response-times-report.csv"');
    return res.send(report.csv);
  }
  res.json({ ok: true, ...report });
}));

module.exports = router;
