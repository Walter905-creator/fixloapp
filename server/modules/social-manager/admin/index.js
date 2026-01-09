const { SocialAccount, ScheduledPost, SocialAuditLog } = require('../models');
const scheduler = require('../scheduler');
const { getConfiguredPlatforms } = require('../oauth');

/**
 * Admin Controls for Social Media Manager
 * Provides administrative functions for managing the system
 */

class AdminService {
  /**
   * Get system status
   * @returns {Object} - System status
   */
  getSystemStatus() {
    return {
      scheduler: scheduler.getStatus(),
      configuredPlatforms: getConfiguredPlatforms(),
      emergencyStop: scheduler.emergencyStop,
      timestamp: new Date()
    };
  }
  
  /**
   * Enable/disable a platform
   * @param {Object} params - Control parameters
   */
  async togglePlatform(params) {
    const { ownerId, platform, enabled, actorId } = params;
    
    const accounts = await SocialAccount.find({ ownerId, platform });
    
    for (const account of accounts) {
      account.isActive = enabled;
      await account.save();
    }
    
    await SocialAuditLog.logAction({
      actorId,
      actorType: 'admin',
      action: enabled ? 'enable_platform' : 'disable_platform',
      status: 'success',
      description: `${enabled ? 'Enabled' : 'Disabled'} ${platform} platform`,
      platform
    });
    
    return {
      success: true,
      platform,
      enabled,
      accountsAffected: accounts.length
    };
  }
  
  /**
   * Activate emergency stop
   * @param {Object} params - Stop parameters
   */
  async activateEmergencyStop(params) {
    const { reason, actorId } = params;
    
    scheduler.activateEmergencyStop(reason);
    
    await SocialAuditLog.logAction({
      actorId,
      actorType: 'admin',
      action: 'emergency_stop',
      status: 'warning',
      description: `Emergency stop activated: ${reason}`
    });
    
    return {
      success: true,
      emergencyStop: true,
      reason,
      timestamp: new Date()
    };
  }
  
  /**
   * Deactivate emergency stop
   * @param {Object} params - Resume parameters
   */
  async deactivateEmergencyStop(params) {
    const { actorId } = params;
    
    scheduler.deactivateEmergencyStop();
    
    await SocialAuditLog.logAction({
      actorId,
      actorType: 'admin',
      action: 'emergency_stop',
      status: 'success',
      description: 'Emergency stop deactivated'
    });
    
    return {
      success: true,
      emergencyStop: false,
      timestamp: new Date()
    };
  }
  
  /**
   * Set manual approval mode
   * @param {Object} params - Approval settings
   */
  async setApprovalMode(params) {
    const { ownerId, requiresApproval, actorId } = params;
    
    // Update all pending/scheduled posts
    const result = await ScheduledPost.updateMany(
      {
        ownerId,
        status: { $in: ['pending', 'scheduled'] }
      },
      {
        $set: { requiresApproval }
      }
    );
    
    await SocialAuditLog.logAction({
      actorId,
      actorType: 'admin',
      action: 'update_settings',
      status: 'success',
      description: `Manual approval mode ${requiresApproval ? 'enabled' : 'disabled'}`,
      metadata: { postsAffected: result.modifiedCount }
    });
    
    return {
      success: true,
      requiresApproval,
      postsAffected: result.modifiedCount
    };
  }
  
  /**
   * Approve a scheduled post
   * @param {Object} params - Approval parameters
   */
  async approvePost(params) {
    const { postId, actorId } = params;
    
    const post = await ScheduledPost.findById(postId);
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    if (post.status !== 'pending') {
      throw new Error(`Post cannot be approved in status: ${post.status}`);
    }
    
    await post.approve(actorId);
    
    await SocialAuditLog.logAction({
      actorId,
      actorType: 'admin',
      action: 'approve_post',
      status: 'success',
      description: `Approved post for ${post.platform}`,
      postId: post._id,
      platform: post.platform
    });
    
    return {
      success: true,
      post: {
        id: post._id,
        status: post.status,
        scheduledFor: post.scheduledFor,
        platform: post.platform
      }
    };
  }
  
