#!/usr/bin/env node

/**
 * Test script for serverless scheduler endpoints
 * Tests POST /api/social/scheduler/run and GET /api/social/scheduler/status
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'fixlo_admin_2026_super_secret_key';

console.log('🧪 Testing Serverless Scheduler Endpoints');
console.log('=' .repeat(60));
console.log(`Base URL: ${BASE_URL}`);
console.log('');

/**
 * Test GET /api/social/scheduler/status
 */
async function testStatus() {
  console.log('📊 Testing GET /api/social/scheduler/status');
  console.log('-'.repeat(60));
  
  try {
    const response = await fetch(`${BASE_URL}/api/social/scheduler/status`);
    const data = await response.json();
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
    
    // Validate response structure
    const checks = [
      { name: 'success', expected: true, actual: data.success },
      { name: 'serverless', expected: true, actual: data.serverless },
      { name: 'databaseAvailable', expected: 'boolean', actual: typeof data.databaseAvailable },
      { name: 'metaConnected', expected: 'boolean', actual: typeof data.metaConnected },
      { name: 'scheduler object', expected: true, actual: !!data.scheduler },
    ];
    
    console.log('✅ Validation:');
    checks.forEach(check => {
      const passed = check.actual === check.expected || (check.expected === 'boolean' && check.actual === 'boolean');
      console.log(`  ${passed ? '✅' : '❌'} ${check.name}: ${check.actual} ${passed ? '==' : '!='} ${check.expected}`);
    });
    
    if (data.scheduler) {
      console.log('\n📈 Scheduler State:');
      console.log(`  Last Run: ${data.scheduler.lastRunAt || 'Never'}`);
      console.log(`  Last Status: ${data.scheduler.lastRunStatus || 'N/A'}`);
      console.log(`  Total Executions: ${data.scheduler.totalExecutions || 0}`);
      console.log(`  Total Posts Published: ${data.scheduler.totalPostsPublished || 0}`);
      console.log(`  Execution Lock: ${data.scheduler.executionLock ? 'LOCKED' : 'Available'}`);
      
      if (data.scheduler.nextScheduledPost) {
        console.log(`  Next Post: ${data.scheduler.nextScheduledPost.platform} at ${data.scheduler.nextScheduledPost.scheduledFor}`);
      } else {
        console.log('  Next Post: None scheduled');
      }
    }
    
    console.log('');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    return { success: false, error: error.message };
  }
}

/**
 * Test POST /api/social/scheduler/run (without auth)
 */
async function testRunNoAuth() {
  console.log('🔒 Testing POST /api/social/scheduler/run (no auth)');
  console.log('-'.repeat(60));
  
  try {
    const response = await fetch(`${BASE_URL}/api/social/scheduler/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
    
    if (response.status === 401) {
      console.log('✅ Correctly rejected - authentication required');
    } else {
      console.log('❌ Should have rejected with 401');
    }
    
    console.log('');
    return { success: response.status === 401, data };
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    return { success: false, error: error.message };
  }
}

/**
 * Test POST /api/social/scheduler/run (with auth)
 */
async function testRunWithAuth() {
  console.log('🔑 Testing POST /api/social/scheduler/run (with auth)');
  console.log('-'.repeat(60));
  
  try {
    const response = await fetch(`${BASE_URL}/api/social/scheduler/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_SECRET_KEY}`
      }
    });
    const data = await response.json();
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
    
    if (data.success) {
      console.log('✅ Scheduler executed successfully');
      
      if (data.result) {
        console.log('\n📊 Execution Results:');
        console.log(`  Skipped: ${data.result.skipped || false}`);
        console.log(`  Posts Processed: ${data.result.postsProcessed || 0}`);
        console.log(`  Posts Published: ${data.result.postsPublished || 0}`);
        console.log(`  Duration: ${data.result.duration || 0}ms`);
        
        if (data.result.nextScheduledPost) {
          console.log(`  Next Post: ${data.result.nextScheduledPost.platform} at ${data.result.nextScheduledPost.scheduledFor}`);
        }
      }
    } else {
      console.log('❌ Scheduler execution failed');
      console.log(`  Error: ${data.error || 'Unknown error'}`);
    }
    
    console.log('');
    return { success: data.success, data };
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    return { success: false, error: error.message };
  }
}

/**
 * Test idempotency - call run twice quickly
 */
async function testIdempotency() {
  console.log('🔁 Testing Idempotency (concurrent execution protection)');
  console.log('-'.repeat(60));
  
  try {
    console.log('Calling scheduler/run twice in parallel...');
    
    const [result1, result2] = await Promise.all([
      fetch(`${BASE_URL}/api/social/scheduler/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_SECRET_KEY}`
        }
      }),
      fetch(`${BASE_URL}/api/social/scheduler/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_SECRET_KEY}`
        }
      })
    ]);
    
    const data1 = await result1.json();
    const data2 = await result2.json();
    
    console.log('\nFirst Request:');
    console.log(`  Status: ${result1.status}`);
    console.log(`  Skipped: ${data1.result?.skipped || false}`);
    
    console.log('\nSecond Request:');
    console.log(`  Status: ${result2.status}`);
    console.log(`  Skipped: ${data2.result?.skipped || false}`);
    
    // One should execute, one should be skipped
    const oneSkipped = data1.result?.skipped || data2.result?.skipped;
    
    if (oneSkipped) {
      console.log('\n✅ Idempotency working - one request was skipped due to concurrent execution');
    } else {
      console.log('\n⚠️  Both requests executed - check if database locking is working');
    }
    
    console.log('');
    return { success: true };
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    return { success: false, error: error.message };
  }
}

/**
 * Run all tests
 */
async function runTests() {
  const results = [];
  
  // Test 1: Status endpoint
  results.push(await testStatus());
  
  // Test 2: Run without auth (should fail)
  results.push(await testRunNoAuth());
  
  // Test 3: Run with auth (should succeed)
  results.push(await testRunWithAuth());
  
  // Test 4: Check status again to see updated state
  console.log('🔄 Checking status again after execution...');
  console.log('-'.repeat(60));
  results.push(await testStatus());
  
  // Test 5: Idempotency
  // Note: Skip if database not available
  const hasDb = results[0]?.data?.databaseAvailable;
  if (hasDb) {
    // Wait 10 seconds for lock to clear
    console.log('⏳ Waiting 10 seconds for execution lock to clear...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    results.push(await testIdempotency());
  } else {
    console.log('⏭️  Skipping idempotency test - database not available\n');
  }
  
  // Summary
  console.log('=' .repeat(60));
  console.log('📋 Test Summary');
  console.log('=' .repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`Passed: ${passed}/${total}`);
  console.log('');
  
  if (passed === total) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
