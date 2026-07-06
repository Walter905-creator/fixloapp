/**
 * InviteCode Model
 * Stores invitation codes for the Fixlo internal dashboard.
 * Admins can generate codes and assign them to pros by name/email/phone/state/trade.
 * Redeeming a valid code grants one free year of Fixlo Pro (plan: "pro", subscriptionStatus: "free_year").
 */
const mongoose = require('mongoose');
const crypto = require('crypto');

const inviteCodeSchema = new mongoose.Schema({
  // The unique invite code string (e.g. FIXLO-8K4P2M, PRO365-X9A7Q)
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },

  // Assignment details (optional — admin can pre-assign to a specific person)
  assignedName: { type: String, trim: true },
  assignedEmail: { type: String, lowercase: true, trim: true },
  assignedPhone: { type: String, trim: true },
  assignedState: { type: String, trim: true },
  assignedTrade: { type: String, trim: true },

  // Plan type — currently only one-year-free
  planType: {
    type: String,
    enum: ['one-year-free'],
    default: 'one-year-free'
  },

  // Redemption tracking
  redeemed: { type: Boolean, default: false },
  redeemedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pro', default: null },
  redeemedAt: { type: Date, default: null },

  // Expiration date (optional — null means never expires)
  expiresAt: { type: Date, default: null },

  // Revoked by admin
  revoked: { type: Boolean, default: false },

  // Admin who created this code
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Pro', default: null }
}, {
  timestamps: true
});

// Computed status virtual: pending | redeemed | expired | revoked
inviteCodeSchema.virtual('status').get(function () {
  if (this.revoked) return 'revoked';
  if (this.redeemed) return 'redeemed';
  if (this.expiresAt && new Date() > this.expiresAt) return 'expired';
  return 'pending';
});

inviteCodeSchema.set('toJSON', { virtuals: true });
inviteCodeSchema.set('toObject', { virtuals: true });

/**
 * Generate a secure random invite code.
 * Format options: FIXLO-XXXXXX, PRO365-XXXXX, VIP-FREE-YEAR-XXX
 */
inviteCodeSchema.statics.generateCode = function (prefix = null) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Remove ambiguous chars (0/O, 1/I)
  const random = (len) => Array.from({ length: len }, () => chars[crypto.randomInt(chars.length)]).join('');

  const prefixes = ['FIXLO', 'PRO365', 'VIP-FREE-YEAR'];
  const chosen = prefix || prefixes[crypto.randomInt(prefixes.length)];

  if (chosen === 'VIP-FREE-YEAR') {
    return `VIP-FREE-YEAR-${random(3)}`;
  }
  return `${chosen}-${random(6)}`;
};

module.exports = mongoose.model('InviteCode', inviteCodeSchema);
