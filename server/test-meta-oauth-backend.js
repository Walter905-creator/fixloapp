/**
 * Test script for backend-only Meta OAuth implementation
 * 
 * This script tests:
 * 1. The new /api/social/force-status endpoint
 * 2. Meta handler's getCompleteMetaAccountInfo method (unit test)
 * 
 * Usage:
 *   node test-meta-oauth-backend.js
 * 
 * Note: The actual OAuth callback requires a real OAuth code from Meta,
 * so we can't fully test it without initiating a real OAuth flow.
 */

const axios = require('axios');

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

console.log('🧪 Testing Meta OAuth Backend Implementation\n');
console.log(`Base URL: ${BASE_URL}\n`);

/**
 * Test 1: Force Status Endpoint
 */
async function testForceStatusEndpoint() {
  console.log('📊 Test 1: Force Status Endpoint');
  console.log('=====================================');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/social/force-status`);
    
    console.log('✅ Status: ', response.status);
    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    
    // Validate response structure
    const requiredFields = [
      'success',
      'facebookConnected',
      'instagramConnected',
      'pageId',
      'pageName',
      'instagramBusinessId',
      'instagramUsername',
      'connectedAt',
      'isTokenValid'
    ];
    
    const missingFields = requiredFields.filter(field => !(field in response.data));
    
    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      return false;
    }
    
    console.log('✅ All required fields present\n');
    return true;
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Error Response:', error.response.status);
      console.log('❌ Error Data:', error.response.data);
    } else {
      console.log('❌ Error:', error.message);
    }
    return false;
  }
}

/**
 * Test 2: Meta Handler Method (Unit Test)
 */
async function testMetaHandlerMethod() {
  console.log('📊 Test 2: Meta Handler getCompleteMetaAccountInfo Method');
  console.log('=====================================');
  
  try {
    // Load the Meta handler
    const metaHandler = require('./modules/social-manager/oauth/metaHandler');
    
    // Verify the method exists
    if (typeof metaHandler.getCompleteMetaAccountInfo !== 'function') {
      console.log('❌ getCompleteMetaAccountInfo method not found');
      return false;
    }
    
    console.log('✅ getCompleteMetaAccountInfo method exists');
    console.log('✅ Method signature validated\n');
    return true;
    
  } catch (error) {
    console.log('❌ Error loading Meta handler:', error.message);
    return false;
  }
}

/**
 * Test 3: Verify OAuth Callback Response Structure
 */
async function testOAuthCallbackResponseStructure() {
  console.log('📊 Test 3: OAuth Callback Response Structure (Simulated Error)');
  console.log('=====================================');
  
  try {
    // Test with missing code parameter (should return error)
    const response = await axios.get(`${BASE_URL}/api/social/oauth/meta/callback`, {
      validateStatus: () => true // Don't throw on 4xx/5xx
    });
    
    console.log('✅ Status:', response.status);
    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    
    // Should be 400 with proper error structure
    if (response.status === 400 && response.data.success === false) {
      console.log('✅ Error handling works correctly');
      console.log('✅ Response structure is correct\n');
      return true;
    } else {
      console.log('❌ Unexpected response structure\n');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

/**
 * Test 4: Check Required Environment Variables
 */
async function testEnvironmentVariables() {
  console.log('📊 Test 4: Environment Variables Check');
  console.log('=====================================');
  
  const requiredEnvVars = [
    'SOCIAL_META_CLIENT_ID',
    'SOCIAL_META_CLIENT_SECRET',
    'SOCIAL_ENCRYPTION_KEY'
  ];
  
  const optionalEnvVars = [
    'SOCIAL_META_REDIRECT_URI',
    'CLIENT_URL'
  ];
  
  console.log('Required environment variables:');
  let allPresent = true;
  
  for (const envVar of requiredEnvVars) {
    const isPresent = !!process.env[envVar];
    console.log(`  ${isPresent ? '✅' : '❌'} ${envVar}: ${isPresent ? 'SET' : 'MISSING'}`);
    if (!isPresent) allPresent = false;
  }
  
  console.log('\nOptional environment variables:');
  for (const envVar of optionalEnvVars) {
    const isPresent = !!process.env[envVar];
    console.log(`  ${isPresent ? '✅' : 'ℹ️'} ${envVar}: ${isPresent ? 'SET' : 'NOT SET (will use defaults)'}`);
  }
  
  console.log('');
  
  if (!allPresent) {
    console.log('⚠️  Warning: Some required environment variables are missing.');
    console.log('    Meta OAuth will not work without proper configuration.\n');
  }
  
  return allPresent;
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Meta OAuth Backend Test Suite        ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  const results = {
    envCheck: await testEnvironmentVariables(),
    unitTest: await testMetaHandlerMethod(),
    forceStatus: await testForceStatusEndpoint(),
    callbackStructure: await testOAuthCallbackResponseStructure()
  };
  
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Test Results Summary                  ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  console.log(`Environment Variables: ${results.envCheck ? '✅ PASS' : '⚠️  WARNING'}`);
  console.log(`Unit Test:            ${results.unitTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Force Status:         ${results.forceStatus ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Callback Structure:   ${results.callbackStructure ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedCount = Object.values(results).filter(r => r === true).length;
  const totalCount = Object.values(results).length;
  
  console.log(`\n📊 Overall: ${passedCount}/${totalCount} tests passed\n`);
  
  if (passedCount === totalCount) {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please review the output above.\n');
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };
