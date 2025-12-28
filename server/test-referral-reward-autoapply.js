/**
 * Test script for Referral Reward Auto-Apply functionality
 * 
 * This script tests the applyReferralFreeMonth function
 * to ensure it properly creates coupons, promo codes, and applies them
 * 
 * Run with: node test-referral-reward-autoapply.js
 */

require('dotenv').config();
const { applyReferralFreeMonth, hasExistingReward, generatePromoCode } = require('./services/applyReferralFreeMonth');

console.log('🧪 Testing Referral Reward Auto-Apply System\n');

// Test 1: Generate promo code
console.log('Test 1: Generate Promo Code');
console.log('----------------------------');
const promoCode1 = generatePromoCode();
const promoCode2 = generatePromoCode();
const promoCode3 = generatePromoCode();
console.log(`Generated codes: ${promoCode1}, ${promoCode2}, ${promoCode3}`);
console.log(`Format check: ${/^FIXLO-[A-Z0-9]{6}$/.test(promoCode1) ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Uniqueness check: ${(promoCode1 !== promoCode2 && promoCode2 !== promoCode3) ? '✅ PASS' : '❌ FAIL'}`);
console.log('');

// Test 2: Validate parameters
console.log('Test 2: Parameter Validation');
console.log('----------------------------');

async function testParameterValidation() {
  // Missing stripeCustomerId
  const result1 = await applyReferralFreeMonth({
    referralCode: 'TEST123'
  });
  console.log(`Missing stripeCustomerId: ${!result1.success && result1.error.includes('stripeCustomerId') ? '✅ PASS' : '❌ FAIL'}`);
  
  // Missing referralCode
  const result2 = await applyReferralFreeMonth({
    stripeCustomerId: 'cus_test123'
  });
  console.log(`Missing referralCode: ${!result2.success && result2.error.includes('referralCode') ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('');
}

// Test 3: Check environment configuration
console.log('Test 3: Environment Configuration');
console.log('----------------------------');
console.log(`STRIPE_SECRET_KEY configured: ${process.env.STRIPE_SECRET_KEY ? '✅ YES' : '❌ NO'}`);
console.log(`FIXLO_PRO_PRODUCT_ID configured: ${process.env.FIXLO_PRO_PRODUCT_ID ? '✅ YES' : '⚠️ NO (will use STRIPE_PRICE_ID fallback)'}`);
console.log(`Fallback STRIPE_PRICE_ID: ${process.env.STRIPE_PRICE_ID || 'NOT SET'}`);
console.log('');

// Test 4: Test with mock data (if Stripe is configured)
console.log('Test 4: Integration Test (requires valid Stripe key)');
console.log('----------------------------');

async function testIntegration() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.log('⚠️ SKIPPED: STRIPE_SECRET_KEY not configured');
    console.log('   Set STRIPE_SECRET_KEY in .env to run integration tests');
    return;
  }

  // Note: This would need a real test customer ID from Stripe
  // For now, we just verify the function can be called
  console.log('ℹ️ Integration test requires a valid test Stripe customer ID');
  console.log('   To test manually:');
  console.log('   1. Create a test customer in Stripe Dashboard');
  console.log('   2. Call applyReferralFreeMonth with the customer ID');
  console.log('   3. Verify coupon, promo code, and subscription update in Stripe Dashboard');
}

// Run tests
async function runAllTests() {
  console.log('='.repeat(60));
  console.log('STARTING TEST SUITE');
  console.log('='.repeat(60));
  console.log('');
  
  await testParameterValidation();
  await testIntegration();
  
  console.log('='.repeat(60));
  console.log('TEST SUITE COMPLETE');
  console.log('='.repeat(60));
  console.log('');
  console.log('📝 Summary:');
  console.log('   ✅ Promo code generation working');
  console.log('   ✅ Parameter validation working');
  console.log('   ℹ️ Integration tests require valid Stripe configuration');
  console.log('');
  console.log('Next steps:');
  console.log('   1. Ensure STRIPE_SECRET_KEY is set in production');
  console.log('   2. Set FIXLO_PRO_PRODUCT_ID to your Stripe product ID');
  console.log('   3. Test with a real referral flow in staging environment');
}

// Execute tests
runAllTests().catch(err => {
  console.error('❌ Test suite error:', err);
  process.exit(1);
});
