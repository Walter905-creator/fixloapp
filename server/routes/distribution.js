/**
 * Distribution Engine API Routes
 * 
 * Admin endpoints for managing and monitoring the distribution engine.
 * Protected by admin authentication.
 */

const express = require('express');
const router = express.Router();
const distributionEngine = require('../services/distribution');
const logger = require('../services/distribution/logger');
const config = require('../services/distribution/config');

/**
 * Middleware to check if distribution engine is enabled
 */
const checkEnabled = (req, res, next) => {
  if (!config.DISTRIBUTION_ENGINE_ENABLED) {
    return res.status(503).json({
      success: false,
      message: 'Distribution Engine is currently disabled',
      enabled: false,
    });
  }
  next();
};

/**
 * GET /api/distribution/status
 * Get current distribution engine status
 */
router.get('/status', (req, res) => {
  try {
    const status = distributionEngine.getStatus();
    
    res.json({
      success: true,
      status,
    });
  } catch (error) {
    logger.error('Status request failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/distribution/report
 * Get detailed status report with recommendations
 */
router.get('/report', checkEnabled, (req, res) => {
  try {
    const report = distributionEngine.getStatusReport();
    
    res.json({
      success: true,
      report,
    });
  } catch (error) {
    logger.error('Report request failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/distribution/initialize
 * Initialize the distribution engine
 */
router.post('/initialize', checkEnabled, async (req, res) => {
  try {
    const initialized = await distributionEngine.initialize();
    
    if (initialized) {
      res.json({
        success: true,
        message: 'Distribution Engine initialized successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Distribution Engine initialization failed',
      });
    }
  } catch (error) {
    logger.error('Initialization failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/distribution/generate
 * Generate pages for service+city combinations
 * 
 * Body:
 * - service: string (required)
 * - cities: string[] (optional, defaults to MAJOR_CITIES)
 * - limit: number (optional, max pages to generate)
 */
router.post('/generate', checkEnabled, async (req, res) => {
  try {
    const { service, cities, limit } = req.body;
    
    if (!service) {
      return res.status(400).json({
        success: false,
        message: 'Service is required',
      });
    }
    
    // Validate service
    if (!config.SERVICES.includes(service)) {
      return res.status(400).json({
        success: false,
        message: `Invalid service. Available: ${config.SERVICES.join(', ')}`,
      });
    }
    
    const citiesToUse = cities || config.MAJOR_CITIES;
    
    // Start generation
    logger.info('Manual generation started', { 
      service,
      cityCount: citiesToUse.length,
      limit,
    });
    
    const results = await distributionEngine.generateBatch(service, citiesToUse, limit);
    
    res.json({
      success: true,
      message: 'Generation complete',
      results,
    });
  } catch (error) {
    logger.error('Generation failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/distribution/generate-single
 * Generate a single page
 * 
 * Body:
 * - service: string (required)
 * - location: string (required)
 * - variant: string (optional, default: 'standard')
 * - language: string (optional, default: 'en')
 */
router.post('/generate-single', checkEnabled, async (req, res) => {
  try {
    const { service, location, variant = 'standard', language = 'en' } = req.body;
    
    if (!service || !location) {
      return res.status(400).json({
        success: false,
        message: 'Service and location are required',
      });
    }
    
    const page = await distributionEngine.generatePage({ service, location, variant, language });
    
    if (!page) {
      return res.status(500).json({
        success: false,
        message: 'Page generation failed',
      });
    }
    
    const published = await distributionEngine.publishPage(page);
    
    res.json({
      success: true,
      message: published ? 'Page generated and published' : 'Page generated and queued',
      page: {
        url: page.url,
        title: page.title,
        published,
      },
    });
  } catch (error) {
    logger.error('Single page generation failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/distribution/process-queue
 * Process items in the publishing queue
 */
router.post('/process-queue', checkEnabled, async (req, res) => {
  try {
    await distributionEngine.processQueue();
    
    const status = require('../services/distribution/rateLimiter').getStatus();
    
    res.json({
      success: true,
      message: 'Queue processed',
      queueLength: status.queueLength,
    });
  } catch (error) {
    logger.error('Queue processing failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/distribution/check-indexing
 * Check indexing status of published pages
 */
router.post('/check-indexing', checkEnabled, async (req, res) => {
  try {
    await distributionEngine.checkIndexingStatus();
    
    res.json({
      success: true,
      message: 'Indexing check complete',
    });
  } catch (error) {
    logger.error('Indexing check failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/distribution/update-sitemap
 * Manually trigger sitemap update
 */
router.post('/update-sitemap', checkEnabled, async (req, res) => {
  try {
    const sitemapManager = require('../services/distribution/sitemapManager');
    const updated = await sitemapManager.updateSitemap();
    
    if (updated) {
      res.json({
        success: true,
        message: 'Sitemap updated successfully',
        stats: sitemapManager.getStats(),
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Sitemap update failed',
      });
    }
  } catch (error) {
    logger.error('Sitemap update failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/distribution/emergency-stop
 * Emergency stop button - immediately disable engine
 */
router.post('/emergency-stop', async (req, res) => {
  try {
    distributionEngine.emergencyStop();
    
    res.json({
      success: true,
      message: 'Distribution Engine emergency stopped',
      enabled: false,
    });
  } catch (error) {
    logger.error('Emergency stop failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/distribution/config
 * Get current configuration (safe subset)
 */
router.get('/config', (req, res) => {
  try {
    res.json({
      success: true,
      config: {
        enabled: config.DISTRIBUTION_ENGINE_ENABLED,
        services: config.SERVICES,
        cities: config.MAJOR_CITIES,
        rateLimits: config.RATE_LIMITS,
        contentQuality: config.CONTENT_QUALITY,
        pageVariants: config.PAGE_VARIANTS,
        languages: config.LANGUAGES,
        monitoring: config.MONITORING,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/distribution/deactivate-slowdown
 * Manually deactivate slowdown mode
 */
router.post('/deactivate-slowdown', checkEnabled, (req, res) => {
  try {
    const monitor = require('../services/distribution/monitor');
    monitor.deactivateSlowdown();
    
    res.json({
      success: true,
      message: 'Slowdown mode deactivated',
    });
  } catch (error) {
    logger.error('Slowdown deactivation failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/distribution/deactivate-pause
 * Manually deactivate pause mode
 */
router.post('/deactivate-pause', checkEnabled, (req, res) => {
  try {
    const monitor = require('../services/distribution/monitor');
    monitor.deactivatePause();
    
    res.json({
      success: true,
      message: 'Pause mode deactivated',
    });
  } catch (error) {
    logger.error('Pause deactivation failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
