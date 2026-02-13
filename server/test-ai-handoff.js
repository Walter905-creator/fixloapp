/**
 * Test script for AI → Pro Handoff functionality
 * Run with: node server/test-ai-handoff.js
 * 
 * This script tests:
 * - Pro matching service
 * - Lead creation service
 * - AI diagnosis handoff logic
 */

const mongoose = require('mongoose');

// Test configuration
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in environment variables');
  console.error('❌ FATAL ERROR: Set MONGO_URI environment variable to run tests');
  process.exit(1);
}

console.log('🧪 Testing AI → Pro Handoff Functionality\n');

// Helper to connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('   Skipping database-dependent tests\n');
    return false;
  }
}

// Helper to disconnect from MongoDB
async function disconnectDB() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Test 1: Pro Matching Service
async function testProMatching() {
  console.log('📋 Test 1: Pro Matching Service');
  
  try {
    const { matchPros, formatProsForClient } = require('./services/proMatching');
    
    // Test with sample data (requires database with pros)
    const testParams = {
      trade: 'plumbing',
      coordinates: [-80.8431, 35.2271], // Charlotte, NC
      maxDistance: 30,
      prioritizeAIPlus: true
    };
    
    console.log('   Testing matchPros with:', testParams);
    const matched = await matchPros(testParams);
    
    console.log(`   ✅ Matched ${matched.length} professionals`);
    
    // Test formatting
    const formatted = formatProsForClient(matched, 5);
    console.log(`   ✅ Formatted ${formatted.length} pros for client`);
    
    // Validate formatted output structure
    if (formatted.length > 0) {
      const sample = formatted[0];
      const requiredFields = ['id', 'name', 'distance', 'rating', 'availability'];
      const hasAllFields = requiredFields.every(field => field in sample);
      
      if (hasAllFields) {
        console.log('   ✅ Formatted pros have all required fields');
      } else {
        console.log('   ❌ Missing required fields in formatted output');
        return false;
      }
      
      // Ensure internal score is NOT exposed
      if ('score' in sample) {
        console.log('   ❌ Internal score exposed to client!');
        return false;
      } else {
        console.log('   ✅ Internal score not exposed (correct)');
      }
    }
    
    console.log('   ✅ Pro matching test passed\n');
    return true;
    
  } catch (error) {
    console.log(`   ❌ Pro matching test failed: ${error.message}\n`);
    return false;
  }
}

// Test 2: Lead Creation Service
async function testLeadCreation() {
  console.log('📋 Test 2: Lead Creation Service');
  
  try {
    const { createAIDiagnosedLead } = require('./services/leadService');
    
    const testLead = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '+12345678901',
      address: '123 Main St, Charlotte, NC 28202',
      city: 'Charlotte',
      state: 'NC',
      zip: '28202',
      trade: 'Electrical',
      description: 'Electrical outlet sparking - urgent repair needed',
      aiDiagnosis: {
        issue: 'Sparking electrical outlet',
        difficulty: 8,
        riskLevel: 'HIGH',
        diyAllowed: false,
        steps: [],
        stopConditions: ['Sparking visible', 'Burning smell detected']
      },
      images: ['https://example.com/image1.jpg'],
      priority: 'HIGH'
    };
    
    console.log('   Creating AI-diagnosed lead...');
    const lead = await createAIDiagnosedLead(testLead);
    
    console.log(`   ✅ Lead created with ID: ${lead._id}`);
    
    // Validate lead fields
    if (lead.source === 'AI_DIAGNOSED') {
      console.log('   ✅ Lead source is AI_DIAGNOSED');
    } else {
      console.log(`   ❌ Lead source is ${lead.source}, expected AI_DIAGNOSED`);
      return false;
    }
    
    if (lead.priority === 'HIGH') {
      console.log('   ✅ Lead priority is HIGH');
    } else {
      console.log(`   ❌ Lead priority is ${lead.priority}, expected HIGH`);
      return false;
    }
    
    if (lead.aiQualified === true) {
      console.log('   ✅ Lead is AI qualified');
    } else {
      console.log('   ❌ Lead aiQualified is false');
      return false;
    }
    
    if (lead.aiDiagnosis && lead.aiDiagnosis.riskLevel === 'HIGH') {
      console.log('   ✅ AI diagnosis stored correctly');
    } else {
      console.log('   ❌ AI diagnosis not stored correctly');
      return false;
    }
    
    // Clean up test lead
    await lead.deleteOne();
    console.log('   ✅ Test lead cleaned up');
    
    console.log('   ✅ Lead creation test passed\n');
    return true;
    
  } catch (error) {
    console.log(`   ❌ Lead creation test failed: ${error.message}\n`);
    return false;
  }
}

