const express = require('express');
const router = express.Router();
const { getHandler, getConfiguredPlatforms } = require('../oauth');
const { SocialAccount, ScheduledPost, SocialAuditLog } = require('../models');
const { tokenEncryption } = require('../security');
const { contentGenerator } = require('../content');
const scheduler = require('../scheduler');
const analyticsService = require('../analytics');
const adminService = require('../admin');
const postingService = require('../posting');
const requireAuth = require('../../middleware/requireAuth');

/**
 * Social Media Manager API Routes
 * All routes are prefixed with /api/social
 * 
 * Authentication: Requires admin authentication for all routes except OAuth callbacks
 * (OAuth callbacks must remain public as they're called by OAuth providers)
 */

// ==================== OAuth & Connection Routes ====================

/**
 * GET /api/social/oauth/meta/callback
 * OAuth callback handler for Meta (Facebook/Instagram)
 * This receives the authorization code from Meta and completes the connection
 * 
 * BACKEND-ONLY IMPLEMENTATION:
 * This endpoint completes the entire OAuth flow server-side without relying on
 * the frontend. It exchanges the code for tokens, fetches Page and Instagram info,
 * stores encrypted tokens in MongoDB, and returns a JSON response.
 * 
 * This allows Meta OAuth to work even if:
 * - Frontend is unavailable
 * - Admin UI routes are hidden
 * - Only backend + Meta OAuth are accessible
 * 
 * VERIFICATION:
 * Use GET /api/social/force-status to verify connection status via API
 * 
 * NOTE: This route MUST remain public - it's called by Meta OAuth service
 */
