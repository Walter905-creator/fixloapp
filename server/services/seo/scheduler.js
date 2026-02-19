const cron = require('node-cron');
const { getSEOAgent } = require('./seoAgent');
const { getGSCClient } = require('./gscClient');

/**
 * SEO Agent Scheduler
 * 
 * Schedules automated runs of the SEO agent:
 * - Daily GSC data sync
 * - Daily decision engine run
 * - Weekly winner analysis
 */
class SEOAgentScheduler {
  constructor() {
    this.jobs = [];
    this.isEnabled = process.env.SEO_AGENT_ENABLED === 'true';
  }

  /**
   * Initialize all scheduled jobs
   */
  initialize() {
    if (!this.isEnabled) {
      console.log('⚠️ SEO Agent scheduler is disabled (set SEO_AGENT_ENABLED=true to enable)');
      return;
    }

    console.log('⏰ Initializing SEO Agent scheduler...');

    // Daily GSC data sync at 6:00 AM UTC
    this.jobs.push(
      cron.schedule('0 6 * * *', async () => {
        console.log('[GSC_SYNC] Started');
        const startTime = Date.now();
        try {
          const gscClient = getGSCClient();
          const result = await gscClient.syncLastNDays(7);
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          
          if (result.skipped) {
            console.log(`[GSC_SYNC] Skipped (${result.reason})`);
          } else {
            console.log(`[GSC_SYNC] Synced ${result.pages} pages, ${result.queries} queries`);
            console.log(`[GSC_SYNC] Completed in ${duration}s`);
          }
        } catch (error) {
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          console.error(`[GSC_SYNC] Failed: ${error.message}`);
          console.log(`[GSC_SYNC] Completed in ${duration}s`);
        }
      }, {
        timezone: 'UTC'
      })
    );

    // Daily agent run at 7:00 AM UTC (after data sync)
    this.jobs.push(
      cron.schedule('0 7 * * *', async () => {
        console.log('[SEO_AGENT] Started');
        const startTime = Date.now();
        try {
          const agent = getSEOAgent();
          
          // Check if already running
          if (agent.isRunning) {
            console.log('[SEO_AGENT] Already running, skipping');
            return;
          }
          
          const results = await agent.run();
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          
          const actionsCount = results.actions?.length || 0;
          const errorsCount = results.errors?.length || 0;
          
          console.log(`[SEO_AGENT] Actions: ${actionsCount}, Errors: ${errorsCount}`);
          console.log(`[SEO_AGENT] Completed in ${duration}s`);
        } catch (error) {
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          console.error(`[SEO_AGENT] Failed: ${error.message}`);
          console.log(`[SEO_AGENT] Completed in ${duration}s`);
        }
      }, {
        timezone: 'UTC'
      })
    );

    // Weekly winner analysis on Mondays at 8:00 AM UTC
    this.jobs.push(
      cron.schedule('0 8 * * 1', async () => {
        console.log('[WINNER_ANALYSIS] Started');
        const startTime = Date.now();
        try {
          const agent = getSEOAgent();
          await agent.decisionEngine.checkCloneWinners();
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`[WINNER_ANALYSIS] Completed in ${duration}s`);
        } catch (error) {
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          console.error(`[WINNER_ANALYSIS] Failed: ${error.message}`);
          console.log(`[WINNER_ANALYSIS] Completed in ${duration}s`);
        }
      }, {
        timezone: 'UTC'
      })
    );

    console.log('✅ SEO Agent scheduler initialized with 3 jobs');
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    this.jobs.forEach(job => job.stop());
    console.log('⏸️ SEO Agent scheduler stopped');
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      jobCount: this.jobs.length,
      jobs: [
        {
          name: 'GSC Data Sync',
          schedule: 'Daily at 6:00 AM UTC',
          status: this.jobs[0] ? 'active' : 'inactive'
        },
        {
          name: 'Agent Run',
          schedule: 'Daily at 7:00 AM UTC',
          status: this.jobs[1] ? 'active' : 'inactive'
        },
        {
          name: 'Winner Analysis',
          schedule: 'Weekly on Mondays at 8:00 AM UTC',
          status: this.jobs[2] ? 'active' : 'inactive'
        }
      ]
    };
  }
}

// Singleton instance
let schedulerInstance = null;

function getSEOAgentScheduler() {
  if (!schedulerInstance) {
    schedulerInstance = new SEOAgentScheduler();
  }
  return schedulerInstance;
}

module.exports = {
  SEOAgentScheduler,
  getSEOAgentScheduler
};
