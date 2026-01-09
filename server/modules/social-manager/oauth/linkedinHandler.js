const axios = require('axios');
const { SocialAccount } = require('../models');
const { tokenEncryption } = require('../security');
const { SocialAuditLog } = require('../models');

/**
 * LinkedIn Company Pages OAuth Handler
 * 
 * TODO: Before production:
 * 1. Create LinkedIn App at https://www.linkedin.com/developers/apps
 * 2. Enable "Sign In with LinkedIn" and "Share on LinkedIn" products
 * 3. Request permissions: w_member_social, r_organization_social
 * 4. Add OAuth redirect URL
 * 5. Get verified for Organization permissions
 * 6. Obtain Client ID and Client Secret
 * 
 * SECURITY NOTES:
 * - Uses OAuth 2.0 authorization code flow
 * - Tokens expire after 60 days
 * - No refresh tokens (must re-authorize)
 */

class LinkedInOAuthHandler {
  constructor() {
    this.clientId = process.env.SOCIAL_LINKEDIN_CLIENT_ID;
    this.clientSecret = process.env.SOCIAL_LINKEDIN_CLIENT_SECRET;
    this.redirectUri = process.env.SOCIAL_LINKEDIN_REDIRECT_URI ||
                       `${process.env.CLIENT_URL}/api/social/oauth/linkedin/callback`;
    
    this.authUrl = 'https://www.linkedin.com/oauth/v2/authorization';
    this.tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
    this.apiUrl = 'https://api.linkedin.com/v2';
  }
  
  isConfigured() {
    return !!(this.clientId && this.clientSecret);
  }
  
  getAuthorizationUrl(ownerId) {
    if (!this.isConfigured()) {
      throw new Error('LinkedIn OAuth not configured');
    }
    
    const scopes = ['w_member_social', 'r_organization_social', 'r_basicprofile'];
    const state = JSON.stringify({ ownerId });
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes.join(' '),
      response_type: 'code',
      state
    });
    
    return `${this.authUrl}?${params.toString()}`;
  }
  
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post(this.tokenUrl, new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      return response.data; // { access_token, expires_in }
    } catch (error) {
      throw new Error(`LinkedIn token exchange failed: ${error.response?.data?.error_description || error.message}`);
    }
  }
  
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get(`${this.apiUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get LinkedIn user info: ${error.response?.data?.message || error.message}`);
    }
  }
  
  async getOrganizations(accessToken) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/organizationAcls?q=roleAssignee&projection=(elements*(organization~(localizedName,vanityName,logoV2)))`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      if (!response.data.elements || response.data.elements.length === 0) {
        throw new Error('No LinkedIn Company Pages found. Please ensure you are an admin of at least one Company Page.');
      }
      
      // Return first organization with admin access
      const org = response.data.elements[0]['organization~'];
      return {
        id: response.data.elements[0].organization,
        name: org.localizedName,
        vanityName: org.vanityName,
        logoUrl: org.logoV2?.original || null
      };
    } catch (error) {
      throw new Error(`Failed to get LinkedIn organizations: ${error.response?.data?.message || error.message}`);
    }
  }
  
  async connect(params) {
    const { code, ownerId } = params;
    
    try {
      const tokenData = await this.exchangeCodeForToken(code);
      const userInfo = await this.getUserInfo(tokenData.access_token);
      const orgInfo = await this.getOrganizations(tokenData.access_token);
      
      const accessToken = await tokenEncryption.storeToken({
        tokenValue: tokenData.access_token,
        tokenType: 'access',
        accountRef: null,
        platform: 'linkedin',
        expiresIn: tokenData.expires_in || 5184000 // 60 days default
      });
      
      const socialAccount = new SocialAccount({
        ownerId,
        platform: 'linkedin',
        platformAccountId: orgInfo.id,
        platformUsername: orgInfo.vanityName,
        accountName: orgInfo.name,
        profileUrl: `https://linkedin.com/company/${orgInfo.vanityName}`,
        profileImageUrl: orgInfo.logoUrl,
        accessTokenRef: accessToken._id,
        tokenExpiresAt: new Date(Date.now() + (tokenData.expires_in || 5184000) * 1000),
        platformSettings: {
          adminUserId: userInfo.id,
          adminName: `${userInfo.localizedFirstName} ${userInfo.localizedLastName}`
        },
        grantedScopes: ['w_member_social', 'r_organization_social']
      });
      
      await socialAccount.save();
      
      accessToken.accountRef = socialAccount._id;
      await accessToken.save();
      
      await SocialAuditLog.logAction({
        actorId: ownerId,
        actorType: 'admin',
        action: 'connect_account',
        status: 'success',
        description: `Connected LinkedIn Company Page: ${orgInfo.name}`,
        accountId: socialAccount._id,
        platform: 'linkedin'
      });
      
      return socialAccount;
    } catch (error) {
      await SocialAuditLog.logAction({
        actorId: ownerId,
        actorType: 'admin',
        action: 'connect_account',
        status: 'failure',
        description: 'Failed to connect LinkedIn account',
        platform: 'linkedin',
        errorMessage: error.message
      });
      throw error;
    }
  }
  
  async refreshToken(account) {
    // LinkedIn doesn't support refresh tokens
    // When token expires, user must re-authorize
    await account.markTokenInvalid('LinkedIn token expired - re-authorization required');
    
    await SocialAuditLog.logAction({
      actorId: account.ownerId,
      actorType: 'system',
      action: 'reauth_required',
      status: 'warning',
      description: 'LinkedIn token expired - user must re-authorize',
      accountId: account._id,
      platform: 'linkedin'
    });
    
    throw new Error('LinkedIn token expired. Please re-authorize the connection.');
  }
  
  async revoke(account) {
    try {
      if (account.accessTokenRef) {
        await tokenEncryption.revokeToken(account.accessTokenRef, 'User disconnected');
      }
      
      await account.disconnect();
      
      await SocialAuditLog.logAction({
        actorId: account.ownerId,
        actorType: 'admin',
        action: 'disconnect_account',
        status: 'success',
        description: 'Disconnected LinkedIn account',
        accountId: account._id,
        platform: 'linkedin'
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new LinkedInOAuthHandler();
