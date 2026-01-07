/**
 * Distribution Engine - Main Orchestrator
 * 
 * Coordinates all distribution engine components to safely expand
 * Fixlo's online presence through programmatic SEO and content distribution.
 * 
 * SAFETY FIRST: Can be disabled instantly via DISTRIBUTION_ENGINE_ENABLED=false
 */

const config = require('./config');
const logger = require('./logger');
const contentGenerator = require('./contentGenerator');
const rateLimiter = require('./rateLimiter');
const monitor = require('./monitor');
const sitemapManager = require('./sitemapManager');
const socialEcho = require('./socialEcho');
const ownedNetwork = require('./ownedNetwork');

class DistributionEngine {
  constructor() {
    this.enabled = config.DISTRIBUTION_ENGINE_ENABLED;
    this.running = false;
    this.initialized = false;
  }
  
  /**
   * Initialize the distribution engine
   */
  async initialize() {
    if (!this.enabled) {
      logger.info('Distribution Engine is DISABLED');
      return false;
    }
    
    logger.info('Initializing Distribution Engine...');
    
    try {
      // Validate configuration
      this.validateConfiguration();
      
      // Load existing sitemap for merging
      sitemapManager.mergeWithExisting();
      
      // Validate safety guardrails
      this.validateSafetyGuardrails();
      
      this.initialized = true;
      logger.info('Distribution Engine initialized successfully');
      
      return true;
    } catch (error) {
      logger.error('Distribution Engine initialization failed', { error: error.message });
      this.enabled = false;
      return false;
    }
  }
  
  /**
   * Validate configuration
   */
  validateConfiguration() {
    // Ensure rate limits are reasonable
    if (config.RATE_LIMITS.maxPagesPerDay > 100) {
      logger.warn('Daily page limit is high', { 
        limit: config.RATE_LIMITS.maxPagesPerDay,
      });
    }
    
    // Ensure minimum interval is set
    if (config.RATE_LIMITS.minPublishIntervalMinutes < 5) {
      throw new Error('Minimum publish interval must be at least 5 minutes');
    }
    
    logger.info('Configuration validated');
  }
  
  /**
   * Validate safety guardrails
   */
  validateSafetyGuardrails() {
    // Ensure no auto-posting is enabled
    if (config.SOCIAL_ECHO.autoPost === true) {
      throw new Error('SAFETY VIOLATION: Auto-posting must be disabled');
    }
    
    // Ensure manual publishing is enforced for owned network
    if (config.OWNED_NETWORK.enabled && !config.OWNED_NETWORK.manualPublishOnly) {
      throw new Error('SAFETY VIOLATION: Manual publishing must be enforced');
    }
    
    logger.info('Safety guardrails validated');
  }
  
  /**
   * Generate page variants for a service + location
   */
  generatePageVariants(service, location) {
    const variants = [];
    
    // Standard page
    if (config.PAGE_VARIANTS.standard) {
      variants.push({ service, location, variant: 'standard', language: 'en' });
    }
    
    // Near me variant
    if (config.PAGE_VARIANTS.nearMe) {
      variants.push({ service, location, variant: 'near-me', language: 'en' });
    }
    
    // Emergency variants
    if (config.PAGE_VARIANTS.emergency) {
      for (const modifier of config.VARIANT_MODIFIERS.emergency.slice(0, 2)) {
        variants.push({ 
          service: `${modifier} ${service}`, 
          location, 
          variant: `emergency-${modifier}`,
          language: 'en',
        });
      }
    }
    
    // Spanish version (if bilingual enabled)
    if (config.PAGE_VARIANTS.bilingual) {
      variants.push({ service, location, variant: 'standard', language: 'es' });
    }
    
    return variants;
  }
  
  /**
   * Generate content for a page
   */
  async generatePage(params) {
    if (!this.enabled || !this.initialized) {
      logger.warn('Engine not enabled or initialized');
      return null;
    }
    
    try {
      // Generate content
      const content = contentGenerator.generatePageContent(params);
      
      if (!content) {
        logger.warn('Content generation failed', params);
        return null;
      }
      
      // Add metadata
      const page = {
        ...content,
        url: this.generatePageURL(params),
        service: params.service,
        location: params.location,
        variant: params.variant,
        generatedAt: new Date().toISOString(),
      };
      
      // Record creation
      monitor.recordPageCreation(page);
      
      logger.info('Page generated', { 
        service: params.service,
        location: params.location,
        variant: params.variant,
      });
      
      return page;
      
    } catch (error) {
      logger.error('Page generation failed', { 
        params,
        error: error.message,
      });
      return null;
    }
  }
  
  /**
   * Generate URL for page
   */
  generatePageURL(params) {
    const { service, location, variant, language } = params;
    
    const slug = `${service}-${location}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    let url = `https://www.fixloapp.com/services/${slug}`;
    
    if (variant !== 'standard') {
      url += `/${variant}`;
    }
    
    if (language === 'es') {
      url += '/es';
    }
    
    return url;
  }
  
