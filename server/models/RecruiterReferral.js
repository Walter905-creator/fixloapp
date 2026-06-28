const mongoose = require('mongoose');

/**
 * RecruiterReferral Model
 *
 * Tracks every pro that signed up via a recruiter link/code.
 * Also tracks second-level recruiter sign-ups.
 */
const recruiterReferralSchema = new mongoose.Schema({
  // Direct recruiter who owns this referral
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecruiterProfile',
    required: true,
    index: true
  },

  // Grand-parent recruiter (for 2nd level commissions)
  parentRecruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecruiterProfile',
    default: null,
    index: true
  },

  // The pro that was referred
  proId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pro',
    default: null,
    index: true
  },
  proEmail: { type: String, lowercase: true, trim: true, default: '' },
  proName: { type: String, trim: true, default: '' },
  proTrade: { type: String, trim: true, default: '' },
  proCity: { type: String, trim: true, default: '' },
  proPhone: { type: String, trim: true, default: '' },

  // Stripe tracking
  stripeCustomerId: { type: String, default: null },
  stripeSubscriptionId: { type: String, default: null },

  signupDate: { type: Date, default: Date.now },
  firstPaymentDate: { type: Date, default: null },

  // Subscription amount at time of first payment (cents)
  subscriptionAmount: { type: Number, default: 0 },

  // Referral code or link used
  referralCode: { type: String, default: '' },
  referralSource: { type: String, default: 'link' }, // 'link' | 'code'

  // IP at signup (fraud detection)
  signupIp: { type: String, default: '' },

  status: {
    type: String,
    enum: ['pending', 'active', 'paid', 'cancelled', 'fraud_review'],
    default: 'pending',
    index: true
  }
}, {
  timestamps: true
});

recruiterReferralSchema.index({ recruiterId: 1, status: 1 });
recruiterReferralSchema.index({ proEmail: 1 });
recruiterReferralSchema.index({ stripeSubscriptionId: 1 });

module.exports = mongoose.model('RecruiterReferral', recruiterReferralSchema);
