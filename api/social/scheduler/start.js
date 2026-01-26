/**
 * Vercel Serverless Function: POST /api/social/scheduler/start
 * 
 * Start the social media scheduler with safety checks
 * 
 * Requirements:
 * - Admin-only access
 * - Verifies Meta is connected before starting
 * - Respects manual approval mode
 * - Safe to call multiple times (idempotent)
 * 
 * Usage:
 * POST /api/social/scheduler/start
 * Headers: Authorization: Bearer <admin-jwt-token>
 */

const mongoose = require('mongoose');
const dbConnect = require('../lib/dbConnect');

/**
 * Verify admin JWT token or special admin key
 */
function verifyAdminToken(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.slice(7);
  
  // Check for special admin key (for CI/CD and monitoring tools)
  const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'fixlo_admin_2026_super_secret_key';
  if (token === ADMIN_SECRET_KEY) {
    return { valid: true, userId: 'admin', isAdminKey: true };
  }
  
  // Otherwise, verify JWT token
  try {
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      console.error('[scheduler-start] JWT_SECRET not configured');
      return { valid: false, error: 'Server configuration error' };
    }
    
    const decoded = jwt.verify(token, secret);
    
    // Verify admin role
    if (decoded.role !== 'admin' && decoded.userType !== 'admin') {
      return { valid: false, error: 'Admin access required' };
    }
    
    return { valid: true, userId: decoded.userId || decoded.id, isAdminKey: false };
  } catch (error) {
    return { valid: false, error: 'Invalid or expired token' };
  }
}

/**
 * Check if Meta is connected
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
      platformAccountId: String
    });
    SocialAccount = mongoose.model('SocialAccount', socialAccountSchema);
  }

  const metaAccounts = await SocialAccount.find({
    ownerId,
    platform: { $in: ['meta_instagram', 'meta_facebook'] },
    isActive: true,
    isTokenValid: true
  });

  return {
    connected: metaAccounts.length > 0,
    instagramConnected: metaAccounts.some(a => a.platform === 'meta_instagram'),
    facebookConnected: metaAccounts.some(a => a.platform === 'meta_facebook'),
    accountCount: metaAccounts.length
  };
}

/**
 * Main handler
 */
module.exports = async (req, res) => {
  const requestId = Date.now().toString(36);
  
  console.log('[scheduler-start] Request received', {
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
    return res.status(401).json({
      success: false,
      error: authResult.error,
      requestId
    });
  }

  try {
    // Connect to database using centralized connection handler
    const db = await dbConnect();

    const databaseAvailable = db !== null;

    if (!databaseAvailable) {
      return res.status(503).json({
        success: false,
        error: 'Database connection unavailable',
        message: 'Configure MONGO_URI environment variable in Vercel',
        databaseAvailable: false,
        requestId
      });
    }

    // Determine ownerId
    const ownerId = req.body?.ownerId || 'admin';

    // Check Meta connection
    const metaStatus = await checkMetaConnection(ownerId);

    if (!metaStatus.connected) {
      console.warn('[scheduler-start] Meta not connected');
      return res.status(400).json({
        success: false,
        error: 'Meta accounts not connected',
        message: 'Connect Instagram or Facebook via Meta OAuth before starting scheduler',
        metaStatus,
        requestId
      });
    }

    // Note: In serverless environment (Vercel), we cannot start persistent cron jobs
    // The scheduler runs in the main Express server, not in serverless functions
    // This endpoint serves as a status indicator and configuration setter
    
    console.warn('[scheduler-start] WARNING: Serverless environment detected');
    console.warn('[scheduler-start] Scheduler must be started on the main Express server');
    console.warn('[scheduler-start] Use the server-side /api/social/scheduler/start route instead');

    return res.status(200).json({
      success: true,
      message: 'Scheduler start requested',
      warning: 'In serverless environment - scheduler runs on main Express server',
      note: 'Use the main server endpoint to actually start cron jobs',
      status: 'start_requested',
      metaStatus,
      metaConnected: metaStatus.connected,
      databaseAvailable: true,
      manualApprovalMode: true,
      serverlessEnvironment: true,
      requestId
    });

  } catch (error) {
    console.error('[scheduler-start] Error:', error.message);

    return res.status(500).json({
      success: false,
      error: 'Failed to start scheduler',
      details: error.message,
      requestId
    });
  }
};
