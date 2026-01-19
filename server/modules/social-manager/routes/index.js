const express = require('express');
const router = express.Router();
const { getHandler, getConfiguredPlatforms } = require('../oauth');
const { SocialAccount, ScheduledPost } = require('../models');
const { contentGenerator } = require('../content');
const scheduler = require('../scheduler');
const analyticsService = require('../analytics');
const adminService = require('../admin');
const postingService = require('../posting');

/**
 * Social Media Manager API Routes
 * All routes are prefixed with /api/social
 * 
 * Authentication: Requires admin authentication
 * (Integrated with Fixlo's existing auth middleware)
 */

// ==================== OAuth & Connection Routes ====================

/**
 * GET /api/social/oauth/meta/callback
 * OAuth callback handler for Meta (Facebook/Instagram)
 * This receives the authorization code from Meta and completes the connection
 */
router.get('/oauth/meta/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;
    
    // Get client URL with secure default
    const clientUrl = process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' 
      ? 'https://www.fixloapp.com' 
      : 'http://localhost:3000');
    
    // Check for OAuth errors - sanitize error messages
    if (error) {
      console.error('[Meta OAuth] OAuth error from Meta:', { error, error_description });
      // Use safe, generic error message for redirect
      const safeError = error === 'access_denied' ? 'access_denied' : 'oauth_error';
      return res.redirect(`${clientUrl}/dashboard/admin/social?error=${safeError}`);
    }
    
    if (!code) {
      console.error('[Meta OAuth] No authorization code received');
      return res.redirect(`${clientUrl}/dashboard/admin/social?error=no_code`);
    }
    
    // Parse state to get ownerId and accountType
    let ownerId = 'admin';
    let accountType = 'instagram';
    
    if (state) {
      try {
        const stateData = JSON.parse(state);
        ownerId = stateData.ownerId || 'admin';
        accountType = stateData.accountType || 'instagram';
      } catch (e) {
        console.warn('[Meta OAuth] Failed to parse state:', e);
      }
    }
    
    console.info('[Meta OAuth] Callback received, processing connection...', {
      accountType,
      ownerId,
      hasCode: !!code
    });
    
    // Get the Meta handler and complete connection
    const handler = getHandler('meta_instagram'); // Both Instagram and Facebook use same handler
    
    try {
      const account = await handler.connect({
        code,
        ownerId,
        accountType
      });
      
      console.info('[Meta OAuth] Connection successful, redirecting to admin page');
      // Redirect back to admin page with success
      return res.redirect(`${clientUrl}/dashboard/admin/social?connected=true&platform=${account.platform}`);
      
    } catch (connectError) {
      console.error('[Meta OAuth] Connection failed:', connectError);
      
      // Get failure reason if available - use only predefined safe reason codes
      const safeReasons = ['NO_PAGES', 'NO_PAGE_TOKEN', 'NO_IG_BUSINESS', 'APP_NOT_LIVE', 'UNKNOWN'];
      const reason = safeReasons.includes(connectError.reason) ? connectError.reason : 'UNKNOWN';
      
      // Redirect back to admin page with safe error code only (no message)
      return res.redirect(`${clientUrl}/dashboard/admin/social?reason=${reason}`);
    }
    
  } catch (error) {
    console.error('[Meta OAuth] Callback handler error:', error);
    const clientUrl = process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' 
      ? 'https://www.fixloapp.com' 
      : 'http://localhost:3000');
    return res.redirect(`${clientUrl}/dashboard/admin/social?error=internal_error`);
  }
});

/**
 * GET /api/social/platforms
 * Get list of configured platforms
 */
