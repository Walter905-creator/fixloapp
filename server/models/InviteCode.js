/**
 * InviteCode Model
 * Stores invitation codes for the Fixlo internal dashboard.
 * Admins can generate codes and assign them to pros by name/email/phone/state/trade.
 * Redeeming a valid code grants the membership duration attached to the code.
 *
 * Default for new contractors (no code): 30-day free trial.
 * Invitation codes can grant: 30days | 90days | 6months | 12months | unlimited.
 */
const mongoose = require('mongoose');
const crypto = require('crypto');

// Sub-schema for each redemption event (supports multi-use codes)
const redemptionSchema = new mongoose.Schema({
  proId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pro' },
  proName: { type: String, trim: true },
  proEmail: { type: String, lowercase: true, trim: true },
  proPhone: { type: String, trim: true },
  redeemedAt: { type: Date, default: Date.now }
}, { _id: false });

const inviteCodeSchema = new mongoose.Schema({
  // ── Identity ────────────────────────────────────────────────────────────────
  // The unique invite code string (e.g. FIXLO-AB82KD)
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },

  // ── Membership settings ──────────────────────────────────────────────────────
  // How long the granted membership lasts after redemption
  membershipDuration: {
    type: String,
    enum: ['30days', '90days', '6months', '12months', 'unlimited'],
    default: '12months'
  },

  // Friendly plan type label (kept for backward compatibility)
  planType: {
    type: String,
    enum: ['one-year-free', 'trial', 'promo'],
    default: 'one-year-free'
  },

  // ── Use limits ───────────────────────────────────────────────────────────────
  // 0 = unlimited uses; positive integer = max uses allowed
  usesAllowed: { type: Number, default: 1, min: 0 },
  usesRemaining: { type: Number, default: 1, min: 0 },

  // ── Assignment restrictions (optional) ───────────────────────────────────────
  assignedName: { type: String, trim: true },
  assignedEmail: { type: String, lowercase: true, trim: true },
  assignedPhone: { type: String, trim: true },
  assignedState: { type: String, trim: true },
  assignedTrade: { type: String, trim: true },

  // ── Internal notes (admin only) ──────────────────────────────────────────────
  notes: { type: String, trim: true, default: '' },

  // ── State flags ──────────────────────────────────────────────────────────────
  // disabled: temporarily deactivated (can be re-enabled)
  disabled: { type: Boolean, default: false },
  // revoked: permanently cancelled (cannot be re-enabled)
  revoked: { type: Boolean, default: false },
  // redeemed: true once all uses are consumed (or single-use is redeemed)
  redeemed: { type: Boolean, default: false },

  // ── Expiration ───────────────────────────────────────────────────────────────
  // expiresAt: last date the code can be used; null = no expiration
  expiresAt: { type: Date, default: null },

  // ── Redemption history ───────────────────────────────────────────────────────
  // Legacy single-use fields (kept for backward compatibility)
  redeemedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pro', default: null },
  redeemedAt: { type: Date, default: null },
  redeemedBy: { type: String, default: null }, // stores pro._id as string

  // Multi-use redemption list (one entry per redemption)
  redeemedByList: { type: [redemptionSchema], default: [] },

  // ── Audit ────────────────────────────────────────────────────────────────────
  // Admin who created this code (ObjectId or admin email string)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Pro', default: null },
  createdByEmail: { type: String, trim: true, default: null },

  // Optional: linked to a recruiter code request
  codeRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'InviteCodeRequest', default: null }
}, {
  timestamps: true
});

// ── Computed status virtual ──────────────────────────────────────────────────
// pending | active | disabled | redeemed | expired | revoked
inviteCodeSchema.virtual('status').get(function () {
  if (this.revoked) return 'revoked';
  if (this.disabled) return 'disabled';
  if (this.redeemed) return 'redeemed';
  if (this.expiresAt && new Date() > this.expiresAt) return 'expired';
  return 'active';
});

// Alias virtuals for backward compatibility
inviteCodeSchema.virtual('used').get(function () { return this.redeemed; });
inviteCodeSchema.virtual('usedAt').get(function () { return this.redeemedAt; });

inviteCodeSchema.set('toJSON', { virtuals: true });
inviteCodeSchema.set('toObject', { virtuals: true });

// ── Indexes ──────────────────────────────────────────────────────────────────
inviteCodeSchema.index({ createdAt: -1 });
inviteCodeSchema.index({ status: 1, createdAt: -1 });

/**
 * Generate a secure random invite code.
 * Format: FIXLO-XXXXXX (always uses FIXLO prefix per spec)
 */
inviteCodeSchema.statics.generateCode = function (prefix = 'FIXLO') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omit ambiguous chars (0/O, 1/I)
  const random = (len) => Array.from({ length: len }, () => chars[crypto.randomInt(chars.length)]).join('');
  return `${prefix}-${random(6)}`;
};

/**
 * Calculate the freeAccessUntil date based on membershipDuration.
 * @param {string} duration - one of the membershipDuration enum values
 * @param {Date} [from] - start date (defaults to now)
 * @returns {Date|null} - null means unlimited (no expiry)
 */
inviteCodeSchema.statics.calcFreeAccessUntil = function (duration, from = new Date()) {
  const ms = (days) => new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
  switch (duration) {
    case '30days':   return ms(30);
    case '90days':   return ms(90);
    case '6months':  return ms(183); // average 6 months (≈183 days)
    case '12months': return ms(365);
    case 'unlimited': return null;
    default:         return ms(365);
  }
};

module.exports = mongoose.model('InviteCode', inviteCodeSchema);
