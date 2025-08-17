#!/usr/bin/env node

/**
 * Test Placeholder Replacement Fix
 * Ensures that literal placeholder strings are properly detected and rejected
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function testPlaceholderFix() {
  console.log('🧪 Testing placeholder replacement fix...\n');
  
  const clientDir = path.join(__dirname, '..', 'client');
  const envFile = path.join(clientDir, '.env.production.local');
  const injectScript = path.join(clientDir, 'scripts', 'inject-build-meta.js');
  
  // Test 1: Normal environment variables should work
  console.log('Test 1: Testing normal environment variables...');
  
  // Clean up
  if (fs.existsSync(envFile)) {
    fs.unlinkSync(envFile);
  }
  
  try {
    const result = execSync('cd client && VERCEL_GIT_COMMIT_SHA="abc123def456" RELEASE_BUILD_ID="20250817-120000" node scripts/inject-build-meta.js', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    
    const envContent = fs.readFileSync(envFile, 'utf8');
    
    if (envContent.includes('REACT_APP_BUILD_ID=20250817-120000') && envContent.includes('REACT_APP_COMMIT_SHA=abc123def456')) {
      console.log('✅ PASS: Normal environment variables work correctly');
    } else {
      console.log('❌ FAIL: Normal environment variables not working');
      console.log('Content:', envContent);
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Error with normal environment variables:', error.message);
    return false;
  }
  
  // Test 2: Literal placeholder strings should be rejected
  console.log('\nTest 2: Testing placeholder string rejection...');
  
  // Clean up
  if (fs.existsSync(envFile)) {
    fs.unlinkSync(envFile);
  }
  
  try {
    const result = execSync('cd client && VERCEL_GIT_COMMIT_SHA="${VERCEL_GIT_COMMIT_SHA}" RELEASE_BUILD_ID="%REACT_APP_BUILD_ID%" node scripts/inject-build-meta.js', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    
    const envContent = fs.readFileSync(envFile, 'utf8');
    
    // Should NOT contain literal placeholders
    if (envContent.includes('${VERCEL_GIT_COMMIT_SHA}') || envContent.includes('%REACT_APP_BUILD_ID%')) {
      console.log('❌ FAIL: Literal placeholders were not rejected');
      console.log('Content:', envContent);
      return false;
    }
    
    // Should contain safe fallbacks
    if (envContent.includes('REACT_APP_COMMIT_SHA=unknown') && envContent.match(/REACT_APP_BUILD_ID=\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      console.log('✅ PASS: Placeholder strings properly rejected and safe fallbacks used');
    } else {
      console.log('❌ FAIL: Expected safe fallbacks not found');
      console.log('Content:', envContent);
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Error with placeholder rejection test:', error.message);
    return false;
  }
  
  // Test 3: Mixed case - some valid, some placeholder
  console.log('\nTest 3: Testing mixed environment variables...');
  
  // Clean up
  if (fs.existsSync(envFile)) {
    fs.unlinkSync(envFile);
  }
  
  try {
    const result = execSync('cd client && VERCEL_GIT_COMMIT_SHA="${VERCEL_GIT_COMMIT_SHA}" RELEASE_BUILD_ID="valid-build-id" node scripts/inject-build-meta.js', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    
    const envContent = fs.readFileSync(envFile, 'utf8');
    
    if (envContent.includes('REACT_APP_BUILD_ID=valid-build-id') && envContent.includes('REACT_APP_COMMIT_SHA=unknown')) {
      console.log('✅ PASS: Mixed environment variables handled correctly');
    } else {
      console.log('❌ FAIL: Mixed environment variables not handled correctly');
      console.log('Content:', envContent);
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Error with mixed environment variables test:', error.message);
    return false;
  }
  
  console.log('\n🎉 All placeholder replacement tests passed!');
  console.log('   - Normal environment variables work correctly');
  console.log('   - Literal placeholder strings are properly rejected');
  console.log('   - Safe fallbacks are used when placeholders are detected');
  
  return true;
}

if (require.main === module) {
  const success = testPlaceholderFix();
  process.exit(success ? 0 : 1);
}

module.exports = { testPlaceholderFix };