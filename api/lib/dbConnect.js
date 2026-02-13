/**
 * MongoDB Connection Handler for Vercel Serverless Functions
 * 
 * This module provides a globally cached MongoDB connection for serverless environments.
 * It prevents creating new connections on every request, which is critical for Vercel.
 * 
 * Features:
 * - Uses globalThis.__mongoClient and globalThis.__mongoClientPromise for caching
 * - Reuses Mongoose (already in project dependencies)
 * - Uses ONLY MONGO_URI environment variable (no fallbacks)
 * - Logs clear errors if environment variable is missing
 * - Reuses existing connection if already connected
 * 
 * Usage:
 * const dbConnect = require('../lib/dbConnect');
 * const db = await dbConnect();
 * if (!db) {
 *   // Handle database unavailable
 * }
 */

const mongoose = require('mongoose');
const { sanitizeMongoURI, parseMongoURI } = require('../../server/lib/mongoUtils');

/**
 * Global cache for MongoDB connection
 * Using globalThis ensures the cache persists across serverless invocations
 */
if (!globalThis.__mongoClientPromise) {
  globalThis.__mongoClientPromise = null;
}

if (!globalThis.__mongoClient) {
  globalThis.__mongoClient = null;
}

/**
 * Connect to MongoDB with connection caching for serverless
 * 
 * @returns {Promise<mongoose.Connection|null>} MongoDB connection or null if failed
 */
