const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { 
  huntLeads, 
  processLead, 
  getHealth, 
  getRecentLeads 
} = require('../services/aiLeadHunter');

/**
 * AI Lead Hunter Routes
 * Endpoints for managing and monitoring the AI lead hunting system
 */

// Health check endpoint (public for monitoring)
router.get('/health', async (req, res) => {
  try {
    const health = getHealth();
    res.json(health);
  } catch (error) {
    console.error('[LEAD_HUNTER_API] ❌ Health check failed:', error);
    res.status(500).json({ 
      error: 'Health check failed',
      message: error.message 
    });
  }
});

// Get recent AI-generated leads (admin only)
router.get('/leads', requireAuth, async (req, res) => {
  try {
    // Check admin access
    const hasAdminAccess = req.user?.role === 'admin' || req.user?.isAdmin === true;
    if (!hasAdminAccess) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const limit = parseInt(req.query.limit) || 50;
    const leads = await getRecentLeads(limit);
    
    res.json({
      success: true,
      count: leads.length,
      leads: leads
    });
  } catch (error) {
    console.error('[LEAD_HUNTER_API] ❌ Error fetching leads:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leads',
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

    console.log('[LEAD_HUNTER_API] 🚀 Manual run triggered by admin');
    const result = await huntLeads();
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[LEAD_HUNTER_API] ❌ Manual run failed:', error);
    res.status(500).json({ 
      error: 'Manual run failed',
      message: error.message 
    });
  }
});

// Process a single lead (admin only, for testing)
router.post('/process', requireAuth, async (req, res) => {
  try {
    // Check admin access
    const hasAdminAccess = req.user?.role === 'admin' || req.user?.isAdmin === true;
    if (!hasAdminAccess) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { source, text, location } = req.body;
    
    if (!source || !text) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['source', 'text']
      });
    }

    const result = await processLead({ source, text, location });
    
    if (!result) {
      return res.json({
        success: false,
        message: 'Lead was skipped (duplicate or low confidence)'
      });
    }
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('[LEAD_HUNTER_API] ❌ Process lead failed:', error);
    res.status(500).json({ 
      error: 'Failed to process lead',
      message: error.message 
    });
  }
});

module.exports = router;
