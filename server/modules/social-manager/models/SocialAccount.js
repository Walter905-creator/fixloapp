const mongoose = require('mongoose');

/**
 * Social Account Model
 * Stores platform connections and account metadata
 * NEVER stores passwords - only OAuth tokens (encrypted separately)
 */
const socialAccountSchema = new mongoose.Schema({
  // Account owner (links to Fixlo admin/org)
  ownerId: {
    type: String,
    required: true,
    index: true,
    comment: 'Admin user or organization ID'
  },
  
  // Platform identification
  platform: {
    type: String,
    required: true,
    enum: ['meta_instagram', 'meta_facebook', 'tiktok', 'x', 'linkedin'],
    index: true
  },
  
  platformAccountId: {
    type: String,
    required: true,
    comment: 'Platform-specific account ID (e.g., Instagram Business Account ID)'
  },
  
  platformUsername: {
    type: String,
    comment: 'Display username/handle for reference'
  },
  
  // Account metadata
  accountName: {
    type: String,
    comment: 'Display name or page name'
  },
  
  profileUrl: {
    type: String,
    comment: 'Public profile URL'
  },
  
  profileImageUrl: {
    type: String,
    comment: 'Profile picture URL'
  },
  
  // Connection status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  isTokenValid: {
    type: Boolean,
    default: true,
    index: true,
    comment: 'Set to false when token refresh fails'
  },
  
  // Token references (actual tokens stored encrypted in EncryptedToken model)
  accessTokenRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EncryptedToken',
    comment: 'Reference to encrypted access token'
  },
  
  refreshTokenRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EncryptedToken',
    comment: 'Reference to encrypted refresh token'
  },
  
  // Token expiration tracking
  tokenExpiresAt: {
    type: Date,
    index: true,
    comment: 'Access token expiration time'
  },
  
  refreshTokenExpiresAt: {
    type: Date,
    comment: 'Refresh token expiration (if applicable)'
  },
  
  // Platform-specific settings
  platformSettings: {
    type: mongoose.Schema.Types.Mixed,
    comment: 'Platform-specific configuration (e.g., posting preferences)'
  },
  
  // Scopes granted
  grantedScopes: [{
    type: String,
    comment: 'OAuth scopes granted by user'
  }],
  
  // Last activity tracking
  lastPostAt: {
    type: Date,
    comment: 'Last successful post timestamp'
  },
  
  lastTokenRefreshAt: {
    type: Date,
    comment: 'Last token refresh timestamp'
  },
  
  // Re-auth alerts
  requiresReauth: {
    type: Boolean,
    default: false,
    index: true,
    comment: 'Flag when user needs to re-authorize'
  },
  
  reauthReason: {
    type: String,
    comment: 'Reason for requiring re-authentication'
  },
  
  // Timestamps
  connectedAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  
  disconnectedAt: {
    type: Date,
    comment: 'When user disconnected the account'
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
socialAccountSchema.index({ ownerId: 1, platform: 1 });
socialAccountSchema.index({ platform: 1, isActive: 1 });
socialAccountSchema.index({ isActive: 1, isTokenValid: 1 });
socialAccountSchema.index({ tokenExpiresAt: 1 }, { sparse: true });

// Methods
socialAccountSchema.methods.markTokenInvalid = function(reason) {
  this.isTokenValid = false;
  this.requiresReauth = true;
  this.reauthReason = reason;
  return this.save();
};

socialAccountSchema.methods.updateTokenExpiration = function(expiresIn) {
  this.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
  this.lastTokenRefreshAt = new Date();
  this.isTokenValid = true;
  return this.save();
};

socialAccountSchema.methods.disconnect = function() {
  this.isActive = false;
  this.disconnectedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('SocialAccount', socialAccountSchema);
