/**
 * Test suite for phone number utilities
 * Tests E.164 normalization and validation
 */

const { normalizeE164 } = require('./server/utils/twilio');

// Test cases for phone normalization
const testCases = [
  // Valid US formats
  { input: '5164449953', expected: '+15164449953', description: '10-digit number' },
  { input: '15164449953', expected: '+15164449953', description: '11-digit number with 1' },
  { input: '+15164449953', expected: '+15164449953', description: 'Already E.164' },
  { input: '(516) 444-9953', expected: '+15164449953', description: 'US format with parentheses' },
  { input: '516-444-9953', expected: '+15164449953', description: 'US format with dashes' },
  { input: '516.444.9953', expected: '+15164449953', description: 'US format with dots' },
  { input: '1-516-444-9953', expected: '+15164449953', description: '11-digit with dashes' },
  { input: '1 (516) 444-9953', expected: '+15164449953', description: '11-digit formatted' },
  
  // Edge cases
  { input: '', expected: null, description: 'Empty string' },
  { input: null, expected: null, description: 'Null input' },
  { input: undefined, expected: null, description: 'Undefined input' },
  { input: '123', expected: '+123', description: 'Too short - invalid' },
];

// Test E.164 validation regex
function isValidE164(phone) {
  return /^\+\d{10,15}$/.test(phone);
}

console.log('🧪 Testing Phone Number Normalization\n');

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = normalizeE164(test.input);
  const success = result === test.expected;
  
  if (success) {
    console.log(`✅ Test ${index + 1}: ${test.description}`);
    console.log(`   Input: "${test.input}" → Output: "${result}"`);
    passed++;
  } else {
    console.log(`❌ Test ${index + 1}: ${test.description}`);
    console.log(`   Input: "${test.input}"`);
    console.log(`   Expected: "${test.expected}"`);
    console.log(`   Got: "${result}"`);
    failed++;
  }
  console.log('');
});

console.log('\n🧪 Testing E.164 Validation\n');

const validationTests = [
  { phone: '+15164449953', expected: true, description: 'Valid US number (11 digits)' },
  { phone: '+442071234567', expected: true, description: 'Valid UK number (12 digits)' },
  { phone: '5164449953', expected: false, description: 'Missing + prefix' },
  { phone: '+151644499', expected: false, description: 'Too short (9 digits total)' },
  { phone: '+1516444995399999', expected: false, description: 'Too long (16 digits)' },
  { phone: '+1 (516) 444-9953', expected: false, description: 'Contains formatting' },
  { phone: '', expected: false, description: 'Empty string' },
  { phone: null, expected: false, description: 'Null' },
];

validationTests.forEach((test, index) => {
  const result = isValidE164(test.phone);
  const success = result === test.expected;
  
  if (success) {
    console.log(`✅ Test ${index + 1}: ${test.description}`);
    console.log(`   Phone: "${test.phone}" → Valid: ${result}`);
    passed++;
  } else {
    console.log(`❌ Test ${index + 1}: ${test.description}`);
    console.log(`   Phone: "${test.phone}"`);
    console.log(`   Expected: ${test.expected}`);
    console.log(`   Got: ${result}`);
    failed++;
  }
  console.log('');
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✅ All tests passed!\n');
  process.exit(0);
} else {
  console.log('❌ Some tests failed\n');
  process.exit(1);
}
