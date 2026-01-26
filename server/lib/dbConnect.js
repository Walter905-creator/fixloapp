/**
 * MongoDB Connection Handler for Vercel Serverless Functions
 * 
 * This module provides a globally cached MongoDB connection for serverless environments.
 * It prevents creating new connections on every request, which is critical for Vercel.
 * 
 * Features:
 * - Uses globalThis.__mongoClient and globalThis.__mongoClientPromise for caching
 * - Reuses Mongoose (already in project dependencies)
 * - Supports both MONGO_URI and MONGODB_URI environment variables
 * - Logs clear errors if environment variables are missing
 * - Reuses existing connection if already connected
 * 
 * Usage:
 * const dbConnect = require('../server/lib/dbConnect');
 * const db = await dbConnect();
 * if (!db) {
 *   // Handle database unavailable
 * }
 */

const mongoose = require('mongoose');

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

  // Get MongoDB URI from environment variables
  // Support both MONGODB_URI (standard) and MONGO_URI (legacy)
  const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!MONGO_URI) {
    console.error('[dbConnect] ❌ MONGO_URI or MONGODB_URI environment variable is not set');
    console.error('[dbConnect] Configure MONGO_URI in Vercel environment variables');
    return null;
  }

  console.log('[dbConnect] Initiating MongoDB connection...');

  // Create new connection promise
  globalThis.__mongoClientPromise = mongoose.connect(MONGO_URI, {
    // Connection pool settings optimized for serverless
    maxPoolSize: 10,
    minPoolSize: 1,
    
    // Timeout settings for serverless environment
    serverSelectionTimeoutMS: 10000, // 10 seconds
    socketTimeoutMS: 45000, // 45 seconds
  }).then(() => {
    console.log('[dbConnect] ✅ MongoDB connected successfully');
    globalThis.__mongoClient = mongoose.connection;
    return mongoose.connection;
  }).catch((error) => {
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
