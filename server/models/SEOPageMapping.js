const mongoose = require('mongoose');

/**
 * SEO Page Mapping
 * Maps service + city combinations to actual URLs
 * Used to detect missing pages and canonical URLs
 */
const seoPageMappingSchema = new mongoose.Schema({
  // Service type
  service: {
    type: String,
    required: true,
    index: true
  },
  
  // City/location
  city: {
    type: String,
    required: true,
    index: true
  },
  
  // State code (for US cities)
  state: {
    type: String,
    index: true
  },
  
  // Country code
  country: {
    type: String,
    default: 'us',
    index: true
  },
  
  // Canonical URL for this service+city combination
  url: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Page status
  status: {
    type: String,
    enum: ['ACTIVE', 'CREATED', 'FROZEN', 'DELETED'],
    default: 'ACTIVE',
    index: true
  },
  
  // When the page was first indexed
  indexedAt: {
    type: Date,
    default: Date.now
  },
  
  // Current SEO metrics
  currentMetrics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    position: { type: Number, default: 0 },
    lastUpdated: Date
  },
  
  // Historical best performance
  bestMetrics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    position: { type: Number, default: 999 },
    achievedAt: Date
  },
  
  // Page metadata (from actual page)
  metadata: {
    title: String,
    metaDescription: String,
    h1: String,
    wordCount: Number,
    lastModified: Date
  },
  
  // Agent activity tracking
  agentActivity: {
    lastOptimizedAt: Date,
    optimizationCount: { type: Number, default: 0 },
    lastAction: String
  },
  
  // Flags
  isGenerated: {
    type: Boolean,
    default: false
  },
  
  isDead: {
    type: Boolean,
    default: false,
    index: true
  },
  
  isWinner: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes
seoPageMappingSchema.index({ service: 1, city: 1, country: 1 });
seoPageMappingSchema.index({ status: 1, isDead: 1 });
seoPageMappingSchema.index({ isWinner: 1, 'currentMetrics.clicks': -1 });

// Static method to find missing combinations
seoPageMappingSchema.statics.findMissingCombinations = async function(services, cities) {
  const existing = await this.find({
    status: { $ne: 'DELETED' }
  }).select('service city');
  
  const existingMap = new Set();
  existing.forEach(page => {
    existingMap.add(`${page.service}:${page.city}`);
  });
  
  const missing = [];
  services.forEach(service => {
    cities.forEach(city => {
      const key = `${service}:${city}`;
      if (!existingMap.has(key)) {
        missing.push({ service, city });
      }
    });
  });
  
  return missing;
};

// Static method to get winners
seoPageMappingSchema.statics.getWinners = async function(limit = 10) {
  return this.find({
    isWinner: true,
    status: 'ACTIVE'
  })
    .sort({ 'currentMetrics.clicks': -1 })
    .limit(limit);
};

// Static method to get dead pages
seoPageMappingSchema.statics.getDeadPages = async function(deadDays = 30) {
  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() - deadDays);
  
  return this.find({
    status: 'ACTIVE',
    indexedAt: { $lte: deadlineDate },
    'currentMetrics.impressions': { $lte: 10 }
  });
};

// Instance method to update metrics
seoPageMappingSchema.methods.updateMetrics = async function(metrics) {
  this.currentMetrics = {
    ...metrics,
    lastUpdated: new Date()
  };
  
  // Update best metrics if current is better
  if (metrics.clicks > this.bestMetrics.clicks) {
    this.bestMetrics = {
      ...metrics,
      achievedAt: new Date()
    };
  }
  
  return this.save();
};

// Instance method to mark as dead
seoPageMappingSchema.methods.markAsDead = async function() {
  this.isDead = true;
  this.status = 'FROZEN';
  return this.save();
};

// Instance method to mark as winner
seoPageMappingSchema.methods.markAsWinner = async function() {
  this.isWinner = true;
  return this.save();
};

// Instance method to record optimization
seoPageMappingSchema.methods.recordOptimization = async function(actionType) {
  this.agentActivity.lastOptimizedAt = new Date();
  this.agentActivity.optimizationCount += 1;
  this.agentActivity.lastAction = actionType;
  return this.save();
};

module.exports = mongoose.model('SEOPageMapping', seoPageMappingSchema);
