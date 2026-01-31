const mongoose = require('mongoose');

/**
 * SMS Notification Tracking Model
 * Ensures idempotency for all non-referral SMS notifications
 * Prevents duplicate SMS sends on retries or system failures
 */
const SmsNotificationSchema = new mongoose.Schema({
  // Idempotency key: hash of leadId + userId + notificationType
  idempotencyKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Notification metadata
  notificationType: {
    type: String,
    required: true,
    enum: ['lead', 'homeowner', 'pro'],
    index: true
  },
  
  // Reference IDs
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobRequest',
    index: true
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userModel'
  },
  
  userModel: {
    type: String,
    enum: ['Pro', 'JobRequest'] // Pro for pros, JobRequest for homeowners
  },
  
  // Recipient info (masked for privacy)
  phoneNumberMasked: {
    type: String,
    required: true
  },
  
  // Delivery tracking
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'delivered', 'undelivered'],
    default: 'pending',
    index: true
  },
  
  twilioSid: {
    type: String,
    index: true
  },
  
  twilioStatus: {
    type: String
  },
  
  // Error tracking
  errorCode: {
    type: String
  },
  
  errorMessage: {
    type: String
  },
  
  // Timestamps
  sentAt: {
    type: Date
  },
  
  deliveredAt: {
    type: Date
  },
  
  failedAt: {
    type: Date
  },
  
  // Retry tracking
  retryCount: {
    type: Number,
    default: 0
  },
  
  lastRetryAt: {
    type: Date
  }
}, {
  timestamps: true,
  // Auto-delete notifications older than 90 days
  expireAfterSeconds: 7776000 // 90 days
});

// Index for efficient lookups
SmsNotificationSchema.index({ createdAt: 1 });
SmsNotificationSchema.index({ notificationType: 1, status: 1 });

/**
 * Generate idempotency key from lead, user, and notification type
 * @param {string} leadId - Lead/JobRequest ID
 * @param {string} userId - User ID (Pro or JobRequest)
 * @param {string} notificationType - Type of notification
 * @returns {string} - Idempotency key
 */
SmsNotificationSchema.statics.generateIdempotencyKey = function(leadId, userId, notificationType) {
  const crypto = require('crypto');
  const data = `${leadId}:${userId}:${notificationType}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Check if notification already sent
 * @param {string} leadId - Lead ID
 * @param {string} userId - User ID
 * @param {string} notificationType - Notification type
 * @returns {Promise<boolean>} - True if already sent
 */
SmsNotificationSchema.statics.wasAlreadySent = async function(leadId, userId, notificationType) {
  const key = this.generateIdempotencyKey(leadId, userId, notificationType);
  const existing = await this.findOne({
    idempotencyKey: key,
    status: { $in: ['sent', 'delivered'] }
  });
  return !!existing;
};

/**
 * Record new SMS notification attempt
 * @param {object} data - Notification data
 * @returns {Promise<object>} - Created notification record
 */
SmsNotificationSchema.statics.recordNotification = async function(data) {
  const key = this.generateIdempotencyKey(
    data.leadId,
    data.userId,
    data.notificationType
  );
  
  // Upsert to handle race conditions
  const notification = await this.findOneAndUpdate(
    { idempotencyKey: key },
    {
      ...data,
      idempotencyKey: key,
      sentAt: data.status === 'sent' ? new Date() : undefined,
      failedAt: data.status === 'failed' ? new Date() : undefined
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );
  
  return notification;
};

/**
 * Mask phone number for privacy logging
 * @param {string} phone - Full phone number
 * @returns {string} - Masked phone number (e.g., +1***567890)
 */
SmsNotificationSchema.statics.maskPhoneNumber = function(phone) {
  if (!phone || phone.length < 4) return '***';
  
  // Show first 2 chars and last 6 chars, mask middle
  const visibleStart = phone.substring(0, 2);
  const visibleEnd = phone.substring(phone.length - 6);
  return `${visibleStart}***${visibleEnd}`;
};

module.exports = mongoose.model('SmsNotification', SmsNotificationSchema);
