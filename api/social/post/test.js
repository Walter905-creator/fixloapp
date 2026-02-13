/**
 * Vercel Serverless Function: POST /api/social/post/test
 * 
 * Test posting endpoint - sends a test post to Instagram (and Facebook if supported)
 * Uses stored Meta credentials without relying on UI or scheduling
 * 
 * Requirements:
 * - Admin-only access
 * - Uses stored encrypted tokens from database
 * - Posts to Instagram Business Account
 * - Returns structured success/failure response
 * - Production-safe logging (no tokens)
 * 
 * Usage:
 * POST /api/social/post/test
 * Headers: Authorization: Bearer <admin-jwt-token>
 */

const mongoose = require('mongoose');

// Connection state cache
let cachedDbConnection = null;
let connectionAttempted = false;

/**
 * Connect to MongoDB
 */
async function connectToDatabase() {
  if (cachedDbConnection && mongoose.connection.readyState === 1) {
    return cachedDbConnection;
  }

  if (connectionAttempted && !cachedDbConnection) {
    return null;
  }

  connectionAttempted = true;

  try {
    const MONGO_URI = process.env.MONGO_URI;

    if (!MONGO_URI) {
      console.warn('[test-post] MONGO_URI not configured');
      return null;
    }

    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });

    cachedDbConnection = mongoose.connection;
    console.log('[test-post] Database connected');
    
    return cachedDbConnection;
  } catch (error) {
    console.error('[test-post] Database connection failed:', error.message);
    return null;
  }
}

/**
 * Verify admin JWT token
 */
function verifyAdminToken(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.slice(7);
  
  try {
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      console.error('[test-post] JWT_SECRET not configured');
      return { valid: false, error: 'Server configuration error' };
    }
    
    const decoded = jwt.verify(token, secret);
    
    // Verify admin role
    if (decoded.role !== 'admin' && decoded.userType !== 'admin') {
      return { valid: false, error: 'Admin access required' };
    }
    
    return { valid: true, userId: decoded.userId || decoded.id };
  } catch (error) {
    return { valid: false, error: 'Invalid or expired token' };
  }
}

/**
 * Main handler
 */
