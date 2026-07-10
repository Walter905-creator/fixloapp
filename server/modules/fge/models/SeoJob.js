/**
 * FGE SeoJob Model
 *
 * Tracks the batch generation and indexing of SEO landing pages.
 * One SeoJob can spawn many LandingPage records.
 */

const mongoose = require('mongoose');

const SeoJobSchema = new mongoose.Schema(
  {
    // Job definition
    service: { type: String, required: true, trim: true },
    cities: [{ city: String, state: String }], // input list
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
    },

    // Progress tracking
    totalPages: { type: Number, default: 0 },
    createdPages: { type: Number, default: 0 },
    failedPages: { type: Number, default: 0 },

    // Indexing
    sitemapUpdated: { type: Boolean, default: false },
    indexingRequested: { type: Boolean, default: false },

    startedAt: { type: Date },
    completedAt: { type: Date },
    errorLog: [{ type: String }],
  },
  { timestamps: true }
);

SeoJobSchema.index({ status: 1 });
SeoJobSchema.index({ service: 1 });

module.exports = mongoose.model('FGESeoJob', SeoJobSchema);
