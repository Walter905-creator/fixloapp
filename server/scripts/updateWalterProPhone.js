/**
 * Update Walter Pro phone number to +15164449953
 * This script ensures the pro notification phone is in E.164 format
 * 
 * Usage: node server/scripts/updateWalterProPhone.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Pro = require('../models/Pro');

const TARGET_PHONE = '+15164449953';
const PRO_EMAIL = 'pro4u.improvements@gmail.com';

async function updateWalterProPhone() {
  try {
    // Connect to MongoDB - ONLY using MONGODB_URI
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      console.error('❌ FATAL ERROR: Set MONGODB_URI environment variable');
      process.exit(1);
    }
    
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(
      process.env.MONGODB_URI,
      {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4,
      }
    );
    console.log('✅ Connected to MongoDB');
    
    console.log(`\n🔍 Searching for Pro user with email: ${PRO_EMAIL}`);
    
    // Find the Walter Pro user
    const pro = await Pro.findOne({ email: PRO_EMAIL.toLowerCase() });
    
    if (!pro) {
      console.error(`❌ Pro user with email ${PRO_EMAIL} not found`);
      console.log('💡 The pro might need to be created first');
      process.exit(1);
    }
    
    console.log(`✅ Found Pro user: ${pro.name} (ID: ${pro._id})`);
    console.log(`📞 Current phone: ${pro.phone}`);
    
    // Check if phone number is already correct
    if (pro.phone === TARGET_PHONE) {
      console.log(`✅ Phone number already set to ${TARGET_PHONE}`);
      console.log('ℹ️  No update needed');
      console.log(`\n📋 Pro user details:`);
      console.log(`   Name: ${pro.name}`);
      console.log(`   Email: ${pro.email}`);
      console.log(`   Phone: ${pro.phone}`);
      console.log(`   Trade: ${pro.trade}`);
      console.log(`   Active: ${pro.isActive}`);
      console.log(`   SMS Consent: ${pro.smsConsent}`);
      console.log(`   Wants Notifications: ${pro.wantsNotifications}`);
      return;
    }
    
    // Check if new phone number is already used by another user
    const existingProWithPhone = await Pro.findOne({ 
      phone: TARGET_PHONE,
      _id: { $ne: pro._id }
    });
    
    if (existingProWithPhone) {
      console.error(`❌ Phone number ${TARGET_PHONE} is already in use by another Pro user (${existingProWithPhone.name})`);
      process.exit(1);
    }
    
    // Update the phone number
    console.log(`\n🔄 Updating phone number to: ${TARGET_PHONE}`);
    pro.phone = TARGET_PHONE;
    
    // Ensure SMS consent is enabled
    if (!pro.smsConsent) {
      console.log('🔄 Enabling SMS consent for job notifications');
      pro.smsConsent = true;
    }
    
    // Ensure notifications are enabled
    if (!pro.wantsNotifications) {
      console.log('🔄 Enabling job notifications');
      pro.wantsNotifications = true;
    }
    
    await pro.save();
    
    console.log('✅ Phone number updated successfully!');
    console.log('\n📋 Updated Pro user details:');
    console.log(`   Name: ${pro.name}`);
    console.log(`   Email: ${pro.email}`);
    console.log(`   Phone: ${pro.phone}`);
    console.log(`   Trade: ${pro.trade}`);
    console.log(`   Active: ${pro.isActive}`);
    console.log(`   SMS Consent: ${pro.smsConsent}`);
    console.log(`   Wants Notifications: ${pro.wantsNotifications}`);
    console.log(`   ID: ${pro._id}`);
    console.log('\n✅ Walter Pro is now configured to receive SMS notifications at:');
    console.log(`   📲 ${TARGET_PHONE}`);
    
  } catch (error) {
    console.error('❌ Script error:', error);
    if (error.name === 'ValidationError') {
      console.error('Validation details:', error.errors);
    }
    process.exit(1);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    console.log('✅ Script completed');
  }
}

// Run the update
updateWalterProPhone();
