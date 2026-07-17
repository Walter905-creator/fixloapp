'use strict';

/**
 * FGAProScore — Professional Performance Score
 *
 * Stores the live performance score and metrics for each professional.
 * Recalculated whenever a lead event triggers an update.
 *
 * Score bands:
 *   0–39   Poor
 *   40–59  Fair
 *   60–79  Good
 *   80–89  Excellent
 *   90–100 Elite
 */

const mongoose = require('mongoose');

const FGAProScoreSchema = new mongoose.Schema(
  {
    proId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pro',
      required: true,
      unique: true,
      index: true,
    },

    // ── Raw counters (source of truth) ─────────────────────────────────────────
    totalLeadsReceived:   { type: Number, default: 0 },
    totalLeadsViewed:     { type: Number, default: 0 },
    totalLeadsAccepted:   { type: Number, default: 0 },
    totalLeadsDeclined:   { type: Number, default: 0 },
    totalLeadsExpired:    { type: Number, default: 0 },  // no response
    totalJobsCompleted:   { type: Number, default: 0 },
    totalJobsCancelled:   { type: Number, default: 0 },
    totalReviews:         { type: Number, default: 0 },
    totalCancellations:   { type: Number, default: 0 },

    // ── Timing sums (ms) — used to compute rolling averages ──────────────────
    sumResponseTimeMs:    { type: Number, default: 0 },  // time from SMS to first open
    sumOpenTimeMs:        { type: Number, default: 0 },  // time from open to accept/decline
    sumAcceptTimeMs:      { type: Number, default: 0 },  // time from SMS to accept

    // ── Calculated metrics (%) ────────────────────────────────────────────────
    avgResponseTimeSec:    { type: Number, default: 0 },  // avg seconds to open SMS link
    avgLeadOpenTimeSec:    { type: Number, default: 0 },  // avg seconds from open to decision
    avgAcceptanceTimeSec:  { type: Number, default: 0 },  // avg seconds from receipt to accept

    acceptanceRate:    { type: Number, default: 0 },  // 0–100
    declineRate:       { type: Number, default: 0 },  // 0–100
    completionRate:    { type: Number, default: 0 },  // 0–100
    cancellationRate:  { type: Number, default: 0 },  // 0–100
    avgRating:         { type: Number, default: 0 },  // 0–5
    responseConsistency: { type: Number, default: 0 }, // 0–100
    activityLevel:     { type: Number, default: 0 },   // 0–100 (recent lead interaction)
    recentPerformance: { type: Number, default: 0 },   // 0–100 (last 30 days)
    overallReliability:{ type: Number, default: 0 },   // 0–100 (weighted composite)

    // ── Overall score ─────────────────────────────────────────────────────────
    score:    { type: Number, default: 0, min: 0, max: 100 },
    scoreLabel: {
      type: String,
      enum: ['Poor', 'Fair', 'Good', 'Excellent', 'Elite', 'Unrated'],
      default: 'Unrated',
    },

    // ── Recent-period counters (last 30 days — refreshed nightly) ─────────────
    recent30dLeadsReceived:  { type: Number, default: 0 },
    recent30dLeadsAccepted:  { type: Number, default: 0 },
    recent30dJobsCompleted:  { type: Number, default: 0 },
    recent30dAvgRating:      { type: Number, default: 0 },

    // ── Last computed ──────────────────────────────────────────────────────────
    lastCalculatedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'fga_pro_scores',
  }
);

FGAProScoreSchema.index({ score: -1 });
FGAProScoreSchema.index({ acceptanceRate: -1 });
FGAProScoreSchema.index({ completionRate: -1 });
FGAProScoreSchema.index({ avgRating: -1 });
FGAProScoreSchema.index({ lastCalculatedAt: -1 });

module.exports = mongoose.model('FGAProScore', FGAProScoreSchema);
