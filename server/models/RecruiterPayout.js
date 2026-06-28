const mongoose = require('mongoose');

/**
 * RecruiterPayout Model
 *
 * Tracks weekly Stripe Connect transfers sent to recruiters.
 */
const recruiterPayoutSchema = new mongoose.Schema({
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecruiterProfile',
    required: true,
    index: true
  },

  // Amount (cents)
  amount: { type: Number, required: true },

  // Stripe transfer ID
  stripeTransferId: { type: String, default: null },

  payoutDate: { type: Date, default: Date.now },

  status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed'],
    default: 'pending',
    index: true
  },

  // IDs of commissions included in this payout
  commissionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RecruiterCommission' }],

  failureReason: { type: String, default: null }
}, {
  timestamps: true
});

recruiterPayoutSchema.index({ recruiterId: 1, status: 1 });
recruiterPayoutSchema.index({ payoutDate: -1 });

module.exports = mongoose.model('RecruiterPayout', recruiterPayoutSchema);
