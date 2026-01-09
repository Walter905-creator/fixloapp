const { PostMetric, ScheduledPost, SocialAccount } = require('../models');

/**
 * Analytics Service
 * Provides insights and metrics for social media performance
 */

class AnalyticsService {
  /**
   * Get overview metrics for all platforms
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Aggregated metrics
   */
  async getOverview(params) {
    const {
      ownerId,
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      endDate = new Date()
    } = params;
    
    // Get all accounts for owner
    const accounts = await SocialAccount.find({ ownerId, isActive: true });
    const accountIds = accounts.map(a => a._id);
    
    // Get all metrics in date range
    const metrics = await PostMetric.find({
      accountId: { $in: accountIds },
      publishedAt: { $gte: startDate, $lte: endDate }
    });
    
    // Aggregate totals
    const totals = {
      posts: metrics.length,
      impressions: 0,
      reach: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      clicks: 0,
      fixloClicks: 0,
      fixloSignups: 0,
      fixloConversions: 0,
      totalEngagement: 0,
      avgEngagementRate: 0
    };
    
    metrics.forEach(m => {
      totals.impressions += m.impressions;
      totals.reach += m.reach;
      totals.likes += m.likes;
      totals.comments += m.comments;
      totals.shares += m.shares;
      totals.saves += m.saves;
      totals.clicks += m.clicks;
      totals.fixloClicks += m.fixloClicks;
      totals.fixloSignups += m.fixloSignups;
      totals.fixloConversions += m.fixloConversions;
    });
    
    totals.totalEngagement = totals.likes + totals.comments + totals.shares;
    totals.avgEngagementRate = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.engagementRate, 0) / metrics.length
      : 0;
    
    // Calculate conversion rates
    const conversionRates = {
      clickThroughRate: totals.impressions > 0
        ? (totals.fixloClicks / totals.impressions) * 100
        : 0,
      signupConversionRate: totals.fixloClicks > 0
        ? (totals.fixloSignups / totals.fixloClicks) * 100
        : 0,
      paidConversionRate: totals.fixloSignups > 0
        ? (totals.fixloConversions / totals.fixloSignups) * 100
        : 0
    };
    
    // Get platform breakdown
    const byPlatform = await this.getMetricsByPlatform({
      ownerId,
      startDate,
      endDate
    });
    
    // Get top performing posts
    const topPosts = await this.getTopPosts({
      ownerId,
      startDate,
      endDate,
      limit: 5
    });
    