router.get('/oauth/meta/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;
    
    // DIAGNOSTIC: Log OAuth callback received
    console.info('[Meta OAuth Backend] Callback received', {
      hasCode: !!code,
      hasState: !!state,
      hasError: !!error,
      timestamp: new Date().toISOString()
    });
    
    // Check for OAuth errors
    if (error) {
      console.error('[Meta OAuth Backend] OAuth error from Meta:', { error, error_description });
      return res.status(400).json({
        success: false,
        platform: 'meta',
        connected: false,
        error: error === 'access_denied' ? 'User denied access' : 'OAuth error',
        errorCode: error
      });
    }
    
    if (!code) {
      console.error('[Meta OAuth Backend] No authorization code received');
      return res.status(400).json({
        success: false,
        platform: 'meta',
        connected: false,
        error: 'No authorization code received'
      });
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
        console.warn('[Meta OAuth Backend] Failed to parse state:', e);
      }
    }
    
    console.info('[Meta OAuth Backend] Processing OAuth connection...', {
      accountType,
      ownerId
    });
    
    // Get the Meta handler
    const handler = getHandler('meta_instagram'); // Both Instagram and Facebook use same handler
    
    try {
      // STEP 1: Exchange authorization code for short-lived token
      console.info('[Meta OAuth Backend] Step 1: Exchanging code for token...');
      const shortTokenData = await handler.exchangeCodeForToken(code);
      console.info('[Meta OAuth Backend] Token exchange: SUCCESS');
      
      // STEP 2: Exchange for long-lived token (60 days)
      console.info('[Meta OAuth Backend] Step 2: Getting long-lived token...');
      const longTokenData = await handler.getLongLivedToken(shortTokenData.access_token);
      console.info('[Meta OAuth Backend] Long-lived token: SUCCESS', {
        expiresIn: longTokenData.expires_in
      });
      
      // STEP 3: Get complete Page and Instagram information with access tokens
      console.info('[Meta OAuth Backend] Step 3: Fetching Page and Instagram info...');
      const metaAccountInfo = await handler.getCompleteMetaAccountInfo(longTokenData.access_token);
      console.info('[Meta OAuth Backend] Account info fetch: SUCCESS', {
        hasPage: !!metaAccountInfo.pageId,
        hasInstagram: metaAccountInfo.hasInstagram,
        pageName: metaAccountInfo.pageName,
        instagramUsername: metaAccountInfo.instagramUsername
      });
      
      // STEP 4: Store Page access token (encrypted)
      console.info('[Meta OAuth Backend] Step 4: Storing encrypted tokens...');
      const pageTokenStored = await tokenEncryption.storeToken({
        tokenValue: metaAccountInfo.pageAccessToken,
        tokenType: 'access',
        accountRef: null, // Will update after creating account
        platform: 'meta_facebook',
        expiresIn: longTokenData.expires_in
      });
      
      // Store Instagram access token if available (uses same token as Page)
      let instagramTokenStored = null;
      if (metaAccountInfo.hasInstagram) {
        instagramTokenStored = await tokenEncryption.storeToken({
          tokenValue: metaAccountInfo.instagramAccessToken,
          tokenType: 'access',
          accountRef: null, // Will update after creating account
          platform: 'meta_instagram',
          expiresIn: longTokenData.expires_in
        });
      }
      
      console.info('[Meta OAuth Backend] Token storage: SUCCESS');
      
      // STEP 5: Create or update SocialAccount for Facebook Page
      let facebookAccount = await SocialAccount.findOne({
        ownerId,
        platform: 'meta_facebook',
        platformAccountId: metaAccountInfo.pageId
      });
      
      if (facebookAccount) {
        // Update existing account
        facebookAccount.accessTokenRef = pageTokenStored._id;
        facebookAccount.tokenExpiresAt = new Date(Date.now() + longTokenData.expires_in * 1000);
        facebookAccount.isActive = true;
        facebookAccount.isTokenValid = true;
        facebookAccount.requiresReauth = false;
        facebookAccount.platformSettings = {
          ...facebookAccount.platformSettings,
          pageId: metaAccountInfo.pageId,
          pageName: metaAccountInfo.pageName
        };
        await facebookAccount.save();
        console.info('[Meta OAuth Backend] Facebook account updated');
      } else {
        // Create new account
        facebookAccount = new SocialAccount({
          ownerId,
          platform: 'meta_facebook',
          platformAccountId: metaAccountInfo.pageId,
          platformUsername: metaAccountInfo.pageName,
          accountName: metaAccountInfo.pageName,
          profileUrl: `https://facebook.com/${metaAccountInfo.pageId}`,
          accessTokenRef: pageTokenStored._id,
          tokenExpiresAt: new Date(Date.now() + longTokenData.expires_in * 1000),
          platformSettings: {
            pageId: metaAccountInfo.pageId,
            pageName: metaAccountInfo.pageName
          },
          grantedScopes: ['pages_show_list'],
          connectedAt: new Date()
        });
        await facebookAccount.save();
        console.info('[Meta OAuth Backend] Facebook account created');
      }
      
      // Update token with account reference
      pageTokenStored.accountRef = facebookAccount._id;
      await pageTokenStored.save();
      
      // STEP 6: Create or update SocialAccount for Instagram (if available)
      let instagramAccount = null;
      if (metaAccountInfo.hasInstagram) {
        instagramAccount = await SocialAccount.findOne({
          ownerId,
          platform: 'meta_instagram',
          platformAccountId: metaAccountInfo.instagramBusinessId
        });
        
        if (instagramAccount) {
          // Update existing account
          instagramAccount.accessTokenRef = instagramTokenStored._id;
          instagramAccount.tokenExpiresAt = new Date(Date.now() + longTokenData.expires_in * 1000);
          instagramAccount.isActive = true;
          instagramAccount.isTokenValid = true;
          instagramAccount.requiresReauth = false;
          instagramAccount.platformUsername = metaAccountInfo.instagramUsername;
          instagramAccount.accountName = metaAccountInfo.instagramName;
          instagramAccount.profileImageUrl = metaAccountInfo.instagramProfilePicture;
          instagramAccount.platformSettings = {
            ...instagramAccount.platformSettings,
            pageId: metaAccountInfo.pageId,
            pageName: metaAccountInfo.pageName,
            instagramBusinessId: metaAccountInfo.instagramBusinessId
          };
          await instagramAccount.save();
          console.info('[Meta OAuth Backend] Instagram account updated');
        } else {
          // Create new account
          instagramAccount = new SocialAccount({
            ownerId,
            platform: 'meta_instagram',
            platformAccountId: metaAccountInfo.instagramBusinessId,
            platformUsername: metaAccountInfo.instagramUsername,
            accountName: metaAccountInfo.instagramName,
            profileUrl: `https://instagram.com/${metaAccountInfo.instagramUsername}`,
            profileImageUrl: metaAccountInfo.instagramProfilePicture,
            accessTokenRef: instagramTokenStored._id,
            tokenExpiresAt: new Date(Date.now() + longTokenData.expires_in * 1000),
            platformSettings: {
              pageId: metaAccountInfo.pageId,
              pageName: metaAccountInfo.pageName,
              instagramBusinessId: metaAccountInfo.instagramBusinessId
            },
            grantedScopes: ['pages_show_list'],
            connectedAt: new Date()
          });
          await instagramAccount.save();
          console.info('[Meta OAuth Backend] Instagram account created');
        }
        
        // Update token with account reference
        instagramTokenStored.accountRef = instagramAccount._id;
        await instagramTokenStored.save();
      }
      
      // STEP 7: Log successful connection
      await SocialAuditLog.logAction({
        actorId: ownerId,
        actorType: 'admin',
        action: 'connect_account',
        status: 'success',
        description: `Connected Meta accounts via backend-only OAuth: Facebook Page "${metaAccountInfo.pageName}"${metaAccountInfo.hasInstagram ? ` + Instagram @${metaAccountInfo.instagramUsername}` : ''}`,
        platform: 'meta_facebook'
      });
      
      console.info('[Meta OAuth Backend] CONNECTION COMPLETE', {
        facebookConnected: true,
        instagramConnected: metaAccountInfo.hasInstagram,
        pageId: metaAccountInfo.pageId,
        instagramBusinessId: metaAccountInfo.instagramBusinessId,
        connectedAt: facebookAccount.connectedAt,
        connectedBy: ownerId
      });
      
      // STEP 8: Return JSON response (NO frontend redirect)
      return res.status(200).json({
        success: true,
        platform: 'meta',
        connected: true,
        facebookConnected: true,
        instagramConnected: metaAccountInfo.hasInstagram,
        pageId: metaAccountInfo.pageId,
        pageName: metaAccountInfo.pageName,
        instagramBusinessId: metaAccountInfo.instagramBusinessId,
        instagramUsername: metaAccountInfo.instagramUsername,
        connectedAt: facebookAccount.connectedAt,
        message: `Successfully connected Meta accounts: Facebook Page "${metaAccountInfo.pageName}"${metaAccountInfo.hasInstagram ? ` + Instagram @${metaAccountInfo.instagramUsername}` : ''}`
      });
      
    } catch (connectError) {
      console.error('[Meta OAuth Backend] Connection failed:', {
        error: connectError.message,
        reason: connectError.reason,
        stack: connectError.stack
      });
      
      // Log failure
      await SocialAuditLog.logAction({
        actorId: ownerId,
        actorType: 'admin',
        action: 'connect_account',
        status: 'failure',
        description: `Failed to connect Meta account via backend OAuth: ${connectError.message}`,
        platform: 'meta_facebook',
        errorMessage: connectError.message
      });
      
      return res.status(500).json({
        success: false,
        platform: 'meta',
        connected: false,
        error: connectError.message,
        reason: connectError.reason || 'UNKNOWN'
      });
    }
    
  } catch (error) {
    console.error('[Meta OAuth Backend] Callback handler error:', {
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      success: false,
      platform: 'meta',
      connected: false,
      error: 'Internal server error during OAuth callback'
    });
  }
});

