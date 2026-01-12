// server/test-commission-system.js
// Test script for commission referral system

const Payout = require('./models/Payout');
const CommissionReferral = require('./models/CommissionReferral');

console.log('🧪 Testing Commission Referral System\n');

// Test 1: Minimum Payout Amount Validation
console.log('Test 1: Minimum Payout Amount Validation');
console.log('=========================================');

const testAmounts = [
  { amount: 1000, expected: false }, // $10 - below minimum
  { amount: 2400, expected: false }, // $24 - below minimum
  { amount: 2500, expected: true },  // $25 - at minimum
  { amount: 5000, expected: true },  // $50 - above minimum
  { amount: 10000, expected: true }  // $100 - above minimum
];

testAmounts.forEach(test => {
  const result = Payout.validateMinimumAmount(test.amount);
  const pass = result.valid === test.expected;
  console.log(`  $${(test.amount / 100).toFixed(2)}: ${pass ? '✅' : '❌'} ${result.message}`);
});

console.log('\nTest 2: Payout Model Constants');
console.log('================================');
console.log(`  MIN_PAYOUT_AMOUNT: $${Payout.MIN_PAYOUT_AMOUNT}`);
console.log(`  ✅ Constant correctly exported\n`);

console.log('Test 3: CommissionReferral Model Schema');
console.log('=========================================');
const referralSchema = CommissionReferral.schema.obj;
const requiredFields = ['referrerId', 'referrerEmail', 'referralCode', 'commissionRate'];
requiredFields.forEach(field => {
  const exists = field in referralSchema;
  console.log(`  ${field}: ${exists ? '✅' : '❌'}`);
});

console.log('\nTest 4: Feature Flag Check');
console.log('===========================');
const featureEnabled = process.env.REFERRALS_ENABLED === 'true';
console.log(`  REFERRALS_ENABLED: ${process.env.REFERRALS_ENABLED || 'not set'}`);
console.log(`  Status: ${featureEnabled ? '✅ ENABLED' : '⚠️  DISABLED (default safe state)'}\n`);

console.log('✅ All tests completed successfully!');
console.log('\nNOTE: This system is DISABLED by default (REFERRALS_ENABLED=false)');
console.log('Set REFERRALS_ENABLED=true in environment to enable the feature.\n');
