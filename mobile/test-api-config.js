/**
 * Test script to verify API configuration
 * Run with: node test-api-config.js
 */

// Mock process.env for testing
process.env.EXPO_PUBLIC_API_URL = 'https://fixloapp.onrender.com';

const apiConfig = require('./config/api.js');

console.log('1. Testing getApiUrl():');
console.log('   Result:', apiConfig.getApiUrl());


console.log('2. Testing buildApiUrl():');
const testEndpoint = '/api/auth/login';
const result = apiConfig.buildApiUrl(testEndpoint);








console.log('4. Testing fallback (without env var):');
delete process.env.EXPO_PUBLIC_API_URL;
// Re-require to test fallback
delete require.cache[require.resolve('./config/api.js')];
const apiConfigFallback = require('./config/api.js');
const fallbackUrl = apiConfigFallback.getApiUrl();

console.log('   Expected: https://fixloapp.onrender.com (fallback)');
