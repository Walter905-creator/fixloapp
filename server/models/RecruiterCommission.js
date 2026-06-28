const mongoose = require('mongoose');

/**
 * RecruiterCommission Model
 *
 * One commission record per referral per level.
 * Level 1 = 50% of first-month subscription.
 * Level 2 = 10% of first-month subscription (paid to parent recruiter).
 */
const recruiterCommissionSchema = new mongoose.Schema({
  referralId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecruiterReferral',
    required: true,
    index: true
  },

  // Recruiter who RECEIVES this commission
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecruiterProfile',
    required: true,
    index: true
  },

  level: {
    type: Number,
    enum: [1, 2],
    required: true
  },

  // Amount (cents)
  amount: { type: Number, required: true },
  sourceAmount: { type: Number, required: true }, // full subscription amount used to calculate

  status: {
    type: String,
    enum: ['pending', 'held', 'approved', 'paid', 'cancelled', 'refunded', 'fraud_review'],
    default: 'pending',
    index: true
  },

  // Rolling reserve: commission becomes approved after holdUntil passes
  holdUntil: { type: Date, required: true },

  // Set when paid out
  paidDate: { type: Date, default: null },
  payoutId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecruiterPayout',
    default: null
  },

  // Admin notes
  adminNotes: { type: String, default: '' }
}, {
  timestamps: true
});

recruiterCommissionSchema.index({ recruiterId: 1, status: 1 });
recruiterCommissionSchema.index({ holdUntil: 1, status: 1 });

/**
 * Promote held commissions to 'approved' when holdUntil has passed.
 * Called by the scheduled task.
 */
recruiterCommissionSchema.statics.releaseHeld = async function () {
  const now = new Date();
  const result = await this.updateMany(
    { status: 'held', holdUntil: { $lte: now } },
    { $set: { status: 'approved' } }
  );
  return result.modifiedCount || 0;
};

module.exports = mongoose.model('RecruiterCommission', recruiterCommissionSchema);
