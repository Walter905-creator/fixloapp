/**
 * Distribution Engine Monitoring & Self-Healing
 * 
 * Tracks performance metrics and automatically adjusts behavior
 * to maintain healthy growth patterns.
 */

const { MONITORING } = require('./config');
const logger = require('./logger');
const rateLimiter = require('./rateLimiter');

class DistributionMonitor {
  constructor() {
    this.metrics = {
      pagesCreated: 0,
      pagesPublished: 0,
      pagesIndexed: 0,
      pagesIgnored: 0,
      crawlErrors: 0,
      totalChecks: 0,
    };
    
    this.indexingHistory = new Map(); // URL -> status history
    this.slowdownActive = false;
    this.pauseActive = false;
  }
  
  /**
   * Record page creation
   */
  recordPageCreation(pageData) {
    this.metrics.pagesCreated++;
    logger.debug('Page creation recorded', { 
      total: this.metrics.pagesCreated,
      page: pageData,
    });
  }
  
  /**
   * Record page publication
   */
  recordPagePublication(pageData) {
    this.metrics.pagesPublished++;
    
    // Initialize indexing tracking
    this.indexingHistory.set(pageData.url, {
      publishedAt: new Date().toISOString(),
      status: 'pending',
      checks: [],
    });
    
    logger.debug('Page publication recorded', { 
      total: this.metrics.pagesPublished,
      page: pageData,
    });
  }
  
  /**
   * Record indexing status check
   */
  recordIndexingCheck(url, status, details = {}) {
    this.metrics.totalChecks++;
    
    const history = this.indexingHistory.get(url) || { checks: [] };
    
    history.checks.push({
      timestamp: new Date().toISOString(),
      status,
      details,
    });
    
    history.status = status;
    history.lastChecked = new Date().toISOString();
    
    this.indexingHistory.set(url, history);
    
    // Update metrics
    if (status === 'indexed') {
      this.metrics.pagesIndexed++;
    } else if (status === 'ignored' || status === 'excluded') {
      this.metrics.pagesIgnored++;
    } else if (status === 'error') {
      this.metrics.crawlErrors++;
    }
    
    logger.debug('Indexing check recorded', { url, status, details });
    
    // Check if self-healing needed
    this.checkHealthThresholds();
  }
  
  /**
   * Calculate indexing rate
   */
  getIndexRate() {
    const total = this.metrics.pagesPublished;
    if (total === 0) return 0;
    
    return this.metrics.pagesIndexed / total;
  }
  
  /**
   * Calculate crawl error rate
   */
  getCrawlErrorRate() {
    const total = this.metrics.totalChecks;
    if (total === 0) return 0;
    
    return this.metrics.crawlErrors / total;
  }
  
  /**
   * Check if health thresholds are exceeded
   */
  checkHealthThresholds() {
    const indexRate = this.getIndexRate();
    const errorRate = this.getCrawlErrorRate();
    
    // Check error rate threshold
    if (errorRate > MONITORING.maxCrawlErrorRate) {
      logger.warn('High crawl error rate detected', { 
        errorRate,
        threshold: MONITORING.maxCrawlErrorRate,
      });
      
      if (MONITORING.autoSlowdownEnabled && !this.slowdownActive) {
        this.activateSlowdown('high_error_rate', { errorRate });
      }
      
      if (MONITORING.autoPauseEnabled && errorRate > MONITORING.maxCrawlErrorRate * 2) {
        this.activatePause('critical_error_rate', { errorRate });
      }
    }
    
    // Check index rate threshold (only if sufficient data)
    if (this.metrics.pagesPublished >= 10 && indexRate < MONITORING.minIndexRate) {
      logger.warn('Low indexing rate detected', { 
        indexRate,
        threshold: MONITORING.minIndexRate,
      });
      
      if (MONITORING.autoSlowdownEnabled && !this.slowdownActive) {
        this.activateSlowdown('low_index_rate', { indexRate });
      }
    }
  }
  
  /**
   * Activate slowdown mode
   */
  activateSlowdown(reason, metrics) {
    if (this.slowdownActive) return;
    
    this.slowdownActive = true;
    logger.logAutoSlowdown(reason, metrics);
    
    // Double the minimum interval
    const currentInterval = require('./config').RATE_LIMITS.minPublishIntervalMinutes;
    process.env.DISTRIBUTION_MIN_INTERVAL_MINUTES = (currentInterval * 2).toString();
    
    logger.info('Publishing interval doubled', {
      oldInterval: currentInterval,
      newInterval: currentInterval * 2,
    });
  }
  
  /**
   * Deactivate slowdown mode
   */
  deactivateSlowdown() {
    if (!this.slowdownActive) return;
    
    this.slowdownActive = false;
    logger.info('Slowdown mode deactivated');
    
    // Reset to original interval (would need to be stored)
    // For now, just log that manual intervention may be needed
    logger.info('Manual interval adjustment may be needed');
  }
  