/**
 * GET /api/social/force-status
 * Get Meta (Facebook + Instagram) connection status
 * 
 * This endpoint provides a way to verify Meta OAuth connections via API
 * without requiring frontend access. Useful for:
 * - Verifying successful OAuth completion
 * - Checking connection status when frontend is unavailable
 * - Monitoring/debugging connection issues
 * 
 * NOTE: This route is public (no auth required) as it only returns
 * connection status without exposing sensitive data (tokens are never returned)
 * 
 * SECURITY: ownerId is restricted to 'admin' by default. In production,
 * this endpoint should require authentication if you need to check status
 * for different users.
 * 
 * RESPONSE FORMAT:
 * {
 *   success: true,
 *   facebookConnected: boolean,
 *   instagramConnected: boolean,
 *   pageId: string | null,
 *   pageName: string | null,
 *   instagramBusinessId: string | null,
 *   instagramUsername: string | null,
 *   connectedAt: date | null,
 *   isTokenValid: boolean
 * }
 */
router.get('/force-status', async (req, res) => {
  try {
    // SECURITY: Only allow checking status for 'admin' owner
    // To support multiple users, add authentication and use req.user.id
    let ownerId = 'admin';
    
    // Only allow override in development mode for testing
    if (process.env.NODE_ENV !== 'production' && req.query.ownerId) {
      // Validate ownerId format (alphanumeric and underscore only)
      if (/^[a-zA-Z0-9_-]+$/.test(req.query.ownerId)) {
        ownerId = req.query.ownerId;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid ownerId format'
        });
      }
    }
    
    console.info('[Meta Force Status] Checking connection status for ownerId:', ownerId);
    
    // Find Facebook Page account
    const facebookAccount = await SocialAccount.findOne({
      ownerId,
      platform: 'meta_facebook',
      isActive: true
    }).sort({ connectedAt: -1 }); // Get most recent
    
    // Find Instagram account
    const instagramAccount = await SocialAccount.findOne({
      ownerId,
      platform: 'meta_instagram',
      isActive: true
    }).sort({ connectedAt: -1 }); // Get most recent
    
    // Build response with explicit null checks for better readability
    const pageId = facebookAccount?.platformSettings?.pageId || null;
    const pageName = facebookAccount?.platformSettings?.pageName || facebookAccount?.accountName || null;
    const instagramBusinessId = instagramAccount?.platformSettings?.instagramBusinessId || instagramAccount?.platformAccountId || null;
    const instagramUsername = instagramAccount?.platformUsername || null;
    const connectedAt = facebookAccount?.connectedAt || instagramAccount?.connectedAt || null;
    const isTokenValid = (facebookAccount?.isTokenValid || instagramAccount?.isTokenValid) || false;
    const tokenExpiresAt = facebookAccount?.tokenExpiresAt || instagramAccount?.tokenExpiresAt || null;
    
    const response = {
      success: true,
      facebookConnected: !!facebookAccount,
      instagramConnected: !!instagramAccount,
      pageId,
      pageName,
      instagramBusinessId,
      instagramUsername,
      connectedAt,
      isTokenValid,
      tokenExpiresAt
    };
    
    console.info('[Meta Force Status] Status check complete:', {
      facebookConnected: response.facebookConnected,
      instagramConnected: response.instagramConnected,
      pageId: response.pageId,
      instagramBusinessId: response.instagramBusinessId
    });
    
    res.json(response);
    
  } catch (error) {
    console.error('[Meta Force Status] Error checking status:', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to check connection status',
      message: error.message
    });
  }
});

