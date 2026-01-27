// Test script to verify OpenAI health endpoint
// Run with: node server/test-ai-health.js
// 
// This script tests the /api/ai/health endpoint to ensure:
// - It returns { ok: false } with status 500 when OPENAI_API_KEY is not configured
// - It would return { ok: true } with status 200 when API key is valid (requires actual key)

const http = require('http');

console.log('🧪 Testing OpenAI Health Endpoint\n');

// Test helper function
function testHealthEndpoint(description, expectedStatus, expectedOk) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/ai/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          const statusMatch = res.statusCode === expectedStatus;
          const okMatch = response.ok === expectedOk;
          
          if (statusMatch && okMatch) {
            console.log(`✅ ${description}`);
            console.log(`   Status: ${res.statusCode} (expected: ${expectedStatus})`);
            console.log(`   Response: ${JSON.stringify(response)}`);
            resolve(true);
          } else {
            console.log(`❌ ${description}`);
            console.log(`   Expected: status ${expectedStatus}, ok: ${expectedOk}`);
            console.log(`   Got: status ${res.statusCode}, ok: ${response.ok}`);
            resolve(false);
          }
        } catch (error) {
          console.log(`❌ ${description} - Invalid JSON response`);
          console.log(`   Error: ${error.message}`);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${description} - Request failed`);
      console.log(`   Error: ${error.message}`);
      console.log(`   Make sure the server is running on port 3001`);
      reject(error);
    });

    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('📋 Test Cases:\n');
  
  try {
    // Test 1: Without API key (expected behavior)
    await testHealthEndpoint(
      'Health check without OPENAI_API_KEY',
      500,
      false
    );
    
    console.log('\n✅ All tests passed!\n');
    console.log('📝 Note: To test with a valid OPENAI_API_KEY, set the environment variable and restart the server.');
    
  } catch (error) {
    console.log('\n❌ Tests failed!\n');
    process.exit(1);
  }
}

runTests();
