/**
 * One-time database update script
 * Purpose: Add phone number to existing Pro user
 * 
 * Usage: node server/scripts/updateProPhone.js
 * 
 * This script:
 * - Finds the Pro user with email "pro4u.improvements@gmail.com"
 * - Updates the phone number to "+15164449953"
 * - Does NOT create a new user
 * - Does NOT change passwords
 * - Does NOT touch Stripe or job logic
 * - Production-safe update only
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Pro = require('../models/Pro');

async function updateProPhone() {
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
    
    // Target email
    const targetEmail = 'pro4u.improvements@gmail.com';
    const newPhone = '+15164449953';
    
    console.log(`\n🔍 Searching for Pro user with email: ${targetEmail}`);
    
    // Find the Pro user
    const pro = await Pro.findOne({ email: targetEmail.toLowerCase() });
    
    if (!pro) {
      console.error(`❌ Pro user with email ${targetEmail} not found`);
      process.exit(1);
    }
    
    console.log(`✅ Found Pro user: ${pro.name} (ID: ${pro._id})`);
    console.log(`📞 Current phone: ${pro.phone}`);
    
    // Check if phone number is already set to target value
    if (pro.phone === newPhone) {
      console.log(`✅ Phone number already set to ${newPhone}`);
      console.log('ℹ️  No update needed');
      return;
    }
    
    // Check if new phone number is already used by another user
    const existingProWithPhone = await Pro.findOne({ 
      phone: newPhone,
      _id: { $ne: pro._id } // Exclude current pro
    });
    
    if (existingProWithPhone) {
      console.error(`❌ Phone number ${newPhone} is already in use by another Pro user (${existingProWithPhone.name})`);
      process.exit(1);
    }
    
    // Update the phone number
    console.log(`\n🔄 Updating phone number to: ${newPhone}`);
    pro.phone = newPhone;
    await pro.save();
    
    console.log('✅ Phone number updated successfully!');
    console.log('\n📋 Updated Pro user details:');
    console.log(`   Name: ${pro.name}`);
    console.log(`   Email: ${pro.email}`);
    console.log(`   Phone: ${pro.phone}`);
    console.log(`   Trade: ${pro.trade}`);
    console.log(`   Active: ${pro.isActive}`);
    console.log(`   ID: ${pro._id}`);
    
  } catch (error) {
    console.error('❌ Script error:', error);
    process.exit(1);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    console.log('✅ Script completed');
  }
}

// Run the update
updateProPhone();
