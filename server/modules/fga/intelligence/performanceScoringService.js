'use strict';

/**
 * Performance Scoring Service
 *
 * Calculates and persists a live Performance Score for every professional.
 * Called whenever a lead event fires (viewed, accepted, declined, completed, etc.)
 *
 * Score components (total 100 pts):
 *   Acceptance Rate      20 pts
 *   Completion Rate      20 pts
 *   Avg Rating           20 pts
 *   Response Time        15 pts  (faster = better)
 *   Response Consistency  5 pts
 *   Activity Level        5 pts
 *   Recent Performance   10 pts  (last 30 days)
 *   Cancellation Penalty  5 pts  (inverse)
 */

const mongoose = require('mongoose');
const FGAProScore = require('../models/FGAProScore');
const LeadAssignment = require('../../../models/LeadAssignment');
const Review = require('../../../models/Review');

// ── Thresholds ────────────────────────────────────────────────────────────────

const EXCELLENT_RESPONSE_SEC = 60;      // ≤ 60s → full response-time points
const GOOD_RESPONSE_SEC      = 300;     // ≤ 5m
const FAIR_RESPONSE_SEC      = 900;     // ≤ 15m
const POOR_RESPONSE_SEC      = 3600;    // ≤ 1h
const RECENT_WINDOW_DAYS     = 30;

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeDiv(a, b) {
  return b > 0 ? a / b : 0;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function responseTimePoints(avgSec) {
  if (avgSec <= 0)                   return 0;   // no data
  if (avgSec <= EXCELLENT_RESPONSE_SEC) return 15;
  if (avgSec <= GOOD_RESPONSE_SEC)   return 12;
  if (avgSec <= FAIR_RESPONSE_SEC)   return 8;
  if (avgSec <= POOR_RESPONSE_SEC)   return 4;
  return 1;
}

function scoreLabel(score) {
  if (score >= 90) return 'Elite';
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score > 0)   return 'Poor';
  return 'Unrated';
}

// ── Main calculation ─────────────────────────────────────────────────────────

/**
 * Recalculate the performance score for a single professional.
 * Fetches live data from LeadAssignment and Review.
 *
 * @param {string|ObjectId} proId
 * @returns {Promise<FGAProScore>}
 */
