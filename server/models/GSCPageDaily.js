const mongoose = require('mongoose');

/**
 * Google Search Console Daily Page Performance
 * Stores daily metrics for each page indexed by GSC
 */
const gscPageDailySchema = new mongoose.Schema({
  // Page URL
  page: {
    type: String,
    required: true,
    index: true
  },
  
  // Date of the data snapshot
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  // Number of times the page appeared in search results
  impressions: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Number of clicks the page received
  clicks: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Click-through rate (clicks / impressions)
  ctr: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Average search position
  position: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Country code (for multi-country tracking)
  country: {
    type: String,
    default: 'us'
  },
  
  // Device type breakdown
  deviceBreakdown: {
    desktop: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 }
    },
    mobile: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 }
    },
    tablet: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 }
    }
  },
  
  // Metadata
  fetchedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
gscPageDailySchema.index({ page: 1, date: -1 });
gscPageDailySchema.index({ date: -1, impressions: -1 });
gscPageDailySchema.index({ date: -1, clicks: -1 });

// Static method to get page performance over time
gscPageDailySchema.statics.getPagePerformance = async function(page, startDate, endDate) {
  return this.find({
    page,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
};

// Static method to get top performing pages
gscPageDailySchema.statics.getTopPages = async function(date, limit = 50) {
  return this.find({ date })
    .sort({ clicks: -1 })
    .limit(limit);
};

// Static method to calculate trend
gscPageDailySchema.statics.calculateTrend = async function(page, days = 7) {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);
  
  const data = await this.find({
    page,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
  
  if (data.length < 2) return null;
  
  const oldestClicks = data[0].clicks;
  const newestClicks = data[data.length - 1].clicks;
  
  if (oldestClicks === 0) return null;
  
  return (newestClicks - oldestClicks) / oldestClicks;
};

module.exports = mongoose.model('GSCPageDaily', gscPageDailySchema);
