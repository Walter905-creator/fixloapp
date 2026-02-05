/**
 * Daily Poster - Automated Daily Post Scheduler
 * 
 * Automatically generates and schedules posts daily based on configuration.
 * Posts are created with AI-generated content and published at optimal times.
 */

const cron = require('node-cron');
const { SocialAccount, ScheduledPost } = require('../models');
const contentGenerator = require('../content/contentGenerator');
const { SocialAuditLog } = require('../models');

class DailyPoster {
  constructor() {
    this.isEnabled = false;
    this.cronJob = null;
    this.config = {
      // When to generate posts (defaults to 6 AM daily)
      generateTime: process.env.SOCIAL_DAILY_POST_GENERATE_TIME || '0 6 * * *',
      
      // When to publish posts (defaults to 10 AM daily for Facebook)
      publishTime: process.env.SOCIAL_DAILY_POST_PUBLISH_TIME || '10:00',
      
      // Content rotation settings
      contentTypes: ['service-specific', 'general', 'seasonal'],
      services: ['plumbing', 'electrical', 'hvac', 'landscaping', 'general-maintenance'],
      
      // Require manual approval before posting
      requiresApproval: process.env.SOCIAL_DAILY_POST_REQUIRE_APPROVAL !== 'false',
      
      // City/location for localized content
      defaultCity: process.env.SOCIAL_DAILY_POST_CITY || 'Miami',
      
      // Platform targeting
      platforms: ['meta_facebook', 'meta_instagram']
    };
    
    console.info('[Daily Poster] Configuration loaded:', {
      generateTime: this.config.generateTime,
      publishTime: this.config.publishTime,
      requiresApproval: this.config.requiresApproval,
      defaultCity: this.config.defaultCity
    });
  }
  
  /**
   * Start the daily poster
   */
  start() {
    if (this.isEnabled) {
      console.warn('[Daily Poster] Already running');
      return { success: true, message: 'Daily poster already running' };
    }
    
    // Schedule daily post generation
    this.cronJob = cron.schedule(this.config.generateTime, async () => {
      await this.generateDailyPost();
    });
    
    this.isEnabled = true;
    
    console.info('[Daily Poster] Started - will generate posts at:', this.config.generateTime);
    
    return {
      success: true,
      message: 'Daily poster started',
      config: {
        generateTime: this.config.generateTime,
        publishTime: this.config.publishTime,
        requiresApproval: this.config.requiresApproval
      }
    };
  }
  
  /**
   * Stop the daily poster
   */
  stop() {
    if (!this.isEnabled) {
      console.warn('[Daily Poster] Not running');
      return { success: true, message: 'Daily poster not running' };
    }
    
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    
    this.isEnabled = false;
    console.info('[Daily Poster] Stopped');
    
    return {
      success: true,
      message: 'Daily poster stopped'
    };
  }
  
  /**
   * Generate and schedule today's post
   */
  async generateDailyPost() {
    console.info('[Daily Poster] Generating daily post...');
    
    try {
      // Get active social accounts
      const accounts = await SocialAccount.find({
        platform: { $in: this.config.platforms },
        isActive: true,
        isTokenValid: true
      });
      
      if (accounts.length === 0) {
        console.warn('[Daily Poster] No active accounts found');
        return;
      }
      
      console.info(`[Daily Poster] Found ${accounts.length} active account(s)`);
      
      // Get today's content theme (rotate through content types)
      const theme = this.selectDailyTheme();
      
      // Generate content for each platform
      for (const account of accounts) {
        try {
          await this.createPostForAccount(account, theme);
        } catch (error) {
          console.error(`[Daily Poster] Failed to create post for ${account.platform}:`, error.message);
          
          // Log error but continue with other accounts
          await SocialAuditLog.logAction({
            actorId: 'system',
            actorType: 'system',
            action: 'daily_post_generation',
            status: 'failure',
            description: `Failed to generate daily post for ${account.platform}`,
            accountId: account._id,
            platform: account.platform,
            errorMessage: error.message
          });
        }
      }
      
      console.info('[Daily Poster] Daily post generation complete');
      
    } catch (error) {
      console.error('[Daily Poster] Fatal error generating daily post:', error);
    }
  }
  
  /**
   * Select today's content theme based on day of week
   */
  selectDailyTheme() {
    const dayOfWeek = new Date().getDay(); // 0 = Sunday, 6 = Saturday
    const dayOfMonth = new Date().getDate();
    
    // Rotate content types by day of week
    const themes = [
      // Sunday - General/Trust building
      { contentType: 'general', topic: 'trust' },
      
      // Monday - Service highlight (rotating service)
      { 
        contentType: 'service-specific', 
        service: this.config.services[dayOfMonth % this.config.services.length]
      },
      
      // Tuesday - Tips/Education
      { contentType: 'general', topic: 'homeowner-tips' },
      
      // Wednesday - Service highlight (different service)
      { 
        contentType: 'service-specific', 
        service: this.config.services[(dayOfMonth + 1) % this.config.services.length]
      },
      
      // Thursday - Seasonal content
      { contentType: 'seasonal', season: this.getCurrentSeason() },
      
      // Friday - Weekend prep
      { contentType: 'general', topic: 'weekend-ready' },
      
      // Saturday - Testimonials/Success stories
      { contentType: 'general', topic: 'success-stories' }
    ];
    
    return themes[dayOfWeek];
  }
  