async function calculateScore(proId) {
  const pid = typeof proId === 'string' ? new mongoose.Types.ObjectId(proId) : proId;

  // ── Fetch all-time assignment data ──────────────────────────────────────────
  const [assignmentAgg, reviewAgg, recentAgg] = await Promise.all([
    LeadAssignment.aggregate([
      { $match: { proId: pid } },
      {
        $group: {
          _id: null,
          totalReceived:   { $sum: 1 },
          totalAccepted:   { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
          totalDeclined:   { $sum: { $cond: [{ $eq: ['$status', 'declined'] }, 1, 0] } },
          totalExpired:    { $sum: { $cond: [{ $eq: ['$status', 'expired'] },  1, 0] } },
          sumResponseMs:   { $sum: { $ifNull: ['$responseTimeMs',   0] } },
          sumOpenMs:       { $sum: { $ifNull: ['$openTimeMs',       0] } },
          sumAcceptMs:     { $sum: { $ifNull: ['$acceptanceDelayMs',0] } },
          countWithResponse: {
            $sum: {
              $cond: [{ $gt: [{ $ifNull: ['$responseTimeMs', 0] }, 0] }, 1, 0]
            }
          },
          countWithOpen: {
            $sum: {
              $cond: [{ $gt: [{ $ifNull: ['$openTimeMs', 0] }, 0] }, 1, 0]
            }
          },
          countWithAccept: {
            $sum: {
              $cond: [{ $gt: [{ $ifNull: ['$acceptanceDelayMs', 0] }, 0] }, 1, 0]
            }
          },
        },
      },
    ]),

    Review.aggregate([
      { $match: { proId: pid } },
      {
        $group: {
          _id: null,
          avgRating:   { $avg: '$rating' },
          totalReviews:{ $sum: 1 },
        },
      },
    ]),

    // Recent 30-day window
    LeadAssignment.aggregate([
      {
        $match: {
          proId: pid,
          createdAt: { $gte: new Date(Date.now() - RECENT_WINDOW_DAYS * 86400000) },
        },
      },
      {
        $group: {
          _id: null,
          recentReceived: { $sum: 1 },
          recentAccepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const agg    = assignmentAgg[0] || {};
  const revAgg = reviewAgg[0]    || {};
  const recAgg = recentAgg[0]    || {};

  const totalReceived = agg.totalReceived || 0;
  const totalAccepted = agg.totalAccepted || 0;
  const totalDeclined = agg.totalDeclined || 0;
  const totalExpired  = agg.totalExpired  || 0;

  // Rates (0–100)
  const acceptanceRate   = clamp(safeDiv(totalAccepted, totalReceived) * 100, 0, 100);
  const declineRate      = clamp(safeDiv(totalDeclined, totalReceived) * 100, 0, 100);
  const cancellationRate = clamp(safeDiv(totalExpired,  totalReceived) * 100, 0, 100);

  // Average timing (seconds)
  const avgResponseTimeSec = agg.countWithResponse > 0
    ? (agg.sumResponseMs / agg.countWithResponse) / 1000 : 0;
  const avgLeadOpenTimeSec = agg.countWithOpen > 0
    ? (agg.sumOpenMs / agg.countWithOpen) / 1000 : 0;
  const avgAcceptanceTimeSec = agg.countWithAccept > 0
    ? (agg.sumAcceptMs / agg.countWithAccept) / 1000 : 0;

  const avgRating   = clamp(revAgg.avgRating || 0, 0, 5);
  const totalReviews = revAgg.totalReviews || 0;

  // Recent performance (last 30 days acceptance rate)
  const recentAcceptanceRate = clamp(
    safeDiv(recAgg.recentAccepted || 0, recAgg.recentReceived || 0) * 100, 0, 100
  );

  // Activity level: has the pro been active in last 30 days?
  const activityLevel = (recAgg.recentReceived || 0) > 0
    ? clamp(recAgg.recentReceived * 5, 0, 100)
    : 0;

  // Response consistency: inverse of coefficient of variation (simplified: high acceptance + low expire)
  const responseConsistency = clamp(
    100 - cancellationRate * 0.5 - declineRate * 0.2, 0, 100
  );

  // ── Score components ───────────────────────────────────────────────────────

  const s_acceptance   = (acceptanceRate / 100) * 20;            // max 20
  const s_completion   = 0;                                       // needs job data — placeholder
  const s_rating       = (avgRating / 5) * 20;                   // max 20
  const s_responseTime = responseTimePoints(avgResponseTimeSec);  // max 15
  const s_consistency  = (responseConsistency / 100) * 5;        // max 5
  const s_activity     = (activityLevel / 100) * 5;              // max 5
  const s_recent       = (recentAcceptanceRate / 100) * 10;      // max 10
  const s_cancelPenalty= Math.max(0, 5 - (cancellationRate / 20)); // max 5

  const rawScore = s_acceptance + s_completion + s_rating + s_responseTime
    + s_consistency + s_activity + s_recent + s_cancelPenalty;

  // Scale to 100 — max theoretical = 85 (20+0+20+15+5+5+10+5)
  const score = clamp(Math.round((rawScore / 85) * 100), 0, 100);

  const overallReliability = clamp(
    Math.round((acceptanceRate * 0.4 + (avgRating / 5) * 40 + responseConsistency * 0.2)),
    0, 100
  );

  // ── Upsert the score document ──────────────────────────────────────────────
  const update = {
    totalLeadsReceived:  totalReceived,
    totalLeadsAccepted:  totalAccepted,
    totalLeadsDeclined:  totalDeclined,
    totalLeadsExpired:   totalExpired,
    totalReviews,

    sumResponseTimeMs:   agg.sumResponseMs || 0,
    sumOpenTimeMs:       agg.sumOpenMs     || 0,
    sumAcceptTimeMs:     agg.sumAcceptMs   || 0,

    avgResponseTimeSec,
    avgLeadOpenTimeSec,
    avgAcceptanceTimeSec,

    acceptanceRate,
    declineRate,
    cancellationRate,
    avgRating,

    responseConsistency,
    activityLevel,
    recentPerformance: recentAcceptanceRate,
    overallReliability,

    recent30dLeadsReceived: recAgg.recentReceived || 0,
    recent30dLeadsAccepted: recAgg.recentAccepted || 0,
    recent30dAvgRating:     avgRating,

    score,
    scoreLabel: scoreLabel(score),
    lastCalculatedAt: new Date(),
  };

  return FGAProScore.findOneAndUpdate(
    { proId: pid },
    { $set: update },
    { upsert: true, new: true }
  );
}

/**
 * Recalculate scores for all professionals (batch — run nightly).
 * Processes in chunks to avoid memory pressure.
 *
 * @returns {Promise<{ processed: number, errors: number }>}
 */
async function recalculateAll() {
  const Pro = require('../../../models/Pro');
  const cursor = Pro.find({ isActive: true }).select('_id').lean().cursor();
  let processed = 0;
  let errors    = 0;

  for await (const pro of cursor) {
    try {
      await calculateScore(pro._id);
      processed += 1;
    } catch (err) {
      console.error(`[FGA:PerfScore] ❌ proId=${pro._id}:`, err.message);
      errors += 1;
    }
  }

  return { processed, errors };
}

/**
 * Get a single pro's score record (cached from last calculation).
 *
 * @param {string|ObjectId} proId
 * @returns {Promise<FGAProScore|null>}
 */
async function getScore(proId) {
  return FGAProScore.findOne({ proId }).lean();
}

/**
 * Get top-scoring pros.
 *
 * @param {number} limit
 * @param {object} [filter]  Additional query filter
 * @returns {Promise<FGAProScore[]>}
 */
async function getTopPros(limit = 25, filter = {}) {
  return FGAProScore.find({ score: { $gt: 0 }, ...filter })
    .sort({ score: -1 })
    .limit(limit)
    .populate('proId', 'name firstName lastName trade city state subscriptionTier isVerified')
    .lean();
}

module.exports = { calculateScore, recalculateAll, getScore, getTopPros, scoreLabel };
