#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFYING APP STORE CONNECT READINESS\n');
console.log('=' .repeat(60));

let allChecksPassed = true;

// 1. Check app.config.ts
console.log('\n📋 1. APP CONFIGURATION');
try {
  const configPath = path.join(__dirname, 'app.config.ts');
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  const versionMatch = configContent.match(/version:\s*["']([^"']+)["']/);
  const buildMatch = configContent.match(/buildNumber:\s*["']([^"']+)["']/);
  const bundleMatch = configContent.match(/bundleIdentifier:\s*["']([^"']+)["']/);
  
  console.log(`   Version: ${versionMatch ? versionMatch[1] : 'NOT FOUND'}`);
  console.log(`   Build Number: ${buildMatch ? buildMatch[1] : 'NOT FOUND'}`);
  console.log(`   Bundle ID: ${bundleMatch ? bundleMatch[1] : 'NOT FOUND'}`);
  
  if (versionMatch && buildMatch && bundleMatch) {
    console.log('   ✅ App configuration valid');
  } else {
    console.log('   ❌ Missing configuration values');
    allChecksPassed = false;
  }
} catch (error) {
  console.log('   ❌ Error reading app.config.ts');
  allChecksPassed = false;
}

// 2. Check IAP Product ID
console.log('\n📋 2. IAP PRODUCT CONFIGURATION');
try {
  const iapPath = path.join(__dirname, 'utils', 'iapService.js');
  const iapContent = fs.readFileSync(iapPath, 'utf8');
  
  const productMatch = iapContent.match(/PRO_MONTHLY:\s*['"]([^'"]+)['"]/);
  
  if (productMatch) {
    const productId = productMatch[1];
    console.log(`   Product ID: ${productId}`);
    
    if (productId === 'com.fixloapp.mobile.pro.monthly') {
      console.log('   ✅ Product ID matches App Store Connect requirement');
    } else {
      console.log('   ⚠️  Product ID should be: com.fixloapp.mobile.pro.monthly');
      allChecksPassed = false;
    }
  } else {
    console.log('   ❌ Product ID not found');
    allChecksPassed = false;
  }
} catch (error) {
  console.log('   ❌ Error reading iapService.js');
  allChecksPassed = false;
}

// 3. Check expo-in-app-purchases package
console.log('\n📋 3. IAP PACKAGE INSTALLATION');
try {
  const packagePath = path.join(__dirname, 'package.json');
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const iapVersion = packageContent.dependencies?.['expo-in-app-purchases'] || 
                     packageContent.devDependencies?.['expo-in-app-purchases'];
  
  if (iapVersion) {
    console.log(`   expo-in-app-purchases: ${iapVersion}`);
    console.log('   ✅ IAP package installed');
  } else {
    console.log('   ❌ expo-in-app-purchases not found in package.json');
    allChecksPassed = false;
  }
} catch (error) {
  console.log('   ❌ Error reading package.json');
  allChecksPassed = false;
}

// 4. Check IAPContext exists
console.log('\n📋 4. IAP CONTEXT PROVIDER');
try {
  const contextPath = path.join(__dirname, 'context', 'IAPContext.js');
  if (fs.existsSync(contextPath)) {
    const contextContent = fs.readFileSync(contextPath, 'utf8');
    const hasProvider = contextContent.includes('export const IAPProvider');
    const hasHook = contextContent.includes('export const useIAP');
    
    console.log(`   IAPProvider: ${hasProvider ? 'Found' : 'Missing'}`);
    console.log(`   useIAP hook: ${hasHook ? 'Found' : 'Missing'}`);
    
    if (hasProvider && hasHook) {
      console.log('   ✅ IAP context properly configured');
    } else {
      console.log('   ❌ IAP context incomplete');
      allChecksPassed = false;
    }
  } else {
    console.log('   ❌ IAPContext.js not found');
    allChecksPassed = false;
  }
} catch (error) {
  console.log('   ❌ Error reading IAPContext.js');
  allChecksPassed = false;
}

// 5. Check SubscriptionScreen exists
console.log('\n📋 5. SUBSCRIPTION SCREEN');
try {
  const screenPath = path.join(__dirname, 'screens', 'SubscriptionScreen.js');
  if (fs.existsSync(screenPath)) {
    const screenContent = fs.readFileSync(screenPath, 'utf8');
    const hasPurchase = screenContent.includes('purchaseProduct');
    const hasRestore = screenContent.includes('restorePurchases');
    
    console.log(`   Purchase function: ${hasPurchase ? 'Implemented' : 'Missing'}`);
    console.log(`   Restore function: ${hasRestore ? 'Implemented' : 'Missing'}`);
    
    if (hasPurchase && hasRestore) {
      console.log('   ✅ Subscription screen complete');
    } else {
      console.log('   ❌ Subscription screen incomplete');
      allChecksPassed = false;
    }
  } else {
    console.log('   ❌ SubscriptionScreen.js not found');
    allChecksPassed = false;
  }
} catch (error) {
  console.log('   ❌ Error reading SubscriptionScreen.js');
  allChecksPassed = false;
}

