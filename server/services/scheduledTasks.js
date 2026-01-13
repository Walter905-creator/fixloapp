const cron = require('node-cron');
const { releaseStaleAuthorizations } = require('./autoReleaseService');
const { verify30DayReferrals } = require('./commissionVerification');

/**
 * Scheduled tasks service
 * Manages cron jobs for operational safeguards
 */

let scheduledTasks = [];

/**
 * Start all scheduled tasks
 */
function startScheduledTasks() {
  console.log('🕐 Starting scheduled tasks...');

  // Task 1: Auto-release stale payment authorizations
  // Runs daily at 3 AM
  const autoReleaseTask = cron.schedule('0 3 * * *', async () => {
    console.log('⏰ Running scheduled task: Auto-release stale authorizations');
    try {
      const result = await releaseStaleAuthorizations();
      console.log('✅ Auto-release task completed:', result);
    } catch (error) {
      console.error('❌ Auto-release task failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'America/New_York'
  });

  scheduledTasks.push({
    name: 'auto-release-stale-authorizations',
    task: autoReleaseTask,
    schedule: '0 3 * * *',
    description: 'Auto-release payment authorizations older than 7 days'
  });

  // Task 2: Verify 30-day commission referrals
  // Runs daily at 4 AM (only scheduled when REFERRALS_ENABLED=true)
  const referralsEnabled = process.env.REFERRALS_ENABLED === 'true';
  
  if (referralsEnabled) {
    const commissionVerificationTask = cron.schedule('0 4 * * *', async () => {
      console.log('⏰ Running scheduled task: Verify 30-day commission referrals');
      try {
        const result = await verify30DayReferrals();
        console.log('✅ Commission verification task completed:', result);
      } catch (error) {
        console.error('❌ Commission verification task failed:', error);
      }
    }, {
      scheduled: true,
      timezone: 'America/New_York'
    });

    scheduledTasks.push({
      name: 'verify-30day-commission-referrals',
      task: commissionVerificationTask,
      schedule: '0 4 * * *',
      description: 'Verify 30-day active requirement for commission referrals'
    });
  } else {
    console.log('ℹ️ Commission verification task not scheduled (REFERRALS_ENABLED=false)');
  }

  console.log(`✅ Scheduled ${scheduledTasks.length} tasks`);
  scheduledTasks.forEach(t => {
    console.log(`  - ${t.name}: ${t.schedule} - ${t.description}`);
  });
}

/**
 * Stop all scheduled tasks
 */
function stopScheduledTasks() {
  console.log('🛑 Stopping scheduled tasks...');
  scheduledTasks.forEach(t => {
    t.task.stop();
  });
  scheduledTasks = [];
}

/**
 * Get status of all scheduled tasks
 * Note: Currently returns basic info as cron tasks don't expose running state
 */
function getTasksStatus() {
  return scheduledTasks.map(t => ({
    name: t.name,
    schedule: t.schedule,
    description: t.description,
    scheduled: true // Cron tasks don't expose runtime state
  }));
}

/**
 * Manually trigger a task by name
 */
async function triggerTask(taskName) {
  switch (taskName) {
    case 'auto-release-stale-authorizations':
      return await releaseStaleAuthorizations();
    case 'verify-30day-commission-referrals':
      return await verify30DayReferrals();
    default:
      throw new Error(`Unknown task: ${taskName}`);
  }
}

module.exports = {
  startScheduledTasks,
  stopScheduledTasks,
  getTasksStatus,
  triggerTask
};
