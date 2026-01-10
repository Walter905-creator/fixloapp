const mongoose = require('mongoose');

/**
 * Social Manager Audit Log
 * Records all actions and events for compliance and debugging
 */
const socialAuditLogSchema = new mongoose.Schema({
  // Actor identification
  actorId: {
    type: String,
    required: true,
    index: true,
    comment: 'User/admin ID who performed the action'
  },
  
  actorType: {
    type: String,
    required: true,
    enum: ['admin', 'system', 'api', 'cron'],
    comment: 'Type of actor'
  },
  
  // Action details
  action: {
    type: String,
    required: true,
    index: true,
    enum: [
      'connect_account',
      'disconnect_account',
      'refresh_token',
      'revoke_token',
      'create_post',
      'approve_post',
      'publish_post',
      'cancel_post',
      'fetch_metrics',
      'enable_platform',
      'disable_platform',
      'update_settings',
      'emergency_stop',
      'reauth_required'
    ]
  },
  
  status: {
    type: String,
    required: true,
    enum: ['success', 'failure', 'warning'],
    index: true
  },
  
  // Target resources
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialAccount',
    index: true
  },
  
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScheduledPost',
    index: true
  },
  
  platform: {
    type: String,
    enum: ['meta_instagram', 'meta_facebook', 'tiktok', 'x', 'linkedin'],
    index: true
  },
  
  // Details
  description: {
    type: String,
    required: true,
    comment: 'Human-readable description of the action'
  },
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    comment: 'Additional context (sanitized, no sensitive data)'
  },
  
  // Error tracking
  errorMessage: {
    type: String,
    comment: 'Error message if action failed'
  },
  
  errorCode: {
    type: String,
    comment: 'Error code for categorization'
  },
  
  errorStack: {
    type: String,
    comment: 'Stack trace (development only)'
  },
  
  // Request context
  ipAddress: {
    type: String,
    comment: 'IP address of request (if applicable)'
  },
  
  userAgent: {
    type: String,
    comment: 'User agent string'
  },
  
  // Privacy compliance
  containsSensitiveData: {
    type: Boolean,
    default: false,
    comment: 'Flag if log contains sensitive data (for retention policy)'
  },
  
  retentionExpiresAt: {
    type: Date,
    index: true,
    comment: 'When this log should be deleted (compliance)'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
socialAuditLogSchema.index({ actorId: 1, createdAt: -1 });
socialAuditLogSchema.index({ action: 1, createdAt: -1 });
socialAuditLogSchema.index({ platform: 1, createdAt: -1 });
socialAuditLogSchema.index({ status: 1, createdAt: -1 });
socialAuditLogSchema.index({ accountId: 1, createdAt: -1 });
socialAuditLogSchema.index({ retentionExpiresAt: 1 }, { sparse: true });

// Static methods for logging
socialAuditLogSchema.statics.logAction = async function(logData) {
  const {
    actorId,
    actorType = 'system',
    action,
    status = 'success',
    description,
    accountId,
    postId,
    platform,
    metadata,
    errorMessage,
    errorCode,
    ipAddress,
    userAgent
  } = logData;
  
  // Auto-expire non-critical logs after 90 days for privacy compliance
  const retentionExpiresAt = new Date();
  retentionExpiresAt.setDate(retentionExpiresAt.getDate() + 90);
  
  const log = new this({
    actorId,
    actorType,
    action,
    status,
    description,
    accountId,
    postId,
    platform,
    metadata,
    errorMessage,
    errorCode,
    ipAddress,
    userAgent,
    retentionExpiresAt
  });
  
  try {
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to save audit log:', error);
    // Don't throw - audit logging should never break main flow
    return null;
  }
};

// Method to sanitize before returning
socialAuditLogSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  // Remove potentially sensitive data
  delete obj.errorStack;
  delete obj.ipAddress;
  delete obj.userAgent;
  return obj;
};

module.exports = mongoose.model('SocialAuditLog', socialAuditLogSchema);
