#!/usr/bin/env node

/**
 * Test Vercel Configuration
 * Validates that routing and environment setup works correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Vercel configuration...\n');

// Test 1: Verify vercel.json exists in root
const vercelConfigPath = path.join(__dirname, '..', 'vercel.json');
if (!fs.existsSync(vercelConfigPath)) {
  console.error('❌ vercel.json not found in root directory');
  process.exit(1);
}

const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
console.log('✅ vercel.json found in root directory');

// Test 2: Check SMS opt-in routing
const smsOptinRoute = vercelConfig.rewrites?.find(r => r.source === '/sms-optin');
const smsOptinRouteSlash = vercelConfig.rewrites?.find(r => r.source === '/sms-optin/');

if (!smsOptinRoute || !smsOptinRouteSlash) {
  console.error('❌ SMS opt-in routing not properly configured');
  process.exit(1);
}

console.log('✅ SMS opt-in routing configured correctly');
console.log(`   ${smsOptinRoute.source} → ${smsOptinRoute.destination}`);
console.log(`   ${smsOptinRouteSlash.source} → ${smsOptinRouteSlash.destination}`);

// Test 3: Check API proxy
const apiRoute = vercelConfig.rewrites?.find(r => r.source === '/api/(.*)');
if (!apiRoute || !apiRoute.destination.includes('fixloapp.onrender.com')) {
  console.error('❌ API proxy not properly configured');
  process.exit(1);
}

console.log('✅ API proxy configured correctly');
console.log(`   ${apiRoute.source} → ${apiRoute.destination}`);

// Test 4: Check environment variables
const requiredEnvVars = [
  'REACT_APP_FEATURE_SHARE_PROFILE',
  'REACT_APP_FEATURE_BADGES', 
  'REACT_APP_FEATURE_7DAY_BOOST',
  'REACT_APP_CLOUDINARY_ENABLED'
];

const missingEnvVars = requiredEnvVars.filter(envVar => 
  !vercelConfig.env || vercelConfig.env[envVar] !== 'true'
);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(envVar => console.error(`   ${envVar}`));
  process.exit(1);
}

console.log('✅ All required environment variables configured');

// Test 5: Check SMS opt-in static file
const smsOptinFile = path.join(__dirname, '..', 'sms-optin', 'index.html');
if (!fs.existsSync(smsOptinFile)) {
  console.error('❌ SMS opt-in static file not found');
  process.exit(1);
}

const smsContent = fs.readFileSync(smsOptinFile, 'utf8');
if (!smsContent.includes('I agree to receive SMS messages from Fixlo')) {
  console.error('❌ SMS opt-in file missing required consent language');
  process.exit(1);
}

console.log('✅ SMS opt-in static file exists with proper consent language');

// Test 6: Check build deployment
const indexPath = path.join(__dirname, '..', 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('❌ index.html not found in root (build not deployed)');
  process.exit(1);
}

const indexContent = fs.readFileSync(indexPath, 'utf8');
const bundleMatch = indexContent.match(/index-([a-zA-Z0-9_-]+)\.js/) || indexContent.match(/main\.([a-f0-9]+)\.js/);
if (!bundleMatch) {
  console.error('❌ Bundle hash not found in index.html');
  process.exit(1);
}

console.log(`✅ Build deployed with bundle: ${bundleMatch[0]}`);

console.log('\n🎉 All Vercel configuration tests passed!');
console.log('🚀 Ready for production deployment');