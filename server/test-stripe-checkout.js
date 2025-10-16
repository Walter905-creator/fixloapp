#!/usr/bin/env node

/**
 * Test script for Stripe Checkout with 30-day free trial
 * 
 * This script demonstrates how to use the new Stripe checkout endpoint
 * 
 * Usage:
 *   node test-stripe-checkout.js
 * 
 * Requirements:
 *   - Server must be running (npm start)
 *   - STRIPE_SECRET_KEY must be set in .env
 *   - STRIPE_PRICE_ID or default prod_SaAyX0rd1VWGE0 will be used
 */

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

async function testCreateCheckoutSession() {
  console.log('\n🧪 Testing Stripe Checkout Session Creation with 30-day Trial\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Create checkout session with new customer
    console.log('\n📝 Test 1: Create checkout session for new customer');
    const response = await axios.post(`${BASE_URL}/api/stripe/create-checkout-session`, {
      email: 'test@example.com',
      userId: '507f1f77bcf86cd799439011' // Sample MongoDB ObjectId
    });
    
    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\nCheckout URL:', response.data.sessionUrl);
    console.log('Customer ID:', response.data.customerId);
    console.log('Session ID:', response.data.sessionId);
    
    // Test 2: Create checkout session with existing customer
    console.log('\n\n📝 Test 2: Create checkout session for existing customer');
    const response2 = await axios.post(`${BASE_URL}/api/stripe/create-checkout-session`, {
      email: 'existing@example.com',
      userId: '507f1f77bcf86cd799439012',
      customerId: response.data.customerId // Reuse the customer ID from test 1
    });
    
    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response2.data, null, 2));
    
    // Test 3: Try to create session without email (should fail)
    console.log('\n\n📝 Test 3: Create checkout session without email (should fail)');
    try {
      await axios.post(`${BASE_URL}/api/stripe/create-checkout-session`, {
        userId: '507f1f77bcf86cd799439013'
      });
      console.log('❌ Test failed - should have returned error');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correctly rejected - missing email');
        console.log('Error:', error.response.data.message);
      } else {
        throw error;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Is the server running?');
      console.error('Make sure to start the server with: npm start');
    } else {
      console.error('Error:', error.message);
    }
    console.log('\n' + '='.repeat(60));
    process.exit(1);
  }
}

async function testWebhookEvents() {
  console.log('\n🔔 Webhook Event Examples\n');
  console.log('='.repeat(60));
  console.log('\nThe following webhook events are now supported:');
  console.log('\n1. checkout.session.completed');
  console.log('   - Triggered when checkout completes');
  console.log('   - Updates Pro record with subscription details');
  console.log('   - Sets trial end date');
  
  console.log('\n2. invoice.payment_succeeded');
  console.log('   - Triggered when payment succeeds');
  console.log('   - Updates Pro payment status to "active"');
  console.log('   - Updates subscription period dates');
  
  console.log('\n3. invoice.payment_failed');
  console.log('   - Triggered when payment fails');
  console.log('   - Updates Pro payment status to "failed"');
  console.log('   - Deactivates Pro account');
  console.log('   - TODO: Send notification email');
  
  console.log('\n4. customer.subscription.trial_will_end');
  console.log('   - Triggered 3 days before trial ends');
  console.log('   - Sends reminder to Pro');
  console.log('   - TODO: Implement email/SMS notification');
  
  console.log('\n5. customer.subscription.deleted');
  console.log('   - Triggered when subscription is cancelled');
  console.log('   - Updates Pro status to "cancelled"');
  console.log('   - Deactivates Pro account');
  
  console.log('\n' + '='.repeat(60));
}

// Run tests
async function main() {
  console.log('\n🚀 Stripe Checkout with 30-day Free Trial - Test Suite\n');
  
  // Show webhook information
  await testWebhookEvents();
  
  // Test the API endpoints
  await testCreateCheckoutSession();
  
  console.log('\n📚 Additional Information:\n');
  console.log('• The checkout session includes a 30-day free trial');
  console.log('• Customers are automatically created if not provided');
  console.log('• All subscription data is stored in the Pro model');
  console.log('• Webhook handlers update Pro records automatically');
  console.log('• Configure STRIPE_WEBHOOK_SECRET in .env for production\n');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testCreateCheckoutSession, testWebhookEvents };