// ==================== ADMIN AUTHENTICATION REQUIRED ====================
// All routes below this point require admin authentication
router.use(requireAuth);
router.use((req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      error: 'Forbidden - Admin access required' 
    });
  }
  next();
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

// ==================== Test Posting & Scheduler Control ====================

/**
 * POST /api/social/post/test
 * Send a test post to Instagram (and Facebook if supported)
 * Uses stored Meta credentials without relying on UI or scheduling
 * 
 * Requirements:
 * - Admin authentication required
 * - Meta must be connected (checks DB)
 * - Posts hardcoded test message
 * - Returns structured response
 */
router.post('/post/test', requireAuth, async (req, res) => {
  const requestId = Date.now().toString(36);
  
  console.log('[Social Post] Attempt', {
    requestId,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  try {
    const ownerId = req.user?.id || 'admin';

    // Find active Instagram account
    const instagramAccount = await SocialAccount.findOne({
      ownerId,
      platform: 'meta_instagram',
      isActive: true,
      isTokenValid: true
    }).sort({ connectedAt: -1 });

    if (!instagramAccount) {
      console.warn('[Social Post] No active Instagram account found');
      return res.status(400).json({
        success: false,
        error: 'No active Instagram account found',
        message: 'Connect Instagram via Meta OAuth first',
        requestId
      });
    }

    // Verify token is not expired
    if (instagramAccount.tokenExpiresAt && new Date(instagramAccount.tokenExpiresAt) < new Date()) {
      console.warn('[Social Post] Instagram token expired');
      return res.status(400).json({
        success: false,
        error: 'Instagram token expired',
        message: 'Re-authenticate via Meta OAuth',
        requestId
      });
    }

    // Get decrypted access token
    const accessToken = await tokenEncryption.retrieveToken(instagramAccount.accessTokenRef);

    if (!accessToken) {
      console.warn('[Social Post] Token not found');
      return res.status(400).json({
        success: false,
        error: 'Access token unavailable',
        message: 'Re-authenticate via Meta OAuth',
        requestId
      });
    }

    // Post to Instagram using adapter
    const metaAdapter = require('../posting/metaAdapter');
    
    const testCaption = "Fixlo test post — automated social system is live 🚀";
    const testImageUrl = "https://fixloapp.com/fixlo-logo.png";
    
    console.log('[Social Post] Posting to Instagram...', {
      username: instagramAccount.platformUsername,
      requestId
    });

    const result = await metaAdapter.publishInstagram({
      account: instagramAccount,
      content: testCaption,
      mediaUrls: [testImageUrl],
      accessToken
    });

    console.log('[Social Post] Success', {
      postId: result.platformPostId,
      platform: 'instagram',
      requestId
    });

    // Log action
    await SocialAuditLog.logAction({
      actorId: ownerId,
      actorType: 'admin',
      action: 'test_post',
      status: 'success',
      description: 'Published test post to Instagram',
      accountId: instagramAccount._id,
      platform: 'meta_instagram'
    });

    return res.status(200).json({
      success: true,
      message: 'Test post published successfully',
      platform: 'instagram',
      account: instagramAccount.platformUsername,
      postId: result.platformPostId,
      postUrl: result.platformPostUrl,
      caption: testCaption,
      requestId
    });

  } catch (error) {
    console.error('[Social Post] Failure', {
      error: error.message,
      requestId
    });

    // Log failure
    try {
      await SocialAuditLog.logAction({
        actorId: req.user?.id || 'admin',
        actorType: 'admin',
        action: 'test_post',
        status: 'failure',
        description: 'Failed to publish test post',
        platform: 'meta_instagram',
        errorMessage: error.message
      });
    } catch (logError) {
      console.error('[Social Post] Failed to log failure:', logError.message);
    }

    let errorMessage = 'Failed to publish test post';
    let statusCode = 500;

    if (error.message.includes('Instagram publish failed')) {
      errorMessage = error.message;
      statusCode = 400;
    }

    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error.message,
      requestId
    });
  }
});

