'use strict';

/**
 * Market Demand Service
 *
 * Calculates and persists market demand snapshots per trade/city/state/month.
 * Run nightly by the FGA scheduler.
 */

const FGAMarketDemand = require('../models/FGAMarketDemand');

function JobRequest()     { return require('../../../models/JobRequest');     }
function Pro()            { return require('../../../models/Pro');            }
function LeadAssignment() { return require('../../../models/LeadAssignment'); }

function getSeason(month) {
  if (month >= 3 && month <= 5)  return 'spring';
  if (month >= 6 && month <= 8)  return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

/**
 * Compute and upsert demand snapshots for a given month.
 *
 * @param {number} year
 * @param {number} month  1-indexed
 * @returns {Promise<{ upserted: number, errors: number }>}
 */
async function computeMonthlyDemand(year, month) {
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 0, 23, 59, 59, 999);
  const season = getSeason(month);

  // Aggregate by trade + city + state
  const agg = await JobRequest().aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: {
          trade: '$trade',
          city:  { $ifNull: ['$city',  ''] },
          state: { $ifNull: ['$state', ''] },
        },
        leadVolume:    { $sum: 1 },
        leadsAccepted: { $sum: { $cond: [{ $in: ['$status', ['assigned', 'in-progress', 'completed']] }, 1, 0] } },
        leadsCompleted:{ $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        leadsCancelled:{ $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
      },
    },
  ]);

  // Subscription counts for the period (new subs)
  const subAgg = await Pro().aggregate([
    {
      $match: {
        subscriptionStartDate: { $gte: start, $lte: end },
        state: { $ne: null },
      },
    },
    {
      $group: {
        _id: '$state',
        newSubs:      { $sum: 1 },
        cancelledSubs:{ $sum: { $cond: [{ $eq: ['$subscriptionStatus', 'cancelled'] }, 1, 0] } },
        activePros:   { $sum: { $cond: ['$subscriptionActive', 1, 0] } },
      },
    },
  ]);
  const subMap = Object.fromEntries(subAgg.map(s => [s._id, s]));

  // Avg response time per trade
  const responseAgg = await LeadAssignment().aggregate([
    { $match: { createdAt: { $gte: start, $lte: end }, responseTimeMs: { $gt: 0 } } },
    {
      $lookup: {
        from: 'jobrequests',
        localField: 'leadId',
        foreignField: '_id',
        as: 'lead',
      },
    },
    { $unwind: '$lead' },
    {
      $group: {
        _id: '$lead.trade',
        avgResponseMs: { $avg: '$responseTimeMs' },
      },
    },
  ]);
  const responseMap = Object.fromEntries(responseAgg.map(r => [r._id, r.avgResponseMs]));

  let upserted = 0;
  let errors   = 0;

  for (const row of agg) {
    const { trade, city, state } = row._id;
    const stateData = subMap[state] || {};
    const avgResponseMs = responseMap[trade] || 0;
    const completionRate = row.leadVolume > 0
      ? (row.leadsCompleted / row.leadVolume) * 100 : 0;
    const netGrowth = (stateData.newSubs || 0) - (stateData.cancelledSubs || 0);

    try {
      await FGAMarketDemand.findOneAndUpdate(
        { year, month, trade, city, state },
        {
          $set: {
            season,
            leadVolume:           row.leadVolume,
            leadsAccepted:        row.leadsAccepted,
            leadsCompleted:       row.leadsCompleted,
            leadsCancelled:       row.leadsCancelled,
            completionRate:       Math.round(completionRate * 10) / 10,
            avgResponseSec:       Math.round((avgResponseMs / 1000) * 10) / 10,
            newSubscriptions:     stateData.newSubs  || 0,
            cancelledSubscriptions: stateData.cancelledSubs || 0,
            netSubscriptionGrowth:  netGrowth,
            activeProsCount:        stateData.activePros || 0,
            computedAt:           new Date(),
          },
        },
        { upsert: true }
      );
      upserted += 1;
    } catch (err) {
      console.error('[FGA:MarketDemand] ❌ upsert error:', err.message);
      errors += 1;
    }
  }

  return { upserted, errors };
}

/**
 * Compute demand for the current month.
 */
async function computeCurrentMonth() {
  const now = new Date();
  return computeMonthlyDemand(now.getFullYear(), now.getMonth() + 1);
}

/**
 * Query demand data.
 *
 * @param {object} filter  e.g. { trade: 'roofing', state: 'NC', year: 2026 }
 * @param {number} [limit=50]
 */
async function getDemand(filter = {}, limit = 50) {
  return FGAMarketDemand.find(filter)
    .sort({ year: -1, month: -1, leadVolume: -1 })
    .limit(limit)
    .lean();
}

/**
 * Top trades by demand in a given period.
 *
 * @param {number} [months=3]
 */
async function getTopTradesByDemand(months = 3) {
  const now = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;

  // Build list of (year, month) pairs for the last N months
  const periods = [];
  for (let i = 0; i < months; i++) {
    let m = month - i;
    let y = year;
    if (m <= 0) { m += 12; y -= 1; }
    periods.push({ year: y, month: m });
  }

  const orClauses = periods.map(p => ({ year: p.year, month: p.month }));

  return FGAMarketDemand.aggregate([
    { $match: { $or: orClauses } },
    {
      $group: {
        _id: '$trade',
        totalLeadVolume:   { $sum: '$leadVolume' },
        totalCompleted:    { $sum: '$leadsCompleted' },
        avgResponseSec:    { $avg: '$avgResponseSec' },
      },
    },
    {
      $addFields: {
        completionRate: {
          $cond: [
            { $gt: ['$totalLeadVolume', 0] },
            { $multiply: [{ $divide: ['$totalCompleted', '$totalLeadVolume'] }, 100] },
            0,
          ],
        },
      },
    },
    { $sort: { totalLeadVolume: -1 } },
    { $limit: 20 },
  ]);
}

module.exports = { computeMonthlyDemand, computeCurrentMonth, getDemand, getTopTradesByDemand };
