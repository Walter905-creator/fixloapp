/**
 * Vercel Serverless Function: GET /api/social/scheduler/status
 * 
 * Get the current status of the social media scheduler
 * 
 * Requirements:
 * - No authentication required (read-only status)
 * - Returns scheduler state from MongoDB (serverless-compatible)
 * - Returns Meta connection status
 * - Safe for monitoring/health checks
 * 
 * Usage:
 * GET /api/social/scheduler/status
 */

const mongoose = require('mongoose');
const dbConnect = require('../../lib/dbConnect');

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
 * Get scheduler state from MongoDB
 */
async function getSchedulerState() {
  let SchedulerState;
  
  if (mongoose.models.SchedulerState) {
    SchedulerState = mongoose.models.SchedulerState;
  } else {
    const schedulerStateSchema = new mongoose.Schema({
      _id: String,
      lastRunAt: Date,
      lastRunDuration: Number,
      lastRunStatus: String,
      totalExecutions: Number,
      totalPostsPublished: Number,
      executionLock: Boolean,
      nextScheduledPost: {
        postId: mongoose.Schema.Types.ObjectId,
        scheduledFor: Date,
        platform: String
      }
    });
    SchedulerState = mongoose.model('SchedulerState', schedulerStateSchema);
  }

  try {
    const state = await SchedulerState.findById('scheduler_state').lean();
    return state || {
      lastRunAt: null,
      lastRunDuration: null,
      lastRunStatus: null,
      totalExecutions: 0,
      totalPostsPublished: 0,
      executionLock: false,
      nextScheduledPost: null
    };
  } catch (error) {
    console.error('[scheduler-status] Failed to get scheduler state:', error.message);
    return {
      lastRunAt: null,
      lastRunDuration: null,
      lastRunStatus: null,
      totalExecutions: 0,
      totalPostsPublished: 0,
      executionLock: false,
      nextScheduledPost: null
    };
  }
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
    // Connect to database using centralized connection handler
    const db = await dbConnect();

    const databaseAvailable = db !== null;

    if (!databaseAvailable) {
      return res.status(200).json({
        success: true,
        environment: 'serverless',
        serverless: true,
        metaConnected: false,
        databaseAvailable: false,
        message: 'Database connection unavailable - check MONGO_URI environment variable',
        requestId
      });
    }

    // Determine ownerId
    const ownerId = req.query.ownerId || 'admin';

    // Check Meta connection
    const metaStatus = await checkMetaConnection(ownerId);

    // Get scheduler state from MongoDB
    const schedulerState = await getSchedulerState();

    // Calculate if scheduler is operational
    const isOperational = databaseAvailable && metaStatus.connected;

    return res.status(200).json({
      success: true,
      environment: 'serverless',
      serverless: true,
      operational: isOperational,
      scheduler: {
        lastRunAt: schedulerState.lastRunAt,
        lastRunDuration: schedulerState.lastRunDuration,
        lastRunStatus: schedulerState.lastRunStatus,
        totalExecutions: schedulerState.totalExecutions,
        totalPostsPublished: schedulerState.totalPostsPublished,
        executionLock: schedulerState.executionLock,
        nextScheduledPost: schedulerState.nextScheduledPost
      },
      meta: metaStatus,
      metaConnected: metaStatus.connected,
      databaseAvailable: true,
      database: {
        connected: true
      },
      endpoints: {
        run: '/api/social/scheduler/run (POST, requires auth)',
        status: '/api/social/scheduler/status (GET, public)'
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
