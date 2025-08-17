#!/usr/bin/env node

/**
 * Test FIXLO BUILD Placeholder Handling
 * Ensures that placeholder strings and 'unknown' values in FIXLO BUILD format are properly handled
 */

const { parseBuildMetadata } = require('./set-build-metadata');

function testFixloBuildPlaceholders() {
  console.log('🧪 Testing FIXLO BUILD placeholder handling...\n');
  
  // Test 1: The specific problem case from the issue
  console.log('Test 1: Problem case - unknown BUILD_ID and VERCEL placeholder COMMIT_SHA');
  try {
    const problemString = "FIXLO BUILD {BUILD_ID: 'unknown', COMMIT_SHA: '${VERCEL_GIT_COMMIT_SHA}'}";
    const result = parseBuildMetadata(problemString);
    
    // BUILD_ID should be replaced with timestamp
    if (result.BUILD_ID !== 'unknown' && result.BUILD_ID.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      console.log('✅ PASS: BUILD_ID placeholder replaced with timestamp');
    } else {
      console.log('❌ FAIL: BUILD_ID not properly replaced');
      console.log('Got BUILD_ID:', result.BUILD_ID);
      return false;
    }
    
    // COMMIT_SHA should be 'unknown' (safe fallback)
    if (result.COMMIT_SHA === 'unknown') {
      console.log('✅ PASS: COMMIT_SHA placeholder replaced with safe fallback');
    } else {
      console.log('❌ FAIL: COMMIT_SHA not properly replaced');
      console.log('Got COMMIT_SHA:', result.COMMIT_SHA);
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Problem case test - Error:', error.message);
    return false;
  }
  
  // Test 2: Various placeholder patterns
  console.log('\nTest 2: Different placeholder patterns');
  const placeholderTests = [
    {
      input: "FIXLO BUILD {BUILD_ID: '%BUILD_ID%', COMMIT_SHA: '%COMMIT_SHA%'}",
      description: "Windows-style placeholders"
    },
    {
      input: "FIXLO BUILD {BUILD_ID: '${BUILD_ID}', COMMIT_SHA: '${COMMIT_SHA}'}",
      description: "Bash-style placeholders"
    },
    {
      input: "FIXLO BUILD {BUILD_ID: ' ', COMMIT_SHA: ' '}",
      description: "Whitespace-only strings"
    }
  ];
  
  for (const test of placeholderTests) {
    try {
      const result = parseBuildMetadata(test.input);
      
      // Both should be replaced with safe fallbacks
      if (result.BUILD_ID !== '' && 
          result.BUILD_ID.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) &&
          result.COMMIT_SHA === 'unknown') {
        console.log(`✅ PASS: ${test.description}`);
      } else {
        console.log(`❌ FAIL: ${test.description}`);
        console.log('Result:', result);
        return false;
      }
    } catch (error) {
      console.log(`❌ FAIL: ${test.description} - Error:`, error.message);
      return false;
    }
  }
  
  // Test 3: Valid values should pass through unchanged
  console.log('\nTest 3: Valid values should pass through unchanged');
  try {
    const validString = "FIXLO BUILD {BUILD_ID: '2025-08-17T12:34:56', COMMIT_SHA: 'abc123def456'}";
    const result = parseBuildMetadata(validString);
    
    if (result.BUILD_ID === '2025-08-17T12:34:56' && result.COMMIT_SHA === 'abc123def456') {
      console.log('✅ PASS: Valid values pass through unchanged');
    } else {
      console.log('❌ FAIL: Valid values were modified');
      console.log('Result:', result);
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Valid values test - Error:', error.message);
    return false;
  }
  
  // Test 4: 'unknown' COMMIT_SHA should be preserved (it's a valid fallback)
  console.log('\nTest 4: Valid unknown COMMIT_SHA should be preserved');
  try {
    const unknownCommitString = "FIXLO BUILD {BUILD_ID: '2025-08-17T12:34:56', COMMIT_SHA: 'unknown'}";
    const result = parseBuildMetadata(unknownCommitString);
    
    if (result.BUILD_ID === '2025-08-17T12:34:56' && result.COMMIT_SHA === 'unknown') {
      console.log('✅ PASS: Valid unknown COMMIT_SHA preserved');
    } else {
      console.log('❌ FAIL: Valid unknown COMMIT_SHA was modified');
      console.log('Result:', result);
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Valid unknown COMMIT_SHA test - Error:', error.message);
    return false;
  }
  
  console.log('\n🎉 All FIXLO BUILD placeholder tests passed!');
  console.log('   - Placeholder strings are properly detected and replaced');
  console.log('   - Unknown BUILD_ID values are replaced with timestamps');
  console.log('   - Placeholder COMMIT_SHA values are replaced with safe fallbacks');
  console.log('   - Valid values pass through unchanged');
  
  return true;
}

if (require.main === module) {
  const success = testFixloBuildPlaceholders();
  process.exit(success ? 0 : 1);
}

module.exports = { testFixloBuildPlaceholders };