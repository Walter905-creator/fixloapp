const mongoose = require('mongoose');

// Professional Schema with geolocation support
const proSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  password: {
    type: String,
    required: false, // Optional during signup, required later for login
    minlength: 6
  },
  trade: {
    type: String,
    required: true,
    enum: [
      'plumbing',
      'electrical', 
      'landscaping',
      'cleaning',
      'junk_removal',
      'handyman',
      'hvac',
      'painting',
      'roofing',
      'flooring',
      'carpentry',
      'appliance_repair'
    ]
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [-74.006, 40.7128] // Default to NYC
    },
    address: {
      type: String,
      required: true
    }
  },
  dob: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false // Changed to false until payment is confirmed
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'active', 'cancelled', 'failed'],
    default: 'pending'
  },
  stripeSessionId: {
    type: String
  },
  stripeCustomerId: {
    type: String
  },
  stripeSubscriptionId: {
    type: String
  },
  subscriptionStartDate: {
    type: Date
  },
  subscriptionEndDate: {
    type: Date
  },
  joinedDate: {
    type: Date,
    default: Date.now
  },
  
  // Additional professional info
  experience: {
    type: Number, // years of experience
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  
  // Verification status
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDate: Date,
  
  // Background check (Checkr integration)
  backgroundCheckStatus: {
    type: String,
    enum: ['pending', 'clear', 'consider', 'suspended', 'failed'],
    default: 'pending'
  },
  checkrCandidateId: {
    type: String
  },
  
  // Contact preferences
  notificationSettings: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    push: { type: Boolean, default: true }
  },
  
  // SMS consent from signup
  smsConsent: {
    type: Boolean,
    default: false
  },

  // Professional portfolio
  profileImage: {
    type: String, // Cloudinary URL
    default: null
  },
  profilePhotoUrl: {
    type: String, // Alias for profileImage for consistency
    default: null
  },
  gallery: [{
    type: String // Array of Cloudinary URLs for work photos
  }],
  reviews: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Review' 
  }]
}, {
  timestamps: true
});

// Create 2dsphere index for geospatial queries
proSchema.index({ location: '2dsphere' });

// Create compound index for efficient trade + location queries
proSchema.index({ trade: 1, location: '2dsphere' });

// Create index for email lookups
proSchema.index({ email: 1 });

// Instance methods
proSchema.methods.getAge = function() {
  return Math.floor((Date.now() - this.dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};

proSchema.methods.updateRating = function(newRating) {
  // Simple average rating calculation
  this.rating = ((this.rating * this.completedJobs) + newRating) / (this.completedJobs + 1);
  this.completedJobs += 1;
};

// Virtual for backward compatibility
proSchema.virtual('profileUrl').get(function() {
  return this.profilePhotoUrl || this.profileImage;
});

// Static methods
proSchema.statics.findNearbyPros = function(trade, coordinates, maxDistance = 30) {
  const maxDistanceInMeters = maxDistance * 1609.34; // Convert miles to meters
  
  return this.find({
    trade: trade,
    isActive: true,
    location: {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates // [longitude, latitude]
        },
        $maxDistance: maxDistanceInMeters
      }
    }
  }).sort({ rating: -1, completedJobs: -1 });
};

proSchema.statics.getTradeStats = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$trade', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

module.exports = mongoose.model('Pro', proSchema);
