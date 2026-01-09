const axios = require('axios');
const { SocialAccount } = require('../models');
const { tokenEncryption } = require('../security');
const { SocialAuditLog } = require('../models');

/**
 * TikTok Business OAuth Handler
 * 
 * TODO: Before production:
 * 1. Register at https://developers.tiktok.com/
 * 2. Create a TikTok for Business app
 * 3. Request permissions: user.info.basic, video.list, video.upload
 * 4. Submit app for review
 * 5. Configure OAuth redirect URI
 * 6. Obtain Client Key and Client Secret
 * 
 * SECURITY NOTES:
 * - Uses OAuth 2.0 authorization code flow
 * - Tokens expire after 24 hours, requires refresh
 * - Refresh tokens valid for 1 year
 */

class TikTokOAuthHandler {
  constructor() {
    this.clientKey = process.env.SOCIAL_TIKTOK_CLIENT_ID;
    this.clientSecret = process.env.SOCIAL_TIKTOK_CLIENT_SECRET;
    this.redirectUri = process.env.SOCIAL_TIKTOK_REDIRECT_URI ||
                       `${process.env.CLIENT_URL}/api/social/oauth/tiktok/callback`;
    
    this.authUrl = 'https://www.tiktok.com/v2/auth/authorize';
    this.tokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/';
    this.apiUrl = 'https://open.tiktokapis.com/v2';
  }
  
  isConfigured() {
    return !!(this.clientKey && this.clientSecret);
  }
  
  getAuthorizationUrl(ownerId) {
    if (!this.isConfigured()) {
      throw new Error('TikTok OAuth not configured');
    }
    
    const scopes = ['user.info.basic', 'video.list', 'video.upload'];
    const state = JSON.stringify({ ownerId });
    
    const params = new URLSearchParams({
      client_key: this.clientKey,
      redirect_uri: this.redirectUri,
      scope: scopes.join(','),
      response_type: 'code',
      state
    });
    
    return `${this.authUrl}?${params.toString()}`;
  }
  
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post(this.tokenUrl, {
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri
      }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      return response.data; // { access_token, refresh_token, expires_in, refresh_expires_in }
    } catch (error) {
      throw new Error(`TikTok token exchange failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get(`${this.apiUrl}/user/info/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          fields: 'open_id,username,display_name,avatar_url'
        }
      });
      
      return response.data.data.user;
    } catch (error) {
      throw new Error(`Failed to get TikTok user info: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  async connect(params) {
    const { code, ownerId } = params;
    
    try {
      const tokenData = await this.exchangeCodeForToken(code);
      const userInfo = await this.getUserInfo(tokenData.access_token);
      
      // Store access token
      const accessToken = await tokenEncryption.storeToken({
        tokenValue: tokenData.access_token,
        tokenType: 'access',
        accountRef: null,
        platform: 'tiktok',
        expiresIn: tokenData.expires_in
      });
      
      // Store refresh token
      const refreshToken = await tokenEncryption.storeToken({
        tokenValue: tokenData.refresh_token,
        tokenType: 'refresh',
        accountRef: null,
        platform: 'tiktok',
        expiresIn: tokenData.refresh_expires_in
      });
      
      const socialAccount = new SocialAccount({
        ownerId,
        platform: 'tiktok',
        platformAccountId: userInfo.open_id,
        platformUsername: userInfo.username,
        accountName: userInfo.display_name,
        profileUrl: `https://tiktok.com/@${userInfo.username}`,
        profileImageUrl: userInfo.avatar_url,
        accessTokenRef: accessToken._id,
        refreshTokenRef: refreshToken._id,
        tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        refreshTokenExpiresAt: new Date(Date.now() + tokenData.refresh_expires_in * 1000),
        grantedScopes: ['user.info.basic', 'video.list', 'video.upload']
      });
      
      await socialAccount.save();
      
      accessToken.accountRef = socialAccount._id;
      refreshToken.accountRef = socialAccount._id;
      await Promise.all([accessToken.save(), refreshToken.save()]);
      
      await SocialAuditLog.logAction({
        actorId: ownerId,
        actorType: 'admin',
        action: 'connect_account',
        status: 'success',
        description: `Connected TikTok account: ${userInfo.username}`,
        accountId: socialAccount._id,
        platform: 'tiktok'
      });
      
      return socialAccount;
    } catch (error) {
      await SocialAuditLog.logAction({
        actorId: ownerId,
        actorType: 'admin',
        action: 'connect_account',
        status: 'failure',
        description: 'Failed to connect TikTok account',
        platform: 'tiktok',
        errorMessage: error.message
      });
      throw error;
    }
  }
  
  async refreshToken(account) {
    try {
      const refreshTokenValue = await tokenEncryption.retrieveToken(account.refreshTokenRef);
      
      const response = await axios.post(this.tokenUrl, {
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshTokenValue
      });
      
      const tokenData = response.data;
      
      const newAccessToken = await tokenEncryption.rotateToken({
        oldTokenId: account.accessTokenRef,
        newTokenValue: tokenData.access_token,
        expiresIn: tokenData.expires_in
      });
      
      const newRefreshToken = await tokenEncryption.rotateToken({
        oldTokenId: account.refreshTokenRef,
        newTokenValue: tokenData.refresh_token,
        expiresIn: tokenData.refresh_expires_in
      });
      
      account.accessTokenRef = newAccessToken._id;
      account.refreshTokenRef = newRefreshToken._id;
      await account.updateTokenExpiration(tokenData.expires_in);
      
      await SocialAuditLog.logAction({
        actorId: account.ownerId,
        actorType: 'system',
        action: 'refresh_token',
        status: 'success',
        description: 'Refreshed TikTok token',
        accountId: account._id,
        platform: 'tiktok'
      });
      
      return account;
    } catch (error) {
      await account.markTokenInvalid(`Token refresh failed: ${error.message}`);
      throw error;
    }
  }
  
  async revoke(account) {
    try {
      if (account.accessTokenRef) {
        await tokenEncryption.revokeToken(account.accessTokenRef, 'User disconnected');
      }
      if (account.refreshTokenRef) {
        await tokenEncryption.revokeToken(account.refreshTokenRef, 'User disconnected');
      }
      
      await account.disconnect();
      
      await SocialAuditLog.logAction({
        actorId: account.ownerId,
        actorType: 'admin',
        action: 'disconnect_account',
        status: 'success',
        description: 'Disconnected TikTok account',
        accountId: account._id,
        platform: 'tiktok'
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new TikTokOAuthHandler();
