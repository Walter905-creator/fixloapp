/**
 * FGE AI Report Model
 *
 * Stores the daily AI-generated growth summary report.
 * Generated each morning by the background job scheduler.
 */

const mongoose = require('mongoose');

const AIReportSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, unique: true },

    // Summary headline
    summary: { type: String },

    // Metrics snapshot
    metrics: {
      newUsers: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },        // USD cents
      traffic: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 }, // percentage
    },

    // AI-generated insights sections
    topPerformingPages: [
      {
        path: { type: String },
        clicks: { type: Number, default: 0 },
        impressions: { type: Number, default: 0 },
      },
    ],
    topRecruiters: [
      {
        name: { type: String },
        referrals: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 },
      },
    ],
    seoOpportunities: [{ type: String }],
    slowPages: [
      {
        path: { type: String },
        loadMs: { type: Number },
      },
    ],
    brokenLinks: [{ type: String }],
    recommendations: [{ type: String }],

    // Raw AI response
    rawAiResponse: { type: String },
    model: { type: String, default: 'gpt-4o' },
  },
  { timestamps: true }
);

AIReportSchema.index({ date: -1 });

module.exports = mongoose.model('FGEAIReport', AIReportSchema);
