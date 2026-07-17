'use strict';

/**
 * Leaderboard Service
 *
 * Generates ranked leaderboards from real database data.
 * All boards are computed on-demand (no pre-computed cache) and cached in-process for 5 minutes.
 */

const FGAProScore      = require('../models/FGAProScore');
const FGARecruiterScore = require('../models/FGARecruiterScore');

// ── Simple in-process cache (5 min TTL, max 50 entries) ──────────────────────

const _cache = new Map();
const CACHE_TTL_MS  = 5 * 60 * 1000;
const CACHE_MAX_SIZE = 50;

function cached(key, fn) {
  const hit = _cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) return Promise.resolve(hit.data);
  return fn().then(data => {
    // Evict oldest entry if at capacity
    if (_cache.size >= CACHE_MAX_SIZE) {
      const oldest = _cache.keys().next().value;
      _cache.delete(oldest);
    }
    _cache.set(key, { data, ts: Date.now() });
    return data;
  });
}

// ── Board: Fastest Responders ─────────────────────────────────────────────────

async function getFastestResponders(limit = 25) {
  return cached(`fastest_responders_${limit}`, async () => {
    return FGAProScore.find({
      avgResponseTimeSec: { $gt: 0 },
      totalLeadsReceived: { $gte: 3 },
    })
      .sort({ avgResponseTimeSec: 1 })  // ascending = fastest first
      .limit(limit)
      .populate('proId', 'name firstName lastName trade city state isVerified subscriptionTier')
      .lean();
  });
}

// ── Board: Highest Acceptance Rate ────────────────────────────────────────────

async function getHighestAcceptanceRate(limit = 25) {
  return cached(`highest_acceptance_${limit}`, async () => {
    return FGAProScore.find({
      acceptanceRate: { $gt: 0 },
      totalLeadsReceived: { $gte: 3 },
    })
      .sort({ acceptanceRate: -1 })
      .limit(limit)
      .populate('proId', 'name firstName lastName trade city state isVerified subscriptionTier')
      .lean();
  });
}

// ── Board: Highest Completion Rate ────────────────────────────────────────────

async function getHighestCompletionRate(limit = 25) {
  return cached(`highest_completion_${limit}`, async () => {
    // Completion rate comes from JobRequest data
    const JobRequest = require('../../../models/JobRequest');
    const agg = await JobRequest.aggregate([
      { $match: { assignedTo: { $ne: null }, status: { $in: ['completed', 'cancelled', 'in-progress'] } } },
      {
        $group: {
          _id: '$assignedTo',
          total:     { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        },
      },
      { $match: { total: { $gte: 3 } } },
      {
        $addFields: {
          completionRate: { $multiply: [{ $divide: ['$completed', '$total'] }, 100] },
        },
      },
      { $sort: { completionRate: -1 } },
      { $limit: limit },
    ]);

    // Populate pro details
    const Pro = require('../../../models/Pro');
    const proIds = agg.map(r => r._id);
    const pros = await Pro.find({ _id: { $in: proIds } })
      .select('name firstName lastName trade city state isVerified subscriptionTier')
      .lean();
    const proMap = Object.fromEntries(pros.map(p => [String(p._id), p]));

    return agg.map(r => ({
      ...r,
      pro: proMap[String(r._id)] || null,
    }));
  });
}

// ── Board: Best Reviews ───────────────────────────────────────────────────────

async function getBestReviews(limit = 25) {
  return cached(`best_reviews_${limit}`, async () => {
    return FGAProScore.find({
      avgRating: { $gte: 4 },
      totalReviews: { $gte: 2 },
    })
      .sort({ avgRating: -1, totalReviews: -1 })
      .limit(limit)
      .populate('proId', 'name firstName lastName trade city state isVerified subscriptionTier')
      .lean();
  });
}

// ── Board: Most Active Pros ───────────────────────────────────────────────────

async function getMostActivePros(limit = 25) {
  return cached(`most_active_${limit}`, async () => {
    return FGAProScore.find({
      recent30dLeadsReceived: { $gt: 0 },
    })
      .sort({ recent30dLeadsReceived: -1, activityLevel: -1 })
      .limit(limit)
      .populate('proId', 'name firstName lastName trade city state isVerified subscriptionTier')
      .lean();
  });
}

// ── Board: Top Recruiters ─────────────────────────────────────────────────────

async function getTopRecruiters(limit = 25) {
  return cached(`top_recruiters_${limit}`, async () => {
    return FGARecruiterScore.find({ score: { $gt: 0 } })
      .sort({ score: -1 })
      .limit(limit)
      .populate('recruiterId', 'name email city state recruiterCode')
      .lean();
  });
}

// ── Board: Highest Revenue Contributors ──────────────────────────────────────

async function getHighestRevenueContributors(limit = 25) {
  return cached(`top_revenue_${limit}`, async () => {
    return FGARecruiterScore.find({ revenueGeneratedCents: { $gt: 0 } })
      .sort({ revenueGeneratedCents: -1 })
      .limit(limit)
      .populate('recruiterId', 'name email city state recruiterCode')
      .lean();
  });
}

// ── Overall Pro Leaderboard ───────────────────────────────────────────────────

async function getOverallProLeaderboard(limit = 25) {
  return cached(`overall_pro_${limit}`, async () => {
    return FGAProScore.find({ score: { $gt: 0 } })
      .sort({ score: -1 })
      .limit(limit)
      .populate('proId', 'name firstName lastName trade city state isVerified subscriptionTier avgRating')
      .lean();
  });
}

module.exports = {
  getFastestResponders,
  getHighestAcceptanceRate,
  getHighestCompletionRate,
  getBestReviews,
  getMostActivePros,
  getTopRecruiters,
  getHighestRevenueContributors,
  getOverallProLeaderboard,
};
