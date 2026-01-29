// Fixlo SEO Domination Agent - Entry Point
// This file decides WHAT MODE runs (daily or weekly)
// NO UI - Backend only, autonomous operation

const { runDaily } = require('./daily');
const { runWeekly } = require('./weekly');
const { acquireLock, releaseLock, setupLockCleanup } = require('./utils/lockManager');

const mode = process.argv[2];

async function main() {
  console.log(`🤖 Fixlo SEO Agent starting in ${mode} mode...`);
  
  // Validate mode
  if (mode !== 'daily' && mode !== 'weekly') {
    console.error('❌ Invalid SEO agent mode. Use "daily" or "weekly"');
    process.exit(1);
  }
  
  // Setup lock cleanup handlers
  setupLockCleanup(mode);
  
  // Try to acquire lock
  const lockAcquired = acquireLock(mode);
  if (!lockAcquired) {
    console.log('⚠️ Another instance is already running. Exiting safely.');
    process.exit(0); // Exit successfully - not an error condition
  }
  
  try {
    if (mode === 'daily') {
      await runDaily();
      console.log('✅ Daily SEO agent run completed successfully');
    } else if (mode === 'weekly') {
      await runWeekly();
      console.log('✅ Weekly SEO agent run completed successfully');
    }
    
    // Release lock before exit
    releaseLock(mode);
    process.exit(0);
  } catch (error) {
    console.error('❌ SEO Agent failed:', error.message);
    console.error(error.stack);
    
    // Release lock before exit
    releaseLock(mode);
    process.exit(1);
  }
}

main();
