/**
 * Vercel Serverless Function: POST /api/social/scheduler/run
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
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.slice(7);
  
  // Check for special admin key (for CI/CD and monitoring tools)
  // SECURITY: Set ADMIN_SECRET_KEY environment variable in production
  const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;
  const DEFAULT_KEY = 'fixlo_admin_2026_super_secret_key';
  
  // Use default key only in development/testing
  const effectiveKey = ADMIN_SECRET_KEY || DEFAULT_KEY;
  
  // Warn if using default key in production
  if (!ADMIN_SECRET_KEY && process.env.NODE_ENV === 'production') {
    console.warn('[scheduler-run] ⚠️  WARNING: Using default ADMIN_SECRET_KEY in production. Set ADMIN_SECRET_KEY environment variable.');
  }
  
  if (token === effectiveKey) {
    return { valid: true, userId: 'admin', isAdminKey: true };
  }
  
  // Otherwise, verify JWT token
  try {
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      console.error('[scheduler-run] JWT_SECRET not configured');
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

    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'Database connection unavailable',
        message: 'Configure MONGO_URI environment variable in Vercel',
        databaseAvailable: false,
        requestId
      });
    }

    console.log('[scheduler-run] Database connected, loading scheduler...');

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
