const mongoose = require('mongoose');

/**
 * Google Search Console Daily Query Performance
 * Stores daily metrics for each search query
 */
const gscQueryDailySchema = new mongoose.Schema({
  // Search query text
  query: {
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
  
  // Page that appeared for this query
  page: {
    type: String,
    index: true
  },
  
  // Number of times the query triggered an impression
  impressions: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Number of clicks from this query
  clicks: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Click-through rate
  ctr: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Average position for this query
  position: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Country code
  country: {
    type: String,
    default: 'us'
  },
  
  // Metadata
  fetchedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
gscQueryDailySchema.index({ query: 1, date: -1 });
gscQueryDailySchema.index({ date: -1, impressions: -1 });
gscQueryDailySchema.index({ page: 1, date: -1 });

// Static method to get queries without dedicated pages
// These are opportunities for new page creation
gscQueryDailySchema.statics.findOpportunities = async function(minImpressions, positionMin, positionMax) {
  const recentDate = new Date();
  recentDate.setDate(recentDate.getDate() - 7); // Last 7 days
  
  return this.aggregate([
    {
      $match: {
        date: { $gte: recentDate },
        impressions: { $gte: minImpressions },
        position: { $gte: positionMin, $lte: positionMax }
      }
    },
    {
      $group: {
        _id: '$query',
        totalImpressions: { $sum: '$impressions' },
        totalClicks: { $sum: '$clicks' },
        avgPosition: { $avg: '$position' },
        pages: { $addToSet: '$page' }
      }
    },
    {
      $sort: { totalImpressions: -1 }
    }
  ]);
};

// Static method to find queries with low CTR for position
gscQueryDailySchema.statics.findLowCTRQueries = async function(page, minImpressions) {
  const recentDate = new Date();
  recentDate.setDate(recentDate.getDate() - 7);
  
  return this.find({
    page,
    date: { $gte: recentDate },
    impressions: { $gte: minImpressions }
  }).sort({ ctr: 1 });
};

// Extract service and location from query
gscQueryDailySchema.methods.extractServiceAndLocation = function() {
  const query = this.query.toLowerCase();
  
  // Common patterns: "[service] in [city]", "[service] [city]", "[city] [service]"
  // This is a simple implementation; could be enhanced with NLP
  
  const servicePattern = /(plumbing|plumber|electrical|electrician|hvac|carpenter|carpentry|painting|painter|roofing|roofer|cleaning|cleaner|landscaping|landscaper|handyman)/i;
  const serviceMatch = query.match(servicePattern);
  
  // Extract city (words after "in" or location indicators)
  let location = null;
  const inMatch = query.match(/in\s+([a-z\s]+?)(?:\s|$)/i);
  if (inMatch) {
    location = inMatch[1].trim();
  }
  
  return {
    service: serviceMatch ? serviceMatch[0] : null,
    location: location
  };
};

module.exports = mongoose.model('GSCQueryDaily', gscQueryDailySchema);
