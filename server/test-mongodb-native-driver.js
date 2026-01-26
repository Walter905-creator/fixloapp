#!/usr/bin/env node

/**
 * MongoDB Native Driver Connection Example
 * 
 * This example shows how to connect to MongoDB using the native MongoDB driver
 * (as shown in the MongoDB Atlas setup instructions), in addition to the 
 * Mongoose connection already used in the application.
 * 
 * Note: The application uses Mongoose by default, which is recommended for
 * Node.js applications. This file is provided as a reference implementation
 * matching the MongoDB Atlas documentation.
 */

const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

// Get the MongoDB URI from environment variables
const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!uri) {
  console.error('❌ ERROR: MONGODB_URI not found in environment variables');
  process.exit(1);
}

console.log('🧪 MongoDB Native Driver Connection Test');
console.log('='.repeat(60));
console.log('');

// Mask the password in the URI for display
const displayUri = uri.replace(/(:\/\/[^:]+:)([^@]+)(@)/, '$1****$3');
console.log('📋 Connection URI:', displayUri);
console.log('');

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    
    console.log('✅ Connected successfully');
    console.log('');
    
    // Send a ping to confirm a successful connection
    console.log('🏓 Pinging deployment...');
    await client.db("admin").command({ ping: 1 });
    console.log('✅ Pinged your deployment. You successfully connected to MongoDB!');
    console.log('');
    
    // Get database information
    const db = client.db('fixlo');
    console.log('📊 Database Information:');
    console.log('   Database name:', db.databaseName);
    console.log('');
    
    // List collections
    const collections = await db.listCollections().toArray();
    if (collections.length > 0) {
      console.log('📂 Collections found:', collections.length);
      collections.forEach(col => {
        console.log('   -', col.name);
      });
    } else {
      console.log('📂 No collections found (database is empty)');
    }
    console.log('');
    
    console.log('🎉 Native driver connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('');
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
    console.log('');
    console.log('🔌 Connection closed');
  }
}

// Run the connection test
run().catch(console.dir);
