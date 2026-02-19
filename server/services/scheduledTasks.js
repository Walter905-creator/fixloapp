const cron = require('node-cron');
const { releaseStaleAuthorizations } = require('./autoReleaseService');
const { verify30DayReferrals } = require('./commissionVerification');
const { huntLeads } = require('./aiLeadHunter');

/**
 * Scheduled tasks service
 * Manages cron jobs for operational safeguards and AI automation
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
    console.log('[AUTO_RELEASE] Started');
    const startTime = Date.now();
    try {
      const result = await releaseStaleAuthorizations();
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[AUTO_RELEASE] Released: ${result.released || 0} authorizations`);
      console.log(`[AUTO_RELEASE] Completed in ${duration}s`);
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.error(`[AUTO_RELEASE] Failed: ${error.message}`);
      console.log(`[AUTO_RELEASE] Completed in ${duration}s`);
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
      console.log('[COMMISSION_VERIFY] Started');
      const startTime = Date.now();
      try {
        const result = await verify30DayReferrals();
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[COMMISSION_VERIFY] Verified: ${result.verified || 0} referrals`);
        console.log(`[COMMISSION_VERIFY] Completed in ${duration}s`);
      } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`[COMMISSION_VERIFY] Failed: ${error.message}`);
        console.log(`[COMMISSION_VERIFY] Completed in ${duration}s`);
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

  // Task 3: AI Lead Hunter
  // Runs every 15 minutes
  const leadHunterTask = cron.schedule('*/15 * * * *', async () => {
    console.log('[LEAD_HUNTER] Started');
    const startTime = Date.now();
    
    try {
      const result = await huntLeads();
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log(`[LEAD_HUNTER] Leads found: ${result.leadsProcessed || 0}`);
      console.log(`[LEAD_HUNTER] Completed in ${duration}s`);
      
      if (result.errors && result.errors > 0) {
        console.log(`[LEAD_HUNTER] Errors: ${result.errors}`);
      }
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.error(`[LEAD_HUNTER] Failed: ${error.message}`);
      console.log(`[LEAD_HUNTER] Completed in ${duration}s`);
      // Don't throw - keep server running
    }
  }, {
    scheduled: true,
    timezone: 'America/New_York'
  });

  scheduledTasks.push({
    name: 'ai-lead-hunter',
    task: leadHunterTask,
    schedule: '*/15 * * * *',
    description: 'AI-powered lead detection and distribution (every 15 minutes)'
  });

  // Task 4: SEO AI Engine
  // Runs daily at 3:30 AM
  const seoAITask = cron.schedule('30 3 * * *', async () => {
    console.log('[SEO_AI] Started');
    const startTime = Date.now();
    
    try {
      const { runSEOAgent } = require('./seo/seoAgent');
      const { updateStats } = require('./seoAIStats');
      
      const result = await runSEOAgent({ maxPages: 20 });
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log(`[SEO_AI] Pages generated: ${result.pagesGenerated || 0}`);
      if (result.skippedDuplicates > 0) {
        console.log(`[SEO_AI] Skipped duplicates: ${result.skippedDuplicates}`);
      }
      console.log(`[SEO_AI] Completed in ${duration}s`);
      
      // Update stats
      updateStats(result.pagesGenerated || 0, false);
      
      if (result.errors && result.errors.length > 0) {
        console.log(`[SEO_AI] Errors: ${result.errors.length}`);
      }
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.error(`[SEO_AI] Failed: ${error.message}`);
      console.log(`[SEO_AI] Completed in ${duration}s`);
      
      // Update stats with error
      const { updateStats } = require('./seoAIStats');
      updateStats(0, true);
      // Don't throw - keep server running
    }
  }, {
    scheduled: true,
    timezone: 'America/New_York'
  });

  scheduledTasks.push({
    name: 'seo-ai-engine',
    task: seoAITask,
    schedule: '30 3 * * *',
    description: 'SEO AI Engine - Generate optimized service pages (daily at 3:30 AM)'
  });

  console.log(`✅ Scheduled ${scheduledTasks.length} tasks`);
  scheduledTasks.forEach(t => {
    console.log(`  📅 ${t.name}: ${t.schedule} - ${t.description}`);
  });
  console.log('🚀 Scheduled tasks initialized - running autonomously');
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
    case 'ai-lead-hunter':
      return await huntLeads();
    case 'seo-ai-engine':
      const { runSEOAgent } = require('./seo/seoAgent');
      return await runSEOAgent({ maxPages: 20 });
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
