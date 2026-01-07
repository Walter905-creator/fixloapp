/**
 * Distribution Engine Logger
 * 
 * Comprehensive logging system for all distribution engine activities.
 * Maintains audit trail of all automated actions.
 */

const fs = require('fs');
const path = require('path');
const { LOGGING } = require('./config');

class DistributionLogger {
  constructor() {
    this.logDirectory = LOGGING.logDirectory;
    this.logLevel = LOGGING.logLevel;
    this.auditTrail = LOGGING.auditTrail;
    
    // Ensure log directory exists
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }
    
    // Log levels
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
  }
  
  /**
   * Format log entry with timestamp and context
   */
  formatLogEntry(level, message, metadata = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      engine: 'distribution',
    };
  }
  
  /**
   * Write log to file (async)
   */
  async writeLog(entry) {
    if (!LOGGING.enabled) return;
    
    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.logDirectory, `distribution-${date}.log`);
    
    try {
      const logLine = JSON.stringify(entry) + '\n';
      // Use async append for better performance
      await fs.promises.appendFile(logFile, logLine, 'utf8');
    } catch (error) {
      console.error('Failed to write distribution log:', error.message);
    }
  }
  
  /**
   * Write to audit trail (async)
   */
  async writeAudit(action, details = {}) {
    if (!this.auditTrail) return;
    
    const date = new Date().toISOString().split('T')[0];
    const auditFile = path.join(this.logDirectory, `audit-${date}.log`);
    
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action,
      details,
      engine: 'distribution',
    };
    
    try {
      const auditLine = JSON.stringify(auditEntry) + '\n';
      // Use async append for better performance
      await fs.promises.appendFile(auditFile, auditLine, 'utf8');
    } catch (error) {
      console.error('Failed to write audit trail:', error.message);
    }
  }
  
  /**
   * Check if log level should be logged
   */
  shouldLog(level) {
    return this.levels[level] >= this.levels[this.logLevel];
  }
  
  /**
   * Debug level logging
   */
  debug(message, metadata = {}) {
    if (!this.shouldLog('debug')) return;
    
    const entry = this.formatLogEntry('debug', message, metadata);
    this.writeLog(entry);
    console.debug(`[DIST-DEBUG] ${message}`, metadata);
  }
  
  /**
   * Info level logging
   */
  info(message, metadata = {}) {
    if (!this.shouldLog('info')) return;
    
    const entry = this.formatLogEntry('info', message, metadata);
    this.writeLog(entry);
    console.log(`[DIST-INFO] ${message}`, metadata);
  }
  
  /**
   * Warning level logging
   */
  warn(message, metadata = {}) {
    if (!this.shouldLog('warn')) return;
    
    const entry = this.formatLogEntry('warn', message, metadata);
    this.writeLog(entry);
    console.warn(`[DIST-WARN] ${message}`, metadata);
  }
  
  /**
   * Error level logging
   */
  error(message, metadata = {}) {
    if (!this.shouldLog('error')) return;
    
    const entry = this.formatLogEntry('error', message, metadata);
    this.writeLog(entry);
    console.error(`[DIST-ERROR] ${message}`, metadata);
  }
  
  /**
   * Log page generation action
   */
  logPageGeneration(pageData) {
    this.info('Page generation initiated', {
      type: 'page_generation',
      page: pageData,
    });
    
    this.writeAudit('page_generation', pageData);
  }
  
  /**
   * Log page publication
   */
  logPagePublication(pageData) {
    this.info('Page published', {
      type: 'page_publication',
      page: pageData,
    });
    
    this.writeAudit('page_publication', pageData);
  }
  
  /**
   * Log rate limit hit
   */
  logRateLimitHit(limitType, currentValue, maxValue) {
    this.warn('Rate limit reached', {
      type: 'rate_limit_hit',
      limitType,
      currentValue,
      maxValue,
    });
    
    this.writeAudit('rate_limit_hit', { limitType, currentValue, maxValue });
  }
  
  /**
   * Log sitemap update
   */
  logSitemapUpdate(stats) {
    this.info('Sitemap updated', {
      type: 'sitemap_update',
      stats,
    });
    
    this.writeAudit('sitemap_update', stats);
  }
  
  /**
   * Log indexing status check
   */
  logIndexingCheck(results) {
    this.info('Indexing status checked', {
      type: 'indexing_check',
      results,
    });
    
    this.writeAudit('indexing_check', results);
  }
  
  /**
   * Log auto-slowdown activation
   */
  logAutoSlowdown(reason, metrics) {
    this.warn('Auto-slowdown activated', {
      type: 'auto_slowdown',
      reason,
      metrics,
    });
    
    this.writeAudit('auto_slowdown', { reason, metrics });
  }
  
  /**
   * Log auto-pause activation
   */
  logAutoPause(reason, metrics) {
    this.error('Auto-pause activated', {
      type: 'auto_pause',
      reason,
      metrics,
    });
    
    this.writeAudit('auto_pause', { reason, metrics });
  }
  
  /**
   * Log safety guardrail trigger
   */
  logSafetyGuardrail(guardType, action) {
    this.error('Safety guardrail triggered', {
      type: 'safety_guardrail',
      guardType,
      action,
    });
    
    this.writeAudit('safety_guardrail', { guardType, action });
  }
}

// Export singleton instance
module.exports = new DistributionLogger();
