#!/usr/bin/env node

/**
 * VERIFICATION SCRIPT: Test Lead Creation for Walter Arevalo
 * 
 * This script tests lead creation through /api/leads endpoint to verify
 * that Walter Arevalo would receive SMS notifications after Pro activation.
 */

const http = require('http');
require('dotenv').config();

console.log('🧪 WALTER AREVALO LEAD VERIFICATION TEST');
console.log('=' .repeat(60));

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
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            data: parsedData
          });
        } catch (err) {
          resolve({
            statusCode: res.statusCode,
            data: body,
            parseError: err.message
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(postData);
    req.end();
  });
}

async function testLeadCreation() {
  console.log('🚀 Starting lead verification tests...\n');
  
  // Test lead creation for Walter's service area (Charlotte, NC)
  const testLead = {
    fullName: "Test Customer for Walter",
    phone: "+19199999999", // Test phone number
    email: "testcustomer@example.com",
    serviceType: "handyman", // Walter's trade
    address: "Charlotte, NC",
    city: "Charlotte", 
    state: "NC",
    description: "Test job request for Walter Arevalo - handyman services needed",
    smsConsent: true
  };
  
  console.log('📝 TEST LEAD DATA');
  console.log('-' .repeat(30));
  console.log(`👤 Customer: ${testLead.fullName}`);
  console.log(`📱 Phone: ${testLead.phone}`);
  console.log(`🔧 Service: ${testLead.serviceType}`);
  console.log(`📍 Location: ${testLead.address}`);
  
  try {
    console.log('\n⚡ Submitting lead to /api/leads...');
    
    const result = await makeRequest(testLead);
    
    console.log('\n📊 RESPONSE RECEIVED');
    console.log('-' .repeat(30));
    console.log(`🌐 Status Code: ${result.statusCode}`);
    
    if (result.parseError) {
      console.log(`❌ Parse Error: ${result.parseError}`);
      console.log(`📄 Raw Response: ${result.data}`);
    } else {
      console.log(`✅ Success: ${result.data.success || false}`);
      console.log(`📄 Message: ${result.data.message || 'No message'}`);
      
      if (result.data.leadId) {
        console.log(`🆔 Lead ID: ${result.data.leadId}`);
      }
      
      if (result.data.prosNotified) {
        console.log(`👨‍🔧 Pros Notified: ${result.data.prosNotified}`);
      }
    }
    
    console.log('\n🔍 VERIFICATION ANALYSIS');
    console.log('-' .repeat(30));
    
    if (result.statusCode === 200 || result.statusCode === 201) {
      console.log('✅ Lead submission endpoint is working');
      
      if (result.data.success) {
        console.log('✅ Lead was successfully processed');
        
        if (result.data.prosNotified && result.data.prosNotified > 0) {
          console.log('✅ SMS notifications were sent to matching pros');
          console.log('📲 Walter should receive SMS if activated and in Charlotte, NC');
        } else {
          console.log('⚠️  No pros were notified (expected if Walter not activated yet)');
        }
      } else {
        console.log('❌ Lead processing failed');
      }
    } else {
      console.log(`❌ Lead submission failed with status ${result.statusCode}`);
    }
    
    console.log('\n📋 NEXT STEPS FOR VERIFICATION');
    console.log('-' .repeat(30));
    console.log('1. Activate Walter using: npm run activate-owner-pro');
    console.log('2. Re-run this test: node scripts/test-walter-lead.js');
    console.log('3. Check Walter receives SMS at +1 516-444-9953');
    console.log('4. Verify lead appears in Pro dashboard');
    
  } catch (error) {
    console.log('\n❌ REQUEST FAILED');
    console.log('-' .repeat(30));
    console.log(`💥 Error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 TROUBLESHOOTING');
      console.log('-' .repeat(30));
      console.log('• Make sure server is running: cd server && npm start');
      console.log('• Server should be listening on port 3001');
      console.log('• Check server logs for connection issues');
    }
  }
}

async function checkServerHealth() {
  console.log('🏥 Checking server health...');
  
  try {
    const healthResult = await makeRequest({});
    // This will fail because it's a GET request on a POST endpoint
    // but we just want to see if the server is reachable
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running on port 3001');
      console.log('   Start server with: cd server && npm start');
      return false;
    }
  }
  
  // Try the health endpoint
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET',
      timeout: 5000
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Server is running and healthy');
          resolve(true);
        } else {
          console.log(`⚠️  Server responded with status ${res.statusCode}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', () => {
      console.log('❌ Server health check failed');
      resolve(false);
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log('❌ Server health check timeout');
      resolve(false);
    });
    
    req.end();
  });
}

// Run the tests
if (require.main === module) {
  checkServerHealth()
    .then(serverHealthy => {
      if (serverHealthy) {
        return testLeadCreation();
      } else {
        console.log('\n🛑 Cannot run tests - server not available');
        console.log('   Start server with: cd server && npm start');
        process.exit(1);
      }
    })
    .then(() => process.exit(0))
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testLeadCreation };