'use strict';

/**
 * Insight Generator Service
 *
 * Analyzes real platform metrics and generates actionable owner insights.
 * All insights are derived from actual database aggregations — no hardcoded values.
 *
 * Insight types generated:
 *   - Response time changes (week-over-week)
 *   - Lead conversion by trade
 *   - High-demand geographic areas
 *   - Campaign performance shifts
 *   - Recruiter opportunities
 *   - Subscription trends
 */

const FGAInsight   = require('../models/FGAInsight');

// ── Lazy model loaders ────────────────────────────────────────────────────────
function JobRequest()  { return require('../../../models/JobRequest');  }
function Pro()         { return require('../../../models/Pro');         }
function LeadAssignment() { return require('../../../models/LeadAssignment'); }
function FGAProScore() { return require('../models/FGAProScore');       }
function FGACampaignAttribution() { return require('../models/FGACampaignAttribution'); }

// ── Helpers ───────────────────────────────────────────────────────────────────

function pctChange(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function round1(n) { return Math.round(n * 10) / 10; }

/**
 * Persist an insight, skipping duplicates (same title within 24h).
 */
async function saveInsight(fields) {
  const cutoff = new Date(Date.now() - 86400000);
  const existing = await FGAInsight.findOne({
    title: fields.title,
    generatedAt: { $gte: cutoff },
  });
  if (existing) return existing;

  return FGAInsight.create({
    ...fields,
    isActive:   true,
    generatedAt: new Date(),
    expiresAt:  new Date(Date.now() + 7 * 86400000),  // expire after 7 days
  });
}

// ── Generators ────────────────────────────────────────────────────────────────

/**
 * Response time insight: compare this week vs. last week.
 */
async function generateResponseTimeInsight() {
  const now      = Date.now();
  const thisWeek = new Date(now - 7 * 86400000);
  const lastWeek = new Date(now - 14 * 86400000);

  const [currentAgg, prevAgg] = await Promise.all([
    LeadAssignment().aggregate([
      { $match: { createdAt: { $gte: thisWeek }, responseTimeMs: { $gt: 0 } } },
      { $group: { _id: null, avgMs: { $avg: '$responseTimeMs' }, count: { $sum: 1 } } },
    ]),
    LeadAssignment().aggregate([
      { $match: { createdAt: { $gte: lastWeek, $lt: thisWeek }, responseTimeMs: { $gt: 0 } } },
      { $group: { _id: null, avgMs: { $avg: '$responseTimeMs' }, count: { $sum: 1 } } },
    ]),
  ]);

  const currentSec = (currentAgg[0]?.avgMs || 0) / 1000;
  const prevSec    = (prevAgg[0]?.avgMs    || 0) / 1000;
  if (!currentSec || !prevSec) return;

  const change = pctChange(currentSec, prevSec);
  const absChange = Math.abs(change);
  if (absChange < 5) return;  // not significant enough

  const direction = change > 0 ? 'increased' : 'decreased';
  await saveInsight({
    category:   'response_time',
    severity:   change > 0 ? 'warning' : 'opportunity',
    title:      `Response times ${direction} ${round1(absChange)}% this week`,
    message:    `Average response time is ${round1(currentSec)}s this week vs. ${round1(prevSec)}s last week (${change > 0 ? '+' : ''}${round1(change)}%).`,
    metric:     'avg_response_time_sec',
    metricValue:      round1(currentSec),
    metricPrevValue:  round1(prevSec),
    dataWindowDays:   7,
  });
}

/**
 * Lead conversion by trade insight.
 */
async function generateTradeConversionInsight() {
  const since = new Date(Date.now() - 30 * 86400000);
  const agg = await JobRequest().aggregate([
    { $match: { createdAt: { $gte: since }, status: { $in: ['completed', 'cancelled', 'assigned'] } } },
    {
      $group: {
        _id: '$trade',
        total:     { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      },
    },
    { $match: { total: { $gte: 3 } } },
    {
      $addFields: {
        conversionRate: { $multiply: [{ $divide: ['$completed', '$total'] }, 100] },
      },
    },
    { $sort: { conversionRate: -1 } },
  ]);

  if (agg.length < 2) return;

  const top    = agg[0];
  const bottom = agg[agg.length - 1];

  await Promise.all([
    saveInsight({
      category:   'lead_conversion',
      severity:   'opportunity',
      title:      `${top._id} leads have the highest conversion rate`,
      message:    `${top._id} converts at ${round1(top.conversionRate)}% in the last 30 days (${top.completed}/${top.total} leads completed).`,
      metric:     'conversion_rate',
      metricValue: round1(top.conversionRate),
      trade:      top._id,
      dataWindowDays: 30,
    }),
    bottom.conversionRate < 30
      ? saveInsight({
          category:   'lead_conversion',
          severity:   'warning',
          title:      `${bottom._id} leads have low conversion (${round1(bottom.conversionRate)}%)`,
          message:    `Only ${bottom.completed} of ${bottom.total} ${bottom._id} leads completed in the last 30 days. Consider improving pro coverage or pricing.`,
          metric:     'conversion_rate',
          metricValue: round1(bottom.conversionRate),
          trade:      bottom._id,
          dataWindowDays: 30,
        })
      : Promise.resolve(),
  ]);
}

/**
 * High-demand geography insight.
 */
async function generateMarketDemandInsight() {
  const since = new Date(Date.now() - 30 * 86400000);
  const agg = await JobRequest().aggregate([
    { $match: { createdAt: { $gte: since }, city: { $ne: null, $ne: '' } } },
    {
      $group: {
        _id: { city: '$city', state: '$state' },
        totalLeads: { $sum: 1 },
        completed:  { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      },
    },
    { $sort: { totalLeads: -1 } },
    { $limit: 5 },
  ]);

  for (const area of agg) {
    const completion = area.totalLeads > 0 ? (area.completed / area.totalLeads) * 100 : 0;
    if (completion < 50 && area.totalLeads >= 5) {
      await saveInsight({
        category:    'market_demand',
        severity:    'opportunity',
        title:       `High demand in ${area._id.city}, ${area._id.state} — low fulfillment`,
        message:     `${area._id.city} received ${area.totalLeads} leads this month but only ${round1(completion)}% were completed. Consider recruiting more pros in this area.`,
        metric:      'completion_rate',
        metricValue: round1(completion),
        city:        area._id.city,
        state:       area._id.state,
        dataWindowDays: 30,
      });
    }
  }
}

/**
 * Campaign performance insight: compare top sources.
 */
async function generateCampaignInsight() {
  const agg = await FGACampaignAttribution().aggregate([
    { $match: { subscribedAt: { $ne: null } } },
    {
      $group: {
        _id: '$source',
        subscriptions: { $sum: { $cond: [{ $ne: ['$subscribedAt', null] }, 1, 0] } },
        revenue:       { $sum: '$lifetimeRevenueCents' },
        total:         { $sum: 1 },
      },
    },
    { $match: { total: { $gte: 2 } } },
    {
      $addFields: {
        conversionRate: {
          $cond: [
            { $gt: ['$total', 0] },
            { $multiply: [{ $divide: ['$subscriptions', '$total'] }, 100] },
            0,
          ],
        },
      },
    },
    { $sort: { conversionRate: -1 } },
  ]);

  if (agg.length < 2) return;

  const top    = agg[0];
  const bottom = agg[agg.length - 1];

  await saveInsight({
    category:    'campaign_performance',
    severity:    'opportunity',
    title:       `${top._id} referrals have the highest conversion (${round1(top.conversionRate)}%)`,
    message:     `${top._id} converts ${round1(top.conversionRate)}% of sign-ups to paying subscribers. Consider increasing spend/effort on this channel.`,
    metric:      'campaign_conversion_rate',
    metricValue: round1(top.conversionRate),
    source:      top._id,
    dataWindowDays: 90,
  });

  if (bottom.conversionRate < 10 && bottom.total >= 5) {
    await saveInsight({
      category:    'campaign_performance',
      severity:    'warning',
      title:       `${bottom._id} has low conversion (${round1(bottom.conversionRate)}%)`,
      message:     `${bottom._id} only converts ${round1(bottom.conversionRate)}% of sign-ups. Review targeting or messaging for this channel.`,
      metric:      'campaign_conversion_rate',
      metricValue: round1(bottom.conversionRate),
      source:      bottom._id,
      dataWindowDays: 90,
    });
  }
}

/**
 * Subscription trend insight (month-over-month growth).
 */
async function generateSubscriptionTrendInsight() {
  const now      = Date.now();
  const thisMonth = new Date(now - 30 * 86400000);
  const lastMonth = new Date(now - 60 * 86400000);

  const [current, previous] = await Promise.all([
    Pro().countDocuments({ subscriptionActive: true, subscriptionStartDate: { $gte: thisMonth } }),
    Pro().countDocuments({ subscriptionActive: true, subscriptionStartDate: { $gte: lastMonth, $lt: thisMonth } }),
  ]);

  if (!previous) return;

  const change = pctChange(current, previous);
  const absChange = Math.abs(change);
  if (absChange < 5) return;

  const direction = change > 0 ? 'increased' : 'decreased';
  await saveInsight({
    category:    'retention',
    severity:    change < 0 ? 'warning' : 'opportunity',
    title:       `New subscriptions ${direction} ${round1(absChange)}% vs. last month`,
    message:     `${current} new subscriptions this month vs. ${previous} last month (${change > 0 ? '+' : ''}${round1(change)}%).`,
    metric:      'new_subscriptions',
    metricValue:      current,
    metricPrevValue:  previous,
    dataWindowDays:   30,
  });
}

// ── Main: run all generators ──────────────────────────────────────────────────

/**
 * Run all insight generators and persist the results.
 *
 * @returns {Promise<{ generated: number, errors: number }>}
 */
async function generateAll() {
  const generators = [
    generateResponseTimeInsight,
    generateTradeConversionInsight,
    generateMarketDemandInsight,
    generateCampaignInsight,
    generateSubscriptionTrendInsight,
  ];

  let generated = 0;
  let errors    = 0;

  for (const gen of generators) {
    try {
      await gen();
      generated += 1;
    } catch (err) {
      console.error('[FGA:Insights] ❌ generator error:', err.message);
      errors += 1;
    }
  }

  return { generated, errors };
}

/**
 * Get active insights for the dashboard.
 *
 * @param {object} [filter]  Optional filter (category, severity)
 * @param {number} [limit=20]
 */
async function getActiveInsights(filter = {}, limit = 20) {
  const query = { isActive: true, ...filter };
  return FGAInsight.find(query)
    .sort({ generatedAt: -1, severity: 1 })
    .limit(limit)
    .lean();
}

module.exports = { generateAll, getActiveInsights, saveInsight };
