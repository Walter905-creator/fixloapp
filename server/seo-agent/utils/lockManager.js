// Lock Manager for SEO Agent
// Prevents concurrent runs and provides stale lock recovery

const fs = require('fs');
const path = require('path');

// Lock file paths
const LOCK_DIR = path.join(__dirname, '..');
const DAILY_LOCK_FILE = path.join(LOCK_DIR, '.seo-agent-daily.lock');
const WEEKLY_LOCK_FILE = path.join(LOCK_DIR, '.seo-agent-weekly.lock');

// Stale lock thresholds (in milliseconds)
const DAILY_STALE_THRESHOLD = 2 * 60 * 60 * 1000; // 2 hours
const WEEKLY_STALE_THRESHOLD = 6 * 60 * 60 * 1000; // 6 hours

// Track if cleanup handlers are already set up
let cleanupHandlersSet = false;

/**
 * Get lock file path for a given mode
 */
function getLockFile(mode) {
  return mode === 'daily' ? DAILY_LOCK_FILE : WEEKLY_LOCK_FILE;
}

/**
 * Get stale threshold for a given mode
 */
function getStaleThreshold(mode) {
  return mode === 'daily' ? DAILY_STALE_THRESHOLD : WEEKLY_STALE_THRESHOLD;
}

/**
 * Check if a lock exists and if it's stale
 * @param {string} mode - 'daily' or 'weekly'
 * @returns {Object} { exists, stale, timestamp }
 */
function checkLock(mode) {
  const lockFile = getLockFile(mode);
  
  if (!fs.existsSync(lockFile)) {
    return { exists: false, stale: false, timestamp: null };
  }
  
  try {
    const lockData = fs.readFileSync(lockFile, 'utf8');
    const timestamp = parseInt(lockData.trim(), 10);
    
    if (isNaN(timestamp)) {
      console.warn(`⚠️ [LOCK] Invalid lock file data, treating as stale`);
      return { exists: true, stale: true, timestamp: null };
    }
    
    const age = Date.now() - timestamp;
    const threshold = getStaleThreshold(mode);
    const isStale = age > threshold;
    
    return { exists: true, stale: isStale, timestamp, age };
  } catch (error) {
    console.error(`❌ [LOCK] Error reading lock file: ${error.message}`);
    return { exists: true, stale: true, timestamp: null };
  }
}

/**
 * Acquire a lock for the given mode
 * Uses atomic file operations to prevent race conditions
 * @param {string} mode - 'daily' or 'weekly'
 * @returns {boolean} true if lock acquired, false if already locked
 */
function acquireLock(mode) {
  const lockFile = getLockFile(mode);
  const lockStatus = checkLock(mode);
  
  // If lock is stale, remove it first
  if (lockStatus.exists && lockStatus.stale) {
    const ageMinutes = Math.floor(lockStatus.age / (60 * 1000));
    console.log(`🔄 [LOCK] Recovering from stale lock (age: ${ageMinutes} minutes)`);
    try {
      fs.unlinkSync(lockFile);
    } catch (error) {
      // Ignore errors if file was already removed
      if (error.code !== 'ENOENT') {
        console.error(`❌ [LOCK] Failed to remove stale lock: ${error.message}`);
      }
    }
  }
  
  // Try to create lock file atomically using 'wx' flag (write + exclusive)
  // This will fail if file already exists, preventing race conditions
  try {
    const timestamp = Date.now().toString();
    const fd = fs.openSync(lockFile, 'wx');
    fs.writeSync(fd, timestamp);
    fs.closeSync(fd);
    console.log(`✅ [LOCK] Lock acquired for ${mode} agent`);
    return true;
  } catch (error) {
    if (error.code === 'EEXIST') {
      // Lock file exists - another process is running
      const currentLockStatus = checkLock(mode);
      if (currentLockStatus.exists && !currentLockStatus.stale) {
        const ageMinutes = Math.floor(currentLockStatus.age / (60 * 1000));
        console.log(`🔒 [LOCK] ${mode} agent is already running (lock age: ${ageMinutes} minutes)`);
      }
      return false;
    }
    // Other errors are unexpected
    console.error(`❌ [LOCK] Failed to create lock file: ${error.message}`);
    throw error;
  }
}

/**
 * Release the lock for the given mode
 * @param {string} mode - 'daily' or 'weekly'
 */
function releaseLock(mode) {
  const lockFile = getLockFile(mode);
  
  try {
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
      console.log(`🔓 [LOCK] Lock released for ${mode} agent`);
    }
  } catch (error) {
    console.error(`❌ [LOCK] Failed to release lock: ${error.message}`);
    // Don't throw - we want to continue even if lock removal fails
  }
}

/**
 * Ensure lock is released on process exit
 * @param {string} mode - 'daily' or 'weekly'
 */
function setupLockCleanup(mode) {
  // Only set up handlers once to avoid duplicates
  if (cleanupHandlersSet) {
    return;
  }
  cleanupHandlersSet = true;
  
  // Handle SIGINT (Ctrl+C)
  process.once('SIGINT', () => {
    console.log('\n⚠️ [LOCK] Received SIGINT, cleaning up...');
    releaseLock(mode);
    // Don't call process.exit() - let Node.js handle it naturally
  });
  
  // Handle SIGTERM (kill command)
  process.once('SIGTERM', () => {
    console.log('\n⚠️ [LOCK] Received SIGTERM, cleaning up...');
    releaseLock(mode);
    // Don't call process.exit() - let Node.js handle it naturally
  });
  
  // Handle uncaught exceptions
  process.once('uncaughtException', (error) => {
    console.error('❌ [LOCK] Uncaught exception:', error);
    releaseLock(mode);
    process.exit(1);
  });
  
  // Handle unhandled promise rejections
  process.once('unhandledRejection', (reason, promise) => {
    console.error('❌ [LOCK] Unhandled rejection at:', promise, 'reason:', reason);
    releaseLock(mode);
    process.exit(1);
  });
}

module.exports = {
  acquireLock,
  releaseLock,
  checkLock,
  setupLockCleanup,
};