    return {
      period: { startDate, endDate },
      totals,
      conversionRates,
      byPlatform,
      topPosts
    };
  }
  
  /**
   * Get metrics broken down by platform
   */
  async getMetricsByPlatform(params) {
    const { ownerId, startDate, endDate } = params;
    
    const accounts = await SocialAccount.find({ ownerId, isActive: true });
    const accountIds = accounts.map(a => a._id);
    
    const metrics = await PostMetric.find({
      accountId: { $in: accountIds },
      publishedAt: { $gte: startDate, $lte: endDate }
    });
    
    const byPlatform = {};
    
    metrics.forEach(m => {
      if (!byPlatform[m.platform]) {
        byPlatform[m.platform] = {
          posts: 0,
          impressions: 0,
          reach: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          engagement: 0,
          avgEngagementRate: 0,
          engagementRateSum: 0
        };
      }
      
      const p = byPlatform[m.platform];
      p.posts++;
      p.impressions += m.impressions;
      p.reach += m.reach;
      p.likes += m.likes;
      p.comments += m.comments;
      p.shares += m.shares;
      p.engagement += (m.likes + m.comments + m.shares);
      p.engagementRateSum += m.engagementRate;
    });
    
    // Calculate averages
    Object.keys(byPlatform).forEach(platform => {
      const p = byPlatform[platform];
      p.avgEngagementRate = p.posts > 0 ? p.engagementRateSum / p.posts : 0;
      delete p.engagementRateSum;
    });
    
    return byPlatform;
  }
  
  /**
   * Get top performing posts
   */
  async getTopPosts(params) {
    const {
      ownerId,
      startDate,
      endDate,
      limit = 10,
      sortBy = 'engagementRate' // or 'impressions', 'reach', 'fixloClicks'
    } = params;
    
    const accounts = await SocialAccount.find({ ownerId, isActive: true });
    const accountIds = accounts.map(a => a._id);
    
    const metrics = await PostMetric.find({
      accountId: { $in: accountIds },
      publishedAt: { $gte: startDate, $lte: endDate }
    })
      .sort({ [sortBy]: -1 })
      .limit(limit)
      .populate('postId')
      .populate('accountId');
    
    return metrics.map(m => ({
      postId: m.postId?._id,
      content: m.postId?.content?.substring(0, 100),
      platform: m.platform,
      publishedAt: m.publishedAt,
      platformPostUrl: m.platformPostUrl,
      metrics: {
        impressions: m.impressions,
        reach: m.reach,
        likes: m.likes,
        comments: m.comments,
        shares: m.shares,
        engagementRate: m.engagementRate,
        fixloClicks: m.fixloClicks,
        fixloSignups: m.fixloSignups
      }
    }));
  }
  
  /**
   * Get posting schedule analytics
   */
  async getScheduleAnalytics(params) {
    const { ownerId } = params;
    
    const accounts = await SocialAccount.find({ ownerId, isActive: true });
    const accountIds = accounts.map(a => a._id);
    
    // Get upcoming posts
    const upcomingPosts = await ScheduledPost.find({
      accountId: { $in: accountIds },
      status: { $in: ['pending', 'approved', 'scheduled'] },
      scheduledFor: { $gte: new Date() }
    })
      .sort({ scheduledFor: 1 })
      .limit(20);
    
    // Get failed posts
    const failedPosts = await ScheduledPost.find({
      accountId: { $in: accountIds },
      status: 'failed',
      lastAttemptAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
      .sort({ lastAttemptAt: -1 });
    
    // Get pending approval
    const pendingApproval = await ScheduledPost.find({
      accountId: { $in: accountIds },
      status: 'pending',
      requiresApproval: true
    })
      .sort({ createdAt: -1 });
    
    // Get posting history (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const publishedPosts = await ScheduledPost.find({
      accountId: { $in: accountIds },
      status: 'published',
      publishedAt: { $gte: thirtyDaysAgo }
    });
    
    // Calculate success rate
    const totalAttempts = publishedPosts.length + failedPosts.length;
    const successRate = totalAttempts > 0
      ? (publishedPosts.length / totalAttempts) * 100
      : 0;
    
    return {
      upcoming: upcomingPosts.length,
      failed: failedPosts.length,
      pendingApproval: pendingApproval.length,
      publishedLast30Days: publishedPosts.length,
      successRate,
      upcomingPosts: upcomingPosts.map(p => ({
        id: p._id,
        platform: p.platform,
        scheduledFor: p.scheduledFor,
        status: p.status,
        content: p.content.substring(0, 100)
      })),
      failedPosts: failedPosts.map(p => ({
        id: p._id,
        platform: p.platform,
        lastError: p.lastError,
        attemptCount: p.attemptCount,
        canRetry: p.canRetry()
      }))
    };
  }
  
  /**
   * Get Fixlo attribution analytics
   */
  async getAttributionAnalytics(params) {
    const {
      ownerId,
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date()
    } = params;
    
    const accounts = await SocialAccount.find({ ownerId, isActive: true });
    const accountIds = accounts.map(a => a._id);
    
    const metrics = await PostMetric.find({
      accountId: { $in: accountIds },
      publishedAt: { $gte: startDate, $lte: endDate }
    });
    
    // Calculate attribution funnel
    const funnel = {
      impressions: 0,
      clicks: 0,
      signups: 0,
      conversions: 0,
      revenue: 0 // Would need to integrate with Stripe
    };
    
    metrics.forEach(m => {
      funnel.impressions += m.impressions;
      funnel.clicks += m.fixloClicks;
      funnel.signups += m.fixloSignups;
      funnel.conversions += m.fixloConversions;
    });
    
    // Calculate conversion rates at each stage
    const conversionRates = {
      impressionToClick: funnel.impressions > 0
        ? (funnel.clicks / funnel.impressions) * 100
        : 0,
      clickToSignup: funnel.clicks > 0
        ? (funnel.signups / funnel.clicks) * 100
        : 0,
      signupToConversion: funnel.signups > 0
        ? (funnel.conversions / funnel.signups) * 100
        : 0,
      overallConversionRate: funnel.impressions > 0
        ? (funnel.conversions / funnel.impressions) * 100
        : 0
    };
    
    // Get top converting platforms
    const platformAttribution = {};
    
    metrics.forEach(m => {
      if (!platformAttribution[m.platform]) {
        platformAttribution[m.platform] = {
          clicks: 0,
          signups: 0,
          conversions: 0
        };
      }
      
      platformAttribution[m.platform].clicks += m.fixloClicks;
      platformAttribution[m.platform].signups += m.fixloSignups;
      platformAttribution[m.platform].conversions += m.fixloConversions;
    });
    
    return {
      period: { startDate, endDate },
      funnel,
      conversionRates,
      platformAttribution
    };
  }
  
  /**
   * Record Fixlo action from social media
   * @param {Object} params - Action parameters
   */
  async recordFixloAction(params) {
    const { postId, actionType, userId = null } = params;
    
    // Find metric by platform post ID or scheduled post ID
    let metric;
    
    if (postId.startsWith('social_')) {
      metric = await PostMetric.findOne({ platformPostId: postId });
    } else {
      metric = await PostMetric.findOne({ postId });
    }
    
    if (!metric) {
      throw new Error('Post metric not found');
    }
    
    await metric.recordFixloAction(actionType);
    
    return metric;
  }
}

module.exports = new AnalyticsService();
