#!/usr/bin/env node

/**
 * ACTIVATION SCRIPT: Walter Arevalo Pro Account
 * 
 * This script adds Walter Arevalo (Pro-4U Improvements LLC) as a Pro in the database,
 * bypassing Stripe subscription verification.
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

console.log('🔧 WALTER AREVALO PRO ACTIVATION SCRIPT');
console.log('=' .repeat(60));

async function activateOwnerPro() {
  // Get MongoDB connection details - ONLY using MONGODB_URI
  const MONGODB_URI = process.env.MONGODB_URI;
  const MONGODB_DB = process.env.MONGODB_DB || 'fixlo';
  
  if (!MONGODB_URI) {
    console.error('❌ Missing MONGODB_URI environment variable');
    console.error('❌ FATAL ERROR: Set MONGODB_URI environment variable');
    process.exit(1);
  }
  
  console.log(`📡 Connecting to MongoDB...`);
  console.log(`🗄️ Database: ${MONGODB_DB}`);
  
  let client;
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(MONGODB_DB);
    const prosCollection = db.collection('pros');
    
    // Walter's data - mapped to actual Pro model fields
    const walterData = {
      name: "Walter Arevalo",
      firstName: "Walter",
      lastName: "Arevalo",
      businessName: "Pro-4U Improvements LLC", // Maps to businessName field
      email: "pro4u.improvements@gmail.com",
      phone: "+15164449953",
      
      // Trade - using 'handyman' as 'General' is not in enum
      trade: "handyman",
      primaryService: "General", // Free text field for services
      
      // Location details
      city: "Charlotte",
      state: "NC",
      
      // Location coordinates for Charlotte, NC (approximate)
      location: {
        type: "Point",
        coordinates: [-80.8431, 35.2271], // [longitude, latitude]
        address: "Charlotte, NC 28202"
      },
      
      // Service radius
      serviceRadiusMiles: 30,
      
      // SMS and notifications
      smsConsent: true,
      notificationSettings: {
        email: true,
        sms: true,
        push: true
      },
      wantsNotifications: true,
      
      // Pro status - bypassing Stripe
      isActive: true,
      paymentStatus: "active", // Maps to paymentStatus enum
      isVerified: true,
      verificationStatus: "verified",
      
      // Stripe fields - set to null as requested
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripeSessionId: null,
      
      // Additional required fields for Pro model
      dob: new Date('1985-01-01'), // Placeholder DOB (required field)
      
      // Auto-populated timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
      joinedDate: new Date()
    };
    
    console.log('\n📝 ACTIVATING PRO ACCOUNT');
    console.log('-' .repeat(30));
    console.log(`👤 Name: ${walterData.name}`);
    console.log(`🏢 Business: ${walterData.businessName}`);
    console.log(`📧 Email: ${walterData.email}`);
    console.log(`📱 Phone: ${walterData.phone}`);
    console.log(`🔧 Trade: ${walterData.trade}`);
    console.log(`📍 Location: ${walterData.city}, ${walterData.state}`);
    
    // Use upsert to create or update
    const filter = {
      $or: [
        { email: walterData.email },
        { phone: walterData.phone }
      ]
    };
    
    const update = {
      $set: walterData,
      $setOnInsert: {
        createdAt: walterData.createdAt
      }
    };
    
    const options = { upsert: true, returnDocument: 'after' };
    
    console.log('\n⚡ EXECUTING UPSERT OPERATION');
    console.log('-' .repeat(30));
    
    const result = await prosCollection.findOneAndUpdate(filter, update, options);
    
    if (result.lastErrorObject && result.lastErrorObject.upserted) {
      console.log('✅ NEW PRO RECORD CREATED');
      console.log(`🆔 ObjectId: ${result.lastErrorObject.upserted}`);
    } else {
      console.log('🔄 EXISTING PRO RECORD UPDATED');
      console.log(`🆔 ObjectId: ${result.value._id}`);
    }
    
    // Display final record details
    const finalRecord = result.value;
    console.log('\n📊 FINAL PRO RECORD STATUS');
    console.log('-' .repeat(30));
    console.log(`👤 Name: ${finalRecord.name}`);
    console.log(`📧 Email: ${finalRecord.email}`);
    console.log(`📱 Phone: ${finalRecord.phone}`);
    console.log(`💳 Payment Status: ${finalRecord.paymentStatus}`);
    console.log(`📲 SMS Consent: ${finalRecord.smsConsent}`);
    console.log(`🟢 Active: ${finalRecord.isActive}`);
    console.log(`✅ Verified: ${finalRecord.isVerified}`);
    console.log(`🔧 Trade: ${finalRecord.trade}`);
    console.log(`📍 Service Radius: ${finalRecord.serviceRadiusMiles} miles`);
    
    console.log('\n🎉 SUCCESS: Walter Arevalo activated as Pro!');
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Test lead creation via /api/leads');
    console.log('2. Verify SMS notification to +1 516-444-9953');
    console.log('3. Check Pro dashboard functionality');
    
  } catch (error) {
    console.error('❌ Error activating Pro account:', error.message);
    console.error('📋 Full error:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 MongoDB connection closed');
    }
  }
}

// Run the script
if (require.main === module) {
  activateOwnerPro()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { activateOwnerPro };