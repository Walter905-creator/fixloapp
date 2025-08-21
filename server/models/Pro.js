const mongoose = require('mongoose');

// Helper function for generating slugs
const slugify = (s) => s.toString().toLowerCase().trim()
  .replace(/[^\w\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-');

// Badge Schema for gamification
const BadgeSchema = new mongoose.Schema({
  name: { type: String, enum: ['Top Promoter', 'Community Builder'], required: true },
  earnedAt: { type: Date, default: Date.now }
}, { _id: false });

// Professional Schema with geolocation support
const proSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  // Additional name fields for better profile management
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  businessName: {
    type: String,
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
  // Primary service for easier reference
  primaryService: {
    type: String,
    trim: true
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
  // Additional location fields
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  
  // Public slug for profile sharing
  slug: { 
    type: String, 
    unique: true, 
    index: true 
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
  // Updated rating fields for better review aggregation
  avgRating: { 
    type: Number, 
    default: 0, 
    min: 0, 
    max: 5 
  },
  reviewCount: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  
  // Gamification features
  boostActiveUntil: { 
    type: Date, 
    default: null 
  },
  badges: { 
    type: [BadgeSchema], 
    default: [] 
  },
  
  // Verification status
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDate: Date,
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected', 'skipped'],
    default: 'unverified'
  },
  verificationNotes: { type: String, default: '' },
  
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

// Badge helper method
proSchema.methods.hasBadge = function (badgeName) {
  return this.badges.some(b => b.name === badgeName);
};

// Ensure slug generation
proSchema.pre('save', function(next) {
  if (!this.slug) {
    const base = this.businessName?.length
      ? `${this.businessName}-${this.city || ''}-${this.state || ''}`
      : `${this.firstName || this.name?.split(' ')[0] || ''}-${this.lastName || this.name?.split(' ')[1] || ''}-${this.primaryService || this.trade || 'pro'}-${this.city || ''}-${this.state || ''}`;
    this.slug = slugify(base);
  }
  
  // Auto-populate firstName/lastName from name if not set
  if (this.name && (!this.firstName || !this.lastName)) {
    const nameParts = this.name.trim().split(' ');
    if (!this.firstName) this.firstName = nameParts[0] || '';
    if (!this.lastName) this.lastName = nameParts.slice(1).join(' ') || '';
  }
  
  // Auto-populate primaryService from trade if not set
  if (this.trade && !this.primaryService) {
    this.primaryService = this.trade;
  }
  
  next();
});

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
