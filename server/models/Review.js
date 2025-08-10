const mongoose = require('mongoose');

// Review Schema for professionals with improved structure
const reviewSchema = new mongoose.Schema({
  proId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pro',
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  text: {
    type: String,
    maxlength: 4000
  },
  photos: { 
    type: [String], 
    default: [] 
  }, // URLs to uploaded images
  homeownerName: { 
    type: String, 
    maxlength: 120 
  },
  homeownerCity: { 
    type: String, 
    maxlength: 120 
  },
  status: { 
    type: String, 
    enum: ['pending', 'published', 'rejected'], 
    default: process.env.REV_AUTOPUBLISH === 'true' ? 'published' : 'pending', 
    index: true 
  },
  ip: { 
    type: String 
  },
  
  // Legacy fields for backward compatibility
  customerName: {
    type: String,
    trim: true
  },
  customerEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  jobDate: {
    type: Date,
    default: Date.now
  },
  verified: {
    type: Boolean,
    default: false
  },
  reviewer: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient querying by proId
reviewSchema.index({ proId: 1, createdAt: -1 });

// Virtual for average rating calculation (can be used in aggregation)
reviewSchema.virtual('averageRating').get(function() {
  return this.rating;
});

// Static method to get average rating for a professional
reviewSchema.statics.getAverageRating = async function(proId) {
  const result = await this.aggregate([
    { $match: { proId: new mongoose.Types.ObjectId(proId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
  
  return result.length > 0 ? result[0] : { averageRating: 0, totalReviews: 0 };
};

module.exports = mongoose.model('Review', reviewSchema);