/**
 * FGE Analytics Model
 *
 * Daily aggregate snapshot of site-wide growth metrics.
 * Populated by background jobs that pull from Google Analytics,
 * Search Console, and internal Fixlo counters.
 */

const mongoose = require('mongoose');

const FGEAnalyticsSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, unique: true },

    // Traffic
    visitors: { type: Number, default: 0 },
    sessions: { type: Number, default: 0 },
    pageviews: { type: Number, default: 0 },
    bounceRate: { type: Number, default: 0 },   // percentage 0–100
    avgSessionDuration: { type: Number, default: 0 }, // seconds

    // Traffic sources
    sources: {
      organic: { type: Number, default: 0 },
      direct: { type: Number, default: 0 },
      referral: { type: Number, default: 0 },
      social: { type: Number, default: 0 },
      email: { type: Number, default: 0 },
      paid: { type: Number, default: 0 },
    },

    // Search Console
    gscImpressions: { type: Number, default: 0 },
    gscClicks: { type: Number, default: 0 },
    gscCtr: { type: Number, default: 0 },       // percentage
    gscAvgPosition: { type: Number, default: 0 },

    // Conversions & Revenue
    conversions: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },       // USD cents

    // User counts (snapshot)
    newHomeowners: { type: Number, default: 0 },
    newContractors: { type: Number, default: 0 },
    newRecruiters: { type: Number, default: 0 },
    totalHomeowners: { type: Number, default: 0 },
    totalContractors: { type: Number, default: 0 },
    totalRecruiters: { type: Number, default: 0 },

    // Top performers
    topCities: [
      {
        city: { type: String },
        state: { type: String },
        visits: { type: Number, default: 0 },
      },
    ],
    topServices: [
      {
        service: { type: String },
        requests: { type: Number, default: 0 },
      },
    ],
    topPages: [
      {
        path: { type: String },
        views: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

FGEAnalyticsSchema.index({ date: -1 });

module.exports = mongoose.model('FGEAnalytics', FGEAnalyticsSchema);
