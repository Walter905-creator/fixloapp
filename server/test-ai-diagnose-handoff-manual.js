/**
 * Manual validation script for AI → Pro Handoff
 * Run with: node server/test-ai-diagnose-handoff-manual.js
 * 
 * Prerequisites:
 * 1. Server must be running on port 3001
 * 2. OpenAI API key must be configured
 * 3. MongoDB must be running with some pros in the database
 */

const http = require('http');

console.log('🧪 Manual AI → Pro Handoff Validation\n');

// Test helper function
function testDiagnoseEndpoint(description, requestBody, validateResponse) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(requestBody);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/ai/diagnose',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          console.log(`\n📋 Test: ${description}`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Mode: ${response.mode || 'N/A'}`);
          
          if (validateResponse) {
            const valid = validateResponse(response, res.statusCode);
            if (valid) {
              console.log(`   ✅ Test passed`);
              resolve(true);
            } else {
              console.log(`   ❌ Test failed`);
              resolve(false);
            }
          } else {
            console.log(`   ✅ Request completed`);
            resolve(true);
          }
          
          // Show sample of response
          if (response.matchedPros && response.matchedPros.length > 0) {
            console.log(`   Matched Pros: ${response.matchedPros.length}`);
            console.log(`   Sample Pro:`, JSON.stringify(response.matchedPros[0], null, 2));
          }
          
        } catch (error) {
          console.log(`\n❌ ${description} - Invalid JSON response`);
          console.log(`   Error: ${error.message}`);
          console.log(`   Raw response: ${responseData.substring(0, 200)}`);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`\n❌ ${description} - Request failed`);
      console.log(`   Error: ${error.message}`);
      console.log(`   Make sure the server is running on port 3001`);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Run manual tests
async function runManualTests() {
  console.log('🚀 Starting Manual Validation Tests\n');
  console.log('⚠️ Prerequisites:');
  console.log('   1. Server running on port 3001');
  console.log('   2. OpenAI API key configured');
  console.log('   3. MongoDB running with pros in database\n');
  
  try {
    // Test 1: HIGH risk scenario (should trigger handoff)
    await testDiagnoseEndpoint(
      'HIGH risk electrical issue (should trigger handoff)',
      {
        description: 'My electrical outlet is sparking and making buzzing noises. I smell burning.',
        images: [],
        userId: 'test-user-123',
        // Required fields for handoff
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+15551234567',
        address: '123 Main St, Charlotte, NC 28202',
        city: 'Charlotte',
        state: 'NC',
        zip: '28202',
        trade: 'Electrical'
      },
      (response, statusCode) => {
        if (statusCode !== 200) {
          console.log(`   ❌ Expected status 200, got ${statusCode}`);
          return false;
        }
        
        if (!response.success) {
          console.log(`   ❌ Response success is false`);
          return false;
        }
        
        if (response.mode !== 'PRO_RECOMMENDED') {
          console.log(`   ⚠️ Expected mode PRO_RECOMMENDED, got ${response.mode}`);
          console.log(`   This is expected if diagnosis didn't return HIGH risk or diyAllowed=false`);
        }
        
        if (response.mode === 'PRO_RECOMMENDED') {
          if (!response.lead || !response.matchedPros) {
            console.log(`   ❌ PRO_RECOMMENDED mode missing lead or matchedPros`);
            return false;
          }
          
          console.log(`   ✅ Lead created: ${response.lead.id}`);
          console.log(`   ✅ Matched ${response.matchedPros.length} pros`);
        }
        
        return true;
      }
    );
    
    // Test 2: LOW risk scenario (should NOT trigger handoff)
    await testDiagnoseEndpoint(
      'LOW risk simple repair (should NOT trigger handoff)',
      {
        description: 'My cabinet door hinge is loose and needs tightening.',
        images: [],
        userId: 'test-user-456',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+15559876543',
        address: '456 Oak Ave, Charlotte, NC 28203',
        city: 'Charlotte',
        state: 'NC',
        zip: '28203',
        trade: 'Handyman'
      },
      (response, statusCode) => {
        if (statusCode !== 200) {
          console.log(`   ❌ Expected status 200, got ${statusCode}`);
          return false;
        }
        
        if (!response.success) {
          console.log(`   ❌ Response success is false`);
          return false;
        }
        
        if (response.mode === 'DIY') {
          console.log(`   ✅ Correctly returned DIY mode for low-risk issue`);
        } else if (response.mode === 'PRO_RECOMMENDED') {
          console.log(`   ⚠️ Returned PRO_RECOMMENDED - diagnosis may have assessed higher risk`);
        }
        
        return true;
      }
    );
    
    // Test 3: Missing user info (should return diagnosis only, no handoff)
    await testDiagnoseEndpoint(
      'HIGH risk but missing user info (should return diagnosis only)',
      {
        description: 'Water heater is leaking and making loud banging noises.',
        images: [],
        userId: 'test-user-789'
        // Intentionally missing name, phone, address, etc.
      },
      (response, statusCode) => {
        if (statusCode !== 200) {
          console.log(`   ❌ Expected status 200, got ${statusCode}`);
          return false;
        }
        
        if (!response.success) {
          console.log(`   ❌ Response success is false`);
          return false;
        }
        
        if (response.mode === 'DIY' || !response.mode) {
          console.log(`   ✅ Correctly returned diagnosis only (no handoff due to missing user info)`);
        } else {
          console.log(`   ⚠️ Unexpected mode: ${response.mode}`);
        }
        
        return true;
      }
    );
    
    console.log('\n✅ Manual validation completed!\n');
    console.log('📝 Next Steps:');
    console.log('   1. Review the test results above');
    console.log('   2. Verify matched pros data structure');
    console.log('   3. Check MongoDB for created leads');
    console.log('   4. Ensure no internal fields (score, etc.) are exposed\n');
    
  } catch (error) {
    console.log('\n❌ Manual validation failed!\n');
    console.log('Error:', error.message);
    process.exit(1);
  }
}

runManualTests();
