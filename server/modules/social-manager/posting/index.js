const metaAdapter = require('./metaAdapter');
const tiktokAdapter = require('./tiktokAdapter');
const xAdapter = require('./xAdapter');
const linkedinAdapter = require('./linkedinAdapter');
const { tokenEncryption } = require('../security');
const { ScheduledPost, PostMetric, SocialAuditLog } = require('../models');

/**
 * Unified Posting Service
 * Routes posts to appropriate platform adapters
 */

class PostingService {
  constructor() {
    this.adapters = {
      meta_instagram: metaAdapter,
      meta_facebook: metaAdapter,
      tiktok: tiktokAdapter,
      x: xAdapter,
      linkedin: linkedinAdapter
    };
    
    // Rate limits (posts per hour per platform)
    this.rateLimits = {
      meta_instagram: 25,
      meta_facebook: 50,
      tiktok: 10,
      x: 300,
      linkedin: 20
    };
  }
  
  /**
   * Publish a scheduled post
   * @param {ScheduledPost} scheduledPost - Post to publish
   * @returns {Promise<Object>} - Publication result
   */
  async publishPost(scheduledPost) {
    const { platform, accountId } = scheduledPost;
    
    // Redact post ID for logging
    const redactedPostId = scheduledPost._id ? `***${String(scheduledPost._id).slice(-4)}` : 'unknown';
    
    try {
      // Mark as publishing
      await scheduledPost.markAsPublishing();
      
      // Get adapter
      const adapter = this.adapters[platform];
      if (!adapter) {
        throw new Error(`No adapter found for platform: ${platform}`);
      }
      
      // Get account and access token
      const { SocialAccount } = require('../models');
      const account = await SocialAccount.findById(accountId);
      
      if (!account || !account.isActive) {
        throw new Error('Account not found or inactive');
      }
      
      if (!account.isTokenValid) {
        throw new Error('Account token is invalid - re-authorization required');
      }
      
      // Redact account details for logging
      const redactedPageId = account.platformAccountId 
        ? `***${account.platformAccountId.slice(-4)}` 
        : 'unknown';
      
      console.info(`📤 Publishing Facebook post to page: ${redactedPageId}`, {
        platform,
        postId: redactedPostId
      });
      
      // Get decrypted access token
      const accessToken = await tokenEncryption.retrieveToken(account.accessTokenRef);
      
      // Publish based on platform
      let result;
      if (platform === 'meta_instagram') {
        result = await adapter.publishInstagram({
          account,
          content: scheduledPost.content,
          mediaUrls: scheduledPost.mediaUrls,
          accessToken
        });
      } else if (platform === 'meta_facebook') {
        result = await adapter.publishFacebook({
          account,
          content: scheduledPost.content,
          mediaUrls: scheduledPost.mediaUrls,
          accessToken
        });
      } else {
        result = await adapter.publish({
          account,
          content: scheduledPost.content,
          mediaUrls: scheduledPost.mediaUrls,
          accessToken
        });
      }
      
      // Mark as published
      await scheduledPost.markAsPublished(result.platformPostId, result.platformPostUrl);
      
      // Update account last post time
      account.lastPostAt = new Date();
      await account.save();
      
      // Create metrics record
      const metric = new PostMetric({
        postId: scheduledPost._id,
        accountId: account._id,
        platform,
        platformPostId: result.platformPostId,
        platformPostUrl: result.platformPostUrl,
        publishedAt: new Date()
      });
      await metric.save();
      
      // Redact platform post ID for logging
      const redactedPlatformPostId = result.platformPostId 
        ? `***${String(result.platformPostId).slice(-4)}` 
        : 'unknown';
      
      console.info(`✅ Facebook post published successfully (platformPostId: ${redactedPlatformPostId})`, {
        platform,
        postId: redactedPostId,
        url: result.platformPostUrl
      });
      
      // Log success
      await SocialAuditLog.logAction({
        actorId: scheduledPost.ownerId,
        actorType: 'system',
        action: 'publish_post',
        status: 'success',
        description: `Published post to ${platform}`,
        accountId: account._id,
        postId: scheduledPost._id,
        platform
      });
      
      return {
        success: true,
        ...result
      };
    } catch (error) {
      console.error(`❌ Facebook post failed: ${error.message}`, {
        platform,
        postId: redactedPostId
      });
      
      // Mark as failed
      await scheduledPost.markAsFailed(error.message);
      
      // Log failure
      await SocialAuditLog.logAction({
        actorId: scheduledPost.ownerId,
        actorType: 'system',
        action: 'publish_post',
        status: 'failure',
        description: `Failed to publish post to ${platform}`,
        accountId: scheduledPost.accountId,
        postId: scheduledPost._id,
        platform,
        errorMessage: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Fetch metrics for a published post
   * @param {PostMetric} metric - Metric record to update
   * @returns {Promise<PostMetric>} - Updated metric
   */
  async fetchMetrics(metric) {
    const { platform, platformPostId, accountId } = metric;
    
    try {
      const adapter = this.adapters[platform];
      if (!adapter) {
        throw new Error(`No adapter found for platform: ${platform}`);
      }
      
      // Get account and access token
      const { SocialAccount } = require('../models');
      const account = await SocialAccount.findById(accountId);
      const accessToken = await tokenEncryption.retrieveToken(account.accessTokenRef);
      
      // Fetch metrics
      let metrics;
      if (platform === 'meta_instagram') {
        metrics = await adapter.fetchInstagramMetrics(platformPostId, accessToken);
      } else if (platform === 'meta_facebook') {
        metrics = await adapter.fetchFacebookMetrics(platformPostId, accessToken);
      } else {
        metrics = await adapter.fetchMetrics(platformPostId, accessToken);
      }
      
      // Update metric record
      await metric.updateMetrics(metrics);
      
      return metric;
    } catch (error) {
      console.error(`Failed to fetch metrics for ${platform} post ${platformPostId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Check rate limit for platform
   * @param {string} platform - Platform name
   * @param {string} accountId - Account ID
   * @returns {Promise<boolean>} - Whether posting is allowed
   */
  async checkRateLimit(platform, accountId) {
    const limit = this.rateLimits[platform];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const recentPosts = await ScheduledPost.countDocuments({
      accountId,
      platform,
      status: 'published',
      publishedAt: { $gte: oneHourAgo }
    });
    
    return recentPosts < limit;
  }
}

module.exports = new PostingService();
