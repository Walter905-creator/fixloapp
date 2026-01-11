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
 * 3. Submit app for review with required permissions:
 *    - pages_show_list
 *    - pages_read_engagement
 *    Note: Instagram permissions are NOT requested in OAuth URL
 * 4. Configure OAuth redirect URI in app settings
 * 5. Obtain App ID and App Secret
 * 
 * SECURITY NOTES:
 * - Uses OAuth 2.0 with authorization code flow
 * - Tokens are long-lived (60 days) and auto-refresh
 * - NEVER stores user passwords
 */

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
   * @param {string} accountType - 'instagram' or 'facebook'
   * @returns {string} - Authorization URL
   * 
   * IMPORTANT: Facebook Login does NOT support instagram_* scopes.
   * Instagram access is derived from the connected Facebook Page.
   * Only request Facebook Page permissions in the OAuth URL.
   */
  getAuthorizationUrl(ownerId, accountType = 'instagram') {
    if (!this.isConfigured()) {
      throw new Error('Meta OAuth not configured. Set SOCIAL_META_CLIENT_ID and SOCIAL_META_CLIENT_SECRET');
    }
    
    // Use ONLY Facebook Page permissions (Instagram access comes from connected Page)
    // Do NOT include instagram_basic or instagram_content_publish - they are invalid for Facebook Login
    const scopes = ['pages_show_list', 'pages_read_engagement'];
    
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
      
      throw new Error('No Instagram Business Account found. Please connect an Instagram Business Account to your Facebook Page.');
    } catch (error) {
      throw new Error(`Failed to get Instagram account: ${error.response?.data?.error?.message || error.message}`);
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
          throw new Error('No Facebook Pages found. Please create or connect a Facebook Page.');
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
    
    try {
      // Step 1: Exchange code for short-lived token
      const shortTokenData = await this.exchangeCodeForToken(code);
      
      // Step 2: Exchange for long-lived token
      const longTokenData = await this.getLongLivedToken(shortTokenData.access_token);
      
      // Step 3: Get account details
      let accountInfo;
      let platform;
      
      if (accountType === 'instagram') {
        accountInfo = await this.getInstagramAccount(longTokenData.access_token);
        platform = 'meta_instagram';
      } else {
        accountInfo = await this.getFacebookPage(longTokenData.access_token);
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
        grantedScopes: ['pages_show_list', 'pages_read_engagement']
      });
      
      await socialAccount.save();
      
      // Update token with account reference
      storedToken.accountRef = socialAccount._id;
      await storedToken.save();
      
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
      
      return socialAccount;
    } catch (error) {
      // Log failure
      await SocialAuditLog.logAction({
        actorId: ownerId,
        actorType: 'admin',
        action: 'connect_account',
        status: 'failure',
        description: `Failed to connect Meta account`,
        platform: accountType === 'instagram' ? 'meta_instagram' : 'meta_facebook',
        errorMessage: error.message
      });
      
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
}

module.exports = new MetaOAuthHandler();
