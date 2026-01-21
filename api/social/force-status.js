/**
 * Vercel Serverless Function: /api/social/force-status
 * 
 * Check social media connection status.
 * This endpoint works with or without database connection.
 * 
 * Routing Configuration:
 * - Vercel serverless functions in /api directory are automatically exposed
 * - This file maps to GET /api/social/force-status
 * - Returns JSON status about social media connections
 */

const mongoose = require('mongoose');

// Connection state cache to avoid repeated connection attempts
let cachedDbConnection = null;
let connectionAttempted = false;

/**
 * Connect to MongoDB with error handling
 */
async function connectToDatabase() {
  // Return cached connection if available
  if (cachedDbConnection && mongoose.connection.readyState === 1) {
    return cachedDbConnection;
  }

  // Only attempt connection once per function instance
  if (connectionAttempted) {
    return null;
  }

  connectionAttempted = true;

  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.warn('[force-status] MONGODB_URI not configured');
      return null;
    }

    console.log('[force-status] Attempting database connection...');
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 10000,
    });

    cachedDbConnection = mongoose.connection;
    console.log('[force-status] Database connected successfully');
    
    return cachedDbConnection;
  } catch (error) {
    console.error('[force-status] Database connection failed:', {
      error: error.message,
      code: error.code,
    });
    return null;
  }
}

/**
 * Main handler function
 */
module.exports = async (req, res) => {
  const requestId = Date.now().toString(36);
  
  // Log API hit (non-sensitive)
  console.log('[API /api/social/force-status] Request received', {
    requestId,
    method: req.method,
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || 'unknown',
    query: req.query,
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    console.warn('[force-status] Invalid method:', req.method, 'requestId:', requestId);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowedMethods: ['GET'],
      requestId,
    });
  }

  try {
    // Attempt database connection
    const db = await connectToDatabase();

    if (!db) {
      // Return graceful response when DB is not available
      console.warn('[force-status] Database unavailable, returning default status');
      
      return res.status(200).json({
        success: true,
        facebookConnected: false,
        instagramConnected: false,
        pageId: null,
        pageName: null,
        instagramBusinessId: null,
        instagramUsername: null,
        connectedAt: null,
        isTokenValid: false,
        tokenExpiresAt: null,
        message: 'Database connection unavailable - configure MONGODB_URI environment variable',
        requestId,
      });
    }

    // Load models dynamically (only if DB is connected)
    const SocialAccount = mongoose.models.SocialAccount || 
      require('../../server/modules/social-manager/models').SocialAccount;

    // Determine ownerId
    let ownerId = 'admin';
    
    // Allow override only in non-production
    if (process.env.VERCEL_ENV !== 'production' && req.query.ownerId) {
      if (/^[a-zA-Z0-9_-]+$/.test(req.query.ownerId)) {
        ownerId = req.query.ownerId;
      } else {
        console.warn('[force-status] Invalid ownerId format:', req.query.ownerId);
        return res.status(400).json({
          success: false,
          error: 'Invalid ownerId format',
          requestId,
        });
      }
    }
    
    console.log('[force-status] Checking status for ownerId:', ownerId);
    
    // Query social accounts
    const [facebookAccount, instagramAccount] = await Promise.all([
      SocialAccount.findOne({
        ownerId,
        platform: 'meta_facebook',
        isActive: true,
      }).sort({ connectedAt: -1 }).lean(),
      
      SocialAccount.findOne({
        ownerId,
        platform: 'meta_instagram',
        isActive: true,
      }).sort({ connectedAt: -1 }).lean(),
    ]);
    
    // Build response
    const response = {
      success: true,
      facebookConnected: !!facebookAccount,
      instagramConnected: !!instagramAccount,
      pageId: facebookAccount?.platformSettings?.pageId || null,
      pageName: facebookAccount?.platformSettings?.pageName || facebookAccount?.accountName || null,
      instagramBusinessId: instagramAccount?.platformSettings?.instagramBusinessId || 
                          instagramAccount?.platformAccountId || null,
      instagramUsername: instagramAccount?.platformUsername || null,
      connectedAt: facebookAccount?.connectedAt || instagramAccount?.connectedAt || null,
      isTokenValid: (facebookAccount?.isTokenValid || instagramAccount?.isTokenValid) || false,
      tokenExpiresAt: facebookAccount?.tokenExpiresAt || instagramAccount?.tokenExpiresAt || null,
      requestId,
    };
    
    console.log('[force-status] Status retrieved successfully', {
      requestId,
      facebookConnected: response.facebookConnected,
      instagramConnected: response.instagramConnected,
    });
    
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('[force-status] Error:', {
      requestId,
      error: error.message,
      stack: error.stack,
    });
    
    // Return error response
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      requestId,
    });
  }
};