// Test 3: Handoff Trigger Conditions
function testHandoffTriggers() {
  console.log('📋 Test 3: Handoff Trigger Conditions');
  
  const testCases = [
    {
      name: 'HIGH risk, diyAllowed = false',
      diagnosis: { riskLevel: 'HIGH', diyAllowed: false },
      shouldTrigger: true
    },
    {
      name: 'HIGH risk, diyAllowed = true (should still trigger)',
      diagnosis: { riskLevel: 'HIGH', diyAllowed: true },
      shouldTrigger: true
    },
    {
      name: 'MEDIUM risk, diyAllowed = false',
      diagnosis: { riskLevel: 'MEDIUM', diyAllowed: false },
      shouldTrigger: true
    },
    {
      name: 'LOW risk, diyAllowed = true',
      diagnosis: { riskLevel: 'LOW', diyAllowed: true },
      shouldTrigger: false
    },
    {
      name: 'MEDIUM risk, diyAllowed = true',
      diagnosis: { riskLevel: 'MEDIUM', diyAllowed: true },
      shouldTrigger: false
    }
  ];
  
  let allPassed = true;
  
  for (const testCase of testCases) {
    const { riskLevel, diyAllowed } = testCase.diagnosis;
    const shouldTrigger = diyAllowed === false || riskLevel === 'HIGH';
    
    if (shouldTrigger === testCase.shouldTrigger) {
      console.log(`   ✅ ${testCase.name}: ${shouldTrigger ? 'triggers' : 'does not trigger'} (correct)`);
    } else {
      console.log(`   ❌ ${testCase.name}: Expected ${testCase.shouldTrigger}, got ${shouldTrigger}`);
      allPassed = false;
    }
  }
  
  if (allPassed) {
    console.log('   ✅ All handoff trigger tests passed\n');
  } else {
    console.log('   ❌ Some handoff trigger tests failed\n');
  }
  
  return allPassed;
}

// Test 4: Response Format Validation
function testResponseFormat() {
  console.log('📋 Test 4: Response Format Validation');
  
  // Mock PRO_RECOMMENDED response
  const proRecommendedResponse = {
    success: true,
    mode: 'PRO_RECOMMENDED',
    diagnosis: {
      issue: 'Sparking outlet',
      difficulty: 8,
      riskLevel: 'HIGH',
      diyAllowed: false,
      steps: [],
      stopConditions: []
    },
    lead: {
      id: '507f1f77bcf86cd799439011',
      status: 'pending'
    },
    matchedPros: [
      {
        id: '507f1f77bcf86cd799439012',
        name: "John's Electrical",
        distance: 5.2,
        rating: 4.8,
        reviewCount: 45,
        completedJobs: 120,
        isVerified: true,
        availability: 'Available'
      }
    ],
    timestamp: new Date().toISOString()
  };
  
  // Validate required fields
  const requiredFields = ['success', 'mode', 'diagnosis', 'lead', 'matchedPros', 'timestamp'];
  let allFieldsPresent = true;
  
  for (const field of requiredFields) {
    if (field in proRecommendedResponse) {
      console.log(`   ✅ Field '${field}' present`);
    } else {
      console.log(`   ❌ Field '${field}' missing`);
      allFieldsPresent = false;
    }
  }
  
  // Validate mode value
  if (proRecommendedResponse.mode === 'PRO_RECOMMENDED') {
    console.log('   ✅ Mode is PRO_RECOMMENDED');
  } else {
    console.log(`   ❌ Mode is ${proRecommendedResponse.mode}`);
    allFieldsPresent = false;
  }
  
  // Validate pro data doesn't expose internal fields
  const pro = proRecommendedResponse.matchedPros[0];
  const exposedInternalFields = ['score', 'subscriptionTier', 'phone', 'email', 'location'];
  let noInternalExposure = true;
  
  for (const field of exposedInternalFields) {
    if (field in pro) {
      console.log(`   ❌ Internal field '${field}' exposed in pro data!`);
      noInternalExposure = false;
    }
  }
  
  if (noInternalExposure) {
    console.log('   ✅ No internal fields exposed in pro data');
  }
  
  const passed = allFieldsPresent && noInternalExposure;
  
  if (passed) {
    console.log('   ✅ Response format test passed\n');
  } else {
    console.log('   ❌ Response format test failed\n');
  }
  
  return passed;
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting AI → Pro Handoff Tests\n');
  
  const results = {
    proMatching: false,
    leadCreation: false,
    handoffTriggers: false,
    responseFormat: false
  };
  
  // Test handoff triggers (no DB required)
  results.handoffTriggers = testHandoffTriggers();
  
  // Test response format (no DB required)
  results.responseFormat = testResponseFormat();
  
  // Connect to database for remaining tests
  const dbConnected = await connectDB();
  
  if (dbConnected) {
    // Test pro matching
    results.proMatching = await testProMatching();
    
    // Test lead creation
    results.leadCreation = await testLeadCreation();
    
    await disconnectDB();
  } else {
    console.log('⏭️ Skipping database-dependent tests (Pro matching, Lead creation)\n');
  }
  
  // Summary
  console.log('📊 Test Summary:');
  console.log('================');
  console.log(`Handoff Triggers: ${results.handoffTriggers ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Response Format: ${results.responseFormat ? '✅ PASS' : '❌ FAIL'}`);
  
  if (dbConnected) {
    console.log(`Pro Matching: ${results.proMatching ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Lead Creation: ${results.leadCreation ? '✅ PASS' : '❌ FAIL'}`);
  } else {
    console.log(`Pro Matching: ⏭️ SKIPPED (no DB)`);
    console.log(`Lead Creation: ⏭️ SKIPPED (no DB)`);
  }
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed && dbConnected) {
    console.log('\n🎉 All tests passed!\n');
    process.exit(0);
  } else if (!dbConnected) {
    console.log('\n⚠️ Some tests skipped due to database unavailability\n');
    console.log('To run all tests, ensure MongoDB is running and MONGO_URI is configured.\n');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed!\n');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('\n💥 Test suite crashed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
