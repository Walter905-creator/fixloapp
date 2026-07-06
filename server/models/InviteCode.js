const mongoose = require('mongoose');

const inviteCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  assignedName: {
    type: String,
    trim: true
  },
  assignedEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  assignedPhone: {
    type: String,
    trim: true
  },
  planType: {
    type: String,
    enum: ['one-year-free'],
    default: 'one-year-free'
  },
  redeemed: {
    type: Boolean,
    default: false
  },
  redeemedAt: {
    type: Date
  },
  redeemedByProId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pro'
  },
  expiresAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Static: generate a cryptographically random invite code
inviteCodeSchema.statics.generateCode = function (prefix = 'FIXLO') {
  const crypto = require('crypto');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.randomBytes(6);
  let random = '';
  for (let i = 0; i < 6; i++) {
    random += chars[bytes[i] % chars.length];
  }
  return `${prefix}-${random}`;
};

// Static: create a unique code with collision checking
inviteCodeSchema.statics.createUniqueCode = async function (options = {}) {
  const { assignedName, assignedEmail, assignedPhone, notes, prefix, expiresAt } = options;

  const prefixes = ['FIXLO', 'PRO365', 'VIP-FREE-YEAR'];
  const chosenPrefix = prefix || prefixes[Math.floor(Math.random() * prefixes.length)];

  let code;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const candidate = this.generateCode(chosenPrefix);
    const existing = await this.findOne({ code: candidate });
    if (!existing) {
      code = candidate;
      break;
    }
    attempts++;
  }

  if (!code) {
    throw new Error('Failed to generate unique invite code after max attempts');
  }

  const doc = await this.create({
    code,
    assignedName: assignedName || undefined,
    assignedEmail: assignedEmail || undefined,
    assignedPhone: assignedPhone || undefined,
    planType: 'one-year-free',
    notes: notes || undefined,
    expiresAt: expiresAt || undefined
  });

  return doc;
};

module.exports = mongoose.model('InviteCode', inviteCodeSchema);
