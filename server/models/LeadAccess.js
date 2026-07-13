const mongoose = require('mongoose');
const { MAX_DECLINE_REASON_LENGTH } = require('../constants/leadTracking');

const leadAccessSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobRequest',
    required: true,
    index: true
  },
  proId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pro',
    required: true,
    index: true
  },
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeadAssignment',
    required: true,
    index: true
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'accepted', 'declined', 'asked_later', 'expired', 'invalidated'],
    default: 'active',
    index: true
  },
  channel: {
    type: String,
    enum: ['sms', 'whatsapp'],
    default: 'sms'
  },
  twilioSid: {
    type: String,
    index: true
  },
  smsNotificationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SmsNotification'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  smsSentAt: Date,
  smsDeliveredAt: Date,
  firstOpenedAt: Date,
  lastOpenedAt: Date,
  viewedAt: Date,
  acceptedAt: Date,
  declinedAt: Date,
  askedLaterAt: Date,
  invalidatedAt: Date,
  openedCount: {
    type: Number,
    default: 0
  },
  ipAddress: String,
  userAgent: String,
  browserName: String,
  deviceType: String,
  platform: String,
  city: String,
  region: String,
  countryCode: String,
  responseTimeMs: Number,
  openTimeMs: Number,
  acceptanceDelayMs: Number,
  acceptanceOrder: Number,
  firstAcceptedProfessional: {
    type: Boolean,
    default: false
  },
  declinedReason: {
    type: String,
    trim: true,
    maxLength: MAX_DECLINE_REASON_LENGTH
  }
}, {
  timestamps: true
});

leadAccessSchema.index({ assignmentId: 1, status: 1, expiresAt: 1 });
leadAccessSchema.index({ proId: 1, status: 1, createdAt: -1 });
leadAccessSchema.index({ leadId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('LeadAccess', leadAccessSchema);
