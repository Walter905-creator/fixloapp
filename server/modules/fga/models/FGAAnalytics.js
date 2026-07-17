'use strict';

/**
 * FGAAnalytics — Daily Analytics Snapshot
 *
 * One document per calendar day.  Incremented atomically throughout the day;
 * never recalculated from scratch (avoids full-collection scans).
 *
 * Future AI/forecasting phases read from this collection.
 */

const mongoose = require('mongoose');

const FGAAnalyticsSchema = new mongoose.Schema(
  {
    // ── Date key (YYYY-MM-DD string for easy grouping) ─────────────────────
    date: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // ── Lead counts ───────────────────────────────────────────────────────────
    leadsTotal:       { type: Number, default: 0 },
    leadsHomeowner:   { type: Number, default: 0 },
    leadsProfessional:{ type: Number, default: 0 },
    leadsRecruiter:   { type: Number, default: 0 },

    // ── Registrations ─────────────────────────────────────────────────────────
    registrationsStarted:   { type: Number, default: 0 },
    registrationsCompleted: { type: Number, default: 0 },

    // ── Subscriptions & revenue ───────────────────────────────────────────────
    subscriptionsPurchased: { type: Number, default: 0 },
    subscriptionsCancelled: { type: Number, default: 0 },
    revenueTotal:           { type: Number, default: 0 }, // cents

    // ── Jobs ──────────────────────────────────────────────────────────────────
    jobsCreated:    { type: Number, default: 0 },
    jobsCompleted:  { type: Number, default: 0 },
    jobsCancelled:  { type: Number, default: 0 },

    // ── Communication ─────────────────────────────────────────────────────────
    emailsSent:      { type: Number, default: 0 },
    emailsOpened:    { type: Number, default: 0 },
    emailsClicked:   { type: Number, default: 0 },
    smsSent:         { type: Number, default: 0 },
    smsDelivered:    { type: Number, default: 0 },

    // ── Reviews ───────────────────────────────────────────────────────────────
    reviewsSubmitted: { type: Number, default: 0 },

    // ── Referrals ─────────────────────────────────────────────────────────────
    referralsCreated:   { type: Number, default: 0 },
    referralsConverted: { type: Number, default: 0 },

    // ── Response time (milliseconds, rolling avg per day) ─────────────────────
    avgResponseTimeMs: { type: Number, default: 0 },
    responseTimeSamples: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'fga_analytics',
  }
);

FGAAnalyticsSchema.index({ date: -1 });

module.exports = mongoose.model('FGAAnalytics', FGAAnalyticsSchema);
