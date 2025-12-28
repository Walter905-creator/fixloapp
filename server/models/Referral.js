const mongoose = require('mongoose');

/**
 * Referral Model - Tracks referral relationships and rewards
 * 
 * COMPLIANCE RULES:
 * - Referrals are ONLY valid after referred user completes PAID subscription
 * - NO automatic discounts or free trials
 * - Rewards granted via promo codes for NEXT billing cycle only
 * - Anti-fraud mechanisms required
 */
const referralSchema = new mongoose.Schema({
  // Unique referral code (e.g., FIXLO-ABC123)
  referralCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true
  },
  
  // Who made the referral (the referrer)
  referrerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pro',
    required: true,
    index: true
  },
  
  // Who was referred (the referee)
  referredUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pro',
    required: false, // Set when user signs up with referral code
    index: true
  },
  
  // Country where referral occurred (for notification routing)
  country: {
    type: String,
    required: false,
    default: 'US'
  },
  
  // Subscription status tracking
  subscriptionStatus: {
    type: String,
    enum: ['pending', 'active', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Stripe subscription ID of referred user (for validation)
  referredSubscriptionId: {
    type: String,
    required: false
  },
  
  // Reward tracking
  rewardStatus: {
    type: String,
    enum: ['pending', 'issued', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Promo code generated for referrer's reward
  promoCode: {
    type: String,
    required: false
  },
  
  // Stripe coupon ID for the reward
  stripeCouponId: {
    type: String,
    required: false
  },
  
  // Stripe promo code ID
  stripePromoCodeId: {
    type: String,
    required: false
  },
  
  // When reward was issued
  rewardIssuedAt: {
    type: Date,
    required: false
  },
  
  // Anti-fraud tracking
  referredUserPhone: {
    type: String,
    required: false,
    index: true
  },
  
  referredUserEmail: {
    type: String,
    required: false,
    index: true
  },
  
  // IP address tracking for fraud detection
  signupIp: {
    type: String,
    required: false
  },
  
  // Device fingerprint for fraud detection
  deviceFingerprint: {
    type: String,
    required: false
  },
  
  // Flag for suspicious activity
  isFraudulent: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Fraud detection notes
  fraudNotes: {
    type: String,
    required: false
  },
  
  // Tracking timestamps
  clickedAt: {
    type: Date,
    required: false
  },
  
  signedUpAt: {
    type: Date,
    required: false
  },
  
  subscribedAt: {
    type: Date,
    required: false
  },
  
  // Notification tracking
  notificationSent: {
    type: Boolean,
    default: false
  },
  
  notificationSentAt: {
    type: Date,
    required: false
  },
  
  notificationType: {
    type: String,
    enum: ['sms', 'whatsapp'],
    required: false
  },
  
  notificationStatus: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
referralSchema.index({ referrerId: 1, subscriptionStatus: 1 });
referralSchema.index({ referrerId: 1, rewardStatus: 1 });
referralSchema.index({ referredUserPhone: 1, createdAt: -1 });
referralSchema.index({ referredUserEmail: 1, createdAt: -1 });

// Static method to check if phone/email already used for referral
referralSchema.statics.checkDuplicateReferral = async function(phone, email) {
  const existingReferral = await this.findOne({
    $or: [
      { referredUserPhone: phone },
      { referredUserEmail: email }
    ],
    subscriptionStatus: { $in: ['active', 'completed'] }
  });
  
  return !!existingReferral;
};

// Static method to get referrer stats
referralSchema.statics.getReferrerStats = async function(referrerId) {
  const totalReferrals = await this.countDocuments({ referrerId });
  const completedReferrals = await this.countDocuments({
    referrerId,
    subscriptionStatus: 'completed'
  });
  const pendingReferrals = await this.countDocuments({
    referrerId,
    subscriptionStatus: 'pending'
  });
  const rewardsEarned = await this.countDocuments({
    referrerId,
    rewardStatus: 'issued'
  });
  
  return {
    totalReferrals,
    completedReferrals,
    pendingReferrals,
    rewardsEarned
  };
};

module.exports = mongoose.model('Referral', referralSchema);
