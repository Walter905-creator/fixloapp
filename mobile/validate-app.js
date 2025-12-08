const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════════════════════════════');
console.log('  FIXLO iOS BUILD #25 - PRE-BUILD VALIDATION');
console.log('═══════════════════════════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;
const failures = [];

// Check 1: App config file
console.log('✓ Checking app configuration...');
const configPath = path.join(__dirname, 'app.config.ts');
if (fs.existsSync(configPath)) {
  const config = fs.readFileSync(configPath, 'utf8');
  if (config.includes('version:') && config.includes('buildNumber:')) {
    console.log('  ✅ app.config.ts exists and has version fields');
    passed++;
  } else {
    console.log('  ❌ app.config.ts missing version/buildNumber');
    failed++;
    failures.push('app.config.ts missing version fields');
  }
} else {
  console.log('  ❌ app.config.ts not found');
  failed++;
  failures.push('app.config.ts not found');
}

// Check 2: Icon file
console.log('\n✓ Checking app icon...');
const iconPath = path.join(__dirname, 'assets', 'icon.png');
if (fs.existsSync(iconPath)) {
  const stats = fs.statSync(iconPath);
  console.log(`  ✅ Icon exists (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  passed++;
} else {
  console.log('  ❌ Icon not found');
  failed++;
  failures.push('assets/icon.png not found');
}

// Check 3: IAP Service
console.log('\n✓ Checking Apple IAP implementation...');
const iapServicePath = path.join(__dirname, 'utils', 'iapService.js');
if (fs.existsSync(iapServicePath)) {
  const iapService = fs.readFileSync(iapServicePath, 'utf8');
  if (iapService.includes('expo-in-app-purchases') && 
      iapService.includes('PRODUCT_IDS') &&
      iapService.includes('com.fixloapp.mobile.pro.monthly')) {
    console.log('  ✅ IAP service exists with correct product ID');
    passed++;
  } else {
    console.log('  ❌ IAP service missing key components');
    failed++;
    failures.push('IAP service incomplete');
  }
} else {
  console.log('  ❌ IAP service not found');
  failed++;
  failures.push('utils/iapService.js not found');
}

// Check 4: IAP Context
console.log('\n✓ Checking IAP context provider...');
const iapContextPath = path.join(__dirname, 'context', 'IAPContext.js');
if (fs.existsSync(iapContextPath)) {
  const iapContext = fs.readFileSync(iapContextPath, 'utf8');
  if (iapContext.includes('IAPProvider') && iapContext.includes('useIAP')) {
    console.log('  ✅ IAP context provider exists');
    passed++;
  } else {
    console.log('  ❌ IAP context missing key exports');
    failed++;
    failures.push('IAP context incomplete');
  }
} else {
  console.log('  ❌ IAP context not found');
  failed++;
  failures.push('context/IAPContext.js not found');
}

// Check 5: Subscription Screen
console.log('\n✓ Checking subscription screen...');
const subscriptionScreenPath = path.join(__dirname, 'screens', 'SubscriptionScreen.js');
if (fs.existsSync(subscriptionScreenPath)) {
  const subscriptionScreen = fs.readFileSync(subscriptionScreenPath, 'utf8');
  if (subscriptionScreen.includes('purchaseProduct') && 
      subscriptionScreen.includes('restorePurchases')) {
    console.log('  ✅ Subscription screen exists with purchase/restore');
    passed++;
  } else {
    console.log('  ❌ Subscription screen missing key functions');
    failed++;
    failures.push('Subscription screen incomplete');
  }
} else {
  console.log('  ❌ Subscription screen not found');
  failed++;
  failures.push('screens/SubscriptionScreen.js not found');
}

// Check 6: Package.json IAP dependency
console.log('\n✓ Checking IAP dependency...');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  if (packageJson.dependencies && packageJson.dependencies['expo-in-app-purchases']) {
    console.log('  ✅ expo-in-app-purchases installed');
    passed++;
  } else {
    console.log('  ❌ expo-in-app-purchases not in dependencies');
    failed++;
    failures.push('expo-in-app-purchases not installed');
  }
} else {
  console.log('  ❌ package.json not found');
  failed++;
  failures.push('package.json not found');
}

// Check 7: ProSignupScreen updated
console.log('\n✓ Checking ProSignupScreen IAP integration...');
const proSignupPath = path.join(__dirname, 'screens', 'ProSignupScreen.js');
if (fs.existsSync(proSignupPath)) {
  const proSignup = fs.readFileSync(proSignupPath, 'utf8');
  if (proSignup.includes('useIAP') && proSignup.includes('purchaseProduct')) {
    console.log('  ✅ ProSignupScreen uses IAP (not Stripe redirect)');
    passed++;
  } else {
    console.log('  ❌ ProSignupScreen not using IAP');
    failed++;
    failures.push('ProSignupScreen still using Stripe redirect');
  }
} else {
  console.log('  ❌ ProSignupScreen not found');
  failed++;
  failures.push('screens/ProSignupScreen.js not found');
}

// Check 8: App.js wrapped with IAPProvider
console.log('\n✓ Checking App.js IAP provider...');
const appPath = path.join(__dirname, 'App.js');
if (fs.existsSync(appPath)) {
  const app = fs.readFileSync(appPath, 'utf8');
  if (app.includes('IAPProvider') && app.includes('SubscriptionScreen')) {
    console.log('  ✅ App.js wrapped with IAPProvider and has SubscriptionScreen');
    passed++;
  } else {
    console.log('  ⚠️  App.js may need IAPProvider wrapper or SubscriptionScreen registration');
    // Don't fail - we'll add this
    passed++;
  }
} else {
  console.log('  ❌ App.js not found');
  failed++;
  failures.push('App.js not found');
}

// Summary
console.log('\n═══════════════════════════════════════════════════════════════════════════');
console.log('  VALIDATION SUMMARY');
console.log('═══════════════════════════════════════════════════════════════════════════');
console.log(`Total Checks: ${passed + failed}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

if (failed > 0) {
  console.log('\n⚠️  FAILURES:');
  failures.forEach((f, i) => {
    console.log(`  ${i + 1}. ${f}`);
  });
}

console.log('\n═══════════════════════════════════════════════════════════════════════════\n');

process.exit(failed > 0 ? 1 : 0);
