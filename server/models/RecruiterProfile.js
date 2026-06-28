const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * RecruiterProfile Model
 *
 * Stores recruiter user accounts with authentication,
 * Stripe Connect info, and aggregate commission stats.
 */
const recruiterProfileSchema = new mongoose.Schema({
  // Auth
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  phone: { type: String, trim: true, default: '' },
  password: { type: String, required: true, minlength: 6 },

  // Unique recruiter code (e.g. "ABC123")
  recruiterCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true
  },

  // Full referral links (generated from recruiterCode)
  recruiterLink: { type: String, default: '' },         // /pro-signup?ref=CODE
  recruiterRecruiterLink: { type: String, default: '' }, // /recruiter/signup?ref=CODE

  // Up-line relationship for 2-level commissions
  parentRecruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecruiterProfile',
    default: null
  },

  // Stripe Connect Express account
  stripeConnectAccountId: { type: String, default: null },
  stripeConnectOnboarded: { type: Boolean, default: false },

  // Aggregated stats (maintained by commission engine)
  totalReferrals: { type: Number, default: 0 },
  activeReferrals: { type: Number, default: 0 },
  pendingCommissions: { type: Number, default: 0 },   // cents
  heldCommissions: { type: Number, default: 0 },      // cents
  approvedCommissions: { type: Number, default: 0 },  // cents
  paidCommissions: { type: Number, default: 0 },      // cents
  lifetimeCommissions: { type: Number, default: 0 },  // cents

  // Payout
  payoutStatus: {
    type: String,
    enum: ['not_connected', 'pending', 'active', 'restricted', 'disabled'],
    default: 'not_connected'
  },

  // SMS notification preferences
  smsNotifications: {
    referrals: { type: Boolean, default: true },
    commissions: { type: Boolean, default: true },
    payouts: { type: Boolean, default: true },
    fraud: { type: Boolean, default: true },
    weeklySummary: { type: Boolean, default: true }
  },

  // Account status
  status: {
    type: String,
    enum: ['active', 'suspended', 'pending_review'],
    default: 'active',
    index: true
  },

  // Password reset
  resetToken: { type: String, default: null },
  resetTokenExpires: { type: Date, default: null },

  // Anti-fraud: IP at signup
  signupIp: { type: String, default: '' }
}, {
  timestamps: true
});

// Indexes
recruiterProfileSchema.index({ email: 1 });
recruiterProfileSchema.index({ recruiterCode: 1 });
recruiterProfileSchema.index({ parentRecruiterId: 1 });

/**
 * Generate a unique recruiter code
 */
recruiterProfileSchema.statics.generateUniqueCode = async function () {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  let exists = true;
  while (exists) {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    exists = !!(await this.findOne({ recruiterCode: code }));
  }
  return code;
};

module.exports = mongoose.model('RecruiterProfile', recruiterProfileSchema);
