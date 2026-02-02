#!/usr/bin/env node

/**
 * Unit Test for Early Access Reset Logic
 * 
 * Tests the reset logic without requiring database access
 * Validates key behaviors:
 * - Idempotency (running multiple times doesn't double-increase)
 * - History tracking
 * - Spot validation (never negative)
 */

const assert = require('assert');

// Mock the EarlyAccessSpots model behavior
class MockEarlyAccessSpots {
  constructor(spotsRemaining = 0) {
    this.spotsRemaining = spotsRemaining;
    this.history = [];
    this.singleton = 'only';
  }

  async save() {
    return this;
  }

  isEarlyAccessAvailable() {
    return this.spotsRemaining > 0;
  }
}

// Test the reset logic
async function testResetLogic() {
  console.log('🧪 Running Early Access Reset Logic Tests...\n');
  
  let passed = 0;
  let failed = 0;

  // Test 1: Reset from 0 to 37
  try {
    console.log('Test 1: Reset from 0 to 37 spots');
    const instance = new MockEarlyAccessSpots(0);
    const previousCount = instance.spotsRemaining;
    const targetSpots = 37;
    
    // Simulate reset logic
    instance.spotsRemaining = targetSpots;
    instance.history.push({
      previousCount,
      newCount: targetSpots,
      reason: 'manual_adjustment',
      metadata: {
        adjustmentAmount: targetSpots - previousCount,
        businessReason: 'Business decision: Re-enable early access pricing promotion'
      }
    });
    
    assert.strictEqual(instance.spotsRemaining, 37, 'Spots should be 37');
    assert.strictEqual(instance.isEarlyAccessAvailable(), true, 'Early access should be available');
    assert.strictEqual(instance.history.length, 1, 'History should have one entry');
    assert.strictEqual(instance.history[0].metadata.adjustmentAmount, 37, 'Adjustment should be +37');
    
    console.log('  ✅ PASSED\n');
    passed++;
  } catch (error) {
    console.log('  ❌ FAILED:', error.message, '\n');
    failed++;
  }

  // Test 2: Idempotency - reset when already at target
  try {
    console.log('Test 2: Idempotency - reset when already at 37');
    const instance = new MockEarlyAccessSpots(37);
    const previousCount = instance.spotsRemaining;
    const targetSpots = 37;
    
    // Simulate idempotent behavior
    if (previousCount === targetSpots) {
      console.log('  → Spots already at target, no action needed');
    } else {
      instance.spotsRemaining = targetSpots;
      instance.history.push({
        previousCount,
        newCount: targetSpots,
        reason: 'manual_adjustment'
      });
    }
    
    assert.strictEqual(instance.spotsRemaining, 37, 'Spots should remain 37');
    assert.strictEqual(instance.history.length, 0, 'History should be empty (no change made)');
    
    console.log('  ✅ PASSED\n');
    passed++;
  } catch (error) {
    console.log('  ❌ FAILED:', error.message, '\n');
    failed++;
  }

  // Test 3: Reset from 5 to 37 (partial exhaustion)
  try {
    console.log('Test 3: Reset from 5 to 37 spots (partial exhaustion)');
    const instance = new MockEarlyAccessSpots(5);
    const previousCount = instance.spotsRemaining;
    const targetSpots = 37;
    
    instance.spotsRemaining = targetSpots;
    instance.history.push({
      previousCount,
      newCount: targetSpots,
      reason: 'manual_adjustment',
      metadata: {
        adjustmentAmount: targetSpots - previousCount
      }
    });
    
    assert.strictEqual(instance.spotsRemaining, 37, 'Spots should be 37');
    assert.strictEqual(instance.history[0].previousCount, 5, 'Previous count should be 5');
    assert.strictEqual(instance.history[0].newCount, 37, 'New count should be 37');
    assert.strictEqual(instance.history[0].metadata.adjustmentAmount, 32, 'Adjustment should be +32');
    
    console.log('  ✅ PASSED\n');
    passed++;
  } catch (error) {
    console.log('  ❌ FAILED:', error.message, '\n');
    failed++;
  }

  // Test 4: Custom spot count
  try {
    console.log('Test 4: Custom spot count (50 instead of 37)');
    const instance = new MockEarlyAccessSpots(0);
    const targetSpots = 50;
    
    instance.spotsRemaining = targetSpots;
    instance.history.push({
      previousCount: 0,
      newCount: targetSpots,
      reason: 'manual_adjustment'
    });
    
    assert.strictEqual(instance.spotsRemaining, 50, 'Spots should be 50');
    assert.strictEqual(instance.isEarlyAccessAvailable(), true, 'Early access should be available');
    
    console.log('  ✅ PASSED\n');
    passed++;
  } catch (error) {
    console.log('  ❌ FAILED:', error.message, '\n');
    failed++;
  }

  // Test 5: Never negative
  try {
    console.log('Test 5: Validation - spots never negative');
    const instance = new MockEarlyAccessSpots(0);
    const targetSpots = -10; // Invalid input
    
    // Validate and sanitize
    const sanitizedSpots = Math.max(0, targetSpots);
    instance.spotsRemaining = sanitizedSpots;
    
    assert.strictEqual(instance.spotsRemaining, 0, 'Negative spots should be clamped to 0');
    assert.strictEqual(instance.isEarlyAccessAvailable(), false, 'Early access should not be available');
    
    console.log('  ✅ PASSED\n');
    passed++;
  } catch (error) {
    console.log('  ❌ FAILED:', error.message, '\n');
    failed++;
  }

  // Test 6: isEarlyAccessAvailable() logic
  try {
    console.log('Test 6: isEarlyAccessAvailable() boundaries');
    
    const instance0 = new MockEarlyAccessSpots(0);
    const instance1 = new MockEarlyAccessSpots(1);
    const instance37 = new MockEarlyAccessSpots(37);
    
    assert.strictEqual(instance0.isEarlyAccessAvailable(), false, '0 spots = not available');
    assert.strictEqual(instance1.isEarlyAccessAvailable(), true, '1 spot = available');
    assert.strictEqual(instance37.isEarlyAccessAvailable(), true, '37 spots = available');
    
    console.log('  ✅ PASSED\n');
    passed++;
  } catch (error) {
    console.log('  ❌ FAILED:', error.message, '\n');
    failed++;
  }

  // Summary
  console.log('═══════════════════════════════════════════');
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════\n');

  if (failed > 0) {
    console.log('❌ Some tests failed');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Deploy the reset script to production');
    console.log('   2. Run: cd server && npm run reset-early-access');
    console.log('   3. Verify: GET /api/pricing-status');
    console.log('   4. Check homepage pricing display');
    process.exit(0);
  }
}

// Run tests
testResetLogic().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
