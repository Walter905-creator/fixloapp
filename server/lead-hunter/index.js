// Fixlo Lead Hunter - Entry Point
// Autonomous intelligence system for opportunity detection

const { runObserver } = require('./observer');
const { runGuarded } = require('./guarded');
const { runTuning } = require('./tuning');
const { acquireLock, releaseLock, setupLockCleanup } = require('./utils/lockManager');
const { MODES, DEFAULT_MODE, MODE_CONFIG } = require('./config/modes');

// Get mode from command line or environment
const mode = process.argv[2] || process.env.LEAD_HUNTER_MODE || DEFAULT_MODE;

async function main() {
  // Validate mode
  const validModes = Object.values(MODES);
  if (!validModes.includes(mode)) {
    console.error(`❌ Invalid mode: ${mode}`);
    console.error(`   Valid modes: ${validModes.join(', ')}`);
    console.error(`\n   Usage: node lead-hunter/index.js <mode>`);
    console.error(`   Example: node lead-hunter/index.js observer`);
    process.exit(1);
  }
  
  // Get mode config
  const modeConfig = MODE_CONFIG[mode];
  
  // Check if mode requires opt-in
  if (modeConfig.requiresOptIn) {
    const envMode = process.env.LEAD_HUNTER_MODE;
    if (envMode !== mode) {
      console.error(`❌ ${modeConfig.name} requires explicit opt-in`);
      console.error(`   Set LEAD_HUNTER_MODE=${mode} in environment or .env file`);
      process.exit(1);
    }
  }
  
  console.log(`🤖 Fixlo Lead Hunter starting in ${modeConfig.name} mode...`);
  console.log(`📋 ${modeConfig.description}`);
  console.log(`📖 Read-only: ${modeConfig.readOnly ? 'Yes' : 'No'}`);
  console.log(`🛡️ Requires opt-in: ${modeConfig.requiresOptIn ? 'Yes' : 'No'}`);
  
  // Setup lock cleanup handlers
  setupLockCleanup(mode);
  
  // Try to acquire lock
  const lockAcquired = acquireLock(mode);
  if (!lockAcquired) {
    console.log('⚠️ Another instance is already running. Exiting safely.');
    process.exit(0); // Exit successfully - not an error condition
  }
  
  try {
    let result;
    
    switch (mode) {
      case MODES.OBSERVER:
        result = await runObserver();
        break;
        
      case MODES.GUARDED:
        result = await runGuarded();
        break;
        
      case MODES.TUNING:
        result = await runTuning();
        break;
        
      default:
        throw new Error(`Unhandled mode: ${mode}`);
    }
    
    console.log(`\n✅ ${modeConfig.name} run completed successfully`);
    
    // Release lock before exit
    releaseLock(mode);
    process.exit(0);
    
  } catch (error) {
    console.error(`\n❌ Lead Hunter failed (${mode} mode):`, error.message);
    console.error(error.stack);
    
    // Release lock before exit
    releaseLock(mode);
    process.exit(1);
  }
}

// Display help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  displayHelp();
  process.exit(0);
}

function displayHelp() {
  console.log(`
🎯 Fixlo Lead Hunter - Autonomous Intelligence System

USAGE:
  node lead-hunter/index.js <mode>

MODES:
  observer   (Default) Intelligence gathering only, read-only
  guarded    Feed opportunities to SEO agent (requires opt-in)
  tuning     Analyze performance and recommend threshold optimizations

EXAMPLES:
  # Run observer mode (default, safe)
  node lead-hunter/index.js observer
  
  # Run guarded mode (requires LEAD_HUNTER_MODE=guarded in .env)
  LEAD_HUNTER_MODE=guarded node lead-hunter/index.js guarded
  
  # Run tuning mode
  node lead-hunter/index.js tuning
  
  # Dry run guarded mode (no proposals written)
  LEAD_HUNTER_MODE=guarded node lead-hunter/index.js guarded --dry-run

ENVIRONMENT VARIABLES:
  LEAD_HUNTER_MODE                 Mode to run (observer, guarded, tuning)
  LEAD_HUNTER_ENABLED              Master enable/disable (default: true)
  LEAD_HUNTER_MAX_DAILY_FEEDS      Max proposals per day (default: 10)
  LEAD_HUNTER_MIN_OPPORTUNITY_SCORE Minimum score to feed (default: 60)

SAFETY:
  - Observer mode is the default (read-only, zero risk)
  - Guarded mode requires explicit opt-in via environment variable
  - All modes use lock files to prevent concurrent execution
  - Rate limits enforce safe operation
  - Full logging and audit trail

For more information, see:
  - /server/lead-hunter/ARCHITECTURE.md
  - /server/lead-hunter/README.md
`);
}

main();