async function dbConnect() {
  // If already connected, return cached connection
  if (globalThis.__mongoClient && mongoose.connection.readyState === 1) {
    return globalThis.__mongoClient;
  }

  // If connection is in progress, wait for it
  if (globalThis.__mongoClientPromise) {
    try {
      await globalThis.__mongoClientPromise;
      if (mongoose.connection.readyState === 1) {
        globalThis.__mongoClient = mongoose.connection;
        return globalThis.__mongoClient;
      }
    } catch (error) {
      // Connection failed, will retry below
      globalThis.__mongoClientPromise = null;
      globalThis.__mongoClient = null;
    }
  }

  // ============================================================================
  // MONGODB CONNECTION - USING ONLY MONGO_URI
  // ============================================================================
  console.log('[dbConnect] ' + "=".repeat(70));
  console.log('[dbConnect] 🔍 MONGODB CONNECTION DEBUG (Serverless API)');
  console.log('[dbConnect] ' + "=".repeat(70));
  console.log(`[dbConnect] 📍 NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`[dbConnect] 📍 Mongoose Version: ${mongoose.version}`);
  
  // Explicit logging before connection
  console.log(`[dbConnect] Using Mongo URI: ${process.env.MONGO_URI ? "MONGO_URI" : "NOT FOUND"}`);

  // Fatal error if MONGO_URI does not exist
  if (!process.env.MONGO_URI) {
    console.error('[dbConnect] ❌ MONGO_URI is missing.');
    console.error('[dbConnect] ❌ FATAL ERROR: Cannot connect without MONGO_URI environment variable.');
    console.error('[dbConnect] Configure MONGO_URI in Vercel environment variables');
    console.log('[dbConnect] ' + "=".repeat(70));
    return null;
  }

  // Use ONLY MONGO_URI - no fallbacks, no defaults
  const MONGO_URI = process.env.MONGO_URI.trim();

  // Sanitize URI for logging (mask password)
  const sanitizedURI = sanitizeMongoURI(MONGO_URI);
  console.log(`[dbConnect] 📍 Sanitized URI: ${sanitizedURI}`);
  
  // Parse connection components
  const parsed = parseMongoURI(MONGO_URI);
  if (parsed.error) {
    console.error(`[dbConnect] ❌ URI parsing error: ${parsed.error}`);
  } else {
    console.log(`[dbConnect] 📍 Parsed Username: ${parsed.username}`);
    console.log(`[dbConnect] 📍 Parsed Host: ${parsed.host}`);
    console.log(`[dbConnect] 📍 Parsed Database: ${parsed.database}`);
  }
  
  // Validate URI format
  if (!MONGO_URI.startsWith('mongodb://') && !MONGO_URI.startsWith('mongodb+srv://')) {
    console.error('[dbConnect] ❌ MALFORMED URI: Must start with mongodb:// or mongodb+srv://');
    console.error('[dbConnect] 📋 Expected format: mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority');
    console.error('[dbConnect] ❌ FATAL ERROR: Invalid MongoDB URI format.');
    console.log('[dbConnect] ' + "=".repeat(70));
    return null;
  }
  
  console.log('[dbConnect] ' + "=".repeat(70));
  // ============================================================================

  console.log('[dbConnect] 🔌 Initiating MongoDB connection...');

  // Connection options optimized for serverless with explicit diagnostics
  const connectionOptions = {
    // Connection pool settings optimized for serverless
    maxPoolSize: 10,
    minPoolSize: 1,
    
    // Timeout settings for serverless environment
    serverSelectionTimeoutMS: 10000, // 10 seconds
    socketTimeoutMS: 45000, // 45 seconds
    family: 4 // Force IPv4
  };
  
  console.log('[dbConnect] 📍 Connection Options:', JSON.stringify(connectionOptions, null, 2));

  // Create new connection promise
  globalThis.__mongoClientPromise = mongoose.connect(MONGO_URI, connectionOptions).then(() => {
    console.log('[dbConnect] ✅ MongoDB connected successfully');
    globalThis.__mongoClient = mongoose.connection;
    return mongoose.connection;
  }).catch((error) => {
    // ============================================================================
    // MONGODB CONNECTION ERROR DIAGNOSTICS
    // ============================================================================
    console.log('[dbConnect] ' + "=".repeat(70));
    console.error('[dbConnect] ❌ MONGODB CONNECTION FAILED - DETAILED DIAGNOSTICS');
    console.log('[dbConnect] ' + "=".repeat(70));
    console.error(`[dbConnect] 📍 Error Name: ${error.name || 'Unknown'}`);
    console.error(`[dbConnect] 📍 Error Message: ${error.message || 'No message'}`);
    console.error(`[dbConnect] 📍 Error Code: ${error.code || 'No code'}`);
    
    // Log error reason if available (MongoDB-specific)
    if (error.reason) {
      console.error(`[dbConnect] 📍 Error Reason: ${JSON.stringify(error.reason, null, 2)}`);
    }
    
    // Log full stack trace
    console.error(`[dbConnect] 📍 Stack Trace:\n${error.stack || 'No stack trace'}`);
    
    // Check for specific authentication errors
    if (error.message && error.message.includes('Authentication failed')) {
      console.error('[dbConnect] ⚠️ AUTHENTICATION ERROR DETECTED');
      console.error('[dbConnect] Possible causes:');
      console.error('[dbConnect]   1. Incorrect username or password in MONGODB_URI');
      console.error('[dbConnect]   2. User does not have access to the specified database');
      console.error('[dbConnect]   3. Authentication mechanism mismatch (SCRAM-SHA-1 vs SCRAM-SHA-256)');
      console.error('[dbConnect]   4. IP whitelist not configured in MongoDB Atlas');
      console.error('[dbConnect]   5. Password contains special characters that need URL encoding');
    }
    
    // Additional diagnostic for connection timeout
    if (error.message && (error.message.includes('timeout') || error.message.includes('ETIMEDOUT'))) {
      console.error('[dbConnect] ⚠️ CONNECTION TIMEOUT DETECTED');
      console.error('[dbConnect] Possible causes:');
      console.error('[dbConnect]   1. MongoDB server is unreachable (check network)');
      console.error('[dbConnect]   2. IP address not whitelisted in MongoDB Atlas');
      console.error('[dbConnect]   3. Firewall blocking connection');
    }
    
    // Additional diagnostic for DNS issues
    if (error.code && (error.code === 'EREFUSED' || error.code === 'ENOTFOUND' || error.message.includes('querySrv'))) {
      console.error('[dbConnect] ⚠️ DNS RESOLUTION ERROR DETECTED');
      console.error('[dbConnect] Possible causes:');
      console.error('[dbConnect]   1. DNS server cannot resolve MongoDB Atlas hostname');
      console.error('[dbConnect]   2. Network connectivity issues');
      console.error('[dbConnect]   3. Temporary DNS server failure');
      console.error('[dbConnect]   4. Incorrect MongoDB Atlas cluster hostname');
      console.error('[dbConnect]   5. Corporate/sandbox DNS restrictions');
    }
    
    console.log('[dbConnect] ' + "=".repeat(70));
    // ============================================================================
    
    console.error('[dbConnect] ❌ MongoDB connection failed:', error.message);
    globalThis.__mongoClientPromise = null;
    globalThis.__mongoClient = null;
    throw error;
  });

  try {
    await globalThis.__mongoClientPromise;
    return globalThis.__mongoClient;
  } catch (error) {
    console.error('[dbConnect] Connection error:', error.message);
    return null;
  }
}

/**
 * Get the current connection state
 * @returns {string} Connection state description
 */
function getConnectionState() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized'
  };
  
  const state = mongoose.connection.readyState;
  return states[state] || 'unknown';
}

/**
 * Check if database is available
 * @returns {boolean} True if connected
 */
function isDatabaseAvailable() {
  return mongoose.connection.readyState === 1;
}

module.exports = dbConnect;
module.exports.getConnectionState = getConnectionState;
module.exports.isDatabaseAvailable = isDatabaseAvailable;
