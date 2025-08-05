const mongoose = require('mongoose');

// Review Schema for professionals
const reviewSchema = new mongoose.Schema({
  proId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pro',
    required: true,
    index: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
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
    { $match: { proId: mongoose.Types.ObjectId(proId) } },
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