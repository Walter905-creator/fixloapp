/**
 * Version Bump Script Tests
 * Tests the version bumping functionality
 */

// Test 1: Check that bumpVersion module exports expected functions

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

} catch (error) {
  if (__DEV__) {
  console.error('❌ Version bump module test failed:', error.message);
  }
  process.exit(1);
}

// Test 2: Test incrementPatchVersion function

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

} catch (error) {
  if (__DEV__) {
  console.error('❌ Version increment test failed:', error.message);
  }
  process.exit(1);
}

// Test 3: Test invalid version format handling

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

} catch (error) {
  if (__DEV__) {
  console.error('❌ Invalid version format test failed:', error.message);
  }
  process.exit(1);
}

// Test 4: Verify script file exists and is executable

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

} catch (error) {
  if (__DEV__) {
  console.error('❌ Script file validation failed:', error.message);
  }
  process.exit(1);
}
