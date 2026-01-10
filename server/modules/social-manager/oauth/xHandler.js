const axios = require('axios');
const { SocialAccount } = require('../models');
const { tokenEncryption } = require('../security');
const { SocialAuditLog } = require('../models');

/**
 * X (Twitter) API OAuth Handler
 * 
 * TODO: Before production:
 * 1. Apply for X API access at https://developer.twitter.com/
 * 2. Upgrade to paid tier (Basic, Pro, or Enterprise)
 * 3. Create an app and enable OAuth 2.0
 * 4. Request write permissions
 * 5. Configure OAuth callback URL
 * 6. Obtain Client ID and Client Secret
 * 
 * SECURITY NOTES:
 * - Uses OAuth 2.0 with PKCE
 * - Tokens expire after 2 hours
 * - Refresh tokens valid for 6 months
 */

class XOAuthHandler {
  constructor() {
    this.clientId = process.env.SOCIAL_X_CLIENT_ID;
    this.clientSecret = process.env.SOCIAL_X_CLIENT_SECRET;
    this.redirectUri = process.env.SOCIAL_X_REDIRECT_URI ||
                       `${process.env.CLIENT_URL}/api/social/oauth/x/callback`;
    
    this.authUrl = 'https://twitter.com/i/oauth2/authorize';
    this.tokenUrl = 'https://api.twitter.com/2/oauth2/token';
    this.apiUrl = 'https://api.twitter.com/2';
  }
  
  isConfigured() {
    return !!(this.clientId && this.clientSecret);
  }
  
  getAuthorizationUrl(ownerId) {
    if (!this.isConfigured()) {
      throw new Error('X OAuth not configured');
    }
    
    const scopes = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'];
    const state = JSON.stringify({ ownerId });
    
    // Generate PKCE challenge (in production, store code_verifier for token exchange)
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes.join(' '),
      response_type: 'code',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });
    
    return {
      url: `${this.authUrl}?${params.toString()}`,
      codeVerifier // Store this temporarily for token exchange
    };
  }
  
  generateCodeVerifier() {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('base64url');
  }
  
  generateCodeChallenge(verifier) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }
  
  async exchangeCodeForToken(code, codeVerifier) {
    try {
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post(this.tokenUrl, new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        code_verifier: codeVerifier
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        }
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`X token exchange failed: ${error.response?.data?.error_description || error.message}`);
    }
  }
  
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get(`${this.apiUrl}/users/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          'user.fields': 'id,name,username,profile_image_url'
        }
      });
      
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to get X user info: ${error.response?.data?.detail || error.message}`);
    }
  }
  
  async connect(params) {
    const { code, codeVerifier, ownerId } = params;
    
    try {
      const tokenData = await this.exchangeCodeForToken(code, codeVerifier);
      const userInfo = await this.getUserInfo(tokenData.access_token);
      
      const accessToken = await tokenEncryption.storeToken({
        tokenValue: tokenData.access_token,
        tokenType: 'access',
        accountRef: null,
        platform: 'x',
        expiresIn: tokenData.expires_in || 7200
      });
      
      const refreshToken = await tokenEncryption.storeToken({
        tokenValue: tokenData.refresh_token,
        tokenType: 'refresh',
        accountRef: null,
        platform: 'x',
        expiresIn: 15552000 // 6 months
      });
      
      const socialAccount = new SocialAccount({
        ownerId,
        platform: 'x',
        platformAccountId: userInfo.id,
        platformUsername: userInfo.username,
        accountName: userInfo.name,
        profileUrl: `https://twitter.com/${userInfo.username}`,
        profileImageUrl: userInfo.profile_image_url,
        accessTokenRef: accessToken._id,
        refreshTokenRef: refreshToken._id,
        tokenExpiresAt: new Date(Date.now() + (tokenData.expires_in || 7200) * 1000),
        grantedScopes: ['tweet.read', 'tweet.write', 'users.read']
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
        description: `Connected X account: @${userInfo.username}`,
        accountId: socialAccount._id,
        platform: 'x'
      });
      
      return socialAccount;
    } catch (error) {
      await SocialAuditLog.logAction({
        actorId: ownerId,
        actorType: 'admin',
        action: 'connect_account',
        status: 'failure',
        description: 'Failed to connect X account',
        platform: 'x',
        errorMessage: error.message
      });
      throw error;
    }
  }
  
  async refreshToken(account) {
    try {
      const refreshTokenValue = await tokenEncryption.retrieveToken(account.refreshTokenRef);
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post(this.tokenUrl, new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshTokenValue,
        client_id: this.clientId
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        }
      });
      
      const tokenData = response.data;
      
      const newAccessToken = await tokenEncryption.rotateToken({
        oldTokenId: account.accessTokenRef,
        newTokenValue: tokenData.access_token,
        expiresIn: tokenData.expires_in || 7200
      });
      
      const newRefreshToken = await tokenEncryption.rotateToken({
        oldTokenId: account.refreshTokenRef,
        newTokenValue: tokenData.refresh_token,
        expiresIn: 15552000
      });
      
      account.accessTokenRef = newAccessToken._id;
      account.refreshTokenRef = newRefreshToken._id;
      await account.updateTokenExpiration(tokenData.expires_in || 7200);
      
      await SocialAuditLog.logAction({
        actorId: account.ownerId,
        actorType: 'system',
        action: 'refresh_token',
        status: 'success',
        description: 'Refreshed X token',
        accountId: account._id,
        platform: 'x'
      });
      
      return account;
    } catch (error) {
      await account.markTokenInvalid(`Token refresh failed: ${error.message}`);
      throw error;
    }
  }
  
  async revoke(account) {
    try {
      // Revoke refresh token with X API
      if (account.refreshTokenRef) {
        const refreshTokenValue = await tokenEncryption.retrieveToken(account.refreshTokenRef);
        const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
        
        await axios.post('https://api.twitter.com/2/oauth2/revoke', new URLSearchParams({
          token: refreshTokenValue,
          token_type_hint: 'refresh_token',
          client_id: this.clientId
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
          }
        }).catch(() => {}); // Ignore errors
        
        await tokenEncryption.revokeToken(account.refreshTokenRef, 'User disconnected');
      }
      
      if (account.accessTokenRef) {
        await tokenEncryption.revokeToken(account.accessTokenRef, 'User disconnected');
      }
      
      await account.disconnect();
      
      await SocialAuditLog.logAction({
        actorId: account.ownerId,
        actorType: 'admin',
        action: 'disconnect_account',
        status: 'success',
        description: 'Disconnected X account',
        accountId: account._id,
        platform: 'x'
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new XOAuthHandler();
