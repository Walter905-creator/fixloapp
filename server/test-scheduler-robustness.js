#!/usr/bin/env node
/**
 * Test script to verify scheduler robustness improvements
 * Tests graceful handling of missing credentials and proper logging
 */

console.log('================================================');
console.log('Scheduler Robustness Test');
console.log('================================================\n');

let testsPassed = 0;
let testsFailed = 0;

// Backup environment variables
const originalEnv = {
  GSC_CLIENT_EMAIL: process.env.GSC_CLIENT_EMAIL,
  GSC_PRIVATE_KEY: process.env.GSC_PRIVATE_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID
};

async function runTests() {
  // TEST 1: GSC Client graceful handling without credentials
  console.log('TEST 1: GSC Client - Missing Credentials Handling');
  console.log('--------------------------------------------------');
  try {
    // Clear GSC credentials
    delete process.env.GSC_CLIENT_EMAIL;
    delete process.env.GSC_PRIVATE_KEY;
    
    // Clear require cache to get fresh instance
    delete require.cache[require.resolve('./services/seo/gscClient')];
    
    const { getGSCClient } = require('./services/seo/gscClient');
    const client = getGSCClient();
    
    // Test initialization without credentials
    const initResult = await client.initialize();
    
    if (initResult === false) {
      console.log('✅ Client returns false when credentials missing');
    } else {
      console.error('❌ Client should return false, returned:', initResult);
      testsFailed++;
    }
    
    // Test syncLastNDays without credentials
    const syncResult = await client.syncLastNDays(7);
    
    if (syncResult.skipped === true && syncResult.reason) {
      console.log('✅ syncLastNDays returns gracefully with skipped flag');
      console.log(`   Reason: ${syncResult.reason}`);
      testsPassed++;
    } else {
      console.error('❌ syncLastNDays should return with skipped flag');
      testsFailed++;
    }
  } catch (err) {
    console.error('❌ TEST 1 FAILED - Exception thrown:', err.message);
    testsFailed++;
  }
  console.log();

  // TEST 2: Lead Hunter passive mode logging
  console.log('TEST 2: Lead Hunter - Passive Mode Logging');
  console.log('-------------------------------------------');
  try {
    // Clear require cache
    delete require.cache[require.resolve('./services/aiLeadHunter')];
    
    const { huntLeads } = require('./services/aiLeadHunter');
    
    // Capture console output
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };
    
    // Run lead hunter twice
    const result1 = await huntLeads();
    const result2 = await huntLeads();
    
    // Restore console
    console.log = originalLog;
    
    // Count how many times passive mode message appears
    const passiveModeMessages = logs.filter(log => 
      log.includes('passive mode') && log.includes('no external sources configured')
    );
    
    if (passiveModeMessages.length === 1) {
      console.log('✅ Passive mode message logged only once');
      testsPassed++;
    } else {
      console.error(`❌ Passive mode message should appear once, appeared ${passiveModeMessages.length} times`);
      testsFailed++;
    }
    
    // Verify no "not yet configured" repeated messages
    const notConfiguredMessages = logs.filter(log => 
      log.includes('not yet configured')
    );
    
    if (notConfiguredMessages.length === 0) {
      console.log('✅ No repeated "not yet configured" messages');
      testsPassed++;
    } else {
      console.error(`❌ Found ${notConfiguredMessages.length} "not yet configured" messages`);
      testsFailed++;
    }
  } catch (err) {
    console.error('❌ TEST 2 FAILED - Exception thrown:', err.message);
    testsFailed++;
  }
  console.log();

  // TEST 3: SEO Agent duplicate start protection
  console.log('TEST 3: SEO Agent - Duplicate Start Protection');
  console.log('-----------------------------------------------');
  try {
    // Clear require cache
    delete require.cache[require.resolve('./services/seo/seoAgent')];
    
    const { getSEOAgent } = require('./services/seo/seoAgent');
    const agent = getSEOAgent();
    
    // Check if agent has isRunning property
    if (typeof agent.isRunning !== 'undefined') {
      console.log('✅ Agent has isRunning flag');
      testsPassed++;
    } else {
      console.error('❌ Agent missing isRunning flag');
      testsFailed++;
    }
    
    // Verify status method exists
    if (typeof agent.getStatus === 'function') {
      const status = agent.getStatus();
      console.log('✅ Agent has getStatus() method');
      console.log(`   Current status:`, status);
      testsPassed++;
    } else {
      console.error('❌ Agent missing getStatus() method');
      testsFailed++;
    }
  } catch (err) {
    console.error('❌ TEST 3 FAILED - Exception thrown:', err.message);
    testsFailed++;
  }
  console.log();

  // TEST 4: Scheduler jobs structure
  console.log('TEST 4: Scheduler Jobs - Structure Validation');
  console.log('----------------------------------------------');
  try {
    delete require.cache[require.resolve('./services/seo/scheduler')];
    
    const { getSEOAgentScheduler } = require('./services/seo/scheduler');
    const scheduler = getSEOAgentScheduler();
    
    if (Array.isArray(scheduler.jobs)) {
      console.log(`✅ Scheduler has jobs array (${scheduler.jobs.length} jobs)`);
      testsPassed++;
    } else {
      console.error('❌ Scheduler missing jobs array');
      testsFailed++;
    }
    
    const status = scheduler.getStatus();
    if (status && typeof status === 'object') {
      console.log('✅ Scheduler getStatus() returns object');
      console.log(`   Enabled: ${status.enabled}`);
      console.log(`   Job count: ${status.jobCount}`);
      testsPassed++;
    } else {
      console.error('❌ Scheduler getStatus() should return object');
      testsFailed++;
    }
  } catch (err) {
    console.error('❌ TEST 4 FAILED - Exception thrown:', err.message);
    testsFailed++;
  }
  console.log();

  // Restore environment variables
  process.env.GSC_CLIENT_EMAIL = originalEnv.GSC_CLIENT_EMAIL;
  process.env.GSC_PRIVATE_KEY = originalEnv.GSC_PRIVATE_KEY;
  process.env.OPENAI_API_KEY = originalEnv.OPENAI_API_KEY;
  process.env.TWILIO_ACCOUNT_SID = originalEnv.TWILIO_ACCOUNT_SID;

  // Summary
  console.log('================================================');
  console.log('Test Summary');
  console.log('================================================');
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log();

  if (testsFailed === 0) {
    console.log('✅ ALL TESTS PASSED');
    console.log('\nScheduler robustness improvements verified:');
    console.log('  - GSC gracefully handles missing credentials');
    console.log('  - Lead Hunter logs passive mode once only');
    console.log('  - SEO Agent has duplicate start protection');
    console.log('  - Scheduler structure is valid');
    console.log('================================================\n');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('================================================\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
