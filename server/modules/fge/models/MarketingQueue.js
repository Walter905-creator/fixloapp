/**
 * FGE Marketing Queue Model
 *
 * Persistent job queue for background tasks (email sends, AI generation,
 * SEO page creation, image generation, etc.).
 *
 * Workers poll this collection for pending jobs and update their status.
 * Provides retries and logging without requiring Redis/BullMQ.
 */

const mongoose = require('mongoose');

const MarketingQueueSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'email',
        'sms',
        'ai_content',
        'seo_page',
        'blog_post',
        'image_generation',
        'sitemap_update',
        'indexing_request',
        'ai_report',
        'newsletter',
      ],
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'retrying'],
      default: 'pending',
    },
    priority: { type: Number, default: 5 }, // 1 (highest) – 10 (lowest)
    payload: { type: mongoose.Schema.Types.Mixed }, // job-specific data
    result: { type: mongoose.Schema.Types.Mixed },  // output after completion
    error: { type: String },                         // last error message
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    runAt: { type: Date, default: Date.now },        // scheduled run time
    startedAt: { type: Date },
    completedAt: { type: Date },
    lockedUntil: { type: Date },                    // prevents double-processing
    workerId: { type: String },                     // identifies which worker claimed it
  },
  { timestamps: true }
);

// Compound index for efficient polling
MarketingQueueSchema.index({ status: 1, priority: 1, runAt: 1 });
MarketingQueueSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('FGEMarketingQueue', MarketingQueueSchema);
