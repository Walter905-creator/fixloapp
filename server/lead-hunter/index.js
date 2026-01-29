// Fixlo Lead Hunter - Entry Point
// Autonomous intelligence system for opportunity detection

const path = require('path');
const fs = require('fs');
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
    console.error(`\n❌ Invalid mode: "${mode}"\n`);
    console.error(`Valid modes: ${validModes.join(', ')}\n`);
    console.error(`Usage:`);
    console.error(`  node lead-hunter/index.js <mode>`);
    console.error(`  npm run lead-hunter:<mode>`);
    console.error(`\nExamples:`);
    console.error(`  node lead-hunter/index.js observer`);
    console.error(`  npm run lead-hunter:observer`);
    console.error(`\nFor more help, run:`);
    console.error(`  node lead-hunter/index.js help`);
    console.error(`  npm run lead-hunter:help\n`);
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

// Handle special commands first
if (process.argv.includes('--help') || process.argv.includes('-h') || mode === 'help') {
  displayHelp();
  process.exit(0);
}

if (mode === 'doctor') {
  runDoctor();
  process.exit(0);
}

function displayHelp() {
  console.log(`
🎯 Fixlo Lead Hunter - Autonomous Intelligence System

USAGE:
  node lead-hunter/index.js <mode>
  
  OR use npm scripts from /server directory:
  npm run lead-hunter:observer
  npm run lead-hunter:guarded
  npm run lead-hunter:tuning
  npm run lead-hunter:help
  npm run lead-hunter:doctor

MODES:
  observer   (Default) Intelligence gathering only, read-only
  guarded    Feed opportunities to SEO agent (requires opt-in)
  tuning     Analyze performance and recommend threshold optimizations
  help       Display this help message
  doctor     Run system health check

EXAMPLES:
  # Run observer mode (default, safe)
  node lead-hunter/index.js observer
  npm run lead-hunter:observer
  
  # Run guarded mode (requires LEAD_HUNTER_MODE=guarded in .env)
  LEAD_HUNTER_MODE=guarded node lead-hunter/index.js guarded
  npm run lead-hunter:guarded
  
  # Run tuning mode
  node lead-hunter/index.js tuning
  npm run lead-hunter:tuning
  
  # Check system health
  node lead-hunter/index.js doctor
  npm run lead-hunter:doctor
  
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

/**
 * Run system health check
 * Validates directory structure, required files, and configuration
 */
function runDoctor() {
  console.log('🏥 Lead Hunter System Health Check\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  let allChecksPass = true;
  
  // Resolve paths relative to /server/
  const serverDir = path.resolve(__dirname, '..');
  const leadHunterDir = path.resolve(__dirname);
  
  // Check 1: Directory structure
  console.log('📁 Checking directory structure...');
  const requiredDirs = [
    'config',
    'ingestion',
    'analysis',
    'integration',
    'safety',
    'utils',
  ];
  
  requiredDirs.forEach(dir => {
    const dirPath = path.join(leadHunterDir, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`   ✅ ${dir}/ exists`);
    } else {
      console.log(`   ❌ ${dir}/ missing`);
      allChecksPass = false;
    }
  });
  
  // Check 2: Required files
  console.log('\n📄 Checking required files...');
  const requiredFiles = [
    'index.js',
    'observer.js',
    'guarded.js',
    'tuning.js',
    'config/modes.js',
    'config/limits.js',
    'utils/lockManager.js',
    'utils/logger.js',
  ];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(leadHunterDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file} exists`);
    } else {
      console.log(`   ❌ ${file} missing`);
      allChecksPass = false;
    }
  });
  
  // Check 3: Logs directory
  console.log('\n📊 Checking logs directory...');
  const logsDir = path.join(serverDir, 'logs');
  if (fs.existsSync(logsDir)) {
    console.log(`   ✅ logs/ directory exists`);
    
    // Check if writable
    try {
      const testFile = path.join(logsDir, '.test-write');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log(`   ✅ logs/ directory is writable`);
    } catch (error) {
      console.log(`   ❌ logs/ directory is not writable: ${error.message}`);
      allChecksPass = false;
    }
  } else {
    console.log(`   ⚠️  logs/ directory does not exist, attempting to create...`);
    try {
      fs.mkdirSync(logsDir, { recursive: true });
      console.log(`   ✅ logs/ directory created`);
    } catch (error) {
      console.log(`   ❌ Failed to create logs/ directory: ${error.message}`);
      allChecksPass = false;
    }
  }
  
  // Check 4: Locks directory
  console.log('\n🔒 Checking locks directory...');
  const locksDir = path.join(serverDir, 'locks');
  if (fs.existsSync(locksDir)) {
    console.log(`   ✅ locks/ directory exists`);
  } else {
    console.log(`   ⚠️  locks/ directory does not exist, attempting to create...`);
    try {
      fs.mkdirSync(locksDir, { recursive: true });
      console.log(`   ✅ locks/ directory created`);
    } catch (error) {
      console.log(`   ❌ Failed to create locks/ directory: ${error.message}`);
      allChecksPass = false;
    }
  }
  
  // Check 5: SEO agent files (ensure not modified)
  console.log('\n🔍 Checking SEO agent integrity...');
  const seoAgentDir = path.join(serverDir, 'seo-agent');
  if (fs.existsSync(seoAgentDir)) {
    console.log(`   ✅ SEO agent directory exists`);
    
    // Check key SEO agent files exist
    const seoFiles = ['index.js', 'daily.js', 'weekly.js'];
    let seoFilesOk = true;
    seoFiles.forEach(file => {
      if (!fs.existsSync(path.join(seoAgentDir, file))) {
        console.log(`   ❌ SEO agent file missing: ${file}`);
        seoFilesOk = false;
      }
    });
    if (seoFilesOk) {
      console.log(`   ✅ SEO agent core files intact`);
    } else {
      allChecksPass = false;
    }
  } else {
    console.log(`   ⚠️  SEO agent directory not found (optional)`);
  }
  
  // Check 6: Configuration
  console.log('\n⚙️  Checking configuration...');
  try {
    const modes = require('./config/modes');
    console.log(`   ✅ Mode configuration loaded`);
    console.log(`   ℹ️  Available modes: ${Object.values(modes.MODES).join(', ')}`);
    console.log(`   ℹ️  Default mode: ${modes.DEFAULT_MODE}`);
  } catch (error) {
    console.log(`   ❌ Failed to load mode configuration: ${error.message}`);
    allChecksPass = false;
  }
  
  try {
    const limits = require('./config/limits');
    console.log(`   ✅ Limits configuration loaded`);
  } catch (error) {
    console.log(`   ❌ Failed to load limits configuration: ${error.message}`);
    allChecksPass = false;
  }
  
  // Check 7: Environment variables
  console.log('\n🌍 Checking environment variables...');
  const envVars = {
    'LEAD_HUNTER_MODE': process.env.LEAD_HUNTER_MODE || '(not set, using default)',
    'LEAD_HUNTER_ENABLED': process.env.LEAD_HUNTER_ENABLED || '(not set, defaults to true)',
  };
  
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`   ℹ️  ${key}: ${value}`);
  });
  
  // Final summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  if (allChecksPass) {
    console.log('\n✅ Lead Hunter is correctly installed and ready to use!\n');
    console.log('Quick start:');
    console.log('  cd /server');
    console.log('  npm run lead-hunter:observer');
    console.log('\nFor more information, run:');
    console.log('  npm run lead-hunter:help\n');
  } else {
    console.log('\n❌ Some checks failed. Please fix the issues above.\n');
    process.exit(1);
  }
}

main();
