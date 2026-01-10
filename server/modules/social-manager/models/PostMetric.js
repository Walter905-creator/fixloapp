const mongoose = require('mongoose');

/**
 * Post Metrics Model
 * Tracks engagement and performance metrics for published posts
 */
const postMetricSchema = new mongoose.Schema({
  // Post reference
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScheduledPost',
    required: true,
    index: true
  },
  
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialAccount',
    required: true,
    index: true
  },
  
  platform: {
    type: String,
    required: true,
    enum: ['meta_instagram', 'meta_facebook', 'tiktok', 'x', 'linkedin'],
    index: true
  },
  
  platformPostId: {
    type: String,
    required: true,
    index: true,
    comment: 'Post ID on the platform'
  },
  
  platformPostUrl: {
    type: String,
    comment: 'Public URL of the post'
  },
  
  // Engagement metrics
  impressions: {
    type: Number,
    default: 0,
    comment: 'Number of times post was displayed'
  },
  
  reach: {
    type: Number,
    default: 0,
    comment: 'Unique users who saw the post'
  },
  
  likes: {
    type: Number,
    default: 0
  },
  
  comments: {
    type: Number,
    default: 0
  },
  
  shares: {
    type: Number,
    default: 0
  },
  
  saves: {
    type: Number,
    default: 0,
    comment: 'Bookmarks/saves (Instagram, LinkedIn)'
  },
  
  clicks: {
    type: Number,
    default: 0,
    comment: 'Link clicks'
  },
  
  videoViews: {
    type: Number,
    default: 0,
    comment: 'For video content'
  },
  
  // Engagement rate calculation
  engagementRate: {
    type: Number,
    default: 0,
    comment: 'Calculated as (likes + comments + shares) / impressions'
  },
  
  // Click-through tracking (Fixlo-specific)
  fixloClicks: {
    type: Number,
    default: 0,
    comment: 'Clicks to Fixlo website from this post'
  },
  
  fixloSignups: {
    type: Number,
    default: 0,
    comment: 'Signups attributed to this post'
  },
  
  fixloConversions: {
    type: Number,
    default: 0,
    comment: 'Paid conversions attributed to this post'
  },
  
  // UTM tracking
  utmCampaign: {
    type: String,
    comment: 'UTM campaign parameter'
  },
  
  utmSource: {
    type: String,
    comment: 'UTM source (platform name)'
  },
  
  utmMedium: {
    type: String,
    default: 'social',
    comment: 'UTM medium'
  },
  
  utmContent: {
    type: String,
    comment: 'UTM content identifier'
  },
  
  // Data collection
  lastFetchedAt: {
    type: Date,
    index: true,
    comment: 'Last time metrics were fetched from platform'
  },
  
  fetchCount: {
    type: Number,
    default: 0,
    comment: 'Number of times metrics have been fetched'
  },
  
  // Performance snapshots (historical tracking)
  snapshots: [{
    timestamp: Date,
    impressions: Number,
    reach: Number,
    likes: Number,
    comments: Number,
    shares: Number,
    saves: Number,
    clicks: Number,
    videoViews: Number
  }],
  
  // Published time reference
  publishedAt: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
postMetricSchema.index({ accountId: 1, publishedAt: -1 });
postMetricSchema.index({ platform: 1, publishedAt: -1 });
postMetricSchema.index({ platformPostId: 1 }, { unique: true });
postMetricSchema.index({ lastFetchedAt: 1 });

// Methods
postMetricSchema.methods.updateMetrics = function(metrics) {
  // Store current metrics as snapshot before updating
  if (this.impressions > 0) {
    this.snapshots.push({
      timestamp: new Date(),
      impressions: this.impressions,
      reach: this.reach,
      likes: this.likes,
      comments: this.comments,
      shares: this.shares,
      saves: this.saves,
      clicks: this.clicks,
      videoViews: this.videoViews
    });
  }
  
  // Update current metrics
  Object.assign(this, metrics);
  
  // Calculate engagement rate
  if (this.impressions > 0) {
    const totalEngagements = this.likes + this.comments + this.shares;
    this.engagementRate = (totalEngagements / this.impressions) * 100;
  }
  
  this.lastFetchedAt = new Date();
  this.fetchCount += 1;
  
  return this.save();
};

postMetricSchema.methods.recordFixloAction = function(actionType) {
  if (actionType === 'click') {
    this.fixloClicks += 1;
  } else if (actionType === 'signup') {
    this.fixloSignups += 1;
  } else if (actionType === 'conversion') {
    this.fixloConversions += 1;
  }
  return this.save();
};

module.exports = mongoose.model('PostMetric', postMetricSchema);
