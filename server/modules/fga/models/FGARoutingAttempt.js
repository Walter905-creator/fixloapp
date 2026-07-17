'use strict';

/**
 * FGARoutingAttempt — Intelligent Lead Routing Log
 *
 * Records every attempt to route a lead to a professional,
 * including the scoring breakdown used to make the routing decision.
 */

const mongoose = require('mongoose');

const FGARoutingAttemptSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobRequest',
      required: true,
      index: true,
    },

    proId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pro',
      required: true,
      index: true,
    },

    // Routing attempt order (1 = first notified)
    attemptOrder: { type: Number, default: 1 },

    // ── Scoring breakdown ─────────────────────────────────────────────────────
    routingScore:        { type: Number, default: 0 },  // overall routing score

    scoreDistanceMiles:  { type: Number, default: 0 },  // actual distance
    scoreDistancePoints: { type: Number, default: 0 },  // 0–25
    scoreTradeMatch:     { type: Number, default: 0 },  // 0–20
    scoreSubTier:        { type: Number, default: 0 },  // 0–15
    scorePerformance:    { type: Number, default: 0 },  // 0–15
    scoreResponseTime:   { type: Number, default: 0 },  // 0–10
    scoreAcceptanceRate: { type: Number, default: 0 },  // 0–5
    scoreCompletionRate: { type: Number, default: 0 },  // 0–5
    scoreRating:         { type: Number, default: 0 },  // 0–5
    scoreAvailability:   { type: Number, default: 0 },  // 0–5 (subscription active?)
    scoreVerified:       { type: Number, default: 0 },  // 0–5
    scoreRecentActivity: { type: Number, default: 0 },  // 0–5 (active last 30d)

    // ── Outcome ───────────────────────────────────────────────────────────────
    outcome: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired', 'cancelled', 'skipped'],
      default: 'pending',
      index: true,
    },

    notifiedAt:   { type: Date, default: Date.now },
    respondedAt:  { type: Date, default: null },
    responseMs:   { type: Number, default: null },  // ms from notified to response
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'fga_routing_attempts',
  }
);

FGARoutingAttemptSchema.index({ leadId: 1, attemptOrder: 1 });
FGARoutingAttemptSchema.index({ proId: 1, notifiedAt: -1 });
FGARoutingAttemptSchema.index({ outcome: 1, notifiedAt: -1 });

module.exports = mongoose.model('FGARoutingAttempt', FGARoutingAttemptSchema);
