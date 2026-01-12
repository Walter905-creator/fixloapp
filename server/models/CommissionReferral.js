const mongoose = require('mongoose');

/**
 * CommissionReferral Model - Tracks public commission-based referrals
 * 
 * CRITICAL RULES:
 * - Anyone can be a referrer (no Pro account required)
 * - Referrers earn 15-20% commission on Pro's monthly subscription
 * - Commission eligible after referred Pro stays active for 30 days
 * - Minimum payout threshold: $25 USD (or local currency equivalent)
 * - Payouts via Stripe Connect only
 * - At least one social media post required before payout
 * - This is an INDEPENDENT commission opportunity, not employment
 */
const commissionReferralSchema = new mongoose.Schema({
  // Referrer information (NOT necessarily a Pro)
  referrerId: {
    type: String, // Could be email, phone, or user ID
    required: true,
    index: true
  },
  
  referrerEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  
  referrerName: {
    type: String,
    required: false,
    trim: true
  },
  
  referrerPhone: {
    type: String,
    required: false,
    trim: true
  },
  
  // Unique referral code for this referrer
  referralCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true
  },
  
  // Referred Pro information
  referredProId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pro',
    required: false, // Set when Pro signs up
    index: true
  },
  
  referredProEmail: {
    type: String,
    required: false,
    lowercase: true,
    trim: true
  },
  
  // Stripe subscription tracking
  referredSubscriptionId: {
    type: String,
    required: false
  },
  
  subscriptionStartDate: {
    type: Date,
    required: false
  },
  
  // 30-day active period tracking
  thirtyDayMarkDate: {
    type: Date,
    required: false
  },
  
  is30DaysComplete: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Commission details
  commissionRate: {
    type: Number, // 0.15 = 15%, 0.20 = 20%
    required: true,
    default: 0.15
  },
  
  monthlySubscriptionAmount: {
    type: Number, // Amount in cents (USD)
    required: false
  },
  
  commissionAmount: {
    type: Number, // Amount in cents (USD)
    required: false
  },
  
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  
  country: {
    type: String,
    default: 'US',
    uppercase: true
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'active', 'eligible', 'paid', 'cancelled', 'fraud'],
    default: 'pending',
    index: true
  },
  
  // Eligibility date (after 30 days active)
  eligibleDate: {
    type: Date,
    required: false
  },
  
  // Payout tracking
  payoutId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payout',
    required: false
  },
  
  paidAt: {
    type: Date,
    required: false
  },
  
  // Social media requirement
  socialMediaPostVerified: {
    type: Boolean,
    default: false
  },
  
  socialMediaPostUrl: {
    type: String,
    required: false
  },
  
  socialMediaPostDate: {
    type: Date,
    required: false
  },
  
  // Anti-fraud tracking
  signupIp: {
    type: String,
    required: false
  },
  
  deviceFingerprint: {
    type: String,
    required: false
  },
  
  isFraudulent: {
    type: Boolean,
    default: false,
    index: true
  },
  
  fraudNotes: {
    type: String,
    required: false
  },
  
  // Stripe Connect account for payouts
  stripeConnectAccountId: {
    type: String,
    required: false
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
commissionReferralSchema.index({ referrerId: 1, status: 1 });
commissionReferralSchema.index({ referrerEmail: 1, status: 1 });
commissionReferralSchema.index({ referredProId: 1 });
commissionReferralSchema.index({ is30DaysComplete: 1, status: 1 });

// Static method to get referrer statistics
commissionReferralSchema.statics.getReferrerStats = async function(referrerId) {
  const totalReferrals = await this.countDocuments({ referrerId });
  const activeReferrals = await this.countDocuments({
    referrerId,
    status: 'active'
  });
  const eligibleReferrals = await this.countDocuments({
    referrerId,
    status: 'eligible'
  });
  const paidReferrals = await this.countDocuments({
    referrerId,
    status: 'paid'
  });
  
  // Calculate total earnings
  const earnings = await this.aggregate([
    {
      $match: {
        referrerId,
        status: { $in: ['eligible', 'paid'] }
      }
    },
    {
      $group: {
        _id: null,
        totalEligible: {
          $sum: {
            $cond: [{ $eq: ['$status', 'eligible'] }, '$commissionAmount', 0]
          }
        },
        totalPaid: {
          $sum: {
            $cond: [{ $eq: ['$status', 'paid'] }, '$commissionAmount', 0]
          }
        }
      }
    }
  ]);
  
  const earningsData = earnings[0] || { totalEligible: 0, totalPaid: 0 };
  
  return {
    totalReferrals,
    activeReferrals,
    eligibleReferrals,
    paidReferrals,
    availableBalance: earningsData.totalEligible || 0, // Amount available for payout
    totalEarnings: (earningsData.totalEligible || 0) + (earningsData.totalPaid || 0)
  };
};

// Static method to check for duplicate referrals (anti-fraud)
commissionReferralSchema.statics.checkDuplicateReferral = async function(email) {
  const existingReferral = await this.findOne({
    referredProEmail: email.toLowerCase(),
    status: { $in: ['active', 'eligible', 'paid'] }
  });
  
  return !!existingReferral;
};

module.exports = mongoose.model('CommissionReferral', commissionReferralSchema);
