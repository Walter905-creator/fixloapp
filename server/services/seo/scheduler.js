const cron = require('node-cron');
const { getSEOAgent } = require('./seo/seoAgent');
const { getGSCClient } = require('./seo/gscClient');

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
        console.log('📊 Running scheduled GSC data sync...');
        try {
          const gscClient = getGSCClient();
          await gscClient.syncLastNDays(7);
          console.log('✅ Scheduled GSC sync complete');
        } catch (error) {
          console.error('❌ Scheduled GSC sync failed:', error.message);
        }
      }, {
        timezone: 'UTC'
      })
    );

    // Daily agent run at 7:00 AM UTC (after data sync)
    this.jobs.push(
      cron.schedule('0 7 * * *', async () => {
        console.log('🤖 Running scheduled SEO agent...');
        try {
          const agent = getSEOAgent();
          const results = await agent.run();
          console.log('✅ Scheduled agent run complete:', results);
        } catch (error) {
          console.error('❌ Scheduled agent run failed:', error.message);
        }
      }, {
        timezone: 'UTC'
      })
    );

    // Weekly winner analysis on Mondays at 8:00 AM UTC
    this.jobs.push(
      cron.schedule('0 8 * * 1', async () => {
        console.log('🏆 Running weekly winner analysis...');
        try {
          const agent = getSEOAgent();
          await agent.decisionEngine.checkCloneWinners();
          console.log('✅ Weekly winner analysis complete');
        } catch (error) {
          console.error('❌ Weekly winner analysis failed:', error.message);
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
