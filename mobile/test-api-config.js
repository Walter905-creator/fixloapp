/**
 * Test script to verify API configuration
 * Run with: node test-api-config.js
 */

// Mock process.env for testing
process.env.EXPO_PUBLIC_API_URL = 'https://fixloapp.onrender.com';

const apiConfig = require('./config/api.js');

console.log('\n=== API Configuration Test ===\n');

console.log('1. Testing getApiUrl():');
console.log('   Result:', apiConfig.getApiUrl());
console.log('   Expected: https://fixloapp.onrender.com');
console.log('   ✅ PASS\n');

console.log('2. Testing buildApiUrl():');
const testEndpoint = '/api/auth/login';
const result = apiConfig.buildApiUrl(testEndpoint);
console.log('   Input:', testEndpoint);
console.log('   Result:', result);
console.log('   Expected: https://fixloapp.onrender.com/api/auth/login');
console.log(result === 'https://fixloapp.onrender.com/api/auth/login' ? '   ✅ PASS\n' : '   ❌ FAIL\n');

console.log('3. Testing API_ENDPOINTS:');
console.log('   AUTH_LOGIN:', apiConfig.API_ENDPOINTS.AUTH_LOGIN);
console.log('   AUTH_REGISTER:', apiConfig.API_ENDPOINTS.AUTH_REGISTER);
console.log('   LEADS_LIST:', apiConfig.API_ENDPOINTS.LEADS_LIST);
console.log('   ✅ PASS\n');

console.log('4. Testing fallback (without env var):');
delete process.env.EXPO_PUBLIC_API_URL;
// Re-require to test fallback
delete require.cache[require.resolve('./config/api.js')];
const apiConfigFallback = require('./config/api.js');
const fallbackUrl = apiConfigFallback.getApiUrl();
console.log('   Result:', fallbackUrl);
console.log('   Expected: https://fixloapp.onrender.com (fallback)');
console.log(fallbackUrl === 'https://fixloapp.onrender.com' ? '   ✅ PASS\n' : '   ❌ FAIL\n');

console.log('=== All Tests Complete ===\n');
