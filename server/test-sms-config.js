#!/usr/bin/env node

/**
 * SMS Configuration Test Script
 * Tests Twilio configuration and SMS notification system
 * Run: node test-sms-config.js
 */

require('dotenv').config();
const twilio = require('twilio');

console.log('🧪 Testing SMS Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`   TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Missing'}`);
console.log(`   TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Missing'}`);
console.log(`   TWILIO_PHONE: ${process.env.TWILIO_PHONE ? process.env.TWILIO_PHONE : 'Missing'}\n`);

// Check if Twilio can be initialized
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio client initialized successfully');
    
    // Validate Account SID format
    if (!process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
      console.log('❌ TWILIO_ACCOUNT_SID must start with "AC"');
    } else {
      console.log('✅ TWILIO_ACCOUNT_SID format is valid');
    }
    
    // Validate Phone number
    if (!process.env.TWILIO_PHONE) {
      console.log('❌ TWILIO_PHONE is required for SMS notifications');
    } else if (!process.env.TWILIO_PHONE.startsWith('+')) {
      console.log('❌ TWILIO_PHONE must be in E.164 format (start with +)');
    } else {
      console.log('✅ TWILIO_PHONE format appears valid');
    }
    
  } catch (error) {
    console.log('❌ Failed to initialize Twilio client:', error.message);
    twilioClient = null;
  }
} else {
  console.log('⚠️ Twilio credentials missing - SMS notifications will be disabled');
}

// Test database-less notification logic
console.log('\n🔍 Testing Notification Logic (without database):');

// Simulate a service request
const mockRequest = {
  name: 'John Doe',
  phone: '+15551234567',
  trade: 'plumbing',
  address: '123 Main St, New York, NY',
  description: 'Leaking faucet repair'
};

console.log('📝 Mock service request:', mockRequest);

// Simulate what happens in the leads route
if (twilioClient && process.env.TWILIO_PHONE) {
  console.log('✅ SMS notifications would be enabled (if professionals are found)');
  console.log('   Message would be sent from:', process.env.TWILIO_PHONE);
  console.log('   Sample message: "FIXLO: New plumbing request near 123 Main St, New York, NY. John Doe (+15551234567). "Leaking faucet repair""');
} else {
  console.log('❌ SMS notifications are disabled because:');
  if (!twilioClient) {
    console.log('   - Twilio client not initialized');
  }
  if (!process.env.TWILIO_PHONE) {
    console.log('   - TWILIO_PHONE not configured');
  }
}

console.log('\n📖 Configuration Instructions:');
console.log('1. Get Twilio credentials from https://console.twilio.com/');
console.log('2. Set environment variables in server/.env:');
console.log('   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
console.log('   TWILIO_AUTH_TOKEN=your_auth_token');
console.log('   TWILIO_PHONE=+1234567890');
console.log('3. Make sure TWILIO_PHONE is a verified Twilio number');
console.log('4. Configure MongoDB to enable professional matching');
console.log('5. Add professionals to the database with wantsNotifications=true');

console.log('\n✅ Test completed!');