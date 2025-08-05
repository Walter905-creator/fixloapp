const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  pro: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pro',
    required: true
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
  reviewer: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Create index for efficient pro lookups
ReviewSchema.index({ pro: 1, createdAt: -1 });

module.exports = mongoose.model('Review', ReviewSchema);