'use strict';

/**
 * Intelligent Lead Routing Service
 *
 * Calculates a Routing Score for each candidate professional and returns
 * them in priority order.  Higher score = notified first.
 *
 * Score breakdown (total 100 pts):
 *   Distance            25 pts  (closer = higher)
 *   Trade Match         20 pts  (exact = full; related = partial)
 *   Subscription Tier   15 pts  (ai_plus > pro > free)
 *   Performance Score   15 pts  (from FGAProScore)
 *   Avg Response Time   10 pts  (faster = higher)
 *   Acceptance Rate      5 pts
 *   Completion Rate      5 pts
 *   Avg Customer Rating  5 pts
 *   Availability         5 pts  (subscription active)
 *   Verified Status      5 pts
 *   Recent Activity      5 pts  (active last 30d, per FGAProScore)
 *
 * After routing, every attempt is logged to FGARoutingAttempt.
 */

const mongoose = require('mongoose');
const FGARoutingAttempt = require('../models/FGARoutingAttempt');
const FGAProScore       = require('../models/FGAProScore');
const performanceSvc    = require('./performanceScoringService');

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

function haversineDistanceMiles(coord1, coord2) {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;
  const R = 3958.8; // earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distanceScore(miles) {
  if (miles <= 5)  return 25;
  if (miles <= 10) return 20;
  if (miles <= 20) return 15;
  if (miles <= 30) return 10;
  if (miles <= 50) return 5;
  return 2;
}

const TIER_SCORES = { ai_plus: 15, pro: 10, premium: 10, free: 3 };

function tierScore(tier) {
  return TIER_SCORES[tier] || 3;
}

function responseTimeScore(avgSec) {
  if (avgSec <= 0)    return 0;
  if (avgSec <= 60)   return 10;
  if (avgSec <= 300)  return 8;
  if (avgSec <= 900)  return 5;
  if (avgSec <= 3600) return 3;
  return 1;
}

// ── Core routing calculation ──────────────────────────────────────────────────

/**
 * Score a single pro against a lead.
 *
 * @param {object} pro       - Mongoose Pro document (lean)
 * @param {object} lead      - Mongoose JobRequest document (lean)
 * @param {object} proScore  - FGAProScore document (lean or null)
 * @returns {object}         - { routingScore, breakdown, distanceMiles }
 */
function scorePro(pro, lead, proScore) {
  const breakdown = {};

  // 1. Distance
  const leadCoords = lead?.location?.coordinates;
  const proCoords  = pro?.location?.coordinates;
  let distanceMiles = 9999;
  if (
    Array.isArray(leadCoords) && leadCoords.length === 2 &&
    Array.isArray(proCoords)  && proCoords.length  === 2
  ) {
    distanceMiles = haversineDistanceMiles(proCoords, leadCoords);
  }
  breakdown.scoreDistanceMiles  = Math.round(distanceMiles * 10) / 10;
  breakdown.scoreDistancePoints = distanceScore(distanceMiles);

  // 2. Trade match
  const proTrade  = (pro.trade || pro.primaryService || '').toLowerCase();
  const leadTrade = (lead.trade || '').toLowerCase();
  breakdown.scoreTradeMatch = proTrade === leadTrade ? 20
    : proTrade.includes(leadTrade) || leadTrade.includes(proTrade) ? 10
    : 0;

  // 3. Subscription tier
  breakdown.scoreSubTier = tierScore(pro.subscriptionTier);

  // 4. Performance score
  const perf = proScore?.score || 0;
  breakdown.scorePerformance = Math.round((perf / 100) * 15);

  // 5. Response time
  breakdown.scoreResponseTime = responseTimeScore(proScore?.avgResponseTimeSec || 0);

  // 6. Acceptance rate
  breakdown.scoreAcceptanceRate = Math.round((clamp(proScore?.acceptanceRate || 0, 0, 100) / 100) * 5);

  // 7. Completion rate
  breakdown.scoreCompletionRate = Math.round((clamp(proScore?.completionRate || 0, 0, 100) / 100) * 5);

  // 8. Avg rating
  breakdown.scoreRating = Math.round(((proScore?.avgRating || 0) / 5) * 5);

  // 9. Availability (active subscription)
  const isActive =
    pro.isActive &&
    pro.subscriptionActive &&
    !['paused', 'cancelled', 'inactive', 'past_due'].includes(pro.subscriptionStatus);
  breakdown.scoreAvailability = isActive ? 5 : 0;

  // 10. Verified
  breakdown.scoreVerified = pro.isVerified ? 5 : 0;

  // 11. Recent activity (active in last 30 days)
  breakdown.scoreRecentActivity = (proScore?.recent30dLeadsReceived || 0) > 0 ? 5 : 0;

  const sum =
    breakdown.scoreDistancePoints +
    breakdown.scoreTradeMatch +
    breakdown.scoreSubTier +
    breakdown.scorePerformance +
    breakdown.scoreResponseTime +
    breakdown.scoreAcceptanceRate +
    breakdown.scoreCompletionRate +
    breakdown.scoreRating +
    breakdown.scoreAvailability +
    breakdown.scoreVerified +
    breakdown.scoreRecentActivity;

  return {
    routingScore: clamp(sum, 0, 100),
    distanceMiles,
    ...breakdown,
  };
}