  /**
   * Cancel a scheduled post
   * @param {Object} params - Cancellation parameters
   */
  async cancelPost(params) {
    const { postId, reason, actorId } = params;
    
    const post = await ScheduledPost.findById(postId);
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    if (!['pending', 'approved', 'scheduled'].includes(post.status)) {
      throw new Error(`Post cannot be cancelled in status: ${post.status}`);
    }
    
    await post.cancel(actorId, reason);
    
    await SocialAuditLog.logAction({
      actorId,
      actorType: 'admin',
      action: 'cancel_post',
      status: 'success',
      description: `Cancelled post: ${reason}`,
      postId: post._id,
      platform: post.platform
    });
    
    return {
      success: true,
      post: {
        id: post._id,
        status: post.status,
        cancellationReason: post.cancellationReason
      }
    };
  }
  
  /**
   * Get accounts requiring re-authentication
   * @param {string} ownerId - Owner ID
   * @returns {Promise<Array>} - Accounts needing reauth
   */
  async getReauthAlerts(ownerId) {
    const accounts = await SocialAccount.find({
      ownerId,
      $or: [
        { requiresReauth: true },
        { isTokenValid: false }
      ]
    });
    
    return accounts.map(a => ({
      id: a._id,
      platform: a.platform,
      platformUsername: a.platformUsername,
      requiresReauth: a.requiresReauth,
      reauthReason: a.reauthReason,
      tokenExpiresAt: a.tokenExpiresAt,
      disconnectedAt: a.disconnectedAt
    }));
  }
  
  /**
   * Get audit logs
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Audit logs
   */
  async getAuditLogs(params) {
    const {
      ownerId = null,
      action = null,
      platform = null,
      status = null,
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      limit = 100
    } = params;
    
    const query = {
      createdAt: { $gte: startDate, $lte: endDate }
    };
    
    if (action) query.action = action;
    if (platform) query.platform = platform;
    if (status) query.status = status;
    
    const logs = await SocialAuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
    
    return logs.map(log => log.toSafeObject());
  }
  
  /**
   * Get system configuration
   * @returns {Object} - Current configuration
   */
  getConfiguration() {
    return {
      platforms: {
        meta: {
          configured: !!(process.env.SOCIAL_META_CLIENT_ID && process.env.SOCIAL_META_CLIENT_SECRET),
          supports: ['instagram', 'facebook']
        },
        tiktok: {
          configured: !!(process.env.SOCIAL_TIKTOK_CLIENT_ID && process.env.SOCIAL_TIKTOK_CLIENT_SECRET)
        },
        x: {
          configured: !!(process.env.SOCIAL_X_CLIENT_ID && process.env.SOCIAL_X_CLIENT_SECRET)
        },
        linkedin: {
          configured: !!(process.env.SOCIAL_LINKEDIN_CLIENT_ID && process.env.SOCIAL_LINKEDIN_CLIENT_SECRET)
        }
      },
      features: {
        aiContentGeneration: !!process.env.OPENAI_API_KEY,
        encryption: !!process.env.SOCIAL_ENCRYPTION_KEY,
        scheduler: scheduler.isRunning
      },
      scheduler: scheduler.getStatus()
    };
  }
  
  /**
   * Update platform settings
   * @param {Object} params - Settings to update
   */
  async updateSettings(params) {
    const { accountId, settings, actorId } = params;
    
    const account = await SocialAccount.findById(accountId);
    
    if (!account) {
      throw new Error('Account not found');
    }
    
    // Merge settings
    account.platformSettings = {
      ...account.platformSettings,
      ...settings
    };
    
    await account.save();
    
    await SocialAuditLog.logAction({
      actorId,
      actorType: 'admin',
      action: 'update_settings',
      status: 'success',
      description: `Updated settings for ${account.platform} account`,
      accountId: account._id,
      platform: account.platform
    });
    
    return {
      success: true,
      account: {
        id: account._id,
        platform: account.platform,
        platformSettings: account.platformSettings
      }
    };
  }
}

module.exports = new AdminService();
