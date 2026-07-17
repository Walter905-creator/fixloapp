'use strict';

/**
 * FGAMarketDemand — Market Demand Snapshot
 *
 * One document per (year, month, trade, city, state) combination.
 * Upserted nightly by the market demand service.
 */

const mongoose = require('mongoose');

const FGAMarketDemandSchema = new mongoose.Schema(
  {
    // ── Period ────────────────────────────────────────────────────────────────
    year:  { type: Number, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },  // 1–12
    season: {
      type: String,
      enum: ['spring', 'summer', 'fall', 'winter'],
      required: true,
    },

    // ── Dimensions ────────────────────────────────────────────────────────────
    trade: { type: String, trim: true, required: true, index: true },
    city:  { type: String, trim: true, default: '', index: true },
    state: { type: String, trim: true, default: '', index: true },

    // ── Volume metrics ────────────────────────────────────────────────────────
    leadVolume:          { type: Number, default: 0 },
    leadsAccepted:       { type: Number, default: 0 },
    leadsCompleted:      { type: Number, default: 0 },
    leadsCancelled:      { type: Number, default: 0 },

    // ── Performance metrics ───────────────────────────────────────────────────
    completionRate:      { type: Number, default: 0 },   // 0–100
    avgResponseSec:      { type: Number, default: 0 },   // avg seconds to respond
    avgRevenueCents:     { type: Number, default: 0 },   // avg revenue per completed job

    // ── Subscription growth ───────────────────────────────────────────────────
    newSubscriptions:    { type: Number, default: 0 },
    cancelledSubscriptions: { type: Number, default: 0 },
    netSubscriptionGrowth:  { type: Number, default: 0 },

    // ── Active pros ───────────────────────────────────────────────────────────
    activeProsCount:     { type: Number, default: 0 },

    // ── Last updated ──────────────────────────────────────────────────────────
    computedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'fga_market_demand',
  }
);

// Compound unique index for upserts
FGAMarketDemandSchema.index({ year: 1, month: 1, trade: 1, city: 1, state: 1 }, { unique: true });
FGAMarketDemandSchema.index({ trade: 1, year: -1, month: -1 });
FGAMarketDemandSchema.index({ state: 1, year: -1, month: -1 });
FGAMarketDemandSchema.index({ city: 1, year: -1, month: -1 });

module.exports = mongoose.model('FGAMarketDemand', FGAMarketDemandSchema);