router.get('/platforms', (req, res) => {
  try {
    const platforms = getConfiguredPlatforms();
    const config = adminService.getConfiguration();
    
    res.json({
      success: true,
      platforms,
      configuration: config.platforms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/social/connect/:platform/url
 * Get OAuth authorization URL for a platform
 */
router.get('/connect/:platform/url', async (req, res) => {
  try {
    const { platform } = req.params;
    const { accountType } = req.query; // For Meta: 'instagram' or 'facebook'
    
    // TODO: Get ownerId from authenticated admin user
    const ownerId = req.user?.id || 'admin';
    
    const handler = getHandler(platform);
    
    if (!handler.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: `${platform} is not configured. Please set environment variables.`
      });
    }
    
    let authUrl;
    if (platform === 'meta_instagram' || platform === 'meta_facebook') {
      authUrl = handler.getAuthorizationUrl(ownerId, accountType || 'instagram');
    } else if (platform === 'x') {
      const result = handler.getAuthorizationUrl(ownerId);
      authUrl = result.url;
      // Store code_verifier in session for token exchange
      // TODO: In production, store this securely
      req.session = req.session || {};
      req.session.xCodeVerifier = result.codeVerifier;
    } else {
      authUrl = handler.getAuthorizationUrl(ownerId);
    }
    
    res.json({
      success: true,
      authUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/social/connect/:platform
 * Complete OAuth connection for a platform
 */
router.post('/connect/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const { code, accountType } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required'
      });
    }
    
    // TODO: Get ownerId from authenticated admin user
    const ownerId = req.user?.id || 'admin';
    
    const handler = getHandler(platform);
    
    const connectParams = {
      code,
      ownerId,
      accountType
    };
    
    // For X, include code verifier
    if (platform === 'x') {
      connectParams.codeVerifier = req.session?.xCodeVerifier;
      if (!connectParams.codeVerifier) {
        return res.status(400).json({
          success: false,
          error: 'Code verifier not found. Please restart OAuth flow.'
        });
      }
    }
    
    const account = await handler.connect(connectParams);
    
    res.json({
      success: true,
      account: {
        id: account._id,
        platform: account.platform,
        platformUsername: account.platformUsername,
        accountName: account.accountName,
        profileUrl: account.profileUrl,
        connectedAt: account.connectedAt
      }
    });
  } catch (error) {
    // Return structured error with reason code for Meta platforms
    const errorResponse = {
      success: false,
      error: error.message
    };
    
    // Add reason code if available (for Meta OAuth)
    if (error.reason) {
      errorResponse.reason = error.reason;
    }
    
    res.status(500).json(errorResponse);
  }
});

/**
 * POST /api/social/disconnect/:platform
 * Disconnect a platform account
 */
router.post('/disconnect/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const { accountId } = req.body;
    
    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID is required'
      });
    }
    
    const account = await SocialAccount.findById(accountId);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }
    
    if (account.platform !== platform) {
      return res.status(400).json({
        success: false,
        error: 'Platform mismatch'
      });
    }
    
    const handler = getHandler(platform);
    await handler.revoke(account);
    
    res.json({
      success: true,
      message: `${platform} account disconnected successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== Content & Posting Routes ====================

/**
 * POST /api/social/generate-content
 * Generate AI content for a post
 */
router.post('/generate-content', async (req, res) => {
  try {
    const {
      platform,
      contentType,
      service,
      city,
      season,
      trend
    } = req.body;
    
    if (!platform) {
      return res.status(400).json({
        success: false,
        error: 'Platform is required'
      });
    }
    
    const generated = await contentGenerator.generatePost({
      platform,
      contentType,
      service,
      city,
      season,
      trend
    });
    
    // Validate content
    const validation = contentGenerator.validateContent(generated.content);
    
    res.json({
      success: true,
      content: generated.content,
      metadata: generated.metadata,
      validation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/social/post
 * Create a new scheduled post
 */
router.post('/post', async (req, res) => {
  try {
    const {
      accountId,
      content,
      mediaUrls,
      scheduledFor,
      requiresApproval
    } = req.body;
    
    if (!accountId || !content) {
      return res.status(400).json({
        success: false,
        error: 'Account ID and content are required'
      });
    }
    
    const account = await SocialAccount.findById(accountId);
    
    if (!account || !account.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Account not found or inactive'
      });
    }
    
    // TODO: Get ownerId from authenticated admin user
    const ownerId = req.user?.id || 'admin';
    
    // Default to next optimal time if not specified
    let postDate = scheduledFor ? new Date(scheduledFor) : null;
    if (!postDate || postDate < new Date()) {
      postDate = scheduler.getOptimalPostingTime(account.platform);
    }
    
    const post = new ScheduledPost({
      ownerId,
      accountId: account._id,
      platform: account.platform,
      content,
      mediaUrls: mediaUrls || [],
      mediaType: mediaUrls && mediaUrls.length > 0 ? 'image' : 'none',
      scheduledFor: postDate,
      requiresApproval: requiresApproval !== undefined ? requiresApproval : true,
      status: requiresApproval ? 'pending' : 'scheduled'
    });
    
    await post.save();
    
    res.json({
      success: true,
      post: {
        id: post._id,
        platform: post.platform,
        scheduledFor: post.scheduledFor,
        status: post.status,
        requiresApproval: post.requiresApproval
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/social/post/:postId/approve
 * Approve a pending post
 */
router.post('/post/:postId/approve', async (req, res) => {
  try {
    const { postId } = req.params;
    const actorId = req.user?.id || 'admin';
    
    const result = await adminService.approvePost({ postId, actorId });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/social/post/:postId/cancel
 * Cancel a scheduled post
 */
router.post('/post/:postId/cancel', async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason } = req.body;
    const actorId = req.user?.id || 'admin';
    
    const result = await adminService.cancelPost({
      postId,
      reason: reason || 'Cancelled by admin',
      actorId
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== Status & Analytics Routes ====================

/**
 * GET /api/social/status
 * Get overall system status
 */
router.get('/status', async (req, res) => {
  try {
    const ownerId = req.user?.id || 'admin';
    
    // Get connected accounts
    const accounts = await SocialAccount.find({ ownerId, isActive: true });
    
    // Get system status
    const systemStatus = adminService.getSystemStatus();
    
    // Get reauth alerts
    const reauthAlerts = await adminService.getReauthAlerts(ownerId);
    
    // Get schedule analytics
    const scheduleAnalytics = await analyticsService.getScheduleAnalytics({ ownerId });
    
    res.json({
      success: true,
      system: systemStatus,
      accounts: accounts.map(a => ({
        id: a._id,
        platform: a.platform,
        platformUsername: a.platformUsername,
        accountName: a.accountName,
        isActive: a.isActive,
        isTokenValid: a.isTokenValid,
        requiresReauth: a.requiresReauth,
        lastPostAt: a.lastPostAt,
        tokenExpiresAt: a.tokenExpiresAt,
        connectedAt: a.connectedAt
      })),
      reauthAlerts,
      schedule: scheduleAnalytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/social/debug/meta
 * Get Meta OAuth debug information
 */
router.get('/debug/meta', async (req, res) => {
  try {
    const ownerId = req.user?.id || 'admin';
    
    const metaHandler = getHandler('meta_instagram'); // Both use same handler
    const debugInfo = await metaHandler.getDebugInfo(ownerId);
    
    res.json({
      success: true,
      ...debugInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/social/metrics
 * Get analytics and metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const ownerId = req.user?.id || 'admin';
    const { startDate, endDate, platform } = req.query;
    
    const params = {
      ownerId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };
    
    const overview = await analyticsService.getOverview(params);
    const attribution = await analyticsService.getAttributionAnalytics(params);
    
    res.json({
      success: true,
      overview,
      attribution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/social/metrics/top-posts
 * Get top performing posts
 */
router.get('/metrics/top-posts', async (req, res) => {
  try {
    const ownerId = req.user?.id || 'admin';
    const { startDate, endDate, limit, sortBy } = req.query;
    
    const topPosts = await analyticsService.getTopPosts({
      ownerId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit) : 10,
      sortBy: sortBy || 'engagementRate'
    });
    
    res.json({
      success: true,
      posts: topPosts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== Admin Routes ====================

/**
 * POST /api/social/admin/emergency-stop
 * Activate/deactivate emergency stop
 */
router.post('/admin/emergency-stop', async (req, res) => {
  try {
    const { activate, reason } = req.body;
    const actorId = req.user?.id || 'admin';
    
    let result;
    if (activate) {
      result = await adminService.activateEmergencyStop({
        reason: reason || 'Emergency stop activated by admin',
        actorId
      });
    } else {
      result = await adminService.deactivateEmergencyStop({ actorId });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/social/admin/approval-mode
 * Set manual approval requirement
 */
router.post('/admin/approval-mode', async (req, res) => {
  try {
    const { requiresApproval } = req.body;
    const ownerId = req.user?.id || 'admin';
    const actorId = req.user?.id || 'admin';
    
    if (typeof requiresApproval !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'requiresApproval must be a boolean'
      });
    }
    
    const result = await adminService.setApprovalMode({
      ownerId,
      requiresApproval,
      actorId
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/social/admin/audit-logs
 * Get audit logs
 */
router.get('/admin/audit-logs', async (req, res) => {
  try {
    const { action, platform, status, startDate, endDate, limit } = req.query;
    
    const logs = await adminService.getAuditLogs({
      action,
      platform,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit) : 100
    });
    
    res.json({
      success: true,
      logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/social/admin/configuration
 * Get system configuration
 */
router.get('/admin/configuration', (req, res) => {
  try {
    const config = adminService.getConfiguration();
    
    res.json({
      success: true,
      configuration: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