/**
 * Rank candidate professionals for a lead.
 *
 * @param {object[]} pros   - Array of lean Pro objects
 * @param {object}   lead   - Lean JobRequest object
 * @returns {Promise<Array<{ pro, routingScore, breakdown, distanceMiles }>>}
 */
async function rankPros(pros, lead) {
  // Bulk-fetch performance scores
  const proIds = pros.map(p => p._id);
  const scores = await FGAProScore.find({ proId: { $in: proIds } }).lean();
  const scoreMap = Object.fromEntries(scores.map(s => [String(s.proId), s]));

  const ranked = pros.map(pro => {
    const proScore = scoreMap[String(pro._id)] || null;
    const result   = scorePro(pro, lead, proScore);
    return { pro, ...result };
  });

  // Sort descending by routing score
  ranked.sort((a, b) => b.routingScore - a.routingScore);
  return ranked;
}

/**
 * Log a routing attempt.
 *
 * @param {object} params
 * @param {ObjectId|string} params.leadId
 * @param {ObjectId|string} params.proId
 * @param {number}          params.attemptOrder
 * @param {object}          params.breakdown   - Score breakdown from scorePro
 * @param {number}          params.routingScore
 * @param {number}          params.distanceMiles
 * @returns {Promise<FGARoutingAttempt>}
 */
async function logAttempt({ leadId, proId, attemptOrder, breakdown, routingScore, distanceMiles }) {
  try {
    return await FGARoutingAttempt.create({
      leadId,
      proId,
      attemptOrder: attemptOrder || 1,
      routingScore: routingScore || 0,
      scoreDistanceMiles:  distanceMiles || 0,
      scoreDistancePoints: breakdown?.scoreDistancePoints || 0,
      scoreTradeMatch:     breakdown?.scoreTradeMatch     || 0,
      scoreSubTier:        breakdown?.scoreSubTier        || 0,
      scorePerformance:    breakdown?.scorePerformance    || 0,
      scoreResponseTime:   breakdown?.scoreResponseTime   || 0,
      scoreAcceptanceRate: breakdown?.scoreAcceptanceRate || 0,
      scoreCompletionRate: breakdown?.scoreCompletionRate || 0,
      scoreRating:         breakdown?.scoreRating         || 0,
      scoreAvailability:   breakdown?.scoreAvailability   || 0,
      scoreVerified:       breakdown?.scoreVerified       || 0,
      scoreRecentActivity: breakdown?.scoreRecentActivity || 0,
      notifiedAt: new Date(),
    });
  } catch (err) {
    console.error('[FGA:Routing] ❌ logAttempt error:', err.message);
    return null;
  }
}

/**
 * Update a routing attempt outcome.
 *
 * @param {ObjectId|string} leadId
 * @param {ObjectId|string} proId
 * @param {'accepted'|'declined'|'expired'|'cancelled'} outcome
 */
async function updateOutcome(leadId, proId, outcome) {
  try {
    const respondedAt = new Date();
    const attempt = await FGARoutingAttempt.findOne({ leadId, proId }).sort({ createdAt: -1 });
    if (!attempt) return;
    const responseMs = respondedAt - attempt.notifiedAt;
    await attempt.updateOne({ outcome, respondedAt, responseMs: Math.max(0, responseMs) });
  } catch (err) {
    console.error('[FGA:Routing] ❌ updateOutcome error:', err.message);
  }
}

/**
 * Get routing summary for a lead.
 *
 * @param {string|ObjectId} leadId
 * @returns {Promise<FGARoutingAttempt[]>}
 */
async function getLeadRoutingLog(leadId) {
  return FGARoutingAttempt.find({ leadId })
    .sort({ attemptOrder: 1 })
    .populate('proId', 'name firstName lastName trade city state')
    .lean();
}

module.exports = { rankPros, scorePro, logAttempt, updateOutcome, getLeadRoutingLog };
