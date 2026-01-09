const mongoose = require('mongoose');

/**
 * Scheduled Post Model
 * Manages posts scheduled for future publication
 */
const scheduledPostSchema = new mongoose.Schema({
  // Owner and target
  ownerId: {
    type: String,
    required: true,
    index: true,
    comment: 'Admin user or organization ID'
  },
  
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialAccount',
    required: true,
    index: true,
    comment: 'Target social media account'
  },
  
  platform: {
    type: String,
    required: true,
    enum: ['meta_instagram', 'meta_facebook', 'tiktok', 'x', 'linkedin'],
    index: true
  },
  
  // Content
  content: {
    type: String,
    required: true,
    comment: 'Post caption/text content'
  },
  
  mediaUrls: [{
    type: String,
    comment: 'URLs of media files to include (images/videos)'
  }],
  
  mediaType: {
    type: String,
    enum: ['none', 'image', 'video', 'carousel'],
    default: 'none'
  },
  
  // Scheduling
  scheduledFor: {
    type: Date,
    required: true,
    index: true,
    comment: 'When to publish this post'
  },
  
  timezone: {
    type: String,
    default: 'America/New_York',
    comment: 'Timezone for scheduling'
  },
  
  // Status
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'scheduled', 'publishing', 'published', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Approval workflow (when manual approval is enabled)
  requiresApproval: {
    type: Boolean,
    default: true,
    comment: 'Whether post needs manual approval before publishing'
  },
  
  approvedBy: {
    type: String,
    comment: 'User ID who approved the post'
  },
  
  approvedAt: {
    type: Date,
    comment: 'When post was approved'
  },
  
  // AI generation metadata
  isAIGenerated: {
    type: Boolean,
    default: false
  },
  
  aiPrompt: {
    type: String,
    comment: 'Prompt used to generate content'
  },
  
  aiModel: {
    type: String,
    comment: 'AI model used (e.g., gpt-4)'
  },
  
  contentTags: [{
    type: String,
    comment: 'Tags for content categorization (e.g., seasonal, service-specific)'
  }],
  
  // Execution tracking
  publishedAt: {
    type: Date,
    comment: 'Actual publication timestamp'
  },
  
  platformPostId: {
    type: String,
    comment: 'Post ID returned by platform after publishing'
  },
  
  platformPostUrl: {
    type: String,
    comment: 'Public URL of published post'
  },
  
  // Retry logic
  attemptCount: {
    type: Number,
    default: 0,
    comment: 'Number of publication attempts'
  },
  
  maxAttempts: {
    type: Number,
    default: 3,
    comment: 'Maximum retry attempts'
  },
  
  lastAttemptAt: {
    type: Date,
    comment: 'Last publication attempt timestamp'
  },
  
  lastError: {
    type: String,
    comment: 'Last error message if failed'
  },
  
  // Cancellation
  cancelledBy: {
    type: String,
    comment: 'User ID who cancelled the post'
  },
  
  cancelledAt: {
    type: Date,
    comment: 'When post was cancelled'
  },
  
  cancellationReason: {
    type: String,
    comment: 'Reason for cancellation'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
scheduledPostSchema.index({ ownerId: 1, status: 1 });
scheduledPostSchema.index({ accountId: 1, status: 1 });
scheduledPostSchema.index({ platform: 1, status: 1 });
scheduledPostSchema.index({ scheduledFor: 1, status: 1 });
scheduledPostSchema.index({ status: 1, scheduledFor: 1 });

// Methods
scheduledPostSchema.methods.approve = function(approvedBy) {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  return this.save();
};

scheduledPostSchema.methods.markAsPublishing = function() {
  this.status = 'publishing';
  this.attemptCount += 1;
  this.lastAttemptAt = new Date();
  return this.save();
};

scheduledPostSchema.methods.markAsPublished = function(platformPostId, platformPostUrl) {
  this.status = 'published';
  this.publishedAt = new Date();
  this.platformPostId = platformPostId;
  this.platformPostUrl = platformPostUrl;
  return this.save();
};

scheduledPostSchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.lastError = error;
  return this.save();
};

scheduledPostSchema.methods.cancel = function(cancelledBy, reason) {
  this.status = 'cancelled';
  this.cancelledBy = cancelledBy;
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  return this.save();
};

scheduledPostSchema.methods.canRetry = function() {
  return this.attemptCount < this.maxAttempts;
};

module.exports = mongoose.model('ScheduledPost', scheduledPostSchema);
