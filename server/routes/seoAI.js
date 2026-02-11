const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const SEOPage = require('../models/SEOPage');
const { getStats, resetDailyStatsIfNeeded } = require('../services/seoAIStats');

/**
 * SEO AI Engine Routes
 * Monitoring and control endpoints for the SEO automation system
 */

// Health check endpoint (public for monitoring)
router.get('/health', async (req, res) => {
  try {
    const stats = getStats();
    
    // Get total pages from database (with fallback if DB not connected)
    let totalPages = stats.totalPages;
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        totalPages = await SEOPage.countDocuments();
      } else {
        console.warn('[SEO_AI_API] Database not connected, using cached stats');
      }
    } catch (dbError) {
      console.warn('[SEO_AI_API] Database query failed:', dbError.message);
    }
    
    res.json({
      running: stats.running,
      pagesGeneratedToday: stats.pagesGeneratedToday,
      totalPages: totalPages,
      lastRun: stats.lastRun,
      errors: stats.errors,
      openaiConfigured: !!process.env.OPENAI_API_KEY,
      gscConfigured: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      databaseConnected: require('mongoose').connection.readyState === 1
    });
  } catch (error) {
    console.error('[SEO_AI_API] ❌ Health check failed:', error);
    res.status(500).json({ 
      error: 'Health check failed',
      message: error.message 
    });
  }
});

// Get recent SEO pages (admin only)
router.get('/pages', requireAuth, async (req, res) => {
  try {
    // Check admin access
    const hasAdminAccess = req.user?.role === 'admin' || req.user?.isAdmin === true;
    if (!hasAdminAccess) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const limit = parseInt(req.query.limit) || 50;
    const pages = await SEOPage.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('service city slug title metaDescription createdAt impressions clicks ctr');
    
    res.json({
      success: true,
      count: pages.length,
      pages: pages
    });
  } catch (error) {
    console.error('[SEO_AI_API] ❌ Error fetching pages:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pages',
      message: error.message 
    });
  }
});

// Manual trigger (admin only)
router.post('/run', requireAuth, async (req, res) => {
  try {
    // Check admin access
    const hasAdminAccess = req.user?.role === 'admin' || req.user?.isAdmin === true;
    if (!hasAdminAccess) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const stats = getStats();
    if (stats.running) {
      return res.status(429).json({ 
        error: 'SEO AI Engine is already running',
        message: 'Please wait for current run to complete'
      });
    }

    console.log('[SEO_AI_API] 🚀 Manual run triggered by admin');
    
    // Import and run SEO agent
    const { runSEOAgent } = require('../services/seo/seoAgent');
    const { setRunning, updateStats } = require('../services/seoAIStats');
    
    setRunning(true);
    
    try {
      const result = await runSEOAgent();
      updateStats(result.pagesGenerated || 0, false);
      
      res.json({
        success: true,
        pagesGenerated: result.pagesGenerated || 0,
        message: 'SEO AI Engine completed successfully'
      });
    } catch (error) {
      updateStats(0, true);
      throw error;
    }
  } catch (error) {
    console.error('[SEO_AI_API] ❌ Manual run failed:', error);
    const { setRunning } = require('../services/seoAIStats');
    setRunning(false);
    res.status(500).json({ 
      error: 'Manual run failed',
      message: error.message 
    });
  }
});

// Get stats (admin only)
router.get('/stats', requireAuth, async (req, res) => {
  try {
    // Check admin access
    const hasAdminAccess = req.user?.role === 'admin' || req.user?.isAdmin === true;
    if (!hasAdminAccess) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const stats = getStats();
    
    // Get additional stats
    const totalPages = await SEOPage.countDocuments();
    const todayPages = await SEOPage.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    
    res.json({
      success: true,
      stats: {
        ...stats,
        totalPages,
        pagesGeneratedToday: todayPages
      }
    });
  } catch (error) {
    console.error('[SEO_AI_API] ❌ Error fetching stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stats',
      message: error.message 
    });
  }
});

module.exports = router;