/**
 * POST /api/social/scheduler/start
 * Start the social media scheduler
 * 
 * Requirements:
 * - Admin authentication required
 * - Verifies Meta is connected
 * - Starts cron jobs
 * - Safe to call multiple times
 */
router.post('/scheduler/start', requireAuth, async (req, res) => {
  const requestId = Date.now().toString(36);
  
  console.log('[scheduler-start] Request received', {
    requestId,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  try {
    const ownerId = req.user?.id || 'admin';

    // Check if scheduler is already running
    const schedulerStatus = scheduler.getStatus();
    
    if (schedulerStatus.isRunning) {
      console.log('[scheduler-start] Already running');
      return res.status(200).json({
        success: true,
        message: 'Scheduler already running',
        status: schedulerStatus,
        requestId
      });
    }

    // Check Meta connection
    const metaAccounts = await SocialAccount.find({
      ownerId,
      platform: { $in: ['meta_instagram', 'meta_facebook'] },
      isActive: true,
      isTokenValid: true
    });

    if (metaAccounts.length === 0) {
      console.warn('[scheduler-start] Meta not connected');
      return res.status(400).json({
        success: false,
        error: 'Meta accounts not connected',
        message: 'Connect Instagram or Facebook via Meta OAuth before starting scheduler',
        requestId
      });
    }

    // Start scheduler
    scheduler.start();
    
    console.log('[scheduler-start] Started successfully');

    // Log action
    await SocialAuditLog.logAction({
      actorId: ownerId,
      actorType: 'admin',
      action: 'scheduler_start',
      status: 'success',
      description: 'Started social media scheduler'
    });

    return res.status(200).json({
      success: true,
      message: 'Scheduler started successfully',
      status: scheduler.getStatus(),
      metaAccounts: {
        instagram: metaAccounts.some(a => a.platform === 'meta_instagram'),
        facebook: metaAccounts.some(a => a.platform === 'meta_facebook')
      },
      manualApprovalMode: true,
      requestId
    });

  } catch (error) {
    console.error('[scheduler-start] Error:', error.message);

    // Log failure
    try {
      await SocialAuditLog.logAction({
        actorId: req.user?.id || 'admin',
        actorType: 'admin',
        action: 'scheduler_start',
        status: 'failure',
        description: 'Failed to start scheduler',
        errorMessage: error.message
      });
    } catch (logError) {
      console.error('[scheduler-start] Failed to log failure:', logError.message);
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to start scheduler',
      details: error.message,
      requestId
    });
  }
});

/**
 * GET /api/social/scheduler/status
 * Get scheduler status
 * 
 * No authentication required (read-only)
 */
router.get('/scheduler/status', async (req, res) => {
  const requestId = Date.now().toString(36);

  try {
    const ownerId = req.query.ownerId || req.user?.id || 'admin';

    // Get scheduler status
    const schedulerStatus = scheduler.getStatus();

    // Check Meta connection
    const metaAccounts = await SocialAccount.find({
      ownerId,
      platform: { $in: ['meta_instagram', 'meta_facebook'] },
      isActive: true
    }).lean();

    const validAccounts = metaAccounts.filter(a => a.isTokenValid);

    return res.status(200).json({
      success: true,
      scheduler: schedulerStatus,
      meta: {
        connected: validAccounts.length > 0,
        totalAccounts: metaAccounts.length,
        validAccounts: validAccounts.length,
        instagram: {
          connected: metaAccounts.some(a => a.platform === 'meta_instagram'),
          isValid: validAccounts.some(a => a.platform === 'meta_instagram')
        },
        facebook: {
          connected: metaAccounts.some(a => a.platform === 'meta_facebook'),
          isValid: validAccounts.some(a => a.platform === 'meta_facebook')
        }
      },
      timestamp: new Date().toISOString(),
      requestId
    });

  } catch (error) {
    console.error('[scheduler-status] Error:', error.message);

    return res.status(500).json({
      success: false,
      error: 'Failed to get scheduler status',
      details: error.message,
      requestId
    });
  }
});

module.exports = router;
