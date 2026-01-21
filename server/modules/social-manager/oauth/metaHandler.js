const axios = require('axios');
const { SocialAccount } = require('../models');
const { tokenEncryption } = require('../security');
const { SocialAuditLog } = require('../models');

/**
 * Meta OAuth Handler (Instagram + Facebook Pages)
 * 
 * OAUTH FLOW:
 * 1. Facebook Login requests ONLY Facebook Page permissions
 * 2. User selects a Facebook Page during OAuth
 * 3. Instagram Business Account is discovered from the connected Page
 * 4. Instagram publishing works via Instagram Graph API
 * 
 * TODO: Before production:
 * 1. Register app at https://developers.facebook.com/
 * 2. Add Instagram Graph API and Pages API permissions
 * 3. Request ONLY pages_show_list permission (no App Review needed)
 *    Note: pages_read_engagement requires Advanced Access/App Review
 *    Note: Instagram permissions are NOT requested in OAuth URL
 *    Note: Engagement data accessed later via Page access token
 * 4. Configure OAuth redirect URI in app settings
 * 5. Obtain App ID and App Secret
 * 
 * SECURITY NOTES:
 * - Uses OAuth 2.0 with authorization code flow
 * - Tokens are long-lived (60 days) and auto-refresh
 * - NEVER stores user passwords
 */

// Error reason constants
const ERROR_REASONS = {
  NO_PAGES: 'NO_PAGES',
  NO_PAGE_TOKEN: 'NO_PAGE_TOKEN',
  NO_IG_BUSINESS: 'NO_IG_BUSINESS',
  APP_NOT_LIVE: 'APP_NOT_LIVE',
  UNKNOWN: 'UNKNOWN'
};

// Error messages
const ERROR_MESSAGES = {
  [ERROR_REASONS.NO_PAGES]: 'No Facebook Pages found. Please create or connect a Facebook Page.',
  [ERROR_REASONS.NO_PAGE_TOKEN]: 'Page access token not available. The app may not be in Live mode or missing required permissions.',
  [ERROR_REASONS.NO_IG_BUSINESS]: 'No Instagram Business Account found. Please connect an Instagram Business Account to your Facebook Page.',
  [ERROR_REASONS.APP_NOT_LIVE]: 'App permissions error. Ensure your Meta app is approved and in Live mode.'
};

class MetaOAuthHandler {
  constructor() {
    this.clientId = process.env.SOCIAL_META_CLIENT_ID;
    this.clientSecret = process.env.SOCIAL_META_CLIENT_SECRET;
    this.redirectUri = process.env.SOCIAL_META_REDIRECT_URI || 
                       `${process.env.CLIENT_URL}/api/social/oauth/meta/callback`;
    
    // API endpoints
    this.authUrl = 'https://www.facebook.com/v18.0/dialog/oauth';
    this.tokenUrl = 'https://graph.facebook.com/v18.0/oauth/access_token';
    this.graphApiUrl = 'https://graph.facebook.com/v18.0';
    
    // Page selection preference (configurable via environment)
    // When multiple pages exist, prefer pages containing this string in their name
    this.preferredPageName = process.env.SOCIAL_META_PREFERRED_PAGE || 'fixlo';
    
    // Debug info storage
    this.lastOAuthAttempt = null;
  }
  
  /**
   * Check if Meta OAuth is configured
   */
  isConfigured() {
    return !!(this.clientId && this.clientSecret);
  }
  
