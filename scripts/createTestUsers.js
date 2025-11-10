/**
 * Create Test Users Script for Fixlo Backend
 * 
 * This script creates sample test Pro users in the Fixlo backend
 * for testing mobile and web logins.
 * 
 * Usage: node scripts/createTestUsers.js
 */

const axios = require('axios');

// Backend API URL
const API_URL = 'https://fixloapp.onrender.com/api/auth/register';

// Test users data - All are Pro users since Fixlo only has Pro accounts
const testUsers = [
  {
    name: 'Test Pro',
    email: 'testpro@fixlo.com',
    phone: '5551112222',
    password: 'FixloTest123',
    trade: 'plumbing',
    location: 'New York, NY',
    experience: '5'
  },
  {
    name: 'Test Homeowner',
    email: 'testhomeowner@fixlo.com',
    phone: '5553334444',
    password: 'FixloTest123',
    trade: 'electrical',
    location: 'Los Angeles, CA',
    experience: '3'
  },
  {
    name: 'Demo User',
    email: 'demo@fixlo.com',
    phone: '5557778888',
    password: 'FixloTest123',
    trade: 'handyman',
    location: 'Chicago, IL',
    experience: '7'
  }
];

/**
 * Create a single user via the API
 */
async function createUser(userData) {
  try {
    console.log(`\n🔄 Creating user: ${userData.name} (${userData.email})...`);
    
    const response = await axios.post(API_URL, userData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    if (response.data.success) {
      console.log(`✅ Test user created successfully: ${userData.name}`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Trade: ${userData.trade}`);
      console.log(`   ID: ${response.data.user._id}`);
      return { success: true, user: userData };
    } else {
      console.log(`⚠️  Unexpected response for ${userData.email}:`, response.data);
      return { success: false, user: userData, reason: 'unexpected_response' };
    }
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error || 'Unknown error';
      
      if (status === 400 && (message.includes('already exists') || message.includes('email or phone'))) {
        console.log(`⚠️  User already exists: ${userData.email}`);
        return { success: false, user: userData, reason: 'already_exists' };
      } else if (status === 503) {
        console.log(`❌ Service unavailable (database may be down): ${userData.email}`);
        return { success: false, user: userData, reason: 'service_unavailable' };
      } else {
        console.log(`❌ Error creating user ${userData.email}: ${message}`);
        return { success: false, user: userData, reason: 'api_error', error: message };
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.log(`❌ No response from server for ${userData.email}. Server may be down or unreachable.`);
      return { success: false, user: userData, reason: 'no_response' };
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log(`❌ Error setting up request for ${userData.email}:`, error.message);
      return { success: false, user: userData, reason: 'request_error', error: error.message };
    }
  }
}

/**
 * Main function to create all test users
 */
async function createTestUsers() {
  console.log('='.repeat(60));
  console.log('🚀 Fixlo Test Users Creation Script');
  console.log('='.repeat(60));
  console.log(`API Endpoint: ${API_URL}`);
  console.log(`Total users to create: ${testUsers.length}`);
  
  const results = [];
  
  // Create users sequentially to avoid overwhelming the server
  for (const userData of testUsers) {
    const result = await createUser(userData);
    results.push(result);
    
    // Wait a bit between requests to be nice to the server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const alreadyExists = results.filter(r => r.reason === 'already_exists').length;
  const failed = results.filter(r => !r.success && r.reason !== 'already_exists').length;
  
  console.log(`✅ Successfully created: ${successful}`);
  console.log(`⚠️  Already existed: ${alreadyExists}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed users:');
    results
      .filter(r => !r.success && r.reason !== 'already_exists')
      .forEach(r => {
        console.log(`  - ${r.user.email}: ${r.reason} ${r.error ? `(${r.error})` : ''}`);
      });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('ℹ️  Login Credentials for Testing:');
  console.log('='.repeat(60));
  testUsers.forEach(user => {
    console.log(`\n${user.name}:`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: ${user.password}`);
    console.log(`  Trade: ${user.trade}`);
  });
  console.log('\n' + '='.repeat(60));
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run the script
if (require.main === module) {
  createTestUsers().catch(error => {
    console.error('\n❌ Unexpected error running script:', error);
    process.exit(1);
  });
}

module.exports = { createTestUsers, createUser };
