const mongoose = require('mongoose');

const homeownerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: { type: String, trim: true },
  password: { type: String, required: true },
  referralCode: { type: String, unique: true, sparse: true },
  invitationCode: { type: String },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Homeowner', default: null },
  verifiedPhone: { type: String },
  phoneVerifiedAt: { type: Date },
  phoneCodeHash: { type: String, select: false },
  phoneCodePhone: { type: String, select: false },
  phoneCodeExpires: { type: Date, select: false },
  phoneCodeSentAt: { type: Date, select: false },
  phoneCodeAttempts: { type: Number, default: 0, select: false },
  smsOptIn: { type: Boolean, default: false },
  smsOptInDate: { type: Date, default: null },
  // Password reset fields
  passwordResetTokenHash: { type: String },
  passwordResetExpires: { type: Date }
}, { timestamps: true });

homeownerSchema.index({ email: 1 });

module.exports = mongoose.model('Homeowner', homeownerSchema);
