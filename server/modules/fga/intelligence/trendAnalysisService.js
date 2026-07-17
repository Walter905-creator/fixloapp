'use strict';

/**
 * Trend Analysis Service
 *
 * Compares platform metrics across multiple time windows:
 *   Today, Yesterday, Last 7 Days, Last 30 Days, Last 90 Days
 *
 * Calculates growth, decline, seasonality, and momentum for key metrics.
 */

function Pro()            { return require('../../../models/Pro');            }
function JobRequest()     { return require('../../../models/JobRequest');     }
function LeadAssignment() { return require('../../../models/LeadAssignment'); }
function FGAAnalytics()   { return require('../models/FGAAnalytics');         }

// ── Helpers ───────────────────────────────────────────────────────────────────

function windowStart(daysAgo) {
  return new Date(Date.now() - daysAgo * 86400000);
}

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function yesterdayStart() {
  const d = todayStart();
  d.setDate(d.getDate() - 1);
  return d;
}

function pctChange(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

function trend(change) {
  if (change >  10) return 'growing';
  if (change < -10) return 'declining';
  return 'stable';
}

// ── Single metric trend ───────────────────────────────────────────────────────

/**
 * Count a Model's documents in multiple time windows.
 *
 * @param {mongoose.Model} Model
 * @param {object} [baseFilter]
 * @returns {Promise<object>}  { today, yesterday, last7, last30, last90 }
 */
async function countInWindows(Model, baseFilter = {}) {
  const now  = Date.now();
  const tDay = todayStart();
  const yDay = yesterdayStart();
  const w7   = windowStart(7);
  const w30  = windowStart(30);
  const w90  = windowStart(90);

  const [today, yesterday, last7, last30, last90] = await Promise.all([
    Model.countDocuments({ ...baseFilter, createdAt: { $gte: tDay } }),
    Model.countDocuments({ ...baseFilter, createdAt: { $gte: yDay, $lt: tDay } }),
    Model.countDocuments({ ...baseFilter, createdAt: { $gte: w7 } }),
    Model.countDocuments({ ...baseFilter, createdAt: { $gte: w30 } }),
    Model.countDocuments({ ...baseFilter, createdAt: { $gte: w90 } }),
  ]);

  return { today, yesterday, last7, last30, last90 };
}

// ── Full Trend Report ─────────────────────────────────────────────────────────

/**
 * Build a comprehensive trend report for all key metrics.
 *
 * @returns {Promise<object>}
 */
async function getTrendReport() {
  const [
    proSignups,
    activeSubscriptions,
    leads,
    completedJobs,
    cancelledJobs,
    acceptedAssignments,
  ] = await Promise.all([
    countInWindows(Pro(), {}),
    countInWindows(Pro(), { subscriptionActive: true }),
    countInWindows(JobRequest(), {}),
    countInWindows(JobRequest(), { status: 'completed' }),
    countInWindows(JobRequest(), { status: 'cancelled' }),
    countInWindows(LeadAssignment(), { status: 'accepted' }),
  ]);

  // Average response time trends from FGAAnalytics daily snapshots
  const analyticsRange = await FGAAnalytics().find({})
    .sort({ date: -1 })
    .limit(90)
    .lean();

  function avgResponseForLastNDays(n) {
    const slice = analyticsRange.slice(0, n);
    const valid = slice.filter(d => d.avgResponseTimeMs > 0);
    if (!valid.length) return 0;
    return Math.round(valid.reduce((s, d) => s + d.avgResponseTimeMs, 0) / valid.length / 1000);
  }

  const responseTrend = {
    today:     avgResponseForLastNDays(1),
    yesterday: avgResponseForLastNDays(2),  // rough approximation
    last7:     avgResponseForLastNDays(7),
    last30:    avgResponseForLastNDays(30),
    last90:    avgResponseForLastNDays(90),
  };

  // ── Growth calculations ─────────────────────────────────────────────────────

  function buildTrend(windows) {
    return {
      ...windows,
      dayOverDay:    pctChange(windows.today,     windows.yesterday),
      weekOverWeek:  pctChange(windows.last7,     windows.last30 / 4),  // normalized to weekly
      monthOverMonth:pctChange(windows.last30,    windows.last90 / 3),  // normalized to monthly
      trend: trend(pctChange(windows.last7, windows.last30 / 4)),
    };
  }

  // ── Seasonality (month name for context) ─────────────────────────────────────

  const monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
  const currentMonth = monthNames[new Date().getMonth()];

  // ── Momentum (acceleration: is growth rate itself growing?) ──────────────────

  const leadMomentum = pctChange(
    pctChange(leads.last7, leads.last30 / 4),
    pctChange(leads.last30, leads.last90 / 4)
  );

  return {
    generatedAt:  new Date(),
    currentMonth,
    metrics: {
      proSignups:          buildTrend(proSignups),
      activeSubscriptions: buildTrend(activeSubscriptions),
      leads:               buildTrend(leads),
      completedJobs:       buildTrend(completedJobs),
      cancelledJobs:       buildTrend(cancelledJobs),
      acceptedLeads:       buildTrend(acceptedAssignments),
      avgResponseTimeSec:  responseTrend,
    },
    momentum: {
      leadGrowthMomentum: Math.round(leadMomentum * 10) / 10,
      interpretation: leadMomentum > 5 ? 'accelerating'
        : leadMomentum < -5 ? 'decelerating'
        : 'steady',
    },
  };
}

/**
 * Trend for a specific trade.
 *
 * @param {string} trade
 * @returns {Promise<object>}
 */
async function getTradeTimeline(trade) {
  const now = Date.now();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now - (i + 1) * 30 * 86400000);
    const end   = new Date(now - i * 30 * 86400000);
    const [leads, completed] = await Promise.all([
      JobRequest().countDocuments({ trade, createdAt: { $gte: start, $lt: end } }),
      JobRequest().countDocuments({ trade, status: 'completed', createdAt: { $gte: start, $lt: end } }),
    ]);
    months.push({
      period: `${start.toLocaleString('default', { month: 'short' })} ${start.getFullYear()}`,
      leads,
      completed,
      completionRate: leads > 0 ? Math.round((completed / leads) * 100) : 0,
    });
  }
  return { trade, timeline: months };
}

module.exports = { getTrendReport, getTradeTimeline };
