// Unit tests for /api/requests endpoint
// Run with: cd server && node test-requests.js

const http = require('http');

const API_BASE = 'http://localhost:3001';

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = res.headers['content-type']?.includes('json') ? JSON.parse(responseData) : responseData;
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Running /api/requests endpoint tests...\n');

  // Test 1: Valid request should return 201
  console.log('Test 1: Valid request');
  try {
    const response = await makeRequest('POST', '/api/requests', {
      serviceType: 'Plumbing',
      fullName: 'Test User',
      phone: '555-123-4567',
      city: 'New York',
      state: 'NY',
      smsConsent: true,
      details: 'Test request'
    });
    
    if (response.status === 201 && response.data.ok) {
      console.log('✅ PASS: Valid request returns 201 with success response');
      console.log(`   Request ID: ${response.data.requestId}`);
    } else {
      console.log('❌ FAIL: Expected 201 with ok:true, got:', response);
    }
  } catch (error) {
    console.log('❌ FAIL: Request failed:', error.message);
  }

  console.log();

  // Test 2: Missing phone should return 400
  console.log('Test 2: Missing required field (phone)');
  try {
    const response = await makeRequest('POST', '/api/requests', {
      serviceType: 'Plumbing',
      fullName: 'Test User',
      city: 'New York',
      state: 'NY',
      smsConsent: true
    });
    
    if (response.status === 400 && response.data.includes('required fields')) {
      console.log('✅ PASS: Missing phone returns 400 with validation error');
      console.log(`   Error: ${response.data}`);
    } else {
      console.log('❌ FAIL: Expected 400 with validation error, got:', response);
    }
  } catch (error) {
    console.log('❌ FAIL: Request failed:', error.message);
  }

  console.log();

  // Test 3: Missing SMS consent should return 400
  console.log('Test 3: Missing SMS consent');
  try {
    const response = await makeRequest('POST', '/api/requests', {
      serviceType: 'Plumbing',
      fullName: 'Test User',
      phone: '555-123-4567',
      city: 'New York',
      state: 'NY',
      smsConsent: false
    });
    
    if (response.status === 400 && response.data.includes('SMS consent')) {
      console.log('✅ PASS: Missing SMS consent returns 400 with validation error');
      console.log(`   Error: ${response.data}`);
    } else {
      console.log('❌ FAIL: Expected 400 with SMS consent error, got:', response);
    }
  } catch (error) {
    console.log('❌ FAIL: Request failed:', error.message);
  }

  console.log();

  // Test 4: Invalid phone should return 400
  console.log('Test 4: Invalid phone number');
  try {
    const response = await makeRequest('POST', '/api/requests', {
      serviceType: 'Plumbing',
      fullName: 'Test User',
      phone: '123', // too short
      city: 'New York',
      state: 'NY',
      smsConsent: true
    });
    
    if (response.status === 400 && response.data.includes('Invalid phone')) {
      console.log('✅ PASS: Invalid phone returns 400 with validation error');
      console.log(`   Error: ${response.data}`);
    } else {
      console.log('❌ FAIL: Expected 400 with phone validation error, got:', response);
    }
  } catch (error) {
    console.log('❌ FAIL: Request failed:', error.message);
  }

  console.log('\n🎉 Test suite completed!');
}

// Run tests
runTests().catch(console.error);