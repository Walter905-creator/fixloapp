/**
 * Rate Limiter for Distribution Engine
 * 
 * Controls the velocity of page generation and publishing
 * to ensure natural growth patterns and avoid triggering spam filters.
 */

const { RATE_LIMITS } = require('./config');
const logger = require('./logger');

class RateLimiter {
  constructor() {
    this.dailyCount = 0;
    this.hourlyCount = 0;
    this.routeCounts = new Map();
    this.lastPublishTime = null;
    this.currentDate = new Date().toDateString();
    this.currentHour = new Date().getHours();
    this.publishQueue = [];
    this.cooldownUntil = null;
  }
  
  /**
   * Reset counters if time period has changed
   */
  checkAndResetCounters() {
    const now = new Date();
    const currentDate = now.toDateString();
    const currentHour = now.getHours();
    
    // Reset daily counter
    if (currentDate !== this.currentDate) {
      this.dailyCount = 0;
      this.currentDate = currentDate;
      logger.info('Daily rate limit counter reset');
    }
    
    // Reset hourly counter
    if (currentHour !== this.currentHour) {
      this.hourlyCount = 0;
      this.currentHour = currentHour;
      logger.debug('Hourly rate limit counter reset');
    }
  }
  
  /**
   * Check if in cooldown period
   */
  isInCooldown() {
    if (!this.cooldownUntil) return false;
    
    const now = Date.now();
    if (now < this.cooldownUntil) {
      return true;
    }
    
    // Cooldown expired
    this.cooldownUntil = null;
    logger.info('Cooldown period ended');
    return false;
  }
  
  /**
   * Activate cooldown
   */
  activateCooldown(hours = RATE_LIMITS.cooldownHours) {
    this.cooldownUntil = Date.now() + (hours * 60 * 60 * 1000);
    logger.warn('Cooldown activated', { 
      hours,
      until: new Date(this.cooldownUntil).toISOString(),
    });
  }
  
  /**
   * Check if allowed to publish based on daily limit
   */
  canPublishDaily() {
    this.checkAndResetCounters();
    
    if (this.dailyCount >= RATE_LIMITS.maxPagesPerDay) {
      logger.logRateLimitHit('daily', this.dailyCount, RATE_LIMITS.maxPagesPerDay);
      return false;
    }
    
    return true;
  }
  
  /**
   * Check if allowed to publish based on hourly limit
   */
  canPublishHourly() {
    this.checkAndResetCounters();
    
    if (this.hourlyCount >= RATE_LIMITS.maxPagesPerHour) {
      logger.logRateLimitHit('hourly', this.hourlyCount, RATE_LIMITS.maxPagesPerHour);
      return false;
    }
    
    return true;
  }
  
  /**
   * Check if allowed to publish to specific route
   */
  canPublishToRoute(route) {
    const routeCount = this.routeCounts.get(route) || 0;
    
    if (routeCount >= RATE_LIMITS.maxPagesPerRoute) {
      logger.logRateLimitHit('route', routeCount, RATE_LIMITS.maxPagesPerRoute);
      return false;
    }
    
    return true;
  }
  
  /**
   * Check minimum interval since last publish
   */
  canPublishByInterval() {
    if (!this.lastPublishTime) return true;
    
    const now = Date.now();
    const timeSinceLastPublish = now - this.lastPublishTime;
    const minInterval = RATE_LIMITS.minPublishIntervalMinutes * 60 * 1000;
    
    if (timeSinceLastPublish < minInterval) {
      const waitMinutes = Math.ceil((minInterval - timeSinceLastPublish) / 60000);
      logger.debug('Minimum interval not met', { waitMinutes });
      return false;
    }
    
    return true;
  }
  
  /**
   * Comprehensive check if allowed to publish
   */
  canPublish(route) {
    // Check cooldown
    if (this.isInCooldown()) {
      logger.warn('Publishing blocked by cooldown', {
        cooldownUntil: new Date(this.cooldownUntil).toISOString(),
      });
      return false;
    }
    
    // Check all rate limits
    if (!this.canPublishDaily()) return false;
    if (!this.canPublishHourly()) return false;
    if (!this.canPublishToRoute(route)) return false;
    if (!this.canPublishByInterval()) return false;
    
    return true;
  }
  
  /**
   * Record a successful publish
   */
  recordPublish(route) {
    this.checkAndResetCounters();
    
    // Increment counters
    this.dailyCount++;
    this.hourlyCount++;
    
    const routeCount = this.routeCounts.get(route) || 0;
    this.routeCounts.set(route, routeCount + 1);
    
    // Update last publish time
    this.lastPublishTime = Date.now();
    
    logger.debug('Publish recorded', {
      dailyCount: this.dailyCount,
      hourlyCount: this.hourlyCount,
      routeCount: this.routeCounts.get(route),
      route,
    });
  }
  
  /**
   * Calculate randomized delay for next publish (in milliseconds)
   */
  getRandomizedDelay() {
    const minDelay = RATE_LIMITS.minPublishIntervalMinutes * 60 * 1000;
    const maxDelay = minDelay * 2; // Up to 2x the minimum interval
    
    // Random delay between min and max
    const delay = minDelay + Math.random() * (maxDelay - minDelay);
    
    return Math.floor(delay);
  }
  
  /**
   * Add item to publish queue
   */
  queuePublish(item) {
    this.publishQueue.push({
      ...item,
      queuedAt: Date.now(),
    });
    
    logger.debug('Item queued for publishing', { 
      queueLength: this.publishQueue.length,
      item,
    });
  }
  
  /**
   * Get next item from queue if allowed
   */
  getNextFromQueue() {
    if (this.publishQueue.length === 0) return null;
    
    // Sort queue by priority or randomize
    const randomIndex = Math.floor(Math.random() * Math.min(this.publishQueue.length, 5));
    const item = this.publishQueue[randomIndex];
    
    // Check if can publish
    if (!this.canPublish(item.route)) {
      return null;
    }
    
    // Remove from queue
    this.publishQueue.splice(randomIndex, 1);
    
    return item;
  }
  
  /**
   * Get current rate limit status
   */
  getStatus() {
    this.checkAndResetCounters();
    
    return {
      dailyCount: this.dailyCount,
      dailyLimit: RATE_LIMITS.maxPagesPerDay,
      dailyRemaining: RATE_LIMITS.maxPagesPerDay - this.dailyCount,
      hourlyCount: this.hourlyCount,
      hourlyLimit: RATE_LIMITS.maxPagesPerHour,
      hourlyRemaining: RATE_LIMITS.maxPagesPerHour - this.hourlyCount,
      queueLength: this.publishQueue.length,
      inCooldown: this.isInCooldown(),
      cooldownUntil: this.cooldownUntil ? new Date(this.cooldownUntil).toISOString() : null,
      lastPublishTime: this.lastPublishTime ? new Date(this.lastPublishTime).toISOString() : null,
    };
  }
  
  /**
   * Reset all counters (admin function)
   */
  reset() {
    this.dailyCount = 0;
    this.hourlyCount = 0;
    this.routeCounts.clear();
    this.lastPublishTime = null;
    this.publishQueue = [];
    this.cooldownUntil = null;
    
    logger.info('Rate limiter reset (manual)');
  }
}

module.exports = new RateLimiter();
