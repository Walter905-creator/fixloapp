'use strict';

/**
 * FGARecruiterScore — Recruiter Performance Score
 *
 * Calculated from RecruiterReferral and RecruiterCommission data.
 * Updated whenever a referral status changes or a commission is processed.
 */

const mongoose = require('mongoose');

const FGARecruiterScoreSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecruiterProfile',
      required: true,
      unique: true,
      index: true,
    },

    // ── Raw counters ──────────────────────────────────────────────────────────
    prosInvited:        { type: Number, default: 0 },
    registrations:      { type: Number, default: 0 },
    verifiedPros:       { type: Number, default: 0 },
    subscriptions:      { type: Number, default: 0 },
    activeSubscriptions:{ type: Number, default: 0 },  // still active today
    cancellations:      { type: Number, default: 0 },
    revenueGeneratedCents: { type: Number, default: 0 },

    // ── Calculated rates ─────────────────────────────────────────────────────
    registrationRate:   { type: Number, default: 0 },  // registrations / prosInvited (%)
    verificationRate:   { type: Number, default: 0 },  // verifiedPros / registrations (%)
    conversionRate:     { type: Number, default: 0 },  // subscriptions / registrations (%)
    retentionRate:      { type: Number, default: 0 },  // activeSubscriptions / subscriptions (%)
    avgTimeToSubscribeDays: { type: Number, default: 0 },  // avg days from signup to first payment

    // ── Score ─────────────────────────────────────────────────────────────────
    score:      { type: Number, default: 0, min: 0, max: 100 },
    scoreLabel: {
      type: String,
      enum: ['Poor', 'Fair', 'Good', 'Excellent', 'Elite', 'Unrated'],
      default: 'Unrated',
    },

    // ── Commission totals (cents) ─────────────────────────────────────────────
    totalPendingCents:  { type: Number, default: 0 },
    totalApprovedCents: { type: Number, default: 0 },
    totalPaidCents:     { type: Number, default: 0 },
    lifetimeCents:      { type: Number, default: 0 },

    // ── Last calculated ───────────────────────────────────────────────────────
    lastCalculatedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'fga_recruiter_scores',
  }
);

FGARecruiterScoreSchema.index({ score: -1 });
FGARecruiterScoreSchema.index({ conversionRate: -1 });
FGARecruiterScoreSchema.index({ revenueGeneratedCents: -1 });

module.exports = mongoose.model('FGARecruiterScore', FGARecruiterScoreSchema);
