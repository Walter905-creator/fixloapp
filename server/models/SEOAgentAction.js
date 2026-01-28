const mongoose = require('mongoose');

/**
 * SEO Agent Decision Log
 * Tracks every decision and action taken by the SEO agent
 * Critical for learning loop and debugging
 */
const seoAgentActionSchema = new mongoose.Schema({
  // Action type (from decision engine)
  actionType: {
    type: String,
    required: true,
    enum: [
      'CREATE_PAGE',
      'REWRITE_META',
      'EXPAND_CONTENT',
      'FREEZE_PAGE',
      'CLONE_STRUCTURE',
      'NO_ACTION'
    ],
    index: true
  },
  
  // URL affected (null for new page creation)
  url: {
    type: String,
    index: true
  },
  
  // Service involved
  service: {
    type: String,
    index: true
  },
  
  // City/location involved
  city: {
    type: String
  },
  
  // Reason for the decision (from decision engine)
  reason: {
    type: String,
    required: true
  },
  
  // Status of the action
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'SKIPPED'],
    default: 'PENDING',
    index: true
  },
  
  // Input data that triggered the decision
  inputData: {
    impressions: Number,
    clicks: Number,
    ctr: Number,
    position: Number,
    trend: Number,
    bounceRate: Number
  },
  
  // Metrics BEFORE the action
  beforeMetrics: {
    impressions: Number,
    clicks: Number,
    ctr: Number,
    position: Number,
    capturedAt: Date
  },
  
  // Metrics AFTER the action (filled in during learning loop)
  afterMetrics: {
    impressions: Number,
    clicks: Number,
    ctr: Number,
    position: Number,
    capturedAt: Date
  },
  
  // Performance delta (calculated during learning loop)
  delta: {
    impressionsChange: Number,
    clicksChange: Number,
    ctrChange: Number,
    positionChange: Number,
    isImprovement: Boolean
  },
  
  // LLM output (if action involved content generation)
  llmOutput: {
    title: String,
    metaDescription: String,
    h1: String,
    content: String,
    model: String,
    tokens: Number
  },
  
  // Source of winning pattern (if cloned)
  sourceUrl: String,
  
  // Error details (if action failed)
  error: {
    message: String,
    stack: String
  },
  
  // Execution time
  executedAt: {
    type: Date,
    index: true
  },
  
  // Time taken to complete action
  executionTimeMs: Number
}, {
  timestamps: true
});

// Indexes for analytics queries
seoAgentActionSchema.index({ actionType: 1, status: 1, createdAt: -1 });
seoAgentActionSchema.index({ url: 1, createdAt: -1 });
seoAgentActionSchema.index({ service: 1, actionType: 1 });
seoAgentActionSchema.index({ 'delta.isImprovement': 1, actionType: 1 });

// Static method to get success rate by action type
seoAgentActionSchema.statics.getSuccessRate = async function(actionType, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const results = await this.aggregate([
    {
      $match: {
        actionType,
        createdAt: { $gte: startDate },
        'delta.isImprovement': { $exists: true }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        successful: {
          $sum: { $cond: ['$delta.isImprovement', 1, 0] }
        }
      }
    }
  ]);
  
  if (results.length === 0) return null;
  
  const { total, successful } = results[0];
  return {
    total,
    successful,
    successRate: successful / total
  };
};

// Static method to get winning patterns
seoAgentActionSchema.statics.getWinningPatterns = async function(minImprovement = 0.25) {
  return this.find({
    'delta.isImprovement': true,
    'delta.clicksChange': { $gte: minImprovement }
  })
    .sort({ 'delta.clicksChange': -1 })
    .limit(10);
};

// Static method to get daily action count (for rate limiting)
seoAgentActionSchema.statics.getTodayActionCount = async function(actionType) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.countDocuments({
    actionType,
    createdAt: { $gte: today },
    status: { $in: ['COMPLETED', 'IN_PROGRESS'] }
  });
};

// Instance method to mark as completed
seoAgentActionSchema.methods.markCompleted = async function(llmOutput, executionTimeMs) {
  this.status = 'COMPLETED';
  this.executedAt = new Date();
  this.executionTimeMs = executionTimeMs;
  if (llmOutput) {
    this.llmOutput = llmOutput;
  }
  return this.save();
};

// Instance method to mark as failed
seoAgentActionSchema.methods.markFailed = async function(error) {
  this.status = 'FAILED';
  this.executedAt = new Date();
  this.error = {
    message: error.message,
    stack: error.stack
  };
  return this.save();
};

// Instance method to update metrics after action
seoAgentActionSchema.methods.updateAfterMetrics = async function(metrics) {
  this.afterMetrics = {
    ...metrics,
    capturedAt: new Date()
  };
  
  // Calculate delta
  if (this.beforeMetrics) {
    this.delta = {
      impressionsChange: metrics.impressions - this.beforeMetrics.impressions,
      clicksChange: metrics.clicks - this.beforeMetrics.clicks,
      ctrChange: metrics.ctr - this.beforeMetrics.ctr,
      positionChange: this.beforeMetrics.position - metrics.position, // Lower position is better
      isImprovement: (
        metrics.clicks > this.beforeMetrics.clicks ||
        (metrics.ctr > this.beforeMetrics.ctr && metrics.position <= this.beforeMetrics.position)
      )
    };
  }
  
  return this.save();
};

module.exports = mongoose.model('SEOAgentAction', seoAgentActionSchema);
