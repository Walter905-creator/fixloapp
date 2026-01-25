/**
 * Vercel Serverless Function: GET /api/social/scheduler/status
 * 
 * Get the current status of the social media scheduler
 * 
 * Requirements:
 * - No authentication required (read-only status)
 * - Returns scheduler state
 * - Returns Meta connection status
 * - Safe for monitoring/health checks
 * 
 * Usage:
 * GET /api/social/scheduler/status
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
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      return null;
    }

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });

    cachedDbConnection = mongoose.connection;
    
    return cachedDbConnection;
  } catch (error) {
    return null;
  }
}

/**
 * Check Meta connection status
 */
async function checkMetaConnection(ownerId) {
  let SocialAccount;
  
  if (mongoose.models.SocialAccount) {
    SocialAccount = mongoose.models.SocialAccount;
  } else {
    const socialAccountSchema = new mongoose.Schema({
      ownerId: String,
      platform: String,
      isActive: Boolean,
      isTokenValid: Boolean,
      platformUsername: String,
      tokenExpiresAt: Date
    });
    SocialAccount = mongoose.model('SocialAccount', socialAccountSchema);
  }

  const metaAccounts = await SocialAccount.find({
    ownerId,
    platform: { $in: ['meta_instagram', 'meta_facebook'] },
    isActive: true
  }).lean();

  const validAccounts = metaAccounts.filter(a => a.isTokenValid);

  return {
    connected: validAccounts.length > 0,
    totalAccounts: metaAccounts.length,
    validAccounts: validAccounts.length,
    instagram: metaAccounts.find(a => a.platform === 'meta_instagram') ? {
      connected: true,
      isValid: validAccounts.some(a => a.platform === 'meta_instagram'),
      username: metaAccounts.find(a => a.platform === 'meta_instagram')?.platformUsername
    } : {
      connected: false,
      isValid: false
    },
    facebook: metaAccounts.find(a => a.platform === 'meta_facebook') ? {
      connected: true,
      isValid: validAccounts.some(a => a.platform === 'meta_facebook'),
      username: metaAccounts.find(a => a.platform === 'meta_facebook')?.platformUsername
    } : {
      connected: false,
      isValid: false
    }
  };
}

/**
 * Main handler
 */
module.exports = async (req, res) => {
  const requestId = Date.now().toString(36);

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
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowedMethods: ['GET'],
      requestId
    });
  }

  try {
    // Connect to database
    const db = await connectToDatabase();

    if (!db) {
      return res.status(200).json({
        success: true,
        isRunning: false,
        environment: 'serverless',
        metaConnected: false,
        databaseAvailable: false,
        message: 'Database connection unavailable',
        requestId
      });
    }

    // Determine ownerId
    const ownerId = req.query.ownerId || 'admin';

    // Check Meta connection
    const metaStatus = await checkMetaConnection(ownerId);

    // Get scheduler state from global (if available)
    const schedulerState = global.schedulerState || {
      isRunning: false,
      startedAt: null
    };

    // Note: In serverless environment, actual cron jobs run on the main server
    return res.status(200).json({
      success: true,
      environment: 'serverless',
      note: 'Scheduler runs on main Express server, not in serverless functions',
      scheduler: {
        isRunning: schedulerState.isRunning,
        startedAt: schedulerState.startedAt,
        manualApprovalMode: true
      },
      meta: metaStatus,
      database: {
        connected: true
      },
      timestamp: new Date().toISOString(),
      requestId
    });

  } catch (error) {
    console.error('[scheduler-status] Error:', error.message);

    return res.status(500).json({
      success: false,
      error: 'Failed to get scheduler status',
      details: error.message,
      requestId
    });
  }
};
