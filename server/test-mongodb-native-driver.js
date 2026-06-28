#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

if (!process.env.MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI not found in environment variables');
  process.exit(1);
}

console.log('🧪 MongoDB Connection Test');
console.log('='.repeat(60));
console.log(
  'MongoDB host:',
  process.env.MONGODB_URI?.replace(/\/\/.*?:.*?@/, '//****:****@')
);
console.log('');

async function run() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(
      process.env.MONGODB_URI,
      {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4,
      }
    );

    console.log('✅ Connected successfully');
    console.log('');

    console.log('🏓 Pinging deployment...');
    await mongoose.connection.db.admin().ping();
    console.log('✅ Pinged your deployment. You successfully connected to MongoDB!');
    console.log('');

    const db = mongoose.connection.db;
    console.log('📊 Database Information:');
    console.log('   Database name:', db.databaseName);
    console.log('');

    const collections = await db.listCollections().toArray();
    if (collections.length > 0) {
      console.log('📂 Collections found:', collections.length);
      collections.forEach((col) => {
        console.log('   -', col.name);
      });
    } else {
      console.log('📂 No collections found (database is empty)');
    }
    console.log('');

    console.log('🎉 MongoDB connection test completed successfully!');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('');
    console.error('Error details:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('');
      console.log('🔌 Connection closed');
    }
  }
}

run()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
