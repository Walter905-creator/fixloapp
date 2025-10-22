/**
 * Data Retention Service
 * Implements automated data retention policies for GDPR/CCPA compliance
 */

const Pro = require('../models/Pro');
const JobRequest = require('../models/JobRequest');
const Review = require('../models/Review');
const { cleanupOldPrivacyLogs } = require('../middleware/privacyAudit');

/**
 * Retention periods (in days)
 */
const RETENTION_POLICIES = {
  INACTIVE_ACCOUNTS: 2555, // 7 years (financial/legal requirements)
  JOB_REQUESTS: 1095, // 3 years
  AUDIT_LOGS: 365, // 1 year
  ANONYMIZED_DATA: 90, // 90 days for analytics
};

/**
 * Anonymize inactive Pro accounts
 * Anonymizes accounts that have been inactive for longer than the retention period
 */
async function anonymizeInactiveAccounts() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_POLICIES.INACTIVE_ACCOUNTS);

    const result = await Pro.updateMany(
      {
        isActive: false,
        updatedAt: { $lt: cutoffDate },
        email: { $not: /^deleted_.*@deleted\.fixlo$/ } // Don't re-anonymize
      },
      {
        $set: {
          name: 'Deleted User',
          firstName: 'Deleted',
          lastName: 'User',
          email: `deleted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@deleted.fixlo`,
          phone: '000-000-0000',
          profileImage: null,
          profilePhotoUrl: null,
          gallery: [],
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          checkrCandidateId: null,
          backgroundCheckStatus: 'pending'
        }
      }
    );

    console.log(`✅ Anonymized ${result.modifiedCount} inactive Pro accounts`);
    return { anonymized: result.modifiedCount };
  } catch (error) {
    console.error('❌ Error anonymizing inactive accounts:', error);
    throw error;
  }
}

/**
 * Delete old job requests
 * Removes job requests older than the retention period
 */
async function deleteOldJobRequests() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_POLICIES.JOB_REQUESTS);

    const result = await JobRequest.deleteMany({
      createdAt: { $lt: cutoffDate },
      status: { $in: ['completed', 'cancelled'] }
    });

    console.log(`✅ Deleted ${result.deletedCount} old job requests`);
    return { deleted: result.deletedCount };
  } catch (error) {
    console.error('❌ Error deleting old job requests:', error);
    throw error;
  }
}

/**
 * Clean up old audit logs
 * Removes audit logs older than the retention period
 */
async function cleanupAuditLogs() {
  try {
    const result = await cleanupOldPrivacyLogs(RETENTION_POLICIES.AUDIT_LOGS);
    console.log(`✅ Cleaned up audit logs: deleted ${result.deleted}, kept ${result.kept}`);
    return result;
  } catch (error) {
    console.error('❌ Error cleaning up audit logs:', error);
    throw error;
  }
}

/**
 * Run all data retention tasks
 * Should be scheduled to run periodically (e.g., daily)
 */
async function runDataRetentionTasks() {
  console.log('🔄 Starting data retention tasks...');
  
  const results = {
    timestamp: new Date().toISOString(),
    tasks: {}
  };

  try {
    // Anonymize inactive accounts
    results.tasks.anonymizeAccounts = await anonymizeInactiveAccounts();
  } catch (error) {
    results.tasks.anonymizeAccounts = { error: error.message };
  }

  try {
    // Delete old job requests
    results.tasks.deleteJobRequests = await deleteOldJobRequests();
  } catch (error) {
    results.tasks.deleteJobRequests = { error: error.message };
  }

  try {
    // Clean up audit logs
    results.tasks.cleanupLogs = await cleanupAuditLogs();
  } catch (error) {
    results.tasks.cleanupLogs = { error: error.message };
  }

  console.log('✅ Data retention tasks completed:', results);
  return results;
}

/**
 * Schedule data retention tasks
 * Runs tasks daily at 2 AM
 */
function scheduleDataRetention() {
  const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
  
  // Calculate time until next 2 AM
  const now = new Date();
  const next2AM = new Date(now);
  next2AM.setHours(2, 0, 0, 0);
  
  if (now > next2AM) {
    next2AM.setDate(next2AM.getDate() + 1);
  }
  
  const timeUntilNext2AM = next2AM - now;

  console.log(`📅 Data retention tasks scheduled for ${next2AM.toISOString()}`);

  // Schedule first run
  setTimeout(() => {
    runDataRetentionTasks();
    
    // Schedule subsequent runs every 24 hours
    setInterval(runDataRetentionTasks, MILLISECONDS_PER_DAY);
  }, timeUntilNext2AM);
}

/**
 * Get data retention statistics
 * Returns current data counts and estimated deletion dates
 */
async function getRetentionStatistics() {
  try {
    const stats = {
      pros: {
        total: await Pro.countDocuments(),
        active: await Pro.countDocuments({ isActive: true }),
        inactive: await Pro.countDocuments({ isActive: false }),
        anonymized: await Pro.countDocuments({ 
          email: /^deleted_.*@deleted\.fixlo$/ 
        })
      },
      jobRequests: {
        total: await JobRequest.countDocuments(),
        pending: await JobRequest.countDocuments({ status: 'pending' }),
        completed: await JobRequest.countDocuments({ status: 'completed' }),
        cancelled: await JobRequest.countDocuments({ status: 'cancelled' })
      },
      retentionPolicies: RETENTION_POLICIES
    };

    return stats;
  } catch (error) {
    console.error('Error getting retention statistics:', error);
    throw error;
  }
}

module.exports = {
  runDataRetentionTasks,
  scheduleDataRetention,
  getRetentionStatistics,
  anonymizeInactiveAccounts,
  deleteOldJobRequests,
  cleanupAuditLogs,
  RETENTION_POLICIES
};
