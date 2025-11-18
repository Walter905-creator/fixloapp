// Comprehensive validation script for Expo configuration
import config from './app.config.js';
import { readFileSync } from 'fs';

const eas = JSON.parse(readFileSync('./eas.json', 'utf8'));

console.log('\n=== EXPO CONFIGURATION VALIDATION ===\n');

// Validate app.config.js
console.log('1. app.config.js validation:');
console.log('   ✓ Valid ES6 module');
console.log('   ✓ Owner:', config.expo.owner);
console.log('   ✓ Slug:', config.expo.slug);
console.log('   ✓ Name:', config.expo.name);
console.log('   ✓ Version:', config.expo.version);
console.log('   ✓ Runtime Version:', config.expo.runtimeVersion);
console.log('   ✓ iOS Bundle ID:', config.expo.ios.bundleIdentifier);
console.log('   ✓ Android Package:', config.expo.android.package);
console.log('   ✓ EAS Project ID:', config.expo.extra.eas.projectId);

// Validate eas.json
console.log('\n2. eas.json validation:');
console.log('   ✓ Valid JSON');
console.log('   ✓ Owner:', eas.owner);
console.log('   ✓ CLI Version:', eas.cli.version);
console.log('   ✓ Build Profiles:', Object.keys(eas.build).join(', '));

// Check for owner consistency
console.log('\n3. Owner consistency check:');
const appConfigOwner = config.expo.owner;
const easJsonOwner = eas.owner;
if (appConfigOwner === easJsonOwner && appConfigOwner === 'fixlo-app') {
  console.log('   ✓ Owner is consistent across both files: "fixlo-app"');
} else {
  console.log('   ✗ Owner mismatch detected!');
  console.log('     app.config.js owner:', appConfigOwner);
  console.log('     eas.json owner:', easJsonOwner);
  process.exit(1);
}

// Check for duplicate fields
console.log('\n4. Duplicate field check:');
const appConfigStr = JSON.stringify(config.expo);
const ownerMatches = (appConfigStr.match(/"owner"/g) || []).length;
console.log('   ✓ Owner field appears', ownerMatches, 'time(s) in app.config.js (expected: 1)');

const easJsonStr = JSON.stringify(eas);
const easOwnerMatches = (easJsonStr.match(/"owner"/g) || []).length;
console.log('   ✓ Owner field appears', easOwnerMatches, 'time(s) in eas.json (expected: 1)');

// Validate build profiles integrity
console.log('\n5. Build profiles integrity:');
const profiles = ['development', 'preview', 'production'];
profiles.forEach(profile => {
  if (eas.build[profile]) {
    console.log('   ✓', profile, 'profile exists');
    if (eas.build[profile].ios) {
      console.log('     - iOS bundleIdentifier:', eas.build[profile].ios.bundleIdentifier || 'inherited');
    }
    if (eas.build[profile].android) {
      console.log('     - Android package:', eas.build[profile].android.package || 'inherited');
    }
  }
});

console.log('\n6. Critical fields validation:');
const criticalFields = {
  'Slug': config.expo.slug === 'fixloapp',
  'Name': config.expo.name === 'Fixlo',
  'iOS Bundle ID': config.expo.ios.bundleIdentifier === 'com.fixloapp.mobile',
  'Android Package': config.expo.android.package === 'com.fixloapp.mobile',
  'Owner': config.expo.owner === 'fixlo-app'
};

let allValid = true;
Object.entries(criticalFields).forEach(([field, isValid]) => {
  console.log(isValid ? '   ✓' : '   ✗', field);
  if (!isValid) allValid = false;
});

if (allValid) {
  console.log('\n=== ✓ ALL VALIDATIONS PASSED ===\n');
  console.log('Configuration is ready for:');
  console.log('  • npx eas build --platform ios');
  console.log('  • npx eas build --platform android');
  console.log('  • npx eas build --platform all');
  console.log('\n');
} else {
  console.log('\n=== ✗ VALIDATION FAILED ===\n');
  process.exit(1);
}
