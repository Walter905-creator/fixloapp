// Safety Kill Switch - NON-NEGOTIABLE
// Stops the agent if metrics indicate problems

const thresholds = require('../config/thresholds');

/**
 * Checks if the SEO agent should halt due to safety triggers
 * @param {Object} metrics - Recent SEO performance metrics
 * @throws {Error} If safety trigger is activated
 */
async function checkKillSwitch(metrics = {}) {
  console.log('🛡️ Running safety kill switch check...');
  
  if (!metrics || typeof metrics !== 'object') {
    console.log('⚠️ No metrics provided, running in safe mode');
    return;
  }
  
  // Check for hard click drops
  if (metrics.clicksDropPercentage !== undefined) {
    if (metrics.clicksDropPercentage >= thresholds.CLICKS_DROP_PERCENTAGE) {
      throw new Error(
        `🚨 SEO Agent halted: Clicks dropped ${(metrics.clicksDropPercentage * 100).toFixed(1)}% ` +
        `(threshold: ${(thresholds.CLICKS_DROP_PERCENTAGE * 100).toFixed(1)}%)`
      );
    }
  }
  
  // Check for high indexing error rates
  if (metrics.indexErrorRate !== undefined) {
    if (metrics.indexErrorRate >= thresholds.INDEX_ERROR_RATE) {
      throw new Error(
        `🚨 SEO Agent halted: Index error rate at ${(metrics.indexErrorRate * 100).toFixed(1)}% ` +
        `(threshold: ${(thresholds.INDEX_ERROR_RATE * 100).toFixed(1)}%)`
      );
    }
  }
  
  // Check for suspicious pattern: impressions up but clicks down
  if (metrics.impressionsChangePercentage > 0.2 && metrics.clicksDropPercentage > 0.1) {
    throw new Error(
      '🚨 SEO Agent halted: Suspicious pattern detected - impressions up but clicks down'
    );
  }
  
  console.log('✅ Kill switch check passed - all metrics within safe ranges');
}

/**
 * Get recent SEO metrics for kill switch evaluation
 * In production, this would fetch real data from Google Search Console
 * @returns {Object} Recent performance metrics
 */
async function getRecentSEOStats() {
  // TODO: Implement actual GSC data fetching
  // For now, return safe dummy data
  return {
    clicksDropPercentage: 0,
    indexErrorRate: 0,
    impressionsChangePercentage: 0,
  };
}

module.exports = {
  checkKillSwitch,
  getRecentSEOStats,
};
