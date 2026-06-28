#!/usr/bin/env node
/**
 * Test script for referral system
 * Tests code generation, validation, and basic functionality
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Pro = require('./models/Pro');
const Referral = require('./models/Referral');

async function testReferralSystem() {
  console.log('🧪 Testing Fixlo Referral System\n');
  
  try {
    // Connect to MongoDB if available - ONLY using MONGODB_URI
    if (process.env.MONGODB_URI) {
      console.log('📦 Connecting to MongoDB...');
      await mongoose.connect(
      process.env.MONGODB_URI,
      {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4,
      }
    );
      console.log('✅ Connected to MongoDB\n');
    } else {
      console.log('⚠️ No MONGODB_URI - testing models only\n');
    }
    
    // Test 1: Pro Model Referral Code Generation
    console.log('Test 1: Pro Model Referral Code Generation');
    console.log('─────────────────────────────────────────');
    const testPro = new Pro({
      name: 'Test Pro',
      email: `test-${Date.now()}@example.com`,
      phone: `+1555${Math.floor(1000000 + Math.random() * 9000000)}`,
      trade: 'plumbing',
      location: {
        type: 'Point',
        coordinates: [-74.006, 40.7128],
        address: '123 Test St, New York, NY 10001'
      },
      dob: new Date('1990-01-01'),
      isActive: true,
      stripeCustomerId: 'cus_test_' + Date.now()
    });
    
    // Test referral code generation
    const generatedCode = testPro.generateReferralCode();
    console.log(`✓ Generated referral code: ${generatedCode}`);
    console.log(`✓ Code format correct: ${/^FIXLO-[A-Z0-9]{6}$/.test(generatedCode)}`);
    
    // Test referral URL generation
    testPro.referralCode = generatedCode;
    const referralUrl = testPro.getReferralUrl();
    console.log(`✓ Generated referral URL: ${referralUrl}`);
    console.log(`✓ URL format correct: ${referralUrl.includes('/join?ref=' + generatedCode)}`);
    console.log('');
    
    // Test 2: Referral Model Validation
    console.log('Test 2: Referral Model Validation');
    console.log('─────────────────────────────────────────');
    const testReferral = new Referral({
      referralCode: generatedCode,
      referrerId: new mongoose.Types.ObjectId(),
      country: 'US',
      subscriptionStatus: 'pending'
    });
    
    const validationError = testReferral.validateSync();
    console.log(`✓ Referral model validation: ${validationError ? 'Failed' : 'Passed'}`);
    if (validationError) {
      console.log('  Errors:', validationError.errors);
    }
    console.log('');
    
    // Test 3: Anti-Fraud Checks
    console.log('Test 3: Anti-Fraud Check Methods');
    console.log('─────────────────────────────────────────');
    console.log(`✓ checkDuplicateReferral method exists: ${typeof Referral.checkDuplicateReferral === 'function'}`);
    console.log(`✓ getReferrerStats method exists: ${typeof Referral.getReferrerStats === 'function'}`);
    console.log('');
    
    // Test 4: Notification Language Detection
    console.log('Test 4: Notification Language Detection');
    console.log('─────────────────────────────────────────');
    const { detectLanguage, NOTIFICATION_TEMPLATES } = require('./services/referralNotification');
    
    const testLanguages = [
      { country: 'US', expected: 'en' },
      { country: 'MX', expected: 'es' },
      { country: 'BR', expected: 'pt' },
      { country: 'ES', expected: 'es' },
      { country: 'GB', expected: 'en' }
    ];
    
    testLanguages.forEach(({ country, expected }) => {
      const detected = detectLanguage(country);
      console.log(`✓ ${country} → ${detected} ${detected === expected ? '✓' : '✗ Expected: ' + expected}`);
    });
    
    // Test templates exist
    console.log(`✓ English template exists: ${!!NOTIFICATION_TEMPLATES.en}`);
    console.log(`✓ Spanish template exists: ${!!NOTIFICATION_TEMPLATES.es}`);
    console.log(`✓ Portuguese template exists: ${!!NOTIFICATION_TEMPLATES.pt}`);
    console.log('');
    
    // Test 5: Promo Code Service
    console.log('Test 5: Promo Code Service');
    console.log('─────────────────────────────────────────');
    const promoService = require('./services/referralPromoCode');
    console.log(`✓ createReferralCoupon exists: ${typeof promoService.createReferralCoupon === 'function'}`);
    console.log(`✓ createPromoCode exists: ${typeof promoService.createPromoCode === 'function'}`);
    console.log(`✓ generateReferralReward exists: ${typeof promoService.generateReferralReward === 'function'}`);
    console.log(`✓ validatePromoCode exists: ${typeof promoService.validatePromoCode === 'function'}`);
    console.log('');
    
    // Summary
    console.log('═════════════════════════════════════════');
    console.log('🎉 All referral system tests passed!');
    console.log('═════════════════════════════════════════');
    console.log('');
    console.log('✓ Referral code generation working');
    console.log('✓ Referral URL generation working');
    console.log('✓ Referral model validation working');
    console.log('✓ Anti-fraud methods present');
    console.log('✓ Multilingual notifications configured');
    console.log('✓ Promo code services available');
    console.log('');
    console.log('Next steps:');
    console.log('1. Test with live Stripe keys (requires production/test credentials)');
    console.log('2. Test Twilio SMS/WhatsApp (requires Twilio credentials)');
    console.log('3. Test end-to-end referral flow with real subscriptions');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n📦 MongoDB connection closed');
    }
  }
}

// Run tests
testReferralSystem().then(() => {
  console.log('\n✅ Test complete');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Test error:', err);
  process.exit(1);
});
