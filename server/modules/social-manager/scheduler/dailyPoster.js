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
    this.lastRun = null;
    this.lastResult = null;
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
      
      // City rotation mode: 'single' (one city), 'rotating' (rotate cities), 'usa' (all USA cities)
      cityMode: process.env.SOCIAL_DAILY_POST_CITY_MODE || 'single',
      
      // Platform targeting
      platforms: ['meta_facebook', 'meta_instagram']
    };
    
    console.info('[Daily Poster] Configuration loaded:', {
      generateTime: this.config.generateTime,
      publishTime: this.config.publishTime,
      requiresApproval: this.config.requiresApproval,
      defaultCity: this.config.defaultCity,
      cityMode: this.config.cityMode
    });
  }
  
  /**
   * Start the daily poster
   */
  start() {
    if (this.isEnabled) {
      console.warn('⚠️ Daily Poster already running');
      return { success: true, message: 'Daily poster already running' };
    }
    
    // Schedule daily post generation
    this.cronJob = cron.schedule(this.config.generateTime, async () => {
      await this.generateDailyPost();
    });
    
    this.isEnabled = true;
    
    // Clear, explicit logging for cron registration
    console.info('⏰ Daily post generation scheduled:', this.config.generateTime);
    console.info('⏰ Daily post publish time:', this.config.publishTime);
    console.info('🚀 Facebook Daily Poster initialized (enabled=true)');
    
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
      console.warn('⚠️ Daily Poster not running');
      return { success: true, message: 'Daily poster not running' };
    }
    
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    
    this.isEnabled = false;
    console.info('🛑 Facebook Daily Poster stopped');
    
    return {
      success: true,
      message: 'Daily poster stopped'
    };
  }
  
  /**
   * Generate and schedule today's post
   */
  async generateDailyPost() {
    const timestamp = new Date().toISOString();
    this.lastRun = timestamp;
    
    console.info('✍️ Generating daily Facebook post...', { timestamp });
    
    try {
      // Get active social accounts
      const accounts = await SocialAccount.find({
        platform: { $in: this.config.platforms },
        isActive: true,
        isTokenValid: true
      });
      
      if (accounts.length === 0) {
        console.warn('⚠️ No active Facebook/Instagram accounts found');
        this.lastResult = 'error';
        return;
      }
      
      console.info(`✅ Found ${accounts.length} active account(s)`);
      
      // Get today's content theme (rotate through content types)
      const theme = this.selectDailyTheme();
      const city = this.getCurrentCity();
      
      console.info(`✍️ Generating daily Facebook post for city: ${city}`, {
        theme: theme.contentType,
        service: theme.service,
        topic: theme.topic
      });
      
      // Generate content for each platform
      let successCount = 0;
      let failureCount = 0;
      
      for (const account of accounts) {
        try {
          await this.createPostForAccount(account, theme, city);
          successCount++;
        } catch (error) {
          failureCount++;
          console.error(`❌ Failed to create post for ${account.platform}:`, error.message);
          
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
      
      if (successCount > 0) {
        console.info(`✅ Daily post generation complete: ${successCount} succeeded, ${failureCount} failed`);
        this.lastResult = 'success';
      } else {
        console.error(`❌ Daily post generation failed: all ${failureCount} attempts failed`);
        this.lastResult = 'error';
      }
      
    } catch (error) {
      console.error('❌ Fatal error generating daily post:', error);
      this.lastResult = 'error';
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
   * Get current city based on cityMode
   */
  getCurrentCity() {
    // For now, just return default city
    // In future, could implement rotation logic
    return this.config.defaultCity;
  }
  
  /**
   * Create a scheduled post for a specific account
   */
  async createPostForAccount(account, theme, city) {
    // Redact account details for logging
    const redactedPageId = account.platformAccountId 
      ? `***${account.platformAccountId.slice(-4)}` 
      : 'unknown';
    
    console.info(`📤 Publishing Facebook post to page: ${redactedPageId} (${account.platform})`);
    
    // Determine platform for content generation
    const platform = account.platform;
    
    // Generate AI content
    const contentParams = {
      platform,
      contentType: theme.contentType,
      city: city || this.config.defaultCity,
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
      throw new Error(`Content generation failed for ${theme.contentType}${theme.service ? ` (${theme.service})` : ''}`);
    }
    
    // Calculate publish time (today at specified time)
    const publishDate = new Date();
    const [hours, minutes] = this.config.publishTime.split(':');
    publishDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    
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
        city: city || this.config.defaultCity
      }
    });
    
    await scheduledPost.save();
    
    // Redact post ID for logging
    const redactedPostId = scheduledPost._id ? `***${String(scheduledPost._id).slice(-4)}` : 'unknown';
    
    console.info(`✅ Facebook post scheduled successfully (postId: ${redactedPostId})`, {
      platform: scheduledPost.platform,
      status: scheduledPost.status,
      scheduledFor: publishDate.toISOString()
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
    console.info('✍️ Manual post generation triggered', options);
    
    try {
      const theme = options.theme || this.selectDailyTheme();
      const platform = options.platform || 'meta_facebook';
      const city = options.city || this.getCurrentCity();
      
      // Find account for specified platform
      const account = await SocialAccount.findOne({
        platform,
        isActive: true,
        isTokenValid: true
      });
      
      if (!account) {
        const errorMsg = `No active ${platform} account found`;
        console.error(`❌ ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      const post = await this.createPostForAccount(account, theme, city);
      
      console.info('✅ Manual post generation successful', {
        postId: post._id,
        platform: post.platform,
        scheduledFor: post.scheduledFor
      });
      
      return post;
    } catch (error) {
      console.error('❌ Manual post generation failed:', error.message);
      throw error;
    }
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
    let nextRunInfo = null;
    
    if (this.cronJob && this.isEnabled) {
      // Parse cron schedule to provide helpful info
      nextRunInfo = `Daily at ${this.config.generateTime} (generate) and ${this.config.publishTime} (publish)`;
    }
    
    return {
      enabled: this.isEnabled,
      running: this.isEnabled,
      generationCron: this.config.generateTime,
      publishTime: this.config.publishTime,
      cityMode: this.config.cityMode,
      currentCity: this.getCurrentCity(),
      lastRun: this.lastRun,
      lastResult: this.lastResult,
      config: this.config,
      nextRunInfo,
      message: this.isEnabled 
        ? 'Daily poster is active. Posts will be generated and scheduled daily.'
        : 'Daily poster is not running. Call POST /api/social/daily-poster/start to enable.'
    };
  }
}

module.exports = new DailyPoster();
