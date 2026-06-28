#!/usr/bin/env node

/**
 * MongoDB Connection Test Script
 * Tests the connection to MongoDB Atlas using the provided connection string
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

console.log('🧪 MongoDB Connection Test');
console.log('='.repeat(50));

if (!MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI not found in environment variables');
  console.log('Please set MONGODB_URI in .env file');
  process.exit(1);
}

// Mask the password in the URI for display
const displayUri = MONGODB_URI.replace(/(:\/\/[^:]+:)([^@]+)(@)/, '$1****$3');
console.log('📋 Connection URI:', displayUri);
console.log('');

async function testConnection() {
  try {
    console.log('🔌 Attempting to connect to MongoDB...');
    
    // Connect with the same options used in the server
    await mongoose.connect(
      MONGODB_URI,
      {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4,
      }
    );
    
    console.log('✅ Successfully connected to MongoDB!');
    console.log('');
    console.log('📊 Connection Details:');
    console.log('  - Database:', mongoose.connection.db.databaseName);
    console.log('  - Host:', mongoose.connection.host);
    console.log('  - State:', mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected');
    console.log('');
    
    // Try to ping the database
    console.log('🏓 Pinging database...');
    const result = await mongoose.connection.db.admin().ping();
    console.log('✅ Ping successful:', result);
    console.log('');
    
    // List collections
    console.log('📂 Checking collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    if (collections.length > 0) {
      console.log('✅ Found', collections.length, 'collections:');
      collections.forEach(col => {
        console.log('  -', col.name);
      });
    } else {
      console.log('ℹ️  No collections found (database is empty)');
    }
    console.log('');
    
    console.log('🎉 MongoDB connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('');
    console.error('Error details:', error);
    // Don't call process.exit here - let finally block run first
  } finally {
    // Close the connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('');
      console.log('🔌 Connection closed');
    }
    // Exit with error code if there was an error
    if (mongoose.connection.readyState !== 1) {
      process.exit(1);
    }
  }
}

testConnection();
