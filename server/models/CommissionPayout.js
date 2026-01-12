const mongoose = require('mongoose');

/**
 * Commission Payout Model
 * 
 * Tracks cash payouts to referrers via Stripe Connect or PayPal.
 * Requires manual admin approval before processing.
 * 
 * COMPLIANCE:
 * - Referrer pays all payout fees
 * - Manual approval required
 * - Country-based currency support
 */
const commissionPayoutSchema = new mongoose.Schema({
  // Referrer
  referrerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommissionReferrer',
    required: true,
    index: true
  },
  
  // Referrals included in this payout
  referralIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommissionReferral'
  }],
  
  // Financial details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  currency: {
    type: String,
    required: true,
    uppercase: true,
    default: 'USD'
  },
  
  // Fees (paid by referrer)
  platformFee: {
    type: Number,
    default: 0,
    min: 0
  },
  
  processingFee: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalFees: {
    type: Number,
    default: 0,
    min: 0
  },
  
  netAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Payout method
  payoutMethod: {
    type: String,
    enum: ['stripe_connect', 'paypal'],
    required: true
  },
  
  // Stripe Connect details
  stripePayoutId: {
    type: String,
    default: null,
    sparse: true,
    index: true
  },
  
  stripeTransferId: {
    type: String,
    default: null
  },
  
  // PayPal details
  paypalPayoutBatchId: {
    type: String,
    default: null,
    sparse: true,
    index: true
  },
  
  paypalPayoutItemId: {
    type: String,
    default: null
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'approved', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Approval workflow
  requestedAt: {
    type: Date,
    default: Date.now
  },
  
  approvedAt: {
    type: Date,
    default: null
  },
  
  approvedBy: {
    type: String,
    default: null // Admin user ID or email
  },
  
  processedAt: {
    type: Date,
    default: null
  },
  
  completedAt: {
    type: Date,
    default: null
  },
  
  // Failure tracking
  failedAt: {
    type: Date,
    default: null
  },
  
  failureReason: {
    type: String,
    default: null
  },
  
  // Cancellation
  cancelledAt: {
    type: Date,
    default: null
  },
  
  cancellationReason: {
    type: String,
    default: null
  },
  
  // Country for compliance
  country: {
    type: String,
    required: true,
    uppercase: true,
    default: 'US'
  },
  
  // Admin notes
  adminNotes: {
    type: String,
    default: ''
  },
  
  // Transaction details
  transactionId: {
    type: String,
    default: null
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
commissionPayoutSchema.index({ referrerId: 1, status: 1 });
commissionPayoutSchema.index({ status: 1, requestedAt: -1 });
commissionPayoutSchema.index({ country: 1, status: 1 });
commissionPayoutSchema.index({ createdAt: -1 });

// Calculate fees based on payout method
commissionPayoutSchema.methods.calculateFees = function() {
  if (this.payoutMethod === 'stripe_connect') {
    // Stripe Connect: 0.25% per payout (min $0.25, max $2)
    const stripeFee = Math.max(0.25, Math.min(2.00, this.amount * 0.0025));
    this.platformFee = Math.round(stripeFee * 100) / 100;
    this.processingFee = 0;
  } else if (this.payoutMethod === 'paypal') {
    // PayPal: $0 for payouts over $1 in US, varies internationally
    // Simplified: 2% fee for international, $0 for US
    if (this.country === 'US') {
      this.platformFee = 0;
      this.processingFee = 0;
    } else {
      this.platformFee = Math.round(this.amount * 0.02 * 100) / 100;
      this.processingFee = 0;
    }
  }
  
  this.totalFees = this.platformFee + this.processingFee;
  this.netAmount = Math.round((this.amount - this.totalFees) * 100) / 100;
};

// Get pending payout amount for referrer
commissionPayoutSchema.statics.getPendingAmount = async function(referrerId) {
  const result = await this.aggregate([
    { 
      $match: { 
        referrerId: referrerId,
        status: { $in: ['pending', 'approved', 'processing'] }
      } 
    },
    { 
      $group: { 
        _id: null,
        total: { $sum: '$amount' }
      } 
    }
  ]);
  
  return result.length > 0 ? result[0].total : 0;
};

module.exports = mongoose.model('CommissionPayout', commissionPayoutSchema);
