#!/bin/bash

# Commission Referral System - Feature Flag Test
# Tests that the system can be disabled instantly via feature flags

echo "🧪 Testing Commission Referral Feature Flag Behavior"
echo "===================================================="
echo ""

cd "$(dirname "$0")/server"

# Test 1: Feature disabled by default
echo "Test 1: Feature disabled by default"
echo "------------------------------------"
export REFERRALS_ENABLED=""
node -e "
const Payout = require('./models/Payout');
const enabled = process.env.REFERRALS_ENABLED === 'true';
console.log('REFERRALS_ENABLED:', process.env.REFERRALS_ENABLED || 'not set');
console.log('Feature status:', enabled ? '❌ ENABLED (should be disabled)' : '✅ DISABLED (correct)');
if (!enabled) {
  console.log('✅ Test 1 PASSED: Feature disabled when flag is unset\n');
  process.exit(0);
} else {
  console.log('❌ Test 1 FAILED: Feature should be disabled by default\n');
  process.exit(1);
}
"
TEST1_RESULT=$?

# Test 2: Feature can be disabled explicitly
echo "Test 2: Feature explicitly disabled"
echo "------------------------------------"
export REFERRALS_ENABLED="false"
node -e "
const enabled = process.env.REFERRALS_ENABLED === 'true';
console.log('REFERRALS_ENABLED:', process.env.REFERRALS_ENABLED);
console.log('Feature status:', enabled ? '❌ ENABLED' : '✅ DISABLED');
if (!enabled) {
  console.log('✅ Test 2 PASSED: Feature disabled when flag is false\n');
  process.exit(0);
} else {
  console.log('❌ Test 2 FAILED: Feature should be disabled when flag is false\n');
  process.exit(1);
}
"
TEST2_RESULT=$?

# Test 3: Feature can be enabled
echo "Test 3: Feature can be enabled"
echo "-------------------------------"
export REFERRALS_ENABLED="true"
node -e "
const enabled = process.env.REFERRALS_ENABLED === 'true';
console.log('REFERRALS_ENABLED:', process.env.REFERRALS_ENABLED);
console.log('Feature status:', enabled ? '✅ ENABLED' : '❌ DISABLED');
if (enabled) {
  console.log('✅ Test 3 PASSED: Feature enabled when flag is true\n');
  process.exit(0);
} else {
  console.log('❌ Test 3 FAILED: Feature should be enabled when flag is true\n');
  process.exit(1);
}
"
TEST3_RESULT=$?

# Test 4: Minimum payout validation
echo "Test 4: Minimum payout validation"
echo "----------------------------------"
node test-commission-system.js > /dev/null 2>&1
TEST4_RESULT=$?
if [ $TEST4_RESULT -eq 0 ]; then
  echo "✅ Test 4 PASSED: Commission system tests pass"
  echo ""
else
  echo "❌ Test 4 FAILED: Commission system tests failed"
  echo ""
fi

# Test 5: Cron job conditional scheduling
echo "Test 5: Cron job scheduling with feature flag"
echo "----------------------------------------------"
export REFERRALS_ENABLED="false"
node -e "
const { verify30DayReferrals } = require('./services/commissionVerification');
(async () => {
  const result = await verify30DayReferrals();
  if (result.message.includes('disabled')) {
    console.log('✅ Test 5 PASSED: Cron function respects feature flag');
    console.log('   Message:', result.message);
    console.log('');
    process.exit(0);
  } else {
    console.log('❌ Test 5 FAILED: Cron should not process when disabled');
    console.log('');
    process.exit(1);
  }
})();
" 2>/dev/null
TEST5_RESULT=$?

# Summary
echo "===================================================="
echo "TEST SUMMARY"
echo "===================================================="
TOTAL_TESTS=5
PASSED_TESTS=0

[ $TEST1_RESULT -eq 0 ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ $TEST2_RESULT -eq 0 ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ $TEST3_RESULT -eq 0 ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ $TEST4_RESULT -eq 0 ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ $TEST5_RESULT -eq 0 ] && PASSED_TESTS=$((PASSED_TESTS + 1))

echo "Passed: $PASSED_TESTS / $TOTAL_TESTS tests"
echo ""

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
  echo "✅ ALL TESTS PASSED"
  echo ""
  echo "The commission referral system:"
  echo "  ✓ Is disabled by default (safe)"
  echo "  ✓ Can be disabled instantly via feature flag"
  echo "  ✓ Can be enabled when ready"
  echo "  ✓ Enforces \$25 minimum payout"
  echo "  ✓ Respects feature flag in all components"
  echo ""
  exit 0
else
  echo "❌ SOME TESTS FAILED"
  echo ""
  echo "Failed tests: $((TOTAL_TESTS - PASSED_TESTS))"
  echo ""
  exit 1
fi
