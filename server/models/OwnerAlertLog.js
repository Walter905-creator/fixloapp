/**
 * OwnerAlertLog Model
 *
 * Tracks every SMS alert sent (or attempted) to the Fixlo owner.
 * Used for the executive dashboard's SMS Alerts card and alert history.
 */

const mongoose = require('mongoose');

const ownerAlertLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['recruiter_signup', 'pro_signup', 'new_lead'],
      required: true,
      index: true
    },
    message: {
      type: String,
      required: true
    },
    recipientPhone: {
      type: String,
      required: true
    },
    twilioMessageSid: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'skipped'],
      required: true,
      index: true
    },
    errorMessage: {
      type: String,
      default: null
    },
    // Idempotency key to prevent duplicate sends for the same event
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'owneralertlogs'
  }
);

// Index for dashboard queries
ownerAlertLogSchema.index({ createdAt: -1 });
ownerAlertLogSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('OwnerAlertLog', ownerAlertLogSchema);
