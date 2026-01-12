const mongoose = require('mongoose');

/**
 * Commission Referrer Model
 * 
 * Tracks anyone who wants to earn commission by referring Pros to Fixlo.
 * This is separate from the Pro-to-Pro referral system.
 * 
 * COMPLIANCE:
 * - Independent commission-based opportunity (not employment)
 * - Must complete social verification before payouts
 * - Country-based commission rates
 */
const commissionReferrerSchema = new mongoose.Schema({
  // Basic Information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  phone: {
    type: String,
    trim: true,
    sparse: true, // Optional but unique if provided
    index: true
  },
  
  // Country for commission calculation
  country: {
    type: String,
    required: true,
    uppercase: true,
    default: 'US'
  },
  
  // Currency for payouts
  currency: {
    type: String,
    required: true,
    uppercase: true,
    default: 'USD'
  },
  
  // Unique referral code (FIXLO-REF-XXXXXX)
  referralCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true
  },
  
  // Full referral URL
  referralUrl: {
    type: String,
    required: true
  },
  
  // Account status
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'banned'],
    default: 'pending',
    index: true
  },
  
  // Social verification required before payouts
  socialVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Social verification date
  socialVerifiedAt: {
    type: Date,
    default: null
  },
  
  // Payout method
  payoutMethod: {
    type: String,
    enum: ['stripe_connect', 'paypal', null],
    default: null
  },
  
  // Stripe Connect account ID
  stripeConnectAccountId: {
    type: String,
    default: null,
    sparse: true,
    index: true
  },
  
  // PayPal email
  paypalEmail: {
    type: String,
    lowercase: true,
    trim: true,
    default: null
  },
  
  // Statistics
  totalReferrals: {
    type: Number,
    default: 0,
    min: 0
  },
  
  pendingReferrals: {
    type: Number,
    default: 0,
    min: 0
  },
  
  approvedReferrals: {
    type: Number,
    default: 0,
    min: 0
  },
  
  paidReferrals: {
    type: Number,
    default: 0,
    min: 0
  },
  
  rejectedReferrals: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Financial tracking
  totalEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  
  availableBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  
  pendingBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Fraud tracking
  signupIp: {
    type: String,
    default: null
  },
  
  deviceFingerprint: {
    type: String,
    default: null
  },
  
  isFlagged: {
    type: Boolean,
    default: false,
    index: true
  },
  
  flagReason: {
    type: String,
    default: null
  },
  
  flaggedAt: {
    type: Date,
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

// Indexes for efficient queries
commissionReferrerSchema.index({ email: 1, status: 1 });
commissionReferrerSchema.index({ referralCode: 1, status: 1 });
commissionReferrerSchema.index({ country: 1, status: 1 });
commissionReferrerSchema.index({ socialVerified: 1, status: 1 });

// Generate unique referral code
commissionReferrerSchema.statics.generateReferralCode = async function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const code = `FIXLO-REF-${randomPart}`;
    
    // Check if code already exists
    const existing = await this.findOne({ referralCode: code });
    if (!existing) {
      return code;
    }
    attempts++;
  }
  
  throw new Error('Failed to generate unique referral code');
};

// Get referral URL
commissionReferrerSchema.methods.getReferralUrl = function() {
  const baseUrl = process.env.CLIENT_URL || 'https://www.fixloapp.com';
  return `${baseUrl}/join?ref=${this.referralCode}`;
};

// Update statistics
commissionReferrerSchema.methods.updateStats = async function(type) {
  const stats = {
    totalReferrals: 0,
    pendingReferrals: 0,
    approvedReferrals: 0,
    paidReferrals: 0,
    rejectedReferrals: 0
  };
  
  // Count referrals by status
  const CommissionReferral = mongoose.model('CommissionReferral');
  const referrals = await CommissionReferral.aggregate([
    { $match: { referrerId: this._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  referrals.forEach(item => {
    stats.totalReferrals += item.count;
    if (item._id === 'pending') stats.pendingReferrals = item.count;
    else if (item._id === 'approved') stats.approvedReferrals = item.count;
    else if (item._id === 'paid') stats.paidReferrals = item.count;
    else if (item._id === 'rejected') stats.rejectedReferrals = item.count;
  });
  
  // Calculate financial stats
  const financials = await CommissionReferral.aggregate([
    { $match: { referrerId: this._id, status: { $in: ['approved', 'paid'] } } },
    { 
      $group: { 
        _id: '$status',
        total: { $sum: '$commissionAmount' }
      } 
    }
  ]);
  
  let totalEarned = 0;
  let totalPaid = 0;
  
  financials.forEach(item => {
    if (item._id === 'approved') {
      totalEarned += item.total;
    } else if (item._id === 'paid') {
      totalEarned += item.total;
      totalPaid += item.total;
    }
  });
  
  // Update this referrer
  this.totalReferrals = stats.totalReferrals;
  this.pendingReferrals = stats.pendingReferrals;
  this.approvedReferrals = stats.approvedReferrals;
  this.paidReferrals = stats.paidReferrals;
  this.rejectedReferrals = stats.rejectedReferrals;
  this.totalEarned = totalEarned;
  this.totalPaid = totalPaid;
  this.availableBalance = totalEarned - totalPaid;
  
  await this.save();
};

module.exports = mongoose.model('CommissionReferrer', commissionReferrerSchema);
