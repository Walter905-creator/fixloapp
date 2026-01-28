const express = require('express');
const router = express.Router();
const { getSEOAgent } = require('../services/seo/seoAgent');
const { getGSCClient } = require('../services/seo/gscClient');
const SEOAgentAction = require('../models/SEOAgentAction');
const SEOPageMapping = require('../models/SEOPageMapping');
const GSCPageDaily = require('../models/GSCPageDaily');
const GSCQueryDaily = require('../models/GSCQueryDaily');

// Middleware to check if user is admin
// TODO: Implement proper admin authentication
const requireAdmin = (req, res, next) => {
  // Check if SEO_AGENT_API_KEY is configured
  if (!process.env.SEO_AGENT_API_KEY) {
    return res.status(500).json({ 
      error: 'Server configuration error',
      message: 'SEO_AGENT_API_KEY not configured'
    });
  }
  
  // For now, require API key
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  if (!apiKey || apiKey !== process.env.SEO_AGENT_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized. Admin access required.' });
  }
  next();
};

/**
 * GET /api/seo-agent/status
 * Get current agent status
 */
router.get('/status', requireAdmin, async (req, res) => {
  try {
    const agent = getSEOAgent();
    const status = agent.getStatus();
    
    // Get recent action counts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayActions = await SEOAgentAction.countDocuments({
      createdAt: { $gte: today }
    });

    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    
    const weekActions = await SEOAgentAction.countDocuments({
      createdAt: { $gte: last7Days }
    });

    res.json({
      ...status,
      stats: {
        todayActions,
        weekActions
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/seo-agent/run
 * Manually trigger agent run
 */
router.post('/run', requireAdmin, async (req, res) => {
  try {
    const agent = getSEOAgent();
    
    // Run agent asynchronously
    agent.run().then(results => {
      console.log('✅ Agent run completed:', results);
    }).catch(error => {
      console.error('❌ Agent run failed:', error);
    });

    res.json({
      message: 'SEO Agent started',
      status: 'running'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/seo-agent/sync-gsc
 * Sync Google Search Console data
 */
router.post('/sync-gsc', requireAdmin, async (req, res) => {
  try {
    let { days = 7 } = req.body;
    
    // Validate days parameter
    days = parseInt(days, 10);
    if (isNaN(days) || days < 1 || days > 30) {
      return res.status(400).json({ 
        error: 'Invalid days parameter',
        message: 'Days must be between 1 and 30'
      });
    }
    
    const gscClient = getGSCClient();
    
    const results = await gscClient.syncLastNDays(days);
    
    res.json({
      message: 'GSC data synced',
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/seo-agent/actions
 * Get recent agent actions with optional filters
 */
router.get('/actions', requireAdmin, async (req, res) => {
  try {
    const {
      actionType,
      status,
      limit = 50,
      page = 1
    } = req.query;

    const query = {};
    if (actionType) query.actionType = actionType;
    if (status) query.status = status;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const actions = await SEOAgentAction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .skip(skip);

    const total = await SEOAgentAction.countDocuments(query);

    res.json({
      actions,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/seo-agent/actions/:id
 * Get specific action details
 */
router.get('/actions/:id', requireAdmin, async (req, res) => {
  try {
    const action = await SEOAgentAction.findById(req.params.id);
    
    if (!action) {
      return res.status(404).json({ error: 'Action not found' });
    }

    res.json(action);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/seo-agent/pages
 * Get page mappings with optional filters
 */
router.get('/pages', requireAdmin, async (req, res) => {
  try {
    const {
      service,
      city,
      status,
      isWinner,
      isDead,
      limit = 50,
      page = 1
    } = req.query;

    const query = {};
    if (service) query.service = service;
    if (city) query.city = city;
    if (status) query.status = status;
    if (isWinner !== undefined) query.isWinner = isWinner === 'true';
    if (isDead !== undefined) query.isDead = isDead === 'true';

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const pages = await SEOPageMapping.find(query)
      .sort({ 'currentMetrics.clicks': -1 })
      .limit(parseInt(limit, 10))
      .skip(skip);

    const total = await SEOPageMapping.countDocuments(query);

    res.json({
      pages,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/seo-agent/analytics
 * Get analytics and performance metrics
 */
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Success rates by action type
    const actionTypes = ['CREATE_PAGE', 'REWRITE_META', 'EXPAND_CONTENT', 'FREEZE_PAGE'];
    const successRates = {};

    for (const actionType of actionTypes) {
      const rate = await SEOAgentAction.getSuccessRate(actionType, parseInt(days));
      successRates[actionType] = rate;
    }

    // Total clicks and impressions trend
    const clicksTrend = await GSCPageDaily.aggregate([
      {
        $match: {
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalClicks: { $sum: '$clicks' },
          totalImpressions: { $sum: '$impressions' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Top performing pages
    const topPages = await SEOPageMapping.find({
      status: 'ACTIVE',
      'currentMetrics.clicks': { $gt: 0 }
    })
      .sort({ 'currentMetrics.clicks': -1 })
      .limit(10);

    // Action counts by type
    const actionCounts = await SEOAgentAction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$actionType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      successRates,
      clicksTrend,
      topPages,
      actionCounts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/seo-agent/opportunities
 * Get current opportunities for page creation
 */
router.get('/opportunities', requireAdmin, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const opportunities = await GSCQueryDaily.findOpportunities(100, 8, 30);
    
    res.json({
      opportunities: opportunities.slice(0, parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/seo-agent/test
 * Test agent configuration (GSC, OpenAI)
 */
router.post('/test', requireAdmin, async (req, res) => {
  try {
    const agent = getSEOAgent();
    const status = agent.getStatus();
    
    const tests = {
      gscConfigured: status.gscConfigured,
      openaiConfigured: status.openaiConfigured,
      databaseConnected: false
    };

    // Test database connection
    try {
      await SEOAgentAction.findOne().limit(1);
      tests.databaseConnected = true;
    } catch (error) {
      tests.databaseError = error.message;
    }

    // Test GSC if configured
    if (status.gscConfigured) {
      try {
        const gscClient = getGSCClient();
        await gscClient.initialize();
        tests.gscInitialized = true;
      } catch (error) {
        tests.gscError = error.message;
      }
    }

    res.json({
      message: 'Configuration test complete',
      tests,
      ready: tests.gscConfigured && tests.openaiConfigured && tests.databaseConnected
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
