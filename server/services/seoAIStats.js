/**
 * SEO AI Stats Service
 * Shared stats management for SEO AI Engine
 * Prevents circular dependencies between routes and services
 */

// Track execution stats
const stats = {
  lastRun: null,
  pagesGeneratedToday: 0,
  totalPages: 0,
  running: false,
  errors: 0,
  lastResetDate: new Date().toDateString()
};

/**
 * Reset daily stats if needed
 */
function resetDailyStatsIfNeeded() {
  const today = new Date().toDateString();
  if (stats.lastResetDate !== today) {
    stats.pagesGeneratedToday = 0;
    stats.lastResetDate = today;
  }
}

/**
 * Update stats after SEO run
 */
function updateStats(pagesGenerated, hadErrors = false) {
  resetDailyStatsIfNeeded();
  stats.lastRun = new Date();
  stats.pagesGeneratedToday += pagesGenerated;
  stats.running = false;
  if (hadErrors) {
    stats.errors++;
  }
}

/**
 * Set running state
 */
function setRunning(isRunning) {
  stats.running = isRunning;
}

/**
 * Get current stats
 */
function getStats() {
  resetDailyStatsIfNeeded();
  return { ...stats };
}

module.exports = {
  updateStats,
  setRunning,
  getStats,
  resetDailyStatsIfNeeded
};
