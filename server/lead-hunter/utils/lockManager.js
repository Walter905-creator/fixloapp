// Lock Manager - Prevents Concurrent Lead Hunter Runs
// Same pattern as SEO agent for consistency

const fs = require('fs');
const path = require('path');

const LOCK_DIR = path.join(__dirname, '../../locks');
const LOCK_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes

// Ensure lock directory exists
if (!fs.existsSync(LOCK_DIR)) {
  fs.mkdirSync(LOCK_DIR, { recursive: true });
}

/**
 * Acquires a lock for the given mode
 * @param {string} mode - The mode to lock (observer, guarded, tuning)
 * @returns {boolean} True if lock acquired, false if already locked
 */
function acquireLock(mode) {
  const lockFile = path.join(LOCK_DIR, `lead-hunter-${mode}.lock`);
  
  try {
    // Check if lock exists
    if (fs.existsSync(lockFile)) {
      const stats = fs.statSync(lockFile);
      const age = Date.now() - stats.mtimeMs;
      
      // If lock is old, remove it (stale lock)
      if (age > LOCK_TIMEOUT_MS) {
        console.log(`⚠️ Removing stale lock (${(age / 1000 / 60).toFixed(1)} minutes old)`);
        fs.unlinkSync(lockFile);
      } else {
        console.log(`🔒 Lock already exists (${(age / 1000 / 60).toFixed(1)} minutes old)`);
        return false;
      }
    }
    
    // Create lock file
    fs.writeFileSync(lockFile, JSON.stringify({
      mode,
      pid: process.pid,
      timestamp: new Date().toISOString(),
    }));
    
    console.log(`🔓 Lock acquired for ${mode} mode (PID: ${process.pid})`);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to acquire lock:', error.message);
    return false;
  }
}

/**
 * Releases the lock for the given mode
 * @param {string} mode - The mode to unlock
 */
function releaseLock(mode) {
  const lockFile = path.join(LOCK_DIR, `lead-hunter-${mode}.lock`);
  
  try {
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
      console.log(`🔓 Lock released for ${mode} mode`);
    }
  } catch (error) {
    console.error('⚠️ Failed to release lock:', error.message);
  }
}

/**
 * Sets up cleanup handlers to release lock on exit
 * @param {string} mode - The mode being locked
 */
function setupLockCleanup(mode) {
  // Handle normal exit
  process.on('exit', () => {
    releaseLock(mode);
  });
  
  // Handle CTRL+C
  process.on('SIGINT', () => {
    console.log('\n⚠️ Received SIGINT, cleaning up...');
    releaseLock(mode);
    process.exit(0);
  });
  
  // Handle kill signal
  process.on('SIGTERM', () => {
    console.log('\n⚠️ Received SIGTERM, cleaning up...');
    releaseLock(mode);
    process.exit(0);
  });
  
  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    releaseLock(mode);
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled rejection:', reason);
    releaseLock(mode);
    process.exit(1);
  });
}

module.exports = {
  acquireLock,
  releaseLock,
  setupLockCleanup,
};
