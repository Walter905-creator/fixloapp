const AuditLog = require('../models/AuditLog');

/**
 * Audit logging service for tracking all system events and admin actions
 * Provides a centralized interface for creating immutable audit logs
 */

/**
 * Create an audit log entry
 * @param {Object} params - Audit log parameters
 * @param {string} params.eventType - Type of event (see AuditLog model for valid types)
 * @param {string} params.actorType - Type of actor (admin, system, user, pro)
 * @param {string} params.actorEmail - Email of the actor (if applicable)
 * @param {string} params.actorId - ID of the actor (if applicable)
 * @param {string} params.entityType - Type of entity affected
 * @param {string} params.entityId - ID of entity affected
 * @param {string} params.action - Action performed
 * @param {string} params.description - Description of the action
 * @param {Object} params.metadata - Additional metadata
 * @param {string} params.status - Status of the action (success, failure, pending)
 * @param {string} params.errorMessage - Error message if action failed
 * @param {string} params.ipAddress - IP address of the actor
 * @param {string} params.userAgent - User agent string
 * @returns {Promise<AuditLog>} Created audit log
 */
async function createAuditLog({
  eventType,
  actorType,
  actorEmail,
  actorId,
  entityType,
  entityId,
  action,
  description,
  metadata = {},
  status = 'success',
  errorMessage,
  ipAddress,
  userAgent
}) {
  try {
    const auditLog = new AuditLog({
      eventType,
      actorType,
      actorEmail,
      actorId,
      entityType,
      entityId,
      action,
      description,
      metadata,
      status,
      errorMessage,
      ipAddress,
      userAgent,
      timestamp: new Date()
    });

    await auditLog.save();
    return auditLog;
  } catch (error) {
    // Don't throw errors from audit logging - just log to console
    console.error('❌ Failed to create audit log:', error.message);
    return null;
  }
}

/**
 * Log a payment action
 */
async function logPaymentAction({
  action, // 'authorized', 'captured', 'released', 'failed'
  jobId,
  stripePaymentIntentId,
  amount,
  actorEmail,
  actorType = 'admin',
  status = 'success',
  errorMessage,
  ipAddress,
  userAgent
}) {
  const eventType = `payment_${action}`;
  
  return createAuditLog({
    eventType,
    actorType,
    actorEmail,
    entityType: 'payment',
    entityId: stripePaymentIntentId || jobId,
    action: `Payment ${action}`,
    description: `Payment ${action} for job ${jobId}. Amount: $${amount || 0}`,
    metadata: {
      jobId,
      stripePaymentIntentId,
      amount
    },
    status,
    errorMessage,
    ipAddress,
    userAgent
  });
}

/**
 * Log a subscription action
 */
async function logSubscriptionAction({
  action, // 'created', 'paused', 'resumed', 'cancelled'
  proId,
  subscriptionId,
  actorEmail,
  actorType = 'user',
  status = 'success',
  errorMessage,
  ipAddress,
  userAgent
}) {
  const eventType = `subscription_${action}`;
  
  return createAuditLog({
    eventType,
    actorType,
    actorEmail,
    entityType: 'subscription',
    entityId: subscriptionId || proId,
    action: `Subscription ${action}`,
    description: `Subscription ${action} for pro ${proId}`,
    metadata: {
      proId,
      subscriptionId
    },
    status,
    errorMessage,
    ipAddress,
    userAgent
  });
}

/**
 * Log a job event
 */
async function logJobEvent({
  eventType, // 'job_created', 'job_assigned', etc.
  jobId,
  actorEmail,
  actorType = 'system',
  description,
  metadata = {},
  status = 'success',
  errorMessage,
  ipAddress,
  userAgent
}) {
  return createAuditLog({
    eventType,
    actorType,
    actorEmail,
    entityType: 'job',
    entityId: jobId,
    action: eventType.replace('job_', '').replace('_', ' '),
    description,
    metadata,
    status,
    errorMessage,
    ipAddress,
    userAgent
  });
}

/**
 * Log an admin action
 */
async function logAdminAction({
  action,
  entityType,
  entityId,
  actorEmail,
  description,
  metadata = {},
  status = 'success',
  errorMessage,
  ipAddress,
  userAgent
}) {
  return createAuditLog({
    eventType: 'admin_action',
    actorType: 'admin',
    actorEmail,
    entityType,
    entityId,
    action,
    description,
    metadata,
    status,
    errorMessage,
    ipAddress,
    userAgent
  });
}

/**
 * Log a notification failure
 */
async function logNotificationFailure({
  notificationType, // 'sms', 'email', 'push'
  recipientId,
  recipientEmail,
  errorMessage,
  metadata = {}
}) {
  return createAuditLog({
    eventType: `${notificationType}_failed`,
    actorType: 'system',
    entityType: 'notification',
    entityId: recipientId,
    action: `${notificationType.toUpperCase()} notification failed`,
    description: `Failed to send ${notificationType} to ${recipientEmail || recipientId}`,
    metadata: {
      notificationType,
      recipientId,
      recipientEmail,
      ...metadata
    },
    status: 'failure',
    errorMessage
  });
}

/**
 * Get audit logs with filters
 */
async function getAuditLogs({
  eventType,
  actorEmail,
  entityType,
  entityId,
  startDate,
  endDate,
  limit = 100,
  page = 1
}) {
  try {
    const query = {};
    
    if (eventType) query.eventType = eventType;
    if (actorEmail) query.actorEmail = actorEmail;
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    return {
      logs,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('❌ Failed to get audit logs:', error.message);
    return {
      logs: [],
      total: 0,
      page: 1,
      pages: 0
    };
  }
}

module.exports = {
  createAuditLog,
  logPaymentAction,
  logSubscriptionAction,
  logJobEvent,
  logAdminAction,
  logNotificationFailure,
  getAuditLogs
};
