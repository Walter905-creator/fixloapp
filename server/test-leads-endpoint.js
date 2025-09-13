// Simple test for /api/leads endpoint to prevent regression
// Run with: node test-leads-endpoint.js

const http = require('http');

function makeRequest(data) {
  const postData = JSON.stringify(data);
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/leads',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: JSON.parse(body)
        });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('Testing /api/leads endpoint...\n');

  // Test 1: Empty city should work (main fix)
  try {
    const result1 = await makeRequest({
      name: "Test User",
      phone: "555-1234",
      service: "plumbing",
      city: ""
    });
    
    if (result1.statusCode === 200 && result1.data.success) {
      console.log('✅ Test 1 PASSED: Empty city accepted');
    } else {
      console.log('❌ Test 1 FAILED: Empty city rejected');
      console.log('Response:', result1);
    }
  } catch (err) {
    console.log('❌ Test 1 ERROR:', err.message);
  }

  // Test 2: Missing city should work
  try {
    const result2 = await makeRequest({
      name: "Test User 2",
      phone: "555-5678",
      service: "electrical"
    });
    
    if (result2.statusCode === 200 && result2.data.success) {
      console.log('✅ Test 2 PASSED: Missing city accepted');
    } else {
      console.log('❌ Test 2 FAILED: Missing city rejected');
      console.log('Response:', result2);
    }
  } catch (err) {
    console.log('❌ Test 2 ERROR:', err.message);
  }

  // Test 3: Valid city should work
  try {
    const result3 = await makeRequest({
      name: "Test User 3",
      phone: "555-9999",
      service: "hvac",
      city: "New York"
    });
    
    if (result3.statusCode === 200 && result3.data.success) {
      console.log('✅ Test 3 PASSED: Valid city accepted');
    } else {
      console.log('❌ Test 3 FAILED: Valid city rejected');
      console.log('Response:', result3);
    }
  } catch (err) {
    console.log('❌ Test 3 ERROR:', err.message);
  }

  // Test 4: Missing required fields should fail
  try {
    const result4 = await makeRequest({
      name: "Test User 4",
      service: "plumbing"
      // Missing phone
    });
    
    if (result4.statusCode === 400 && !result4.data.success) {
      console.log('✅ Test 4 PASSED: Missing phone properly rejected');
    } else {
      console.log('❌ Test 4 FAILED: Missing phone not rejected');
      console.log('Response:', result4);
    }
  } catch (err) {
    console.log('❌ Test 4 ERROR:', err.message);
  }

  console.log('\nTests completed.');
}

runTests().catch(console.error);