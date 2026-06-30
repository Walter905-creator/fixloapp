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
  smsOptIn: { type: Boolean, default: false },
  smsOptInDate: { type: Date, default: null },
  // Password reset fields
  passwordResetTokenHash: { type: String },
  passwordResetExpires: { type: Date }
}, { timestamps: true });

homeownerSchema.index({ email: 1 });

module.exports = mongoose.model('Homeowner', homeownerSchema);
