#!/usr/bin/env node
/**
 * Test script to verify SEO Agent Scheduler loads correctly
 * This tests the fix for the module path issue
 */

console.log('================================================');
console.log('SEO Agent Scheduler Loading Test');
console.log('================================================\n');

console.log('Initializing SEO Agent Scheduler...');

try {
  const { getSEOAgentScheduler, SEOAgentScheduler } = require('./services/seo/scheduler');
  console.log('SEO Agent module loaded successfully');
  
  // Verify exports
  console.log('\n✅ Module exports are correct:');
  console.log('  - getSEOAgentScheduler:', typeof getSEOAgentScheduler);
  console.log('  - SEOAgentScheduler:', typeof SEOAgentScheduler);
  
  // Try to instantiate (without initializing - to avoid needing DB)
  const scheduler = getSEOAgentScheduler();
  console.log('\n✅ Scheduler instance created successfully');
  console.log('  - isEnabled:', scheduler.isEnabled);
  console.log('  - jobCount:', scheduler.jobs.length);
  
  console.log('\n================================================');
  console.log('✅ TEST PASSED: SEO Agent Scheduler loads correctly');
  console.log('================================================');
  
} catch (err) {
  console.error('SEO Agent module failed to load:', err.message);
  console.error('Stack trace:', err.stack);
  console.error('\n================================================');
  console.error('❌ TEST FAILED');
  console.error('================================================');
  process.exit(1);
}
