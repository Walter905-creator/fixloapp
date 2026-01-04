const express = require('express');
const router = express.Router();
const Pro = require('../models/Pro');
const requireAuth = require('../middleware/requireAuth');
const { logSubscriptionAction } = require('../services/auditLogger');

// Middleware to check if user is a pro
const requirePro = async (req, res, next) => {
  try {
    const pro = await Pro.findOne({ email: req.user.email });
    if (!pro) {
      return res.status(403).json({ error: 'Not authorized - Pro account required' });
    }
    req.pro = pro;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authorization failed' });
  }
};

// All routes require authentication
router.use(requireAuth);
router.use(requirePro);

// POST /api/subscription/pause - Pause subscription (web/Stripe only)
router.post('/pause', async (req, res) => {
  try {
    const { reason } = req.body;
    const pro = req.pro;

    // Check current status
    if (pro.subscriptionStatus === 'paused') {
      return res.status(400).json({ 
        error: 'Subscription already paused',
        message: 'Your subscription is already paused'
      });
    }

    if (pro.subscriptionStatus !== 'active') {
      return res.status(400).json({ 
        error: 'Invalid subscription status',
        message: `Cannot pause subscription with status: ${pro.subscriptionStatus}`
      });
    }

    // For Stripe subscriptions, we set pause state in our system
    // The actual Stripe subscription remains active (Apple-compliant approach)
    pro.subscriptionStatus = 'paused';
    pro.pausedAt = new Date();
    pro.pauseReason = reason || 'User requested pause';
    pro.wantsNotifications = false; // Stop sending leads
    await pro.save();

    // Log the action
    await logSubscriptionAction({
      action: 'paused',
      proId: pro._id.toString(),
      subscriptionId: pro.stripeSubscriptionId,
      actorEmail: pro.email,
      actorType: 'user',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Subscription paused successfully. You will not receive new leads.',
      subscription: {
        status: pro.subscriptionStatus,
        pausedAt: pro.pausedAt,
        canResume: true
      }
    });
  } catch (error) {
    console.error('❌ Error pausing subscription:', error);
    res.status(500).json({ 
      error: 'Failed to pause subscription',
      message: error.message 
    });
  }
});

// POST /api/subscription/resume - Resume paused subscription
router.post('/resume', async (req, res) => {
  try {
    const pro = req.pro;

    // Check current status
    if (pro.subscriptionStatus !== 'paused') {
      return res.status(400).json({ 
        error: 'Subscription not paused',
        message: `Cannot resume subscription with status: ${pro.subscriptionStatus}`
      });
    }

    // Resume subscription
    pro.subscriptionStatus = 'active';
    pro.resumedAt = new Date();
    pro.wantsNotifications = true; // Resume receiving leads
    await pro.save();

    // Log the action
    await logSubscriptionAction({
      action: 'resumed',
      proId: pro._id.toString(),
      subscriptionId: pro.stripeSubscriptionId,
      actorEmail: pro.email,
      actorType: 'user',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Subscription resumed successfully. You will receive new leads.',
      subscription: {
        status: pro.subscriptionStatus,
        resumedAt: pro.resumedAt
      }
    });
  } catch (error) {
    console.error('❌ Error resuming subscription:', error);
    res.status(500).json({ 
      error: 'Failed to resume subscription',
      message: error.message 
    });
  }
});

// GET /api/subscription/status - Get subscription status
router.get('/status', async (req, res) => {
  try {
    const pro = req.pro;

    res.json({
      success: true,
      subscription: {
        status: pro.subscriptionStatus,
        paymentStatus: pro.paymentStatus,
        isActive: pro.isActive,
        pausedAt: pro.pausedAt,
        resumedAt: pro.resumedAt,
        pauseReason: pro.pauseReason,
        stripeSubscriptionId: pro.stripeSubscriptionId,
        subscriptionStartDate: pro.subscriptionStartDate,
        canPause: pro.subscriptionStatus === 'active',
        canResume: pro.subscriptionStatus === 'paused',
        receivingLeads: pro.subscriptionStatus === 'active' && pro.wantsNotifications
      }
    });
  } catch (error) {
    console.error('❌ Error getting subscription status:', error);
    res.status(500).json({ 
      error: 'Failed to get subscription status',
      message: error.message 
    });
  }
});

module.exports = router;