  /**
   * Generate OAuth authorization URL
   * @param {string} ownerId - Admin/org ID initiating connection
   * @param {string} accountType - 'instagram' or 'facebook' (used for post-OAuth processing)
   * @returns {string} - Authorization URL
   * 
   * IMPORTANT: Facebook Login does NOT support instagram_* scopes.
   * Instagram access is derived from the connected Facebook Page.
   * Only request Facebook Page permissions in the OAuth URL.
   * 
   * NOTE: The accountType parameter doesn't affect OAuth scopes (both use the same
   * Facebook Page permissions). It's passed through state for post-OAuth processing
   * to determine which account type to retrieve and save.
   * 
   * SCOPE RESTRICTION: Only pages_show_list is used because pages_read_engagement
   * requires App Review/Advanced Access. Engagement data will be accessed later
   * using the Page access token after OAuth completion.
   */
  getAuthorizationUrl(ownerId, accountType = 'instagram') {
    if (!this.isConfigured()) {
      throw new Error('Meta OAuth not configured. Set SOCIAL_META_CLIENT_ID and SOCIAL_META_CLIENT_SECRET');
    }
    
    // Use ONLY pages_show_list (pages_read_engagement requires App Review/Advanced Access)
    // Engagement data will be accessed later using Page access token
    const scopes = ['pages_show_list'];
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes.join(','),
      response_type: 'code',
      state: JSON.stringify({ ownerId, accountType }) // Pass context through state
    });
    
    return `${this.authUrl}?${params.toString()}`;
  }
  
  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from callback
   * @returns {Promise<Object>} - Token data
   */
  async exchangeCodeForToken(code) {
    if (!this.isConfigured()) {
      throw new Error('Meta OAuth not configured');
    }
    
    try {
      const response = await axios.get(this.tokenUrl, {
        params: {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri,
          code
        }
      });
      
      return response.data; // { access_token, token_type, expires_in }
    } catch (error) {
      throw new Error(`Meta token exchange failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  /**
   * Exchange short-lived token for long-lived token
   * @param {string} shortLivedToken - Short-lived access token
   * @returns {Promise<Object>} - Long-lived token data
   */
  async getLongLivedToken(shortLivedToken) {
    try {
      const response = await axios.get(this.tokenUrl, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          fb_exchange_token: shortLivedToken
        }
      });
      
      return response.data; // { access_token, token_type, expires_in }
    } catch (error) {
      throw new Error(`Long-lived token exchange failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  /**
   * Get Instagram Business Account ID from Pages
   * @param {string} accessToken - User access token
   * @returns {Promise<Object>} - Instagram account info
   */
  async getInstagramAccount(accessToken) {
    try {
      // Get user's Facebook Pages
      const pagesResponse = await axios.get(`${this.graphApiUrl}/me/accounts`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,instagram_business_account'
        }
      });
      
      const pages = pagesResponse.data.data;
      
      // Check if any pages exist
      if (!pages || pages.length === 0) {
        throw new Error(ERROR_MESSAGES[ERROR_REASONS.NO_PAGES]);
      }
      
      // Find first page with Instagram Business Account
      for (const page of pages) {
        if (page.instagram_business_account) {
          // Get Instagram account details
          const igResponse = await axios.get(
            `${this.graphApiUrl}/${page.instagram_business_account.id}`,
            {
              params: {
                access_token: accessToken,
                fields: 'id,username,name,profile_picture_url'
              }
            }
          );
          
          return {
            ...igResponse.data,
            pageId: page.id,
            pageName: page.name
          };
        }
      }
      
      throw new Error(ERROR_MESSAGES[ERROR_REASONS.NO_IG_BUSINESS]);
    } catch (error) {
      // Preserve original error message if it's one of our constants
      if (Object.values(ERROR_MESSAGES).includes(error.message)) {
        throw error;
      }
      throw new Error(`Failed to get Instagram account: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  /**
   * Get complete Facebook Page and Instagram account information with access tokens
   * This is used for backend-only OAuth completion without frontend
   * @param {string} userAccessToken - Long-lived user access token
   * @returns {Promise<Object>} - Complete page and Instagram info with tokens
   */
  async getCompleteMetaAccountInfo(userAccessToken) {
    try {
      // Step 1: Get user's Facebook Pages with access tokens
      console.info('[Meta OAuth] Fetching Facebook Pages with access tokens...');
      const pagesResponse = await axios.get(`${this.graphApiUrl}/me/accounts`, {
        params: {
          access_token: userAccessToken,
          fields: 'id,name,access_token,instagram_business_account'
        }
      });
      
      const pages = pagesResponse.data.data;
      
      // Check if any pages exist
      if (!pages || pages.length === 0) {
        throw new Error(ERROR_MESSAGES[ERROR_REASONS.NO_PAGES]);
      }
      
      console.info('[Meta OAuth] Pages found:', {
        count: pages.length,
        pageNames: pages.map(p => p.name)
      });
      
      // Step 2: Select the appropriate page
      // Try to find preferred page first (configurable), otherwise use first page (or only page)
      let selectedPage = pages.find(p => 
        p.name && p.name.toLowerCase().includes(this.preferredPageName.toLowerCase())
      );
      
      if (!selectedPage) {
        selectedPage = pages[0];
        console.info(`[Meta OAuth] No '${this.preferredPageName}' page found, using first page:`, selectedPage.name);
      } else {
        console.info(`[Meta OAuth] Selected '${this.preferredPageName}' page:`, selectedPage.name);
      }
      
      // Verify Page has access token
      if (!selectedPage.access_token) {
        console.error('[Meta OAuth] Page access token not available - app may not be in Live mode');
        throw new Error(ERROR_MESSAGES[ERROR_REASONS.NO_PAGE_TOKEN]);
      }
      
      // Step 3: Get Instagram Business Account if linked
      let instagramInfo = null;
      
      if (selectedPage.instagram_business_account) {
        console.info('[Meta OAuth] Fetching Instagram Business Account details...');
        try {
          const igResponse = await axios.get(
            `${this.graphApiUrl}/${selectedPage.instagram_business_account.id}`,
            {
              params: {
                // Use Page access token for Instagram API calls
                access_token: selectedPage.access_token,
                fields: 'id,username,name,profile_picture_url'
              }
            }
          );
          
          instagramInfo = {
            instagramBusinessId: igResponse.data.id,
            instagramUsername: igResponse.data.username,
            instagramName: igResponse.data.name,
            instagramProfilePicture: igResponse.data.profile_picture_url,
            // Instagram uses the Page access token for API calls
            instagramAccessToken: selectedPage.access_token
          };
          
          console.info('[Meta OAuth] Instagram Business Account found:', {
            username: instagramInfo.instagramUsername,
            id: instagramInfo.instagramBusinessId
          });
        } catch (igError) {
          console.error('[Meta OAuth] Failed to fetch Instagram account details:', {
            error: igError.message,
            pageId: selectedPage.id
          });
          throw new Error(ERROR_MESSAGES[ERROR_REASONS.NO_IG_BUSINESS]);
        }
      } else {
        console.warn('[Meta OAuth] No Instagram Business Account linked to selected page');
      }
      
      // Step 4: Return complete information
      return {
        // Facebook Page info
        pageId: selectedPage.id,
        pageName: selectedPage.name,
        pageAccessToken: selectedPage.access_token,
        
        // Instagram info (may be null if not linked)
        ...instagramInfo,
        
        // Metadata
        hasInstagram: !!instagramInfo,
        selectedPageName: selectedPage.name,
        totalPagesAvailable: pages.length
      };
      
    } catch (error) {
      // Preserve original error message if it's one of our constants
      if (Object.values(ERROR_MESSAGES).includes(error.message)) {
        throw error;
      }
      throw new Error(`Failed to get Meta account info: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  /**
   * Get Facebook Page info
   * @param {string} accessToken - User access token
   * @param {string} pageId - Optional specific page ID
   * @returns {Promise<Object>} - Page info
   */
  async getFacebookPage(accessToken, pageId = null) {
    try {
      if (pageId) {
        // Get specific page
        const response = await axios.get(`${this.graphApiUrl}/${pageId}`, {
          params: {
            access_token: accessToken,
            fields: 'id,name,username,picture'
          }
        });
        return response.data;
      } else {
        // Get all pages
        const response = await axios.get(`${this.graphApiUrl}/me/accounts`, {
          params: {
            access_token: accessToken,
            fields: 'id,name,username,picture'
          }
        });
        
        if (!response.data.data || response.data.data.length === 0) {
          throw new Error(ERROR_MESSAGES[ERROR_REASONS.NO_PAGES]);
        }
        
        return response.data.data[0]; // Return first page
      }
    } catch (error) {
      throw new Error(`Failed to get Facebook page: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  /**
   * Connect a Meta account (Instagram or Facebook)
   * @param {Object} params - Connection parameters
   * @returns {Promise<SocialAccount>} - Created account
   */
  async connect(params) {
    const { code, ownerId, accountType } = params;
    
    // DIAGNOSTIC: Log OAuth callback received
    console.info('[Meta OAuth] Callback received', {
      accountType,
      ownerId,
      hasCode: !!code,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Step 1: Exchange code for short-lived token
      console.info('[Meta OAuth] Exchanging authorization code for access token...');
      const shortTokenData = await this.exchangeCodeForToken(code);
      console.info('[Meta OAuth] Access token exchange: SUCCESS', {
        hasToken: !!shortTokenData.access_token,
        expiresIn: shortTokenData.expires_in
      });
      
      // Step 2: Exchange for long-lived token
      console.info('[Meta OAuth] Exchanging for long-lived token...');
      const longTokenData = await this.getLongLivedToken(shortTokenData.access_token);
      console.info('[Meta OAuth] Long-lived token exchange: SUCCESS', {
        hasToken: !!longTokenData.access_token,
        expiresIn: longTokenData.expires_in
      });
      
      // Step 3: Get account details
      let accountInfo;
      let platform;
      
      if (accountType === 'instagram') {
        console.info('[Meta OAuth] Looking up Instagram Business Account via Pages API...');
        try {
          accountInfo = await this.getInstagramAccount(longTokenData.access_token);
          console.info('[Meta OAuth] Instagram Business Account lookup: SUCCESS', {
            hasUsername: !!accountInfo.username,
            // Only log identifiers in development
            ...(process.env.NODE_ENV !== 'production' && {
              instagramId: accountInfo.id,
              username: accountInfo.username,
              pageId: accountInfo.pageId
            })
          });
          platform = 'meta_instagram';
        } catch (error) {
          // Extract failure reason from error message
          const errorReason = error.message.includes(ERROR_MESSAGES[ERROR_REASONS.NO_PAGES])
            ? ERROR_REASONS.NO_PAGES
            : error.message.includes(ERROR_MESSAGES[ERROR_REASONS.NO_IG_BUSINESS])
            ? ERROR_REASONS.NO_IG_BUSINESS
            : error.response?.data?.error?.code === 190
            ? ERROR_REASONS.APP_NOT_LIVE
            : ERROR_REASONS.UNKNOWN;
          
          console.error('[Meta OAuth] Instagram account lookup failed:', {
            reason: errorReason,
            error: error.message,
            apiError: error.response?.data?.error
          });
          
          const structuredError = new Error(error.message);
          structuredError.reason = errorReason;
          throw structuredError;
        }
      } else {
        console.info('[Meta OAuth] Looking up Facebook Page...');
        accountInfo = await this.getFacebookPage(longTokenData.access_token);
        console.info('[Meta OAuth] Facebook Page lookup: SUCCESS', {
          pageId: accountInfo.id,
          pageName: accountInfo.name
        });
        platform = 'meta_facebook';
      }
      
      // Step 4: Store encrypted token
      const storedToken = await tokenEncryption.storeToken({
        tokenValue: longTokenData.access_token,
        tokenType: 'access',
        accountRef: null, // Will update after creating account
        platform,
        expiresIn: longTokenData.expires_in
      });
      
      // Step 5: Create social account
      const socialAccount = new SocialAccount({
        ownerId,
        platform,
        platformAccountId: accountInfo.id,
        platformUsername: accountInfo.username,
        accountName: accountInfo.name || accountInfo.username,
        profileUrl: accountType === 'instagram'
          ? `https://instagram.com/${accountInfo.username}`
          : `https://facebook.com/${accountInfo.id}`,
        profileImageUrl: accountInfo.profile_picture_url || accountInfo.picture?.data?.url,
        accessTokenRef: storedToken._id,
        tokenExpiresAt: new Date(Date.now() + longTokenData.expires_in * 1000),
        platformSettings: {
          pageId: accountInfo.pageId,
          pageName: accountInfo.pageName
        },
        grantedScopes: ['pages_show_list']
      });
      
      await socialAccount.save();
      
      // Update token with account reference
      storedToken.accountRef = socialAccount._id;
      await storedToken.save();
      
      console.info('[Meta OAuth] Final decision: CONNECTED', {
        accountId: socialAccount._id,
        platform: socialAccount.platform,
        username: socialAccount.platformUsername
      });
      
      // Log action
      await SocialAuditLog.logAction({
        actorId: ownerId,
        actorType: 'admin',
        action: 'connect_account',
        status: 'success',
        description: `Connected ${platform} account: ${accountInfo.username}`,
        accountId: socialAccount._id,
        platform
      });
      
      // Store debug info
      this.lastOAuthAttempt = {
        success: true,
        accountType,
        timestamp: new Date().toISOString()
      };
      
      return socialAccount;
    } catch (error) {
      // Use the reason from the error if available
      const failureReason = error.reason || ERROR_REASONS.UNKNOWN;
      
      console.error('[Meta OAuth] Connection failed:', {
        reason: failureReason,
        errorMessage: error.message,
        timestamp: new Date().toISOString()
      });
      
      // Store debug info
      this.lastOAuthAttempt = {
        success: false,
        reason: failureReason,
        accountType,
        errorMessage: error.message,
        timestamp: new Date().toISOString()
      };
      
      // Log failure
      await SocialAuditLog.logAction({
        actorId: ownerId,
        actorType: 'admin',
        action: 'connect_account',
        status: 'failure',
        description: `Failed to connect Meta account: ${failureReason}`,
        platform: accountType === 'instagram' ? 'meta_instagram' : 'meta_facebook',
        errorMessage: error.message
      });
      
      // Ensure error has reason attached
      if (!error.reason) {
        error.reason = failureReason;
      }
      throw error;
    }
  }
  
  /**
   * Refresh access token
   * @param {SocialAccount} account - Account to refresh
   * @returns {Promise<SocialAccount>} - Updated account
   */
  async refreshToken(account) {
    try {
      // Get current token
      const currentToken = await tokenEncryption.retrieveToken(account.accessTokenRef);
      
      // Get new long-lived token
      const newTokenData = await this.getLongLivedToken(currentToken);
      
      // Rotate token
      const newStoredToken = await tokenEncryption.rotateToken({
        oldTokenId: account.accessTokenRef,
        newTokenValue: newTokenData.access_token,
        expiresIn: newTokenData.expires_in
      });
      
      // Update account
      account.accessTokenRef = newStoredToken._id;
      await account.updateTokenExpiration(newTokenData.expires_in);
      
      // Log action
      await SocialAuditLog.logAction({
        actorId: account.ownerId,
        actorType: 'system',
        action: 'refresh_token',
        status: 'success',
        description: `Refreshed ${account.platform} token`,
        accountId: account._id,
        platform: account.platform
      });
      
      return account;
    } catch (error) {
      // Mark token as invalid
      await account.markTokenInvalid(`Token refresh failed: ${error.message}`);
      
      await SocialAuditLog.logAction({
        actorId: account.ownerId,
        actorType: 'system',
        action: 'refresh_token',
        status: 'failure',
        description: `Failed to refresh ${account.platform} token`,
        accountId: account._id,
        platform: account.platform,
        errorMessage: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Revoke access token
   * @param {SocialAccount} account - Account to revoke
   * @returns {Promise<void>}
   */
  async revoke(account) {
    try {
      // Revoke stored token
      if (account.accessTokenRef) {
        await tokenEncryption.revokeToken(account.accessTokenRef, 'User disconnected account');
      }
      
      // Disconnect account
      await account.disconnect();
      
      // Log action
      await SocialAuditLog.logAction({
        actorId: account.ownerId,
        actorType: 'admin',
        action: 'disconnect_account',
        status: 'success',
        description: `Disconnected ${account.platform} account`,
        accountId: account._id,
        platform: account.platform
      });
    } catch (error) {
      await SocialAuditLog.logAction({
        actorId: account.ownerId,
        actorType: 'admin',
        action: 'disconnect_account',
        status: 'failure',
        description: `Failed to disconnect ${account.platform} account`,
        accountId: account._id,
        platform: account.platform,
        errorMessage: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Get debug information about Meta OAuth state
   * @param {string} ownerId - Owner ID to check connection status
   * @returns {Promise<Object>} - Debug information
   */
  async getDebugInfo(ownerId) {
    try {
      // Check if app is configured
      const isConfigured = this.isConfigured();
      
      // Get connected accounts
      const accounts = await SocialAccount.find({
        ownerId,
        platform: { $in: ['meta_instagram', 'meta_facebook'] },
        isActive: true
      });
      
      // Determine app mode
      // Note: Meta app mode (development/live) is separate from Node.js environment
      // We can't detect actual Meta app mode without making an API call
      // This just reports the Node.js environment for context
      const nodeEnv = process.env.NODE_ENV || 'development';
      
      const debugInfo = {
        isConfigured,
        nodeEnv, // Renamed from appMode to be more accurate
        hasActiveInstagram: accounts.some(a => a.platform === 'meta_instagram'),
        hasActiveFacebook: accounts.some(a => a.platform === 'meta_facebook'),
        lastOAuthAttempt: this.lastOAuthAttempt || null,
        connectedAccounts: accounts.map(a => ({
          platform: a.platform,
          username: a.platformUsername,
          isTokenValid: a.isTokenValid,
          connectedAt: a.connectedAt
        }))
      };
      
      // Add additional diagnostic info if last attempt failed
      if (this.lastOAuthAttempt && !this.lastOAuthAttempt.success) {
        debugInfo.lastErrorReason = this.lastOAuthAttempt.reason;
        debugInfo.lastErrorTimestamp = this.lastOAuthAttempt.timestamp;
        
        // Provide helpful guidance based on error
        switch (this.lastOAuthAttempt.reason) {
          case 'NO_PAGES':
            debugInfo.helpText = 'No Facebook Pages found. Create a Facebook Business Page and try again.';
            break;
          case 'NO_PAGE_TOKEN':
            debugInfo.helpText = 'Page access token not available. Your app must be in Live mode on Meta for Developers.';
            break;
          case 'NO_IG_BUSINESS':
            debugInfo.helpText = 'No Instagram Business Account linked to your Facebook Page. Convert to Business Account in Instagram settings.';
            break;
          case 'APP_NOT_LIVE':
            debugInfo.helpText = 'App permissions error. Ensure your Meta app is approved and in Live mode.';
            break;
          default:
            debugInfo.helpText = 'Unknown error. Check server logs for details.';
        }
      }
      
      return debugInfo;
    } catch (error) {
      console.error('[Meta OAuth] Failed to get debug info:', error);
      return {
        error: 'Failed to retrieve debug information',
        message: error.message
      };
    }
  }
}

module.exports = new MetaOAuthHandler();