  /**
   * Get current season
   */
  getCurrentSeason() {
    const month = new Date().getMonth() + 1; // 1-12
    
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
  }
  
  /**
   * Create a scheduled post for a specific account
   */
  async createPostForAccount(account, theme) {
    console.info(`[Daily Poster] Creating post for ${account.platform} (${account.platformUsername})`);
    
    // Determine platform for content generation
    const platform = account.platform;
    
    // Generate AI content
    const contentParams = {
      platform,
      contentType: theme.contentType,
      city: this.config.defaultCity,
      includeHashtags: platform === 'meta_instagram', // Hashtags for Instagram
      includeCallToAction: true
    };
    
    // Add theme-specific parameters
    if (theme.service) {
      contentParams.service = theme.service;
    }
    if (theme.season) {
      contentParams.season = theme.season;
    }
    if (theme.topic) {
      contentParams.topic = theme.topic;
    }
    
    console.info(`[Daily Poster] Generating content with params:`, contentParams);
    
    const generatedContent = await contentGenerator.generatePost(contentParams);
    
    if (!generatedContent || !generatedContent.content) {
      throw new Error('Content generation failed');
    }
    
    // Calculate publish time (today at specified time)
    const publishDate = new Date();
    const [hours, minutes] = this.config.publishTime.split(':');
    publishDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // If publish time has already passed today, schedule for tomorrow
    if (publishDate < new Date()) {
      publishDate.setDate(publishDate.getDate() + 1);
    }
    
    // Create scheduled post
    const scheduledPost = new ScheduledPost({
      ownerId: account.ownerId,
      accountId: account._id,
      platform: account.platform,
      content: generatedContent.content,
      mediaUrls: generatedContent.mediaUrls || [],
      scheduledFor: publishDate,
      status: this.config.requiresApproval ? 'pending_approval' : 'scheduled',
      requiresApproval: this.config.requiresApproval,
      metadata: {
        generationType: 'daily_auto',
        theme: theme,
        city: this.config.defaultCity
      }
    });
    
    await scheduledPost.save();
    
    console.info(`[Daily Poster] Post scheduled for ${publishDate.toISOString()}`, {
      postId: scheduledPost._id,
      status: scheduledPost.status,
      scheduledFor: publishDate
    });
    
    // Log action
    await SocialAuditLog.logAction({
      actorId: 'system',
      actorType: 'system',
      action: 'daily_post_generation',
      status: 'success',
      description: `Generated daily post for ${account.platform} - ${theme.contentType}`,
      accountId: account._id,
      platform: account.platform,
      metadata: {
        postId: scheduledPost._id,
        scheduledFor: publishDate,
        theme: theme
      }
    });
    
    return scheduledPost;
  }
  
  /**
   * Generate a post immediately (manual trigger)
   */
  async generateNow(options = {}) {
    console.info('[Daily Poster] Manual post generation triggered');
    
    const theme = options.theme || this.selectDailyTheme();
    const platform = options.platform || 'meta_facebook';
    
    // Find account for specified platform
    const account = await SocialAccount.findOne({
      platform,
      isActive: true,
      isTokenValid: true
    });
    
    if (!account) {
      throw new Error(`No active ${platform} account found`);
    }
    
    return await this.createPostForAccount(account, theme);
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    const updated = {};
    
    if (newConfig.generateTime) {
      this.config.generateTime = newConfig.generateTime;
      updated.generateTime = true;
    }
    
    if (newConfig.publishTime) {
      this.config.publishTime = newConfig.publishTime;
      updated.publishTime = true;
    }
    
    if (newConfig.requiresApproval !== undefined) {
      this.config.requiresApproval = newConfig.requiresApproval;
      updated.requiresApproval = true;
    }
    
    if (newConfig.defaultCity) {
      this.config.defaultCity = newConfig.defaultCity;
      updated.defaultCity = true;
    }
    
    // Restart cron job if timing changed
    if ((updated.generateTime || updated.publishTime) && this.isEnabled) {
      this.stop();
      this.start();
    }
    
    console.info('[Daily Poster] Configuration updated:', updated);
    
    return {
      success: true,
      message: 'Configuration updated',
      updated,
      config: this.config
    };
  }
  
  /**
   * Get current status
   */
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      config: this.config,
      nextRunTime: this.cronJob ? 'Based on cron schedule' : null
    };
  }
}

module.exports = new DailyPoster();
