const mongoose = require('mongoose');

// Audit Log Schema for tracking all admin actions and system events
const AuditLogSchema = new mongoose.Schema({
  // Event details
  eventType: {
    type: String,
    required: true,
    enum: [
      'job_created',
      'job_assigned',
      'job_scheduled',
      'job_started',
      'job_completed',
      'job_cancelled',
      'payment_authorized',
      'payment_captured',
      'payment_released',
      'payment_failed',
      'subscription_created',
      'subscription_paused',
      'subscription_resumed',
      'subscription_cancelled',
      'authorization_auto_released',
      'sms_failed',
      'email_sent',
      'admin_action'
    ]
  },
  // Actor information
  actorType: {
    type: String,
    enum: ['admin', 'system', 'user', 'pro'],
    required: true
  },
  actorEmail: {
    type: String,
    trim: true
  },
  actorId: {
    type: String,
    trim: true
  },
  // Target entity
  entityType: {
    type: String,
    enum: ['job', 'payment', 'subscription', 'pro', 'user', 'notification'],
    required: true
  },
  entityId: {
    type: String,
    required: true,
    trim: true
  },
  // Action details
  action: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Status and result
  status: {
    type: String,
    enum: ['success', 'failure', 'pending'],
    default: 'success'
  },
  errorMessage: {
    type: String,
    trim: true
  },
  // IP and location for security
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    immutable: true // Cannot be modified once set
  }
}, {
  timestamps: false // We use custom timestamp field
});

// Create indexes for efficient querying
AuditLogSchema.index({ eventType: 1, timestamp: -1 });
AuditLogSchema.index({ entityId: 1, timestamp: -1 });
AuditLogSchema.index({ actorEmail: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 }); // For general time-based queries

// TTL index - auto-delete logs older than 2 years (730 days)
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 });

// Prevent any updates after creation (immutable logs)
AuditLogSchema.pre('findOneAndUpdate', function(next) {
  next(new Error('Audit logs cannot be modified'));
});

AuditLogSchema.pre('updateOne', function(next) {
  next(new Error('Audit logs cannot be modified'));
});

AuditLogSchema.pre('updateMany', function(next) {
  next(new Error('Audit logs cannot be modified'));
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
