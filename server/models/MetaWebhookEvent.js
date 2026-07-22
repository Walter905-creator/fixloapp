const mongoose = require('mongoose');

/**
 * MetaWebhookEvent — durable store for raw Meta leadgen webhook payloads.
 *
 * Events are written BEFORE processing so that a server restart cannot lose a
 * lead.  After successful processing the status advances to 'processed'.
 * On failure it advances to 'failed' and retryCount / nextRetryAt are updated
 * so the periodic recovery job can re-attempt ingestion.
 */
const metaWebhookEventSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'processing', 'processed', 'failed'],
    default: 'pending',
    index: true
  },
  rawPayload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  signature: {
    type: String,
    default: ''
  },
  retryCount: {
    type: Number,
    default: 0
  },
  nextRetryAt: {
    type: Date,
    default: null,
    index: true
  },
  lastError: {
    type: String,
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  },
  processingResult: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

metaWebhookEventSchema.index({ status: 1, nextRetryAt: 1 });
metaWebhookEventSchema.index({ createdAt: -1 });

module.exports = mongoose.model('MetaWebhookEvent', metaWebhookEventSchema);