module.exports = async (req, res) => {
  const requestId = Date.now().toString(36);
  
  console.log('[Social Post] Attempt', {
    requestId,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Set security headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Request-ID', requestId);
  
  // CORS headers
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://www.fixloapp.com',
    'https://fixloapp.com',
    'http://localhost:3000',
  ];
  
  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    console.warn('[test-post] Invalid method:', req.method);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowedMethods: ['POST'],
      requestId
    });
  }

  // Verify admin authentication
  const authResult = verifyAdminToken(req);
  if (!authResult.valid) {
    console.warn('[test-post] Auth failed:', authResult.error);
    return res.status(401).json({
      success: false,
      error: authResult.error,
      requestId
    });
  }

  try {
    // Connect to database
    const db = await connectToDatabase();

    if (!db) {
      console.error('[test-post] Database unavailable');
      return res.status(503).json({
        success: false,
        error: 'Database connection unavailable',
        message: 'Configure MONGO_URI environment variable',
        requestId
      });
    }

    // Load models dynamically
    let SocialAccount, EncryptedToken;
    
    if (mongoose.models.SocialAccount) {
      SocialAccount = mongoose.models.SocialAccount;
    } else {
      const socialAccountSchema = new mongoose.Schema({
        ownerId: String,
        platform: String,
        isActive: Boolean,
        isTokenValid: Boolean,
        accountName: String,
        platformUsername: String,
        platformAccountId: String,
        platformSettings: mongoose.Schema.Types.Mixed,
        accessTokenRef: mongoose.Schema.Types.ObjectId,
        tokenExpiresAt: Date,
        requiresReauth: Boolean
      });
      SocialAccount = mongoose.model('SocialAccount', socialAccountSchema);
    }

    if (mongoose.models.EncryptedToken) {
      EncryptedToken = mongoose.models.EncryptedToken;
    } else {
      const encryptedTokenSchema = new mongoose.Schema({
        encryptedValue: String,
        iv: String,
        authTag: String,
        tokenType: String,
        platform: String,
        accountRef: mongoose.Schema.Types.ObjectId,
        isRevoked: Boolean,
        isValid: Boolean,
        expiresAt: Date,
        createdAt: Date
      });
      EncryptedToken = mongoose.model('EncryptedToken', encryptedTokenSchema);
    }

    // Determine ownerId (default to 'admin' or from request)
    const ownerId = req.body?.ownerId || 'admin';

    // Find active Instagram account
    const instagramAccount = await SocialAccount.findOne({
      ownerId,
      platform: 'meta_instagram',
      isActive: true,
      isTokenValid: true
    }).sort({ connectedAt: -1 });

    if (!instagramAccount) {
      console.warn('[test-post] No active Instagram account found');
      return res.status(400).json({
        success: false,
        error: 'No active Instagram account found',
        message: 'Connect Instagram via Meta OAuth first',
        requestId
      });
    }

    // Verify token is not expired
    if (instagramAccount.tokenExpiresAt && new Date(instagramAccount.tokenExpiresAt) < new Date()) {
      console.warn('[test-post] Instagram token expired');
      return res.status(400).json({
        success: false,
        error: 'Instagram token expired',
        message: 'Re-authenticate via Meta OAuth',
        requestId
      });
    }

    // Retrieve encrypted token
    const tokenRecord = await EncryptedToken.findById(instagramAccount.accessTokenRef);
    
    if (!tokenRecord || tokenRecord.isRevoked) {
      console.warn('[test-post] Token not found or revoked');
      return res.status(400).json({
        success: false,
        error: 'Access token unavailable',
        message: 'Re-authenticate via Meta OAuth',
        requestId
      });
    }

    // Decrypt token using same algorithm as tokenEncryption service (AES-256-GCM)
    // Note: We inline the decryption logic here instead of importing the tokenEncryption
    // service to minimize dependencies in the serverless function. The logic matches
    // the tokenEncryption.decrypt() method exactly.
    const crypto = require('crypto');
    const encryptionKey = process.env.SOCIAL_ENCRYPTION_KEY;
    
    if (!encryptionKey) {
      console.error('[test-post] SOCIAL_ENCRYPTION_KEY not configured');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
        requestId
      });
    }

    // Parse encryption key (supports both base64 and hex)
    let key;
    if (encryptionKey.length === 64) {
      key = Buffer.from(encryptionKey, 'hex');
    } else {
      key = Buffer.from(encryptionKey, 'base64');
    }

    // Verify authTag exists (required for AES-GCM)
    if (!tokenRecord.authTag) {
      console.error('[test-post] Token missing authTag - may be using old encryption');
      return res.status(500).json({
        success: false,
        error: 'Token encryption format incompatible',
        message: 'Re-authenticate via Meta OAuth',
        requestId
      });
    }

    // Decrypt using AES-256-GCM (same as tokenEncryption service)
    const iv = Buffer.from(tokenRecord.iv, 'base64');
    const authTag = Buffer.from(tokenRecord.authTag, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let accessToken = decipher.update(tokenRecord.encryptedValue, 'base64', 'utf8');
    accessToken += decipher.final('utf8');

    // Post to Instagram using Graph API
    const axios = require('axios');
    const igAccountId = instagramAccount.platformAccountId;
    
    // Test post content
    const testCaption = "Fixlo test post — automated social system is live 🚀";
    const testImageUrl = "https://fixloapp.com/fixlo-logo.png"; // Using existing public image
    
    console.log('[Social Post] Posting to Instagram...', {
      username: instagramAccount.platformUsername,
      requestId
    });

    // Step 1: Create media container
    const containerResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igAccountId}/media`,
      {
        image_url: testImageUrl,
        caption: testCaption,
        access_token: accessToken
      }
    );

    const containerId = containerResponse.data.id;
    
    console.log('[Social Post] Media container created', { containerId });

    // Step 2: Publish container
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`,
      {
        creation_id: containerId,
        access_token: accessToken
      }
    );

    const postId = publishResponse.data.id;
    
    // Fetch the actual permalink (Instagram shortcode URL)
    let postUrl = `https://www.instagram.com/p/${postId}/`; // Fallback URL
    try {
      const permalinkResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${postId}`,
        {
          params: {
            fields: 'permalink',
            access_token: accessToken
          }
        }
      );
      if (permalinkResponse.data.permalink) {
        postUrl = permalinkResponse.data.permalink;
      }
    } catch (permalinkError) {
      console.warn('[Social Post] Could not fetch permalink:', permalinkError.message);
      // Continue with fallback URL
    }
    
    console.log('[Social Post] Success', {
      postId,
      platform: 'instagram',
      requestId
    });

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Test post published successfully',
      platform: 'instagram',
      account: instagramAccount.platformUsername,
      postId: postId,
      postUrl: postUrl,
      caption: testCaption,
      requestId
    });

  } catch (error) {
    console.error('[Social Post] Failure', {
      error: error.message,
      requestId
    });

    // Check for specific Meta API errors
    let errorMessage = 'Failed to publish test post';
    let statusCode = 500;

    if (error.response?.data?.error) {
      const metaError = error.response.data.error;
      errorMessage = metaError.message || errorMessage;
      
      // Handle specific error codes
      if (metaError.code === 190) {
        statusCode = 401;
        errorMessage = 'Invalid or expired access token - re-authenticate required';
      } else if (metaError.code === 100) {
        statusCode = 400;
        errorMessage = 'Invalid parameters or permissions issue';
      }
    }

    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error.message,
      requestId
    });
  }
};
