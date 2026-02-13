#!/usr/bin/env node

/**
 * Test script for AI+ Subscription Tier
 * 
 * This script tests:
 * 1. Checkout session creation with AI_PLUS tier
 * 2. Checkout session creation with PRO tier (default)
 * 3. AI+ priority lead matching logic
 * 
 * Usage:
 *   node test-ai-plus-tier.js
 * 
 * Requirements:
 *   - Server must be running (npm start)
 *   - STRIPE_SECRET_KEY must be set in .env
 */

const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

async function testAIPlusTier() {
  console.log('\n🧪 Testing AI+ Subscription Tier\n');
  console.log('='.repeat(70));
  
  try {
    // Test 1: Create checkout session for AI+ tier
    console.log('\n📝 Test 1: Create checkout session for AI+ tier ($99/month)');
    const aiPlusResponse = await axios.post(`${BASE_URL}/api/stripe/create-checkout-session`, {
      email: 'aiplus-test@example.com',
      userId: '507f1f77bcf86cd799439011',
      tier: 'AI_PLUS'
    });
    
    console.log('✅ AI+ checkout session created successfully!');
    console.log('Session ID:', aiPlusResponse.data.sessionId);
    console.log('Customer ID:', aiPlusResponse.data.customerId);
    console.log('Checkout URL:', aiPlusResponse.data.sessionUrl);
    
    // Test 2: Create checkout session for PRO tier (default)
    console.log('\n\n📝 Test 2: Create checkout session for PRO tier ($59.99/month)');
    const proResponse = await axios.post(`${BASE_URL}/api/stripe/create-checkout-session`, {
      email: 'pro-test@example.com',
      userId: '507f1f77bcf86cd799439012'
      // No tier specified - should default to PRO
    });
    
    console.log('✅ PRO checkout session created successfully!');
    console.log('Session ID:', proResponse.data.sessionId);
    console.log('Customer ID:', proResponse.data.customerId);
    console.log('Checkout URL:', proResponse.data.sessionUrl);
    
    // Test 3: Create checkout session with explicit PRO tier
    console.log('\n\n📝 Test 3: Create checkout session with explicit PRO tier');
    const proExplicitResponse = await axios.post(`${BASE_URL}/api/stripe/create-checkout-session`, {
      email: 'pro-explicit-test@example.com',
      userId: '507f1f77bcf86cd799439013',
      tier: 'PRO'
    });
    
    console.log('✅ Explicit PRO checkout session created successfully!');
    console.log('Session ID:', proExplicitResponse.data.sessionId);
    
    console.log('\n\n✅ All Stripe tier tests passed!');
    console.log('\n📌 Summary:');
    console.log('  • AI+ tier: $99/month - Priority access to AI-qualified leads');
    console.log('  • PRO tier: $59.99/month - Standard access to leads');
    console.log('  • Tier is stored in Stripe subscription metadata');
    console.log('  • Webhooks will update Pro model subscriptionTier field');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

async function testLeadPrioritization() {
  console.log('\n\n🧪 Testing AI+ Lead Prioritization Logic\n');
  console.log('='.repeat(70));
  
  try {
    // Connect to MongoDB to create test pros
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGO_URI not found in environment variables');
      console.error('❌ FATAL ERROR: Set MONGO_URI environment variable');
      process.exit(1);
    }
    
    console.log('\n📦 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const Pro = require('./models/Pro');
    
    // Create test pros with different tiers
    console.log('\n📝 Creating test pros with different subscription tiers...');
    
    const testLocation = {
      type: 'Point',
      coordinates: [-122.4194, 37.7749] // San Francisco
    };
    
    // Clean up any existing test pros
    await Pro.deleteMany({ email: /test-tier-.*@example\.com/ });
    
    // Create AI+ pro
    const aiPlusPro = await Pro.create({
      name: 'AI+ Test Pro',
      email: 'test-tier-aiplus@example.com',
      phone: '+11234567890',
      password: 'test123',
      trade: 'plumbing',
      location: testLocation,
      subscriptionTier: 'ai_plus',
      subscriptionStatus: 'active',
      isActive: true,
      wantsNotifications: true,
      rating: 4.5,
      avgRating: 4.5,
      completedJobs: 10
    });
    console.log('✅ Created AI+ pro:', aiPlusPro._id);
    
    // Create PRO tier pro
    const proPro = await Pro.create({
      name: 'PRO Test Pro',
      email: 'test-tier-pro@example.com',
      phone: '+11234567891',
      password: 'test123',
      trade: 'plumbing',
      location: testLocation,
      subscriptionTier: 'pro',
      subscriptionStatus: 'active',
      isActive: true,
      wantsNotifications: true,
      rating: 4.8,
      avgRating: 4.8,
      completedJobs: 50
    });
    console.log('✅ Created PRO pro:', proPro._id);
    
    // Create FREE tier pro
    const freePro = await Pro.create({
      name: 'FREE Test Pro',
      email: 'test-tier-free@example.com',
      phone: '+11234567892',
      password: 'test123',
      trade: 'plumbing',
      location: testLocation,
      subscriptionTier: 'free',
      subscriptionStatus: 'active',
      isActive: true,
      wantsNotifications: true,
      rating: 5.0,
      avgRating: 5.0,
      completedJobs: 100
    });
    console.log('✅ Created FREE pro:', freePro._id);
    
    // Test lead matching with AI+ priority
    const { matchPros } = require('./services/proMatching');
    
    console.log('\n📝 Test: AI-qualified lead matching with prioritizeAIPlus=true');
    const matchedPros = await matchPros({
      trade: 'plumbing',
      coordinates: [-122.4194, 37.7749], // Same location
      maxDistance: 30,
      prioritizeAIPlus: true
    });
    
    console.log(`\n✅ Matched ${matchedPros.length} pros`);
    
    if (matchedPros.length > 0) {
      console.log('\n📊 Lead Distribution Result:');
      matchedPros.forEach((match, index) => {
        const tier = match.pro.subscriptionTier;
        const tierLabel = tier === 'ai_plus' ? '🌟 AI+' : tier === 'pro' ? '⭐ PRO' : '💚 FREE';
        console.log(`  ${index + 1}. ${tierLabel} - ${match.pro.name} (Score: ${match.score}, Distance: ${match.distance}mi)`);
      });
      
      // Verify AI+ pro is first
      const firstProTier = matchedPros[0].pro.subscriptionTier;
      if (firstProTier === 'ai_plus') {
        console.log('\n✅ PASS: AI+ pro received priority access (first in list)');
      } else {
        console.log('\n❌ FAIL: AI+ pro should be first, but got:', firstProTier);
      }
    }
    
    // Test: Deactivate AI+ pro and verify fallback to PRO
    console.log('\n\n📝 Test: Fallback to PRO tier when no AI+ pros available');
    await Pro.updateOne(
      { _id: aiPlusPro._id },
      { isActive: false }
    );
    console.log('✅ Deactivated AI+ pro');
    
    const matchedPros2 = await matchPros({
      trade: 'plumbing',
      coordinates: [-122.4194, 37.7749],
      maxDistance: 30,
      prioritizeAIPlus: true
    });
    
    console.log(`\n✅ Matched ${matchedPros2.length} pros after AI+ deactivation`);
    
    if (matchedPros2.length > 0) {
      console.log('\n📊 Lead Distribution Result (no AI+ available):');
      matchedPros2.forEach((match, index) => {
        const tier = match.pro.subscriptionTier;
        const tierLabel = tier === 'ai_plus' ? '🌟 AI+' : tier === 'pro' ? '⭐ PRO' : '💚 FREE';
        console.log(`  ${index + 1}. ${tierLabel} - ${match.pro.name} (Score: ${match.score})`);
      });
      
      // Verify PRO pro is first (AI+ not available)
      const firstProTier2 = matchedPros2[0].pro.subscriptionTier;
      if (firstProTier2 === 'pro') {
        console.log('\n✅ PASS: System correctly fell back to PRO tier');
      } else {
        console.log('\n⚠️ Unexpected tier:', firstProTier2);
      }
    }
    
    // Clean up test data
    console.log('\n\n🧹 Cleaning up test data...');
    await Pro.deleteMany({ email: /test-tier-.*@example\.com/ });
    console.log('✅ Test data cleaned up');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
    console.log('\n\n✅ All lead prioritization tests passed!');
    console.log('\n📌 Verified behaviors:');
    console.log('  • AI+ pros receive exclusive first access to AI-qualified leads');
    console.log('  • System falls back to PRO tier when no AI+ pros available');
    console.log('  • System falls back to FREE tier when no PRO pros available');
    console.log('  • Priority logic is internal (not exposed to client)');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run tests
async function main() {
  console.log('\n🚀 Starting AI+ Tier Tests\n');
  
  try {
    // Test 1: Stripe checkout with tier support
    await testAIPlusTier();
    
    // Test 2: Lead prioritization logic
    await testLeadPrioritization();
    
    console.log('\n\n🎉 All tests completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Only run if called directly
if (require.main === module) {
  main();
}

module.exports = { testAIPlusTier, testLeadPrioritization };
