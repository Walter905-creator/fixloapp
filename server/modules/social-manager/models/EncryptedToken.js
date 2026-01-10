const mongoose = require('mongoose');

/**
 * Encrypted Token Model
 * Stores OAuth tokens with AES-256 encryption
 * Referenced by SocialAccount but stored separately for security
 */
const encryptedTokenSchema = new mongoose.Schema({
  // Token type
  tokenType: {
    type: String,
    required: true,
    enum: ['access', 'refresh'],
    index: true
  },
  
  // Encrypted token data
  encryptedValue: {
    type: String,
    required: true,
    comment: 'AES-256 encrypted token value'
  },
  
  // Encryption metadata
  encryptionAlgorithm: {
    type: String,
    default: 'aes-256-gcm',
    immutable: true
  },
  
  iv: {
    type: String,
    required: true,
    comment: 'Initialization vector for decryption'
  },
  
  authTag: {
    type: String,
    required: true,
    comment: 'Authentication tag for AES-GCM'
  },
  
  // Associated account
  accountRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialAccount',
    required: true,
    index: true
  },
  
  // Platform for reference
  platform: {
    type: String,
    required: true,
    enum: ['meta_instagram', 'meta_facebook', 'tiktok', 'x', 'linkedin']
  },
  
  // Rotation tracking
  rotationCount: {
    type: Number,
    default: 0,
    comment: 'Number of times this token has been rotated'
  },
  
  previousTokenRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EncryptedToken',
    comment: 'Reference to previous token (for rotation history)'
  },
  
  // Expiration and invalidation
  expiresAt: {
    type: Date,
    index: true,
    comment: 'Token expiration time'
  },
  
  isValid: {
    type: Boolean,
    default: true,
    index: true
  },
  
  revokedAt: {
    type: Date,
    comment: 'When token was explicitly revoked'
  },
  
  revokedReason: {
    type: String,
    comment: 'Reason for revocation'
  },
  
  // Last usage tracking
  lastUsedAt: {
    type: Date,
    comment: 'Last time this token was used'
  },
  
  usageCount: {
    type: Number,
    default: 0,
    comment: 'Number of times token has been used'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
encryptedTokenSchema.index({ accountRef: 1, tokenType: 1 });
encryptedTokenSchema.index({ isValid: 1, expiresAt: 1 });
encryptedTokenSchema.index({ platform: 1, isValid: 1 });

// Methods
encryptedTokenSchema.methods.markUsed = function() {
  this.lastUsedAt = new Date();
  this.usageCount += 1;
  return this.save();
};

encryptedTokenSchema.methods.revoke = function(reason) {
  this.isValid = false;
  this.revokedAt = new Date();
  this.revokedReason = reason;
  return this.save();
};

encryptedTokenSchema.methods.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

// Auto-invalidate expired tokens (passive check)
encryptedTokenSchema.virtual('isActive').get(function() {
  return this.isValid && !this.isExpired();
});

module.exports = mongoose.model('EncryptedToken', encryptedTokenSchema);