  /**
   * Publish a page (add to sitemap, track, export)
   */
  async publishPage(page) {
    if (!this.enabled || !this.initialized) {
      return false;
    }
    
    const route = `${page.service}/${page.location}`;
    
    // Check rate limits
    if (!rateLimiter.canPublish(route)) {
      logger.info('Rate limit reached, queueing page', { route });
      rateLimiter.queuePublish({ page, route });
      return false;
    }
    
    try {
      // Add to sitemap
      sitemapManager.addPage(page.url, {
        lastmod: page.generatedAt,
        priority: this.calculatePriority(page),
      });
      
      // Record publication
      monitor.recordPagePublication(page);
      rateLimiter.recordPublish(route);
      logger.logPagePublication(page);
      
      // Generate social echo payloads
      if (config.SOCIAL_ECHO.enabled) {
        const socialPayload = socialEcho.generateSchedulingPayload(page);
        if (socialPayload) {
          socialEcho.savePayload(socialPayload);
        }
      }
      
      // Export to owned network
      if (config.OWNED_NETWORK.enabled) {
        ownedNetwork.exportPage(page);
      }
      
      logger.info('Page published successfully', { 
        url: page.url,
        route,
      });
      
      return true;
      
    } catch (error) {
      logger.error('Page publication failed', { 
        page,
        error: error.message,
      });
      return false;
    }
  }
  
  /**
   * Calculate page priority for sitemap
   */
  calculatePriority(page) {
    let priority = config.SITEMAP_CONFIG.defaultPriority;
    
    // Emergency services get higher priority
    if (page.variant && page.variant.includes('emergency')) {
      priority = 0.9;
    }
    
    // Standard service pages
    if (page.variant === 'standard' && page.language === 'en') {
      priority = 0.8;
    }
    
    return priority;
  }
  
  /**
   * Process publishing queue
   */
  async processQueue() {
    if (!this.enabled || !this.initialized) {
      return;
    }
    
    const item = rateLimiter.getNextFromQueue();
    
    if (item) {
      logger.info('Processing queued item', { 
        queueLength: rateLimiter.publishQueue.length,
      });
      
      await this.publishPage(item.page);
    }
  }
  
  /**
   * Generate and publish pages for service+city combinations
   */
  async generateBatch(service, cities, limit = null) {
    if (!this.enabled || !this.initialized) {
      logger.warn('Engine not enabled');
      return { success: 0, failed: 0, queued: 0 };
    }
    
    const results = { success: 0, failed: 0, queued: 0 };
    const citiesToProcess = limit ? cities.slice(0, limit) : cities;
    
    for (const city of citiesToProcess) {
      // Generate variants
      const variants = this.generatePageVariants(service, city);
      
      for (const variantParams of variants) {
        // Generate page
        const page = await this.generatePage(variantParams);
        
        if (!page) {
          results.failed++;
          continue;
        }
        
        // Try to publish
        const published = await this.publishPage(page);
        
        if (published) {
          results.success++;
        } else {
          results.queued++;
        }
        
        // Add random delay between generations
        await this.sleep(rateLimiter.getRandomizedDelay());
      }
    }
    
    // Update sitemap after batch
    await sitemapManager.updateSitemap();
    
    logger.info('Batch generation complete', results);
    
    return results;
  }
  
  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Check indexing status for published pages
   */
  async checkIndexingStatus() {
    if (!this.enabled || !this.initialized) {
      return;
    }
    
    const pagesToCheck = monitor.getPagesNeedingCheck();
    
    logger.info('Checking indexing status', { 
      count: pagesToCheck.length,
    });
    
    for (const page of pagesToCheck) {
      // In production, this would make API calls to Google Search Console
      // For now, we just simulate the check
      const status = Math.random() > 0.3 ? 'indexed' : 'pending';
      
      monitor.recordIndexingCheck(page.url, status, {
        checkType: 'automated',
        publishedDaysAgo: Math.floor((Date.now() - new Date(page.publishedAt).getTime()) / (24 * 60 * 60 * 1000)),
      });
      
      logger.logIndexingCheck({ 
        url: page.url,
        status,
      });
    }
  }
  
  /**
   * Get complete engine status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      initialized: this.initialized,
      running: this.running,
      config: {
        rateLimits: config.RATE_LIMITS,
        contentQuality: config.CONTENT_QUALITY,
        socialEcho: socialEcho.getStatus(),
        ownedNetwork: ownedNetwork.getStatus(),
      },
      metrics: monitor.getMetrics(),
      rateLimiter: rateLimiter.getStatus(),
      sitemap: sitemapManager.getStats(),
    };
  }
  
  /**
   * Get detailed status report
   */
  getStatusReport() {
    return monitor.getStatusReport();
  }
  
  /**
   * Emergency stop
   */
  emergencyStop() {
    this.enabled = false;
    this.running = false;
    
    logger.error('EMERGENCY STOP activated');
    logger.logSafetyGuardrail('emergency_stop', 'engine_disabled');
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('Shutting down Distribution Engine...');
    
    this.running = false;
    
    // Save final sitemap
    await sitemapManager.updateSitemap();
    
    logger.info('Distribution Engine shutdown complete');
  }
}

// Export singleton instance
module.exports = new DistributionEngine();
