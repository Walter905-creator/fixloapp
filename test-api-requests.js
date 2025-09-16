#!/usr/bin/env node

// Simple validation test for the new /api/requests endpoint
const API_BASE = 'http://localhost:3001';

async function testEndpoint(testName, payload, expectedStatus = 201) {
  console.log(`\n🧪 Testing: ${testName}`);
  console.log(`📤 Payload:`, JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(`${API_BASE}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
    
    console.log(`📥 Status: ${response.status} (expected: ${expectedStatus})`);
    console.log(`📥 Response:`, responseData);
    
    if (response.status === expectedStatus) {
      console.log(`✅ ${testName}: PASSED`);
      return true;
    } else {
      console.log(`❌ ${testName}: FAILED`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${testName}: ERROR - ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting API Endpoint Tests...\n');
  
  const tests = [
    // Valid request test
    {
      name: 'Valid complete request',
      payload: {
        serviceType: 'plumbing',
        fullName: 'Jane Smith',
        phone: '(555) 987-6543',
        city: 'Orlando',
        state: 'FL',
        smsConsent: true,
        details: 'Kitchen sink is clogged and water backing up'
      },
      expectedStatus: 201
    },
    
    // Missing required field tests
    {
      name: 'Missing phone field',
      payload: {
        serviceType: 'electrical',
        fullName: 'Bob Johnson',
        city: 'Tampa',
        state: 'FL',
        smsConsent: true
      },
      expectedStatus: 400
    },
    
    // SMS consent validation
    {
      name: 'Missing SMS consent',
      payload: {
        serviceType: 'hvac',
        fullName: 'Alice Brown',
        phone: '555-234-5678',
        city: 'Jacksonville',
        state: 'FL'
      },
      expectedStatus: 400
    },
    
    // Invalid phone test
    {
      name: 'Invalid phone number',
      payload: {
        serviceType: 'painting',
        fullName: 'Mike Wilson',
        phone: '123',
        city: 'Miami',
        state: 'FL',
        smsConsent: false
      },
      expectedStatus: 400
    }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const result = await testEndpoint(test.name, test.payload, test.expectedStatus);
    if (result) passed++;
  }
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

runTests().catch(console.error);