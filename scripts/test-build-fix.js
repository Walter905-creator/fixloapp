#!/usr/bin/env node

/**
 * Test Build Metadata Fix
 * Tests that the BUILD_ID placeholder replacement issue is resolved
 */

const fs = require('fs');
const path = require('path');

function testBuildMetadataFix() {
  console.log('🧪 Testing BUILD_ID placeholder replacement fix...\n');
  
  const indexPath = path.join(__dirname, '..', 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.error('❌ index.html not found at:', indexPath);
    process.exit(1);
  }
  
  const content = fs.readFileSync(indexPath, 'utf8');
  
  // Test 1: No unreplaced placeholders
  console.log('Test 1: Checking for unreplaced placeholders...');
  const unreplacedPlaceholders = content.match(/%REACT_APP_[^%]+%/g);
  
  if (unreplacedPlaceholders) {
    console.error('❌ FAIL: Found unreplaced placeholders:', unreplacedPlaceholders);
    return false;
  }
  console.log('✅ PASS: No unreplaced placeholders found');
  
  // Test 2: BUILD_ID is properly formatted
  console.log('\nTest 2: Checking BUILD_ID format...');
  const buildIdMatch = content.match(/BUILD_ID:"([^"]+)"/);
  
  if (!buildIdMatch) {
    console.error('❌ FAIL: BUILD_ID not found in HTML');
    return false;
  }
  
  const buildId = buildIdMatch[1];
  const buildIdPattern = /^\d{8}-\d{6}$/; // YYYYMMDD-HHMMSS format
  
  if (!buildIdPattern.test(buildId)) {
    console.error(`❌ FAIL: BUILD_ID "${buildId}" is not in expected format YYYYMMDD-HHMMSS`);
    return false;
  }
  
  console.log(`✅ PASS: BUILD_ID "${buildId}" is properly formatted`);
  
  // Test 3: COMMIT_SHA is present
  console.log('\nTest 3: Checking COMMIT_SHA...');
  const commitShaMatch = content.match(/COMMIT_SHA:"([^"]*)"/);
  
  if (!commitShaMatch) {
    console.error('❌ FAIL: COMMIT_SHA not found in HTML');
    return false;
  }
  
  const commitSha = commitShaMatch[1];
  console.log(`✅ PASS: COMMIT_SHA "${commitSha}" found`);
  
  // Test 4: Meta tags are correct
  console.log('\nTest 4: Checking meta tags...');
  const metaBuildIdMatch = content.match(/name="fixlo-build-id" content="([^"]+)"/);
  
  if (!metaBuildIdMatch) {
    console.error('❌ FAIL: fixlo-build-id meta tag not found');
    return false;
  }
  
  if (metaBuildIdMatch[1] !== buildId) {
    console.error(`❌ FAIL: Meta tag BUILD_ID "${metaBuildIdMatch[1]}" does not match console log BUILD_ID "${buildId}"`);
    return false;
  }
  
  console.log('✅ PASS: Meta tag BUILD_ID matches console log BUILD_ID');
  
  console.log('\n🎉 All tests passed! BUILD_ID placeholder replacement issue is resolved.');
  return true;
}

if (require.main === module) {
  const success = testBuildMetadataFix();
  process.exit(success ? 0 : 1);
}

module.exports = { testBuildMetadataFix };