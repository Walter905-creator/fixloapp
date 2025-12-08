/**
 * SMS Consent Checkbox Verification Script
 */

const fs = require('fs');

console.log('🔍 VERIFYING SMS CONSENT IMPLEMENTATION\n');

const fileContent = fs.readFileSync('screens/ProSignupScreen.js', 'utf8');

const checks = {
  passed: 0,
  failed: 0
};

// Check 1: smsOptIn state variable
if (fileContent.includes("const [smsOptIn, setSmsOptIn] = useState(false)")) {
  console.log('✅ smsOptIn state variable found (default: false)');
  checks.passed++;
} else {
  console.log('❌ smsOptIn state variable missing');
  checks.failed++;
}

// Check 2: showSmsError state variable
if (fileContent.includes("const [showSmsError, setShowSmsError] = useState(false)")) {
  console.log('✅ showSmsError state variable found');
  checks.passed++;
} else {
  console.log('❌ showSmsError state variable missing');
  checks.failed++;
}

// Check 3: Validation logic
if (fileContent.includes("if (!smsOptIn)") && fileContent.includes("SMS Consent Required")) {
  console.log('✅ Validation logic implemented');
  checks.passed++;
} else {
  console.log('❌ Validation logic missing');
  checks.failed++;
}

// Check 4: API payload includes smsOptIn
if (fileContent.includes("smsOptIn: true")) {
  console.log('✅ smsOptIn field added to API payload');
  checks.passed++;
} else {
  console.log('❌ smsOptIn not included in API payload');
  checks.failed++;
}

// Check 5: Checkbox component
if (fileContent.includes("accessibilityLabel=\"SMS notifications consent checkbox\"")) {
  console.log('✅ Checkbox component with accessibility labels');
  checks.passed++;
} else {
  console.log('❌ Checkbox accessibility missing');
  checks.failed++;
}

// Check 6: Error text display
if (fileContent.includes("{showSmsError &&") && fileContent.includes("You must agree to SMS notifications")) {
  console.log('✅ Error message component found');
  checks.passed++;
} else {
  console.log('❌ Error message component missing');
  checks.failed++;
}

// Check 7: Button disabled state
if (fileContent.includes("disabled={loading || !smsOptIn}")) {
  console.log('✅ Submit button disabled when checkbox unchecked');
  checks.passed++;
} else {
  console.log('❌ Button disable logic missing');
  checks.failed++;
}

// Check 8: Checkbox styles
if (fileContent.includes("checkboxContainer:") && 
    fileContent.includes("checkboxChecked:") &&
    fileContent.includes("checkboxLabel:")) {
  console.log('✅ Checkbox styles defined');
  checks.passed++;
} else {
  console.log('❌ Checkbox styles incomplete');
  checks.failed++;
}

// Check 9: SMS disclosure text
if (fileContent.includes("I agree to receive SMS updates") && 
    fileContent.includes("Reply STOP to unsubscribe")) {
  console.log('✅ Complete SMS disclosure text present');
  checks.passed++;
} else {
  console.log('❌ SMS disclosure text incomplete');
  checks.failed++;
}

console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION RESULTS:');
console.log(`✅ Passed: ${checks.passed}`);
console.log(`❌ Failed: ${checks.failed}`);
console.log('='.repeat(60));

if (checks.failed === 0) {
  console.log('\n🎉 ALL CHECKS PASSED - SMS CONSENT READY FOR DEPLOYMENT!');
  process.exit(0);
} else {
  console.log('\n⚠️  SOME CHECKS FAILED - REVIEW IMPLEMENTATION');
  process.exit(1);
}
