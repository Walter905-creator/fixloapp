const mongoose = require('mongoose');

/**
 * Early Access Spots Tracking Schema
 * Manages the limited early-access spots for Fixlo Pro at $59.99
 * Once spots reach 0, new users must pay $179.99
 */
const earlyAccessSpotsSchema = new mongoose.Schema({
  // Total remaining spots
  spotsRemaining: {
    type: Number,
    required: true,
    min: 0, // Never negative
    default: 37
  },
  
  // History of spot changes
  history: [{
    previousCount: { type: Number, required: true },
    newCount: { type: Number, required: true },
    reason: { 
      type: String, 
      enum: ['subscription_created', 'daily_decrement', 'initial_setup', 'manual_adjustment'],
      required: true 
    },
    metadata: {
      subscriptionId: String,
      userId: String,
      adjustmentAmount: Number
    },
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Last daily decrement date (to prevent multiple decrements per day)
  lastDailyDecrement: {
    type: Date,
    default: null
  },
  
  // Lock to ensure single instance
  singleton: {
    type: String,
    default: 'only',
    unique: true
  }
}, {
  timestamps: true
});

// Static method to get or create the singleton instance
earlyAccessSpotsSchema.statics.getInstance = async function() {
  let instance = await this.findOne({ singleton: 'only' });
  
  if (!instance) {
    // Initialize with 37 spots
    instance = await this.create({
      spotsRemaining: 37,
      singleton: 'only',
      history: [{
        previousCount: 0,
        newCount: 37,
        reason: 'initial_setup',
        timestamp: new Date()
      }]
    });
    console.log('✅ Early access spots initialized: 37 spots');
  }
  
  return instance;
};

// Method to decrement spots (with safeguards)
earlyAccessSpotsSchema.methods.decrementSpots = async function(reason, metadata = {}) {
  const previousCount = this.spotsRemaining;
  
  // Never go below 0
  if (this.spotsRemaining <= 0) {
    console.log('⚠️ Early access spots already at 0, cannot decrement further');
    return false;
  }
  
  // Decrement by 1
  this.spotsRemaining = Math.max(0, this.spotsRemaining - 1);
  
  // Add to history
  this.history.push({
    previousCount,
    newCount: this.spotsRemaining,
    reason,
    metadata,
    timestamp: new Date()
  });
  
  await this.save();
  
  console.log(`📉 Early access spots decremented: ${previousCount} → ${this.spotsRemaining} (Reason: ${reason})`);
  
  return true;
};

// Method to check if early access is available
earlyAccessSpotsSchema.methods.isEarlyAccessAvailable = function() {
  return this.spotsRemaining > 0;
};

// Method to perform daily decrement (1-3 spots, bounded)
earlyAccessSpotsSchema.methods.performDailyDecrement = async function() {
  const now = new Date();
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Check if already decremented today
  if (this.lastDailyDecrement) {
    const lastDecrementDate = this.lastDailyDecrement.toISOString().split('T')[0];
    if (lastDecrementDate === today) {
      console.log('✅ Daily decrement already performed today');
      return false;
    }
  }
  
  // Skip if already at 0
  if (this.spotsRemaining <= 0) {
    console.log('⚠️ Early access spots at 0, skipping daily decrement');
    return false;
  }
  
  const previousCount = this.spotsRemaining;
  
  // Decrement by 1-3 spots (weighted toward 1-2)
  // Distribution: 50% chance of 1, 35% chance of 2, 15% chance of 3
  const rand = Math.random();
  let decrementAmount;
  if (rand < 0.50) {
    decrementAmount = 1;
  } else if (rand < 0.85) {
    decrementAmount = 2;
  } else {
    decrementAmount = 3;
  }
  
  // Never go below 0
  this.spotsRemaining = Math.max(0, this.spotsRemaining - decrementAmount);
  
  // Update last decrement date
  this.lastDailyDecrement = now;
  
  // Add to history
  this.history.push({
    previousCount,
    newCount: this.spotsRemaining,
    reason: 'daily_decrement',
    metadata: { adjustmentAmount: -decrementAmount },
    timestamp: now
  });
  
  await this.save();
  
  console.log(`📉 Daily spot decrement: ${previousCount} → ${this.spotsRemaining} (-${decrementAmount})`);
  
  return true;
};

module.exports = mongoose.model('EarlyAccessSpots', earlyAccessSpotsSchema);
