/**
 * Version Bump Script Tests
 * Tests the version bumping functionality
 */

console.log('🧪 Running Version Bump Script Tests...\n');

// Test 1: Check that bumpVersion module exports expected functions
console.log('Test 1: Version Bump Module Exports');
try {
  const bumpVersion = require('../scripts/bumpVersion');
  const requiredExports = [
    'incrementPatchVersion',
    'readConfigFile',
    'updateConfigFile'
  ];
  
  const missingExports = requiredExports.filter(exp => typeof bumpVersion[exp] !== 'function');
  if (missingExports.length > 0) {
    throw new Error(`Missing exports: ${missingExports.join(', ')}`);
  }
  console.log('✅ All version bump functions exported correctly');
} catch (error) {
  console.error('❌ Version bump module test failed:', error.message);
  process.exit(1);
}

// Test 2: Test incrementPatchVersion function
console.log('\nTest 2: Increment Patch Version');
try {
  const { incrementPatchVersion } = require('../scripts/bumpVersion');
  
  const testCases = [
    { input: '1.0.0', expected: '1.0.1' },
    { input: '1.0.9', expected: '1.0.10' },
    { input: '2.5.99', expected: '2.5.100' },
    { input: '1.0.2', expected: '1.0.3' }
  ];
  
  for (const testCase of testCases) {
    const result = incrementPatchVersion(testCase.input);
    if (result !== testCase.expected) {
      throw new Error(`incrementPatchVersion("${testCase.input}") returned "${result}", expected "${testCase.expected}"`);
    }
  }
  console.log('✅ All version increment tests passed');
} catch (error) {
  console.error('❌ Version increment test failed:', error.message);
  process.exit(1);
}

// Test 3: Test invalid version format handling
console.log('\nTest 3: Invalid Version Format Handling');
try {
  const { incrementPatchVersion } = require('../scripts/bumpVersion');
  
  const invalidVersions = ['1.0', '1', 'abc', '1.0.0.0'];
  let errorThrown = false;
  
  for (const invalidVersion of invalidVersions) {
    try {
      incrementPatchVersion(invalidVersion);
    } catch (error) {
      errorThrown = true;
      if (!error.message.includes('Invalid version format')) {
        throw new Error(`Expected error message to include "Invalid version format" but got: ${error.message}`);
      }
    }
    
    if (!errorThrown) {
      throw new Error(`incrementPatchVersion("${invalidVersion}") should have thrown an error`);
    }
    errorThrown = false;
  }
  
  console.log('✅ Invalid version formats properly rejected');
} catch (error) {
  console.error('❌ Invalid version format test failed:', error.message);
  process.exit(1);
}

// Test 4: Verify script file exists and is executable
console.log('\nTest 4: Script File Validation');
try {
  const fs = require('fs');
  const path = require('path');
  const scriptPath = path.join(__dirname, '..', 'scripts', 'bumpVersion.js');
  
  if (!fs.existsSync(scriptPath)) {
    throw new Error('bumpVersion.js script file does not exist');
  }
  
  const stats = fs.statSync(scriptPath);
  if (!stats.isFile()) {
    throw new Error('bumpVersion.js is not a file');
  }
  
  console.log('✅ Script file exists and is valid');
} catch (error) {
  console.error('❌ Script file validation failed:', error.message);
  process.exit(1);
}

console.log('\n🎉 All version bump tests passed!\n');
