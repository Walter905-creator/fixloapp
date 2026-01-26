const cron = require('node-cron');
const { ScheduledPost, SocialAccount } = require('../models');
const postingService = require('../posting');
const { oauthHandlers } = require('../oauth');

/**
 * Social Media Scheduler
 * Manages automated posting based on schedule
 * 
 * FEATURES:
 * - Cron-based scheduling
 * - Smart time windows by platform
 * - Retry logic for failures
 * - Emergency kill switch
 * - Token refresh before posting
 */

class Scheduler {
  constructor() {
    this.jobs = [];
    this.isRunning = false;
    this.emergencyStop = false;
    
    // Optimal posting times by platform (UTC hours)
    this.optimalTimes = {
      meta_instagram: [13, 14, 15, 16, 17], // 9am-1pm EST
      meta_facebook: [13, 14, 15, 19, 20], // 9am-11am, 3pm-4pm EST
      tiktok: [18, 19, 20, 21, 22], // 2pm-6pm EST
      x: [12, 13, 14, 17, 18], // 8am-10am, 1pm-2pm EST
      linkedin: [14, 15, 16, 17] // 10am-1pm EST (business hours)
    };
  }
  
  /**
   * Start the scheduler
   * SAFETY: Respects SOCIAL_AUTOMATION_ENABLED environment variable
   * @param {Object} options - Start options
   * @param {boolean} options.force - Force start even if automation disabled (for manual API control)
   * @throws {Error} If SOCIAL_AUTOMATION_ENABLED is false and force is not true
   */
  start(options = {}) {
    if (this.isRunning) {
      console.log('📅 Social scheduler already running');
      return;
    }
    
    // SAFETY CHECK: Respect SOCIAL_AUTOMATION_ENABLED flag
    // This prevents accidental auto-start in production
    const automationEnabled = process.env.SOCIAL_AUTOMATION_ENABLED === 'true';
    const { force = false } = options;
    
    if (!automationEnabled && !force) {
      console.warn('🛑 SOCIAL_AUTOMATION_ENABLED is false - scheduler will not start automatically. Use API endpoints to start manually.');
      const error = new Error('Social automation is disabled. Set SOCIAL_AUTOMATION_ENABLED=true to enable.');
      error.code = 'AUTOMATION_DISABLED';
      throw error;
    }
    
    if (force && !automationEnabled) {
      console.log('⚠️ Scheduler started manually (SOCIAL_AUTOMATION_ENABLED is false)');
    }
    
    console.log('📅 Starting social media scheduler...');
    
    // Main posting job - runs every 15 minutes
    // SAFETY: Wrapped in try-catch to prevent scheduler crashes
    const postingJob = cron.schedule('*/15 * * * *', async () => {
      try {
        if (this.emergencyStop) {
          console.log('🛑 Emergency stop active - skipping scheduled posting');
          return;
        }
        
        await this.processScheduledPosts();
      } catch (error) {
        // SAFETY: Log error but don't crash the scheduler
        console.error('❌ Posting job error (non-fatal):', error.message);
      }
    }, {
      scheduled: true,
      timezone: 'America/New_York'
    });
    
    this.jobs.push({
      name: 'scheduled-posting',
      job: postingJob,
      schedule: '*/15 * * * *'
    });
    
    // Token refresh job - runs every 6 hours
    // SAFETY: Wrapped in try-catch to prevent scheduler crashes
    const refreshJob = cron.schedule('0 */6 * * *', async () => {
      try {
        await this.refreshExpiredTokens();
      } catch (error) {
        // SAFETY: Log error but don't crash the scheduler
        console.error('❌ Token refresh job error (non-fatal):', error.message);
      }
    }, {
      scheduled: true,
      timezone: 'America/New_York'
    });
    
    this.jobs.push({
      name: 'token-refresh',
      job: refreshJob,
      schedule: '0 */6 * * *'
    });
    
    // Metrics collection job - runs daily at 2 AM
    // SAFETY: Wrapped in try-catch to prevent scheduler crashes
    const metricsJob = cron.schedule('0 2 * * *', async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        // SAFETY: Log error but don't crash the scheduler
        console.error('❌ Metrics collection job error (non-fatal):', error.message);
      }
    }, {
      scheduled: true,
      timezone: 'America/New_York'
    });
    
    this.jobs.push({
      name: 'metrics-collection',
      job: metricsJob,
      schedule: '0 2 * * *'
    });
    
    // Retry failed posts - runs every hour
    // SAFETY: Wrapped in try-catch to prevent scheduler crashes
    const retryJob = cron.schedule('0 * * * *', async () => {
      try {
        if (this.emergencyStop) return;
        await this.retryFailedPosts();
      } catch (error) {
        // SAFETY: Log error but don't crash the scheduler
        console.error('❌ Retry job error (non-fatal):', error.message);
      }
    }, {
      scheduled: true,
      timezone: 'America/New_York'
    });
    
    this.jobs.push({
      name: 'retry-failed',
      job: retryJob,
      schedule: '0 * * * *'
    });
    
    this.isRunning = true;
    console.log(`✅ Social scheduler started with ${this.jobs.length} jobs`);
    this.jobs.forEach(j => {
      console.log(`  - ${j.name}: ${j.schedule}`);
    });
  }
  
  /**
   * Stop the scheduler
   */
  stop() {
    console.log('🛑 Stopping social media scheduler...');
    
    this.jobs.forEach(j => {
      j.job.stop();
    });
    
    this.isRunning = false;
    console.log('✅ Social scheduler stopped');
  }
  
  /**
   * Emergency stop - prevents all posting
   */
  activateEmergencyStop(reason = 'Manual activation') {
    console.log(`🚨 EMERGENCY STOP ACTIVATED: ${reason}`);
    this.emergencyStop = true;
  }
  
  /**
   * Deactivate emergency stop
   */
  deactivateEmergencyStop() {
    console.log('✅ Emergency stop deactivated');
    this.emergencyStop = false;
  }
  
  /**
   * Process posts scheduled for current time
   */
  async processScheduledPosts() {
    if (this.emergencyStop) return;
    
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    
    try {
      // Find posts that should be published now
      const posts = await ScheduledPost.find({
        status: { $in: ['approved', 'scheduled'] },
        scheduledFor: {
          $gte: fifteenMinutesAgo,
          $lte: now
        }
      }).limit(50); // Process up to 50 posts per cycle
      
      if (posts.length === 0) {
        return;
      }
      
      console.log(`📤 Processing ${posts.length} scheduled posts...`);
      
      for (const post of posts) {
        try {
          // Check rate limit
          const canPost = await postingService.checkRateLimit(post.platform, post.accountId);
          if (!canPost) {
            console.log(`⏸️ Rate limit reached for ${post.platform}, deferring post ${post._id}`);
            // Defer by 1 hour
            post.scheduledFor = new Date(Date.now() + 60 * 60 * 1000);
            await post.save();
            continue;
          }
          
          // Check if we should refresh token before posting
          await this.ensureValidToken(post.accountId);
          
          // Publish
          await postingService.publishPost(post);
          console.log(`✅ Published post ${post._id} to ${post.platform}`);
        } catch (error) {
          console.error(`❌ Failed to publish post ${post._id}:`, error.message);
          
          // Will be retried by retry job if retries remaining
          if (post.canRetry()) {
            console.log(`  Will retry (${post.attemptCount}/${post.maxAttempts})`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error processing scheduled posts:', error);
    }
  }
  
  /**
   * Ensure account token is valid before posting
   */
  async ensureValidToken(accountId) {
    const account = await SocialAccount.findById(accountId);
    
    if (!account) {
      throw new Error('Account not found');
    }
    
    // Check if token expires within 24 hours
    const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    if (account.tokenExpiresAt && account.tokenExpiresAt < oneDayFromNow) {
      console.log(`🔄 Refreshing token for ${account.platform} account ${accountId}...`);
      
      const { getHandler } = require('../oauth');
      const handler = getHandler(account.platform);
      
      try {
        await handler.refreshToken(account);
        console.log(`✅ Token refreshed for ${account.platform}`);
      } catch (error) {
        console.error(`❌ Token refresh failed for ${account.platform}:`, error.message);
        throw error;
      }
    }
  }
  
  /**
   * Refresh tokens that are expiring soon
   */
  async refreshExpiredTokens() {
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    
    try {
      const accounts = await SocialAccount.find({
        isActive: true,
        isTokenValid: true,
        tokenExpiresAt: { $lt: threeDaysFromNow }
      });
      
      console.log(`🔄 Refreshing ${accounts.length} expiring tokens...`);
      
      for (const account of accounts) {
        try {
          const { getHandler } = require('../oauth');
          const handler = getHandler(account.platform);
          
          await handler.refreshToken(account);
          console.log(`✅ Refreshed ${account.platform} token for account ${account._id}`);
        } catch (error) {
          console.error(`❌ Failed to refresh ${account.platform} token:`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing tokens:', error);
    }
  }
  
  /**
   * Retry failed posts that still have attempts remaining
   */
  async retryFailedPosts() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    try {
      const failedPosts = await ScheduledPost.find({
        status: 'failed',
        lastAttemptAt: { $lt: oneHourAgo }
      });
      
      const retriablePosts = failedPosts.filter(post => post.canRetry());
      
      if (retriablePosts.length === 0) {
        return;
      }
      
      console.log(`🔄 Retrying ${retriablePosts.length} failed posts...`);
      
      for (const post of retriablePosts) {
        try {
          post.status = 'scheduled'; // Reset to scheduled
          await post.save();
          
          await postingService.publishPost(post);
          console.log(`✅ Retry successful for post ${post._id}`);
        } catch (error) {
          console.error(`❌ Retry failed for post ${post._id}:`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Error retrying failed posts:', error);
    }
  }
  
  /**
   * Collect metrics for recent posts
   */
  async collectMetrics() {
    const { PostMetric } = require('../models');
    
    try {
      // Get metrics that haven't been updated in 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const metrics = await PostMetric.find({
        $or: [
          { lastFetchedAt: { $lt: oneDayAgo } },
          { lastFetchedAt: null }
        ],
        publishedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      }).limit(100);
      
      console.log(`📊 Collecting metrics for ${metrics.length} posts...`);
      
      for (const metric of metrics) {
        try {
          await postingService.fetchMetrics(metric);
          console.log(`✅ Updated metrics for ${metric.platform} post ${metric.platformPostId}`);
        } catch (error) {
          console.error(`❌ Failed to fetch metrics for post ${metric.platformPostId}:`, error.message);
        }
        
        // Rate limit: wait 2 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error('❌ Error collecting metrics:', error);
    }
  }
  
  /**
   * Get optimal posting time for platform (returns next optimal hour)
   */
  getOptimalPostingTime(platform, daysFromNow = 0) {
    const times = this.optimalTimes[platform] || this.optimalTimes.meta_instagram;
    const now = new Date();
    const currentHour = now.getUTCHours();
    
    // Find next optimal hour
    const nextHour = times.find(h => h > currentHour) || times[0];
    
    const scheduledDate = new Date(now);
    scheduledDate.setDate(scheduledDate.getDate() + daysFromNow);
    scheduledDate.setUTCHours(nextHour, 0, 0, 0);
    
    // If the time has passed today, schedule for tomorrow
    if (scheduledDate <= now) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }
    
    return scheduledDate;
  }
  
  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      emergencyStop: this.emergencyStop,
      activeJobs: this.jobs.length,
      jobs: this.jobs.map(j => ({
        name: j.name,
        schedule: j.schedule
      }))
    };
  }
}

module.exports = new Scheduler();