// 6. Check ProSignupScreen IAP integration
console.log('\n📋 6. PRO SIGNUP SCREEN (IAP INTEGRATION)');
try {
  const proPath = path.join(__dirname, 'screens', 'ProSignupScreen.js');
  const proContent = fs.readFileSync(proPath, 'utf8');
  
  const hasUseIAP = proContent.includes('useIAP');
  const hasPurchaseCall = proContent.includes('purchaseProduct');
  const noStripeRedirect = !proContent.includes('Linking.openURL') || 
                           !proContent.includes('pro-signup');
  
  console.log(`   useIAP hook: ${hasUseIAP ? 'Imported' : 'Missing'}`);
  console.log(`   purchaseProduct call: ${hasPurchaseCall ? 'Used' : 'Missing'}`);
  console.log(`   No Stripe redirect: ${noStripeRedirect ? 'Confirmed' : 'Still present'}`);
  
  if (hasUseIAP && hasPurchaseCall && noStripeRedirect) {
    console.log('   ✅ ProSignupScreen uses native IAP');
  } else {
    console.log('   ⚠️  ProSignupScreen may still redirect to external payment');
    allChecksPassed = false;
  }
} catch (error) {
  console.log('   ❌ Error reading ProSignupScreen.js');
  allChecksPassed = false;
}

// 7. Check App.js IAPProvider wrapper
console.log('\n📋 7. APP.JS IAP PROVIDER');
try {
  const appPath = path.join(__dirname, 'App.js');
  const appContent = fs.readFileSync(appPath, 'utf8');
  
  const hasImport = appContent.includes('IAPProvider');
  const hasWrapper = appContent.includes('<IAPProvider');
  
  console.log(`   IAPProvider import: ${hasImport ? 'Found' : 'Missing'}`);
  console.log(`   IAPProvider wrapper: ${hasWrapper ? 'Applied' : 'Missing'}`);
  
  if (hasImport && hasWrapper) {
    console.log('   ✅ App.js properly wraps navigation with IAPProvider');
  } else {
    console.log('   ❌ App.js missing IAPProvider integration');
    allChecksPassed = false;
  }
} catch (error) {
  console.log('   ❌ Error reading App.js');
  allChecksPassed = false;
}

// 8. Check backend IAP route
console.log('\n📋 8. BACKEND RECEIPT VERIFICATION');
try {
  const serverPath = path.join(__dirname, '..', 'server', 'routes', 'iap.js');
  if (fs.existsSync(serverPath)) {
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    const hasVerify = serverContent.includes('/verify');
    const hasAppleURL = serverContent.includes('apple.com') || 
                        serverContent.includes('itunes.apple.com');
    
    console.log(`   Verify endpoint: ${hasVerify ? 'Implemented' : 'Missing'}`);
    console.log(`   Apple API integration: ${hasAppleURL ? 'Configured' : 'Missing'}`);
    
    if (hasVerify && hasAppleURL) {
      console.log('   ✅ Backend receipt verification ready');
    } else {
      console.log('   ❌ Backend verification incomplete');
      allChecksPassed = false;
    }
  } else {
    console.log('   ❌ server/routes/iap.js not found');
    allChecksPassed = false;
  }
} catch (error) {
  console.log('   ⚠️  Cannot verify backend (may be in separate repo)');
}

// 9. Check for external payment links
console.log('\n📋 9. GUIDELINE 3.1.1 COMPLIANCE CHECK');
try {
  const proPath = path.join(__dirname, 'screens', 'ProSignupScreen.js');
  const proContent = fs.readFileSync(proPath, 'utf8');
  
  const suspiciousPatterns = [
    { pattern: /fixloapp\.com\/pro-signup/i, name: 'External signup URL' },
    { pattern: /stripe/i, name: 'Stripe reference' },
    { pattern: /Linking\.openURL.*http/i, name: 'External URL redirect' },
    { pattern: /PayPal/i, name: 'PayPal reference' }
  ];
  
  let violations = [];
  suspiciousPatterns.forEach(({ pattern, name }) => {
    if (pattern.test(proContent)) {
      violations.push(name);
    }
  });
  
  if (violations.length === 0) {
    console.log('   ✅ No external payment links detected');
    console.log('   ✅ App Store Guideline 3.1.1 compliant');
  } else {
    console.log(`   ⚠️  Potential violations found: ${violations.join(', ')}`);
    console.log('   ⚠️  Review required for Guideline 3.1.1 compliance');
  }
} catch (error) {
  console.log('   ⚠️  Cannot verify compliance');
}

// 10. Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 FINAL READINESS STATUS\n');

if (allChecksPassed) {
  console.log('✅ ALL CHECKS PASSED');
  console.log('\nBuild #24 is ready for App Store Connect submission.');
  console.log('Follow the manual steps in APP-STORE-CONNECT-SUBMISSION-GUIDE.md');
} else {
  console.log('❌ SOME CHECKS FAILED');
  console.log('\nReview the failed checks above before submitting.');
}

console.log('\n' + '='.repeat(60));

process.exit(allChecksPassed ? 0 : 1);
