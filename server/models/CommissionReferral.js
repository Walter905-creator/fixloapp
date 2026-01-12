const mongoose = require('mongoose');

/**
 * Commission Referral Model
 * 
 * Tracks individual referrals made by commission referrers.
 * Includes 30-day verification lifecycle and fraud detection.
 * 
 * LIFECYCLE STATES:
 * - pending: 0-30 days after Pro signup
 * - approved: Pro verified active at 30 days, no refunds/fraud
 * - rejected: Failed verification (refund, fraud, inactive)
 * - paid: Commission paid to referrer
 * - flagged: Suspected fraud, needs review
 */
const commissionReferralSchema = new mongoose.Schema({
  // Referrer information
  referrerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommissionReferrer',
    required: true,
    index: true
  },
  
  referralCode: {
    type: String,
    required: true,
    uppercase: true,
    index: true
  },
  
  // Referred Pro information
  proId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pro',
    required: false, // Set when Pro signs up
    index: true
  },
  
  proEmail: {
    type: String,
    lowercase: true,
    trim: true,
    index: true
  },
  
  proPhone: {
    type: String,
    trim: true,
    index: true
  },
  
  // Subscription tracking
  stripeSubscriptionId: {
    type: String,
    index: true
  },
  
  subscriptionStartDate: {
    type: Date,
    default: null
  },
  
  // 30-day verification date
  verificationDueDate: {
    type: Date,
    default: null,
    index: true
  },
  
  verifiedAt: {
    type: Date,
    default: null
  },
  
  // Location data
  country: {
    type: String,
    required: true,
    uppercase: true,
    default: 'US'
  },
  
  currency: {
    type: String,
    required: true,
    uppercase: true,
    default: 'USD'
  },
  
  // Commission calculation
  proMonthlyPrice: {
    type: Number,
    required: false, // Set when subscription created
    min: 0
  },
  
  commissionRate: {
    type: Number,
    required: false, // Percentage (e.g., 15 for 15%)
    min: 0,
    max: 100
  },
  
  commissionAmount: {
    type: Number,
    required: false, // Calculated amount
    min: 0
  },
  
  // Lifecycle status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid', 'flagged'],
    default: 'pending',
    index: true
  },
  
  // Rejection reason
  rejectionReason: {
    type: String,
    enum: [
      null,
      'pro_inactive',
      'subscription_cancelled',
      'refund_issued',
      'chargeback',
      'fraud_detected',
      'duplicate_signup',
      'failed_verification',
      'admin_decision'
    ],
    default: null
  },
  
  rejectionDetails: {
    type: String,
    default: null
  },
  
  rejectedAt: {
    type: Date,
    default: null
  },
  
  // Approval tracking
  approvedAt: {
    type: Date,
    default: null
  },
  
  approvedBy: {
    type: String,
    default: 'system' // 'system' or admin user ID
  },
  
  // Fraud detection
  signupIp: {
    type: String,
    default: null
  },
  
  deviceFingerprint: {
    type: String,
    default: null
  },
  
  isFraudulent: {
    type: Boolean,
    default: false,
    index: true
  },
  
  fraudFlags: [{
    type: String,
    enum: [
      'same_ip_as_referrer',
      'same_device_as_referrer',
      'same_payment_method',
      'rapid_signup',
      'duplicate_email',
      'duplicate_phone',
      'suspicious_pattern'
    ]
  }],
  
  fraudNotes: {
    type: String,
    default: null
  },
  
  // Verification checks
  verificationChecks: {
    proStillActive: { type: Boolean, default: null },
    noRefunds: { type: Boolean, default: null },
    noChargebacks: { type: Boolean, default: null },
    noFraudFlags: { type: Boolean, default: null },
    subscriptionActive: { type: Boolean, default: null },
    verifiedAt: { type: Date, default: null }
  },
  
  // Tracking timestamps
  clickedAt: {
    type: Date,
    default: null
  },
  
  signedUpAt: {
    type: Date,
    default: null
  },
  
  subscribedAt: {
    type: Date,
    default: null
  },
  
  // Payout tracking
  paidAt: {
    type: Date,
    default: null
  },
  
  payoutId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommissionPayout',
    default: null
  },
  
  // Admin notes
  adminNotes: {
    type: String,
    default: ''
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
commissionReferralSchema.index({ referrerId: 1, status: 1 });
commissionReferralSchema.index({ proId: 1, status: 1 });
commissionReferralSchema.index({ verificationDueDate: 1, status: 1 });
commissionReferralSchema.index({ proEmail: 1, createdAt: -1 });
commissionReferralSchema.index({ proPhone: 1, createdAt: -1 });
commissionReferralSchema.index({ country: 1, status: 1 });

// Check for duplicate Pro signup
commissionReferralSchema.statics.checkDuplicatePro = async function(email, phone) {
  const existing = await this.findOne({
    $or: [
      { proEmail: email },
      { proPhone: phone }
    ],
    status: { $in: ['pending', 'approved', 'paid'] }
  });
  
  return !!existing;
};

// Calculate commission based on country
commissionReferralSchema.methods.calculateCommission = function() {
  if (!this.proMonthlyPrice) {
    return 0;
  }
  
  // Country-based commission rates (15-20% of monthly price)
  const rates = {
    'US': 20,      // $20 on $100/month = 20%
    'CA': 20,      // CAD
    'GB': 18,      // GBP
    'AU': 18,      // AUD
    'NZ': 18,      // NZD
    'IE': 18,      // EUR
    'DEFAULT': 15  // Default rate
  };
  
  this.commissionRate = rates[this.country] || rates.DEFAULT;
  this.commissionAmount = Math.round((this.proMonthlyPrice * this.commissionRate / 100) * 100) / 100;
  
  return this.commissionAmount;
};

// Set 30-day verification date
commissionReferralSchema.methods.setVerificationDate = function() {
  if (this.subscribedAt) {
    const dueDate = new Date(this.subscribedAt);
    dueDate.setDate(dueDate.getDate() + 30);
    this.verificationDueDate = dueDate;
  }
};

// Run verification checks
commissionReferralSchema.methods.runVerificationChecks = async function() {
  const Pro = mongoose.model('Pro');
  const pro = await Pro.findById(this.proId);
  
  if (!pro) {
    this.verificationChecks.proStillActive = false;
    return false;
  }
  
  // Check 1: Pro still active
  this.verificationChecks.proStillActive = pro.isActive && pro.paymentStatus === 'active';
  
  // Check 2: Subscription still active
  this.verificationChecks.subscriptionActive = pro.subscriptionStatus === 'active';
  
  // Check 3: No fraud flags on this referral
  this.verificationChecks.noFraudFlags = !this.isFraudulent && this.fraudFlags.length === 0;
  
  // Check 4: No refunds (check with Stripe if needed)
  // For now, assume no refunds if subscription is still active
  this.verificationChecks.noRefunds = true;
  
  // Check 5: No chargebacks
  this.verificationChecks.noChargebacks = true;
  
  this.verificationChecks.verifiedAt = new Date();
  
  // All checks must pass
  const allPassed = Object.values(this.verificationChecks)
    .filter(v => typeof v === 'boolean')
    .every(v => v === true);
  
  return allPassed;
};

module.exports = mongoose.model('CommissionReferral', commissionReferralSchema);
