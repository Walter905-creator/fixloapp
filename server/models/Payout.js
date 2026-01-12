const mongoose = require('mongoose');

/**
 * Payout Model - Tracks commission payouts to referrers
 * 
 * CRITICAL RULES:
 * - Minimum payout amount: $25 USD (or local currency equivalent)
 * - Payouts via Stripe Connect only
 * - Admin approval required
 * - Social media post required before payout
 * - Processing fees deducted from payout amount
 */

const MIN_PAYOUT_AMOUNT = 25; // $25 USD minimum

const payoutSchema = new mongoose.Schema({
  // Referrer information
  referrerId: {
    type: String, // Email, phone, or user ID
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
  
  // Payout amount details
  requestedAmount: {
    type: Number, // Amount in cents
    required: true,
    validate: {
      validator: function(v) {
        // Convert cents to dollars for validation
        return v >= (MIN_PAYOUT_AMOUNT * 100);
      },
      message: props => `Payout amount must be at least $${MIN_PAYOUT_AMOUNT} USD`
    }
  },
  
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  
  // Stripe processing fee (deducted from payout)
  processingFee: {
    type: Number, // Amount in cents
    default: 0
  },
  
  netAmount: {
    type: Number, // Amount in cents (after fees)
    required: true
  },
  
  // Associated commission referrals
  commissionReferralIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommissionReferral'
  }],
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'approved', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Stripe Connect payout details
  stripeConnectAccountId: {
    type: String,
    required: true
  },
  
  stripePayoutId: {
    type: String,
    required: false
  },
  
  stripeTransferId: {
    type: String,
    required: false
  },
  
  // Social media requirement verification
  socialMediaVerified: {
    type: Boolean,
    default: false,
    required: true
  },
  
  socialMediaPostUrl: {
    type: String,
    required: false
  },
  
  // Admin approval
  approvedBy: {
    type: String, // Admin email or ID
    required: false
  },
  
  approvedAt: {
    type: Date,
    required: false
  },
  
  approvalNotes: {
    type: String,
    required: false
  },
  
  // Processing timestamps
  requestedAt: {
    type: Date,
    default: Date.now
  },
  
  processingStartedAt: {
    type: Date,
    required: false
  },
  
  completedAt: {
    type: Date,
    required: false
  },
  
  // Failure tracking
  failureReason: {
    type: String,
    required: false
  },
  
  failureCode: {
    type: String,
    required: false
  },
  
  retryCount: {
    type: Number,
    default: 0
  },
  
  // Cancellation
  cancelledBy: {
    type: String,
    required: false
  },
  
  cancelledAt: {
    type: Date,
    required: false
  },
  
  cancellationReason: {
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

// Indexes
payoutSchema.index({ referrerId: 1, status: 1 });
payoutSchema.index({ referrerEmail: 1, status: 1 });
payoutSchema.index({ status: 1, createdAt: -1 });

// Static method to validate minimum payout amount
payoutSchema.statics.validateMinimumAmount = function(amountInCents, currency = 'USD') {
  const minAmount = MIN_PAYOUT_AMOUNT * 100; // Convert to cents
  
  if (amountInCents < minAmount) {
    return {
      valid: false,
      message: `Minimum payout amount is $${MIN_PAYOUT_AMOUNT} ${currency}`,
      minimumAmount: minAmount
    };
  }
  
  return {
    valid: true,
    message: 'Amount meets minimum threshold'
  };
};

// Virtual for displaying amount in dollars
payoutSchema.virtual('requestedAmountDollars').get(function() {
  return this.requestedAmount / 100;
});

payoutSchema.virtual('netAmountDollars').get(function() {
  return this.netAmount / 100;
});

// Export minimum payout amount constant
payoutSchema.statics.MIN_PAYOUT_AMOUNT = MIN_PAYOUT_AMOUNT;

module.exports = mongoose.model('Payout', payoutSchema);
