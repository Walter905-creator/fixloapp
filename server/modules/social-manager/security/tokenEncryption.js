const crypto = require('crypto');
const { EncryptedToken } = require('../models');

/**
 * Token Encryption Service
 * Handles AES-256-GCM encryption/decryption of OAuth tokens
 * 
 * SECURITY NOTES:
 * - Uses AES-256-GCM for authenticated encryption
 * - Generates unique IV for each encryption
 * - Validates auth tag on decryption
 * - Encryption key MUST be 32 bytes (256 bits)
 * - Key stored in env var: SOCIAL_ENCRYPTION_KEY
 */

class TokenEncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits
    this.authTagLength = 16; // 128 bits
    
    // Get encryption key from environment
    const keyEnv = process.env.SOCIAL_ENCRYPTION_KEY;
    
    if (!keyEnv) {
      throw new Error(
        'SOCIAL_ENCRYPTION_KEY not configured. Generate with: ' +
        'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
      );
    }
    
    // Key can be base64 string or hex string
    try {
      if (keyEnv.length === 64) {
        // Assume hex encoding
        this.key = Buffer.from(keyEnv, 'hex');
      } else {
        // Assume base64 encoding
        this.key = Buffer.from(keyEnv, 'base64');
      }
      
      if (this.key.length !== this.keyLength) {
        throw new Error(`Key must be ${this.keyLength} bytes, got ${this.key.length}`);
      }
    } catch (error) {
      throw new Error(`Invalid SOCIAL_ENCRYPTION_KEY format: ${error.message}`);
    }
  }
  
  /**
   * Encrypt a token value
   * @param {string} plaintext - Token to encrypt
   * @returns {Object} - { encryptedValue, iv, authTag }
   */
  encrypt(plaintext) {
    if (!plaintext || typeof plaintext !== 'string') {
      throw new Error('Invalid token value to encrypt');
    }
    
    // Generate random IV for this encryption
    const iv = crypto.randomBytes(this.ivLength);
    
    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Get auth tag for integrity verification
    const authTag = cipher.getAuthTag();
    
    return {
      encryptedValue: encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64')
    };
  }
  
  /**
   * Decrypt an encrypted token
   * @param {string} encryptedValue - Encrypted token
   * @param {string} iv - Initialization vector (base64)
   * @param {string} authTag - Authentication tag (base64)
   * @returns {string} - Decrypted token
   */
  decrypt(encryptedValue, iv, authTag) {
    if (!encryptedValue || !iv || !authTag) {
      throw new Error('Missing encryption parameters');
    }
    
    try {
      // Convert from base64
      const ivBuffer = Buffer.from(iv, 'base64');
      const authTagBuffer = Buffer.from(authTag, 'base64');
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, ivBuffer);
      decipher.setAuthTag(authTagBuffer);
      
      // Decrypt
      let decrypted = decipher.update(encryptedValue, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }
  
  /**
   * Store encrypted token in database
   * @param {Object} params - Token parameters
   * @returns {Promise<EncryptedToken>} - Saved token document
   */
  async storeToken(params) {
    const {
      tokenValue,
      tokenType,
      accountRef,
      platform,
      expiresIn,
      previousTokenRef
    } = params;
    
    if (!tokenValue || !tokenType || !accountRef || !platform) {
      throw new Error('Missing required token parameters');
    }
    
    // Encrypt the token
    const { encryptedValue, iv, authTag } = this.encrypt(tokenValue);
    
    // Calculate expiration
    let expiresAt = null;
    if (expiresIn) {
      expiresAt = new Date(Date.now() + expiresIn * 1000);
    }
    
    // Create token document
    const token = new EncryptedToken({
      tokenType,
      encryptedValue,
      iv,
      authTag,
      accountRef,
      platform,
      expiresAt,
      previousTokenRef,
      encryptionAlgorithm: this.algorithm
    });
    
    await token.save();
    return token;
  }
  
  /**
   * Retrieve and decrypt token from database
   * @param {string} tokenId - Token document ID
   * @returns {Promise<string>} - Decrypted token value
   */
  async retrieveToken(tokenId) {
    const token = await EncryptedToken.findById(tokenId);
    
    if (!token) {
      throw new Error('Token not found');
    }
    
    if (!token.isValid) {
      throw new Error('Token has been revoked');
    }
    
    if (token.isExpired()) {
      throw new Error('Token has expired');
    }
    
    // Decrypt and return
    const decrypted = this.decrypt(
      token.encryptedValue,
      token.iv,
      token.authTag
    );
    
    // Track usage
    await token.markUsed();
    
    return decrypted;
  }
  
  /**
   * Rotate a token (store new, invalidate old)
   * @param {Object} params - Rotation parameters
   * @returns {Promise<EncryptedToken>} - New token document
   */
  async rotateToken(params) {
    const { oldTokenId, newTokenValue, expiresIn } = params;
    
    // Get old token
    const oldToken = await EncryptedToken.findById(oldTokenId);
    if (!oldToken) {
      throw new Error('Old token not found');
    }
    
    // Store new token with reference to old one
    const newToken = await this.storeToken({
      tokenValue: newTokenValue,
      tokenType: oldToken.tokenType,
      accountRef: oldToken.accountRef,
      platform: oldToken.platform,
      expiresIn,
      previousTokenRef: oldTokenId
    });
    
    // Update rotation count
    newToken.rotationCount = oldToken.rotationCount + 1;
    await newToken.save();
    
    // Invalidate old token
    await oldToken.revoke('Rotated to new token');
    
    return newToken;
  }
  
  /**
   * Revoke a token
   * @param {string} tokenId - Token to revoke
   * @param {string} reason - Revocation reason
   * @returns {Promise<void>}
   */
  async revokeToken(tokenId, reason = 'Manual revocation') {
    const token = await EncryptedToken.findById(tokenId);
    if (token) {
      await token.revoke(reason);
    }
  }
  
  /**
   * Clean up expired tokens (for scheduled maintenance)
   * @param {number} daysOld - Remove tokens older than this
   * @returns {Promise<number>} - Number of tokens removed
   */
  async cleanupExpiredTokens(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await EncryptedToken.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { revokedAt: { $lt: cutoffDate } }
      ]
    });
    
    return result.deletedCount;
  }
}

// Export singleton instance
module.exports = new TokenEncryptionService();