  /**
   * Activate pause mode
   */
  activatePause(reason, metrics) {
    if (this.pauseActive) return;
    
    this.pauseActive = true;
    logger.logAutoPause(reason, metrics);
    
    // Activate long cooldown in rate limiter
    rateLimiter.activateCooldown(MONITORING.indexCheckDelayDays * 24);
    
    logger.error('Distribution engine paused automatically', {
      reason,
      metrics,
      cooldownDays: MONITORING.indexCheckDelayDays,
    });
  }
  
  /**
   * Deactivate pause mode (manual only)
   */
  deactivatePause() {
    if (!this.pauseActive) return;
    
    this.pauseActive = false;
    rateLimiter.cooldownUntil = null;
    
    logger.info('Pause mode deactivated (manual)');
  }
  
  /**
   * Get pages needing indexing check
   */
  getPagesNeedingCheck() {
    const needsCheck = [];
    const checkDelay = MONITORING.indexCheckDelayDays * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    for (const [url, history] of this.indexingHistory.entries()) {
      // Skip if already indexed
      if (history.status === 'indexed') continue;
      
      // Check if enough time has passed since publishing
      const publishedAt = new Date(history.publishedAt).getTime();
      if (now - publishedAt < checkDelay) continue;
      
      // Check if already checked recently
      const lastChecked = history.lastChecked ? new Date(history.lastChecked).getTime() : 0;
      if (now - lastChecked < checkDelay) continue;
      
      needsCheck.push({
        url,
        publishedAt: history.publishedAt,
        lastStatus: history.status,
        checkCount: history.checks.length,
      });
    }
    
    return needsCheck;
  }
  
  /**
   * Flag content for rewrite
   */
  flagForRewrite(url, reason) {
    const history = this.indexingHistory.get(url);
    if (!history) return;
    
    history.flaggedForRewrite = true;
    history.rewriteReason = reason;
    history.flaggedAt = new Date().toISOString();
    
    this.indexingHistory.set(url, history);
    
    logger.warn('Content flagged for rewrite', { url, reason });
  }
  
  /**
   * Get metrics summary
   */
  getMetrics() {
    return {
      ...this.metrics,
      indexRate: this.getIndexRate(),
      errorRate: this.getCrawlErrorRate(),
      slowdownActive: this.slowdownActive,
      pauseActive: this.pauseActive,
      pendingChecks: this.getPagesNeedingCheck().length,
    };
  }
  
  /**
   * Get detailed status report
   */
  getStatusReport() {
    const metrics = this.getMetrics();
    const rateLimitStatus = rateLimiter.getStatus();
    
    return {
      timestamp: new Date().toISOString(),
      metrics,
      rateLimits: rateLimitStatus,
      health: {
        indexRateHealthy: metrics.indexRate >= MONITORING.minIndexRate,
        errorRateHealthy: metrics.errorRate <= MONITORING.maxCrawlErrorRate,
        overall: !this.pauseActive && !this.slowdownActive,
      },
      recommendations: this.generateRecommendations(metrics),
    };
  }
  
  /**
   * Generate recommendations based on metrics
   */
  generateRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.indexRate < MONITORING.minIndexRate && metrics.pagesPublished >= 10) {
      recommendations.push({
        type: 'warning',
        message: 'Low indexing rate detected. Consider improving content quality or reducing publishing velocity.',
      });
    }
    
    if (metrics.errorRate > MONITORING.maxCrawlErrorRate) {
      recommendations.push({
        type: 'error',
        message: 'High crawl error rate. Check for technical issues with generated pages.',
      });
    }
    
    if (rateLimiter.getStatus().queueLength > 50) {
      recommendations.push({
        type: 'info',
        message: 'Large publish queue detected. Publishing will continue at controlled rate.',
      });
    }
    
    if (this.slowdownActive) {
      recommendations.push({
        type: 'warning',
        message: 'Slowdown mode is active. Publishing velocity has been reduced automatically.',
      });
    }
    
    if (this.pauseActive) {
      recommendations.push({
        type: 'error',
        message: 'Pause mode is active. Manual intervention required to resume.',
      });
    }
    
    return recommendations;
  }
  
  /**
   * Reset all metrics (admin function)
   */
  reset() {
    this.metrics = {
      pagesCreated: 0,
      pagesPublished: 0,
      pagesIndexed: 0,
      pagesIgnored: 0,
      crawlErrors: 0,
      totalChecks: 0,
    };
    
    this.indexingHistory.clear();
    this.slowdownActive = false;
    this.pauseActive = false;
    
    logger.info('Monitor metrics reset (manual)');
  }
}

module.exports = new DistributionMonitor();
