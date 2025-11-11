#!/usr/bin/env node

/**
 * Build Configuration Verification Script
 * Verifies all iOS build requirements are met
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying iOS Build Configuration...\n');

let allPassed = true;

// 1. Check app.config.ts
console.log('1️⃣ Checking app.config.ts...');
try {
  const config = require('./app.config.ts').default;
  
  const checks = [
    { name: 'Owner', expected: 'fixlo-app', actual: config.expo.owner },
    { name: 'EAS Project ID', expected: 'f13247bf-8aca-495f-9b71-e94d1cc480a5', actual: config.expo.extra.eas.projectId },
    { name: 'Bundle Identifier', expected: 'com.fixloapp.mobile', actual: config.expo.ios.bundleIdentifier },
    { name: 'Scheme', expected: 'fixloapp', actual: config.expo.scheme },
  ];
  
  checks.forEach(check => {
    if (check.actual === check.expected) {
      console.log(`   ✅ ${check.name}: ${check.actual}`);
    } else {
      console.log(`   ❌ ${check.name}: ${check.actual} (expected: ${check.expected})`);
      allPassed = false;
    }
  });
} catch (error) {
  console.log(`   ❌ Error reading config: ${error.message}`);
  allPassed = false;
}

// 2. Check required assets
console.log('\n2️⃣ Checking required assets...');
const requiredAssets = ['icon.png', 'splash.png', 'adaptive-icon.png'];
requiredAssets.forEach(asset => {
  const assetPath = path.join(__dirname, 'assets', asset);
  if (fs.existsSync(assetPath)) {
    const stats = fs.statSync(assetPath);
    console.log(`   ✅ ${asset} (${(stats.size / 1024).toFixed(1)}KB)`);
  } else {
    console.log(`   ❌ ${asset} not found`);
    allPassed = false;
  }
});

// 3. Check dependencies
console.log('\n3️⃣ Checking dependencies...');
try {
  const pkg = require('./package.json');
  const bundled = require('./node_modules/expo/bundledNativeModules.json');
  
  const criticalDeps = [
    'expo-constants',
    'expo-notifications',
    'react-native-worklets',
    'expo-build-properties',
  ];
  
  criticalDeps.forEach(dep => {
    if (pkg.dependencies[dep]) {
      console.log(`   ✅ ${dep}: ${pkg.dependencies[dep]}`);
    } else {
      console.log(`   ❌ ${dep}: missing`);
      allPassed = false;
    }
  });
} catch (error) {
  console.log(`   ❌ Error checking dependencies: ${error.message}`);
  allPassed = false;
}

// 4. Check eas.json
console.log('\n4️⃣ Checking eas.json...');
try {
  const eas = require('./eas.json');
  
  if (eas.build?.production?.ios?.appleTeamId === 'YKAYTX4AWR') {
    console.log(`   ✅ Apple Team ID: ${eas.build.production.ios.appleTeamId}`);
  } else {
    console.log(`   ❌ Apple Team ID not set correctly`);
    allPassed = false;
  }
  
  if (eas.build?.production?.node === '20.11.1') {
    console.log(`   ✅ Node version: ${eas.build.production.node}`);
  } else {
    console.log(`   ⚠️  Node version: ${eas.build?.production?.node || 'not set'}`);
  }
} catch (error) {
  console.log(`   ❌ Error reading eas.json: ${error.message}`);
  allPassed = false;
}

// Final result
console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✅ All checks passed! Ready for EAS build.');
  console.log('\nNext step:');
  console.log('  npx eas build --platform ios --profile production');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please fix the issues above.');
  process.exit(1);
}
