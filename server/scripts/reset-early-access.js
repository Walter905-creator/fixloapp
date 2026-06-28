#!/usr/bin/env node

/**
 * Reset Early Access Spots Script
 * 
 * BUSINESS DECISION (2026-02-02):
 * Re-enable early access pricing to show $59.99 offer vs $179.99 standard price.
 * This is an intentional business reset to re-activate the special pricing promotion.
 * 
 * This script:
 * - Resets early access spots to 37 (default value)
 * - Records the change in history with 'manual_adjustment' reason
 * - Is idempotent (safe to run multiple times)
 * - Does NOT affect Stripe prices or existing subscriptions
 * 
 * Usage:
 *   node scripts/reset-early-access.js [spots]
 * 
 * Examples:
 *   node scripts/reset-early-access.js       # Reset to default 37 spots
 *   node scripts/reset-early-access.js 50    # Reset to 50 spots
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import the EarlyAccessSpots model
const EarlyAccessSpots = require('../models/EarlyAccessSpots');

async function resetEarlyAccess() {
  try {
    // Parse command line argument for custom spot count
    const customSpots = parseInt(process.argv[2]);
    const targetSpots = !isNaN(customSpots) && customSpots > 0 ? customSpots : 37;
    
    console.log('🚀 Early Access Reset Script Starting...');
    console.log(`📊 Target spots: ${targetSpots}`);
    
    // Connect to MongoDB - ONLY using MONGODB_URI
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable is not set');
      console.error('❌ FATAL ERROR: Set MONGODB_URI environment variable');
      throw new Error('MONGODB_URI environment variable is not set');
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
    console.log('✅ MongoDB connected');
    
    // Get or create the EarlyAccessSpots instance
    console.log('📥 Fetching EarlyAccessSpots instance...');
    const spotsInstance = await EarlyAccessSpots.getInstance();
    
    const previousCount = spotsInstance.spotsRemaining;
    console.log(`📊 Current spots: ${previousCount}`);
    
    // Check if reset is needed
    if (previousCount === targetSpots) {
      console.log(`✅ Spots already at target value (${targetSpots}). No action needed.`);
      console.log('💡 This is idempotent behavior - safe to run multiple times.');
    } else {
      // Reset spots to target value
      spotsInstance.spotsRemaining = targetSpots;
      
      // Add to history with business context
      spotsInstance.history.push({
        previousCount,
        newCount: targetSpots,
        reason: 'manual_adjustment',
        metadata: {
          adjustmentAmount: targetSpots - previousCount,
          businessReason: 'Business decision: Re-enable early access pricing promotion',
          resetDate: new Date().toISOString(),
          resetBy: 'admin-script'
        },
        timestamp: new Date()
      });
      
      // Save changes
      await spotsInstance.save();
      
      console.log('✅ Early Access Spots Reset Complete!');
      console.log(`📈 Spots updated: ${previousCount} → ${targetSpots}`);
      console.log('💰 Early access pricing ($59.99) is now ACTIVE');
    }
    
    // Verify the change
    const verifyInstance = await EarlyAccessSpots.getInstance();
    const isAvailable = verifyInstance.isEarlyAccessAvailable();
    
    console.log('\n📋 Current Status:');
    console.log(`   Spots Remaining: ${verifyInstance.spotsRemaining}`);
    console.log(`   Early Access Available: ${isAvailable ? '✅ YES' : '❌ NO'}`);
    console.log(`   Expected Pricing: ${isAvailable ? '$59.99/month' : '$179.99/month'}`);
    
    console.log('\n🎯 Next Steps:');
    console.log('   1. Test: GET /api/pricing-status');
    console.log('   2. Verify homepage shows "Special Early Access Offer"');
    console.log('   3. Daily decrement will continue automatically');
    console.log('   4. Early access will auto-disable when spots reach 0');
    
  } catch (error) {
    console.error('❌ Error resetting early access:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 MongoDB disconnected');
    }
  }
}

// Run the script
resetEarlyAccess()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
