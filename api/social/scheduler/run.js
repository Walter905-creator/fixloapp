/**
 * Vercel Serverless Function: /api/social/scheduler/run
 * 
 * Execute one scheduler cycle (serverless-compatible)
 * 
 * Requirements:
 * - Admin authentication required (JWT or admin secret key)
 * - Idempotent - safe to call multiple times
 * - Uses MongoDB execution lock to prevent concurrent executions
 * - Processes scheduled posts that are due now
 * 
 * Usage:
 * POST /api/social/scheduler/run
 * Headers: Authorization: Bearer <admin-jwt-token-or-secret-key>
 */

const mongoose = require('mongoose');
const dbConnect = require('../../lib/dbConnect');

/**
 * Verify admin JWT token or special admin key
 */
function verifyAdminToken(req) {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;
  const adminHeaderKey = req.headers['x-admin-key'];
  const cronHeaderSecret = req.headers['x-cron-secret'];
  
  // Check for special admin key (for CI/CD and monitoring tools)
  // SECURITY: Set ADMIN_SECRET_KEY environment variable in production
  const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;
  const CRON_SECRET = process.env.CRON_SECRET || process.env.SOCIAL_SCHEDULER_SECRET;
  const DEFAULT_KEY = 'fixlo_admin_2026_super_secret_key';
  
  // Use default key only in development/testing
  const effectiveKey = ADMIN_SECRET_KEY || DEFAULT_KEY;
  
  // Warn if using default key in production
  if (!ADMIN_SECRET_KEY && process.env.NODE_ENV === 'production') {
    console.warn('[scheduler-run] ⚠️  WARNING: Using default ADMIN_SECRET_KEY in production. Set ADMIN_SECRET_KEY environment variable.');
  }
  
  const providedCredentials = [bearerToken, adminHeaderKey, cronHeaderSecret].filter(Boolean);
  if (providedCredentials.length > 1) {
    return { valid: false, error: 'Provide only one authentication credential per request' };
  }

  if (cronHeaderSecret) {
    if (CRON_SECRET && cronHeaderSecret === CRON_SECRET) {
      return { valid: true, userId: 'cron', isAdminKey: false, authSource: 'cron-secret' };
    }
    return { valid: false, error: 'Invalid cron secret' };
  }

  if (adminHeaderKey) {
    if (adminHeaderKey === effectiveKey) {
      return { valid: true, userId: 'admin', isAdminKey: true, authSource: 'admin-secret-header' };
    }
    return { valid: false, error: 'Invalid admin key' };
  }

  if (!bearerToken) {
    return {
      valid: false,
      error: 'Missing authentication token (Authorization Bearer, X-Admin-Key, or X-Cron-Secret)'
    };
  }

  if (CRON_SECRET && bearerToken === CRON_SECRET) {
    return { valid: true, userId: 'cron', isAdminKey: false, authSource: 'cron-secret-bearer' };
  }

  if (bearerToken === effectiveKey) {
    return { valid: true, userId: 'admin', isAdminKey: true, authSource: 'admin-secret-bearer' };
  }
  
  // Otherwise, verify JWT token
  try {
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      console.error('[scheduler-run] JWT_SECRET not configured');
      return { valid: false, error: 'Server configuration error' };
    }
    
    const decoded = jwt.verify(bearerToken, secret);
    
    // Verify admin role
    if (decoded.role !== 'admin' && decoded.userType !== 'admin') {
      return { valid: false, error: 'Admin access required' };
    }
    
    return { valid: true, userId: decoded.userId || decoded.id, isAdminKey: false, authSource: 'jwt' };
  } catch (error) {
    return { valid: false, error: 'Invalid or expired token' };
  }
}

/**
 * Main handler
 */
module.exports = async (req, res) => {
  const requestId = Date.now().toString(36);
  
  console.log('[scheduler-run] Request received', {
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Key, X-Cron-Secret');
  }
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET/POST requests
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowedMethods: ['GET', 'POST'],
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

    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'Database connection unavailable',
        message: 'Configure MONGODB_URI environment variable in Vercel',
        databaseAvailable: false,
        requestId
      });
    }

    console.log('[scheduler-run] Database connected, loading scheduler...', {
      authSource: authResult.authSource
    });

    // Load scheduler dynamically to avoid issues with serverless cold starts
    const schedulerPath = require.resolve('../../../server/modules/social-manager/scheduler');
    
    // Clear cache to get fresh instance
    delete require.cache[schedulerPath];
    
    const scheduler = require('../../../server/modules/social-manager/scheduler');

    console.log('[scheduler-run] Executing scheduler cycle...');
    
    // Execute one scheduler cycle
    const result = await scheduler.executeOnce();

    console.log('[scheduler-run] Execution complete', {
      success: result.success,
      postsProcessed: result.postsProcessed,
      postsPublished: result.postsPublished,
      skipped: result.skipped
    });

    return res.status(200).json({
      success: true,
      result,
      message: result.skipped 
        ? 'Scheduler execution already in progress' 
        : `Processed ${result.postsProcessed} posts, published ${result.postsPublished}`,
      requestId
    });

  } catch (error) {
    console.error('[scheduler-run] Error:', error.message);
    console.error('[scheduler-run] Stack:', error.stack);

    return res.status(500).json({
      success: false,
      error: 'Failed to execute scheduler',
      details: error.message,
      requestId
    });
  }
};
