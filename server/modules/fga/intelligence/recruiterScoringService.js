'use strict';

/**
 * Recruiter Scoring Service
 *
 * Calculates and persists performance scores for every recruiter.
 * Derives metrics from RecruiterReferral and RecruiterCommission.
 *
 * Score breakdown (total 100 pts):
 *   Subscriptions / Registrations  30 pts  (conversion rate)
 *   Retention Rate                 25 pts
 *   Revenue Generated              20 pts  (log scale)
 *   Verification Rate              15 pts
 *   Avg Time to Subscribe          10 pts  (faster = better)
 */

const FGARecruiterScore  = require('../models/FGARecruiterScore');

function RecruiterProfile()  { return require('../../../models/RecruiterProfile');  }
function RecruiterReferral() { return require('../../../models/RecruiterReferral'); }
function RecruiterCommission() { return require('../../../models/RecruiterCommission'); }
function Pro()               { return require('../../../models/Pro');               }

// ── Score label ───────────────────────────────────────────────────────────────

function scoreLabel(score) {
  if (score >= 90) return 'Elite';
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score > 0)   return 'Poor';
  return 'Unrated';
}

function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

// ── Per-recruiter calculation ─────────────────────────────────────────────────

/**
 * Calculate the performance score for one recruiter.
 *
 * @param {string|ObjectId} recruiterId
 * @returns {Promise<FGARecruiterScore>}
 */
async function calculateScore(recruiterId) {
  const mongoose = require('mongoose');
  const rid = typeof recruiterId === 'string'
    ? new mongoose.Types.ObjectId(recruiterId)
    : recruiterId;

  // All referrals for this recruiter
  const referrals = await RecruiterReferral().find({ recruiterId: rid }).lean();
  const prosInvited    = referrals.length;
  const registrations  = referrals.filter(r => r.proId).length;
  const subscriptions  = referrals.filter(r => r.status === 'active' || r.status === 'paid').length;
  const cancellations  = referrals.filter(r => r.status === 'cancelled').length;

  // Verified pros count (pro has isVerified = true)
  let verifiedPros = 0;
  if (registrations > 0) {
    const proIds = referrals.filter(r => r.proId).map(r => r.proId);
    verifiedPros = await Pro().countDocuments({ _id: { $in: proIds }, isVerified: true });
  }

  // Active subscriptions today
  let activeSubscriptions = 0;
  if (subscriptions > 0) {
    const proIds = referrals.filter(r => r.status === 'active' || r.status === 'paid').map(r => r.proId);
    activeSubscriptions = await Pro().countDocuments({
      _id: { $in: proIds },
      subscriptionActive: true,
    });
  }

  // Revenue from commissions
  const commissionAgg = await RecruiterCommission().aggregate([
    { $match: { recruiterId: rid } },
    {
      $group: {
        _id: null,
        pending:  { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
        approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0] } },
        paid:     { $sum: { $cond: [{ $eq: ['$status', 'paid'] },     '$amount', 0] } },
        lifetime: { $sum: '$amount' },
      },
    },
  ]);
  const commAgg = commissionAgg[0] || {};

  // Revenue generated (sum of subscription amounts from referrals)
  const revAgg = await RecruiterReferral().aggregate([
    { $match: { recruiterId: rid, subscriptionAmount: { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: '$subscriptionAmount' } } },
  ]);
  const revenueGeneratedCents = revAgg[0]?.total || 0;

  // Avg time from referral signup to first payment
  const timeAgg = await RecruiterReferral().aggregate([
    {
      $match: {
        recruiterId: rid,
        firstPaymentDate: { $ne: null },
        signupDate: { $ne: null },
      },
    },
    {
      $project: {
        diffMs: { $subtract: ['$firstPaymentDate', '$signupDate'] },
      },
    },
    { $group: { _id: null, avgMs: { $avg: '$diffMs' } } },
  ]);
  const avgTimeToSubscribeDays = timeAgg[0]?.avgMs
    ? Math.round((timeAgg[0].avgMs / 86400000) * 10) / 10
    : 0;

  // ── Rates ─────────────────────────────────────────────────────────────────
  const registrationRate  = prosInvited   > 0 ? (registrations / prosInvited)  * 100 : 0;
  const verificationRate  = registrations > 0 ? (verifiedPros  / registrations) * 100 : 0;
  const conversionRate    = registrations > 0 ? (subscriptions / registrations) * 100 : 0;
  const retentionRate     = subscriptions > 0 ? (activeSubscriptions / subscriptions) * 100 : 0;

  // ── Score ─────────────────────────────────────────────────────────────────
  const s_conversion   = (conversionRate  / 100) * 30;          // max 30
  const s_retention    = (retentionRate   / 100) * 25;          // max 25
  // Revenue: log scale — $1000 = 10 pts, $10000 = 20 pts
  const revDollars = revenueGeneratedCents / 100;
  const s_revenue  = revDollars > 0
    ? clamp(Math.log10(revDollars + 1) * 7, 0, 20)              // max 20
    : 0;
  const s_verification = (verificationRate / 100) * 15;         // max 15
  // Time to subscribe: ≤7 days = 10, ≤30 = 5, else 0
  const s_time = avgTimeToSubscribeDays > 0
    ? (avgTimeToSubscribeDays <= 7 ? 10 : avgTimeToSubscribeDays <= 30 ? 5 : 2)
    : 0;                                                         // max 10

  const rawScore = s_conversion + s_retention + s_revenue + s_verification + s_time;
  const score    = clamp(Math.round(rawScore), 0, 100);

  const update = {
    prosInvited,
    registrations,
    verifiedPros,
    subscriptions,
    activeSubscriptions,
    cancellations,
    revenueGeneratedCents,
    registrationRate:    Math.round(registrationRate  * 10) / 10,
    verificationRate:    Math.round(verificationRate  * 10) / 10,
    conversionRate:      Math.round(conversionRate    * 10) / 10,
    retentionRate:       Math.round(retentionRate     * 10) / 10,
    avgTimeToSubscribeDays,
    totalPendingCents:   commAgg.pending  || 0,
    totalApprovedCents:  commAgg.approved || 0,
    totalPaidCents:      commAgg.paid     || 0,
    lifetimeCents:       commAgg.lifetime || 0,
    score,
    scoreLabel: scoreLabel(score),
    lastCalculatedAt: new Date(),
  };

  return FGARecruiterScore.findOneAndUpdate(
    { recruiterId: rid },
    { $set: update },
    { upsert: true, new: true }
  );
}

/**
 * Recalculate scores for all recruiters (run nightly).
 *
 * @returns {Promise<{ processed: number, errors: number }>}
 */
async function recalculateAll() {
  const recruiters = await RecruiterProfile().find({ status: 'active' }).select('_id').lean();
  let processed = 0;
  let errors    = 0;

  for (const r of recruiters) {
    try {
      await calculateScore(r._id);
      processed += 1;
    } catch (err) {
      console.error(`[FGA:RecruiterScore] ❌ recruiterId=${r._id}:`, err.message);
      errors += 1;
    }
  }

  return { processed, errors };
}

/**
 * Get top-scoring recruiters.
 *
 * @param {number} [limit=25]
 */
async function getTopRecruiters(limit = 25) {
  return FGARecruiterScore.find({ score: { $gt: 0 } })
    .sort({ score: -1 })
    .limit(limit)
    .populate('recruiterId', 'name email city state recruiterCode')
    .lean();
}

module.exports = { calculateScore, recalculateAll, getTopRecruiters, scoreLabel };
