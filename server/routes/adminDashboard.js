const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const Pro = require('../models/Pro');
const JobRequest = require('../models/JobRequest');
const LeadAssignment = require('../models/LeadAssignment');
const AdminSettings = require('../models/AdminSettings');
const SocialSettings = require('../models/SocialSettings');
const SmsNotification = require('../models/SmsNotification');
const { getHealth: getLeadHunterHealth, huntLeads } = require('../services/aiLeadHunter');
const { getStats: getSeoStats } = require('../services/seoAIStats');
const { getOwnerLeadAnalytics } = require('../services/leadTrackingService');

/**
 * Compute a human-readable health status for a background service.
 * @param {boolean} configured - Whether required API keys / config are present.
 * @param {boolean} running    - Whether the service is currently executing a job.
 * @param {Date|null} lastRun  - Timestamp of the last completed execution, or null if never run.
 * @returns {'online'|'offline'|'running'|'initializing'}
 */
function serviceStatus(configured, running, lastRun) {
  if (!configured) return 'offline';
  if (running) return 'running';
  if (!lastRun) return 'initializing';
  return 'online';
}

// Validate Stripe secret key format (only accept full secret keys, not restricted keys)
function isStripeKeyValid(key) {
  if (!key) return false;
  return /^sk_(live|test)_/.test(key);
}

// Validate Twilio Account SID format (starts with AC + 32 case-insensitive hex chars)
function isTwilioSidValid(sid) {
  if (!sid) return false;
  return /^AC[a-fA-F0-9]{32}$/.test(sid);
}

// ── Auth guard ────────────────────────────────────────────────────────────────
router.use(requireAuth);
router.use(requireAdmin);

// ── Helper: safe DB check ─────────────────────────────────────────────────────
function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

// ── PART 7: Dashboard Overview ────────────────────────────────────────────────
// GET /api/admin/overview
router.get('/overview', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalPros, activePros, lifetimePros, monthRevenue, leadsToday, smsSentToday, proPlans, assignmentStats, recentAssignments, leadAnalytics] = await Promise.all([
      Pro.countDocuments(),
      // "Active and approved": only pros who have completed Stripe payment are counted here.
      // isActive:true is set by the invoice.payment_succeeded webhook; paymentStatus:'active'
      // is set at the same time. invite-code pros may have isActive:true via manual activation
      // without a Stripe charge (paymentStatus stays 'pending'), so requiring paymentStatus:'active'
      // scopes this metric to paying, verified subscribers only. Manually-activated pros without
      // a Stripe subscription are intentionally excluded from this "approved" count.
      Pro.countDocuments({ isActive: true, paymentStatus: 'active' }),
      Pro.countDocuments({ subscriptionType: 'lifetime' }),
      // Revenue from successful Stripe subscription payments this month.
      // The invoice.payment_succeeded webhook sets subscriptionStartDate = current_period_start
      // on every billing renewal (see stripe.js). Pros whose billing period started this month
      // are those who paid this month — both new sign-ups AND renewals — which correctly reflects
      // subscription revenue received in the current calendar month.
      // subscriptionStatus:'active' further excludes cancelled or past-due subscriptions.
      Pro.aggregate([
        {
          $match: {
            paymentStatus: 'active',
            subscriptionStatus: 'active',
            subscriptionStartDate: { $gte: startOfMonth }
          }
        },
        { $group: { _id: null, total: { $sum: '$subscriptionPrice' } } }
      ]),
      JobRequest.countDocuments({ createdAt: { $gte: startOfDay } }),
      // Real SMS count for today from the SmsNotification tracking model
      SmsNotification.countDocuments({
        createdAt: { $gte: startOfDay },
        status: { $in: ['sent', 'delivered'] }
      }),
      Pro.aggregate([
        { $group: { _id: '$subscriptionPlan', count: { $sum: 1 } } }
      ]),
      LeadAssignment.aggregate([
        {
          $group: {
            _id: null,
            acceptedAssignments: {
              $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] }
            },
            expiredAssignments: {
              $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
            },
            pendingPremiumAssignments: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$assignmentType', 'premium_exclusive'] },
                      { $eq: ['$status', 'pending'] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            releasedAssignments: {
              $sum: { $cond: [{ $eq: ['$status', 'released'] }, 1, 0] }
            },
            totalPremiumAssignments: {
              $sum: { $cond: [{ $eq: ['$assignmentType', 'premium_exclusive'] }, 1, 0] }
            },
            acceptedPremiumAssignments: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$assignmentType', 'premium_exclusive'] },
                      { $eq: ['$status', 'accepted'] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]),
      LeadAssignment.find()
        .populate('leadId', 'trade city state createdAt')
        .populate('proId', 'name businessName subscriptionPlan')
        .sort({ assignedAt: -1 })
        .limit(10),
      getOwnerLeadAnalytics()
    ]);

    const lhHealth = getLeadHunterHealth();
    const seoStats = getSeoStats();

    // Stripe: validate key format (only accept full secret keys sk_live_ or sk_test_)
    const stripeConfigured = isStripeKeyValid(process.env.STRIPE_SECRET_KEY);
    // Twilio: validate Account SID format (starts with AC + 32 hex chars) and auth token presence
    const twilioConfigured = isTwilioSidValid(process.env.TWILIO_ACCOUNT_SID) &&
      !!(process.env.TWILIO_AUTH_TOKEN);
    // SEO Engine requires OpenAI for content generation
    const seoConfigured = !!(process.env.OPENAI_API_KEY);

    const assignmentSummary = assignmentStats[0] || {};
    const proPlanCounts = proPlans.reduce((acc, item) => {
      if (item?._id) acc[item._id] = item.count;
      return acc;
    }, {});

    res.json({
      totalPros,
      activePros,
      lifetimePros,
      totalRevenueMonth: monthRevenue[0]?.total || 0,
      leadsToday,
      smsSentToday,
      proPlanCounts,
      leadAssignments: {
        acceptedAssignments: assignmentSummary.acceptedAssignments || 0,
        expiredAssignments: assignmentSummary.expiredAssignments || 0,
        pendingPremiumAssignments: assignmentSummary.pendingPremiumAssignments || 0,
        releasedAssignments: assignmentSummary.releasedAssignments || 0,
        premiumResponseRate: assignmentSummary.totalPremiumAssignments
          ? Number(((assignmentSummary.acceptedPremiumAssignments || 0) / assignmentSummary.totalPremiumAssignments * 100).toFixed(1))
          : 0,
        recent: recentAssignments,
        analytics: leadAnalytics
      },
      systemHealth: {
        // Boolean: true = key is present and format is valid
        stripe: stripeConfigured,
        twilio: twilioConfigured,
        // Status strings for services: 'online' | 'offline' | 'running' | 'initializing'
        aiLeadHunter: serviceStatus(lhHealth.openaiConfigured, lhHealth.running, lhHealth.lastRun),
        seoEngine: serviceStatus(seoConfigured, seoStats.running, seoStats.lastRun)
      }
    });
  } catch (err) {
    console.error('❌ /admin/overview error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── PART 1: Jobs Overview ─────────────────────────────────────────────────────
// GET /api/admin/jobs/overview
router.get('/jobs/overview', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());

    const [
      totalJobs,
      pendingJobs,
      assignedJobs,
      completedJobs,
      cancelledJobs,
      jobsToday,
      jobsThisWeek,
      revenueAgg
    ] = await Promise.all([
      JobRequest.countDocuments(),
      JobRequest.countDocuments({ status: 'pending' }),
      JobRequest.countDocuments({ status: { $in: ['assigned', 'in-progress', 'scheduled'] } }),
      JobRequest.countDocuments({ status: 'completed' }),
      JobRequest.countDocuments({ status: 'cancelled' }),
      JobRequest.countDocuments({ createdAt: { $gte: startOfDay } }),
      JobRequest.countDocuments({ createdAt: { $gte: startOfWeek } }),
      JobRequest.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalCost' } } }
      ])
    ]);

    res.json({
      totalJobs,
      pendingJobs,
      assignedJobs,
      completedJobs,
      cancelledJobs,
      jobsToday,
      jobsThisWeek,
      totalRevenue: revenueAgg[0]?.total || 0
    });
  } catch (err) {
    console.error('❌ /admin/jobs/overview error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/jobs/recent
router.get('/jobs/recent', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const jobs = await JobRequest.find()
      .populate('assignedTo', 'name phone trade')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ jobs });
  } catch (err) {
    console.error('❌ /admin/jobs/recent error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/lead-assignments/recent', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const assignments = await LeadAssignment.find()
      .populate('leadId', 'trade city state status createdAt')
      .populate('proId', 'name businessName subscriptionPlan leadPriority')
      .sort({ assignedAt: -1 })
      .limit(50);

    res.json({ success: true, assignments });
  } catch (err) {
    console.error('❌ /admin/lead-assignments/recent error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── PART 2: Social Media Settings ────────────────────────────────────────────
// GET /api/admin/social/settings
router.get('/social/settings', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    let settings = await SocialSettings.findOne({ _singleton: 'social' });
    if (!settings) {
      settings = await SocialSettings.create({ _singleton: 'social' });
    }
    res.json(settings);
  } catch (err) {
    console.error('❌ /admin/social/settings GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/social/settings
router.post('/social/settings', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const { autoPostingEnabled, postingFrequency, connectedAccounts } = req.body;

    const update = { updatedAt: new Date() };
    if (typeof autoPostingEnabled === 'boolean') update.autoPostingEnabled = autoPostingEnabled;
    if (postingFrequency) {
      const valid = ['daily', 'twice_daily', 'weekly'];
      if (!valid.includes(postingFrequency)) {
        return res.status(400).json({ error: 'Invalid postingFrequency' });
      }
      update.postingFrequency = postingFrequency;
    }
    if (connectedAccounts && typeof connectedAccounts === 'object') {
      if (typeof connectedAccounts.facebook === 'boolean') update['connectedAccounts.facebook'] = connectedAccounts.facebook;
      if (typeof connectedAccounts.instagram === 'boolean') update['connectedAccounts.instagram'] = connectedAccounts.instagram;
      if (typeof connectedAccounts.twitter === 'boolean') update['connectedAccounts.twitter'] = connectedAccounts.twitter;
    }

    const settings = await SocialSettings.findOneAndUpdate(
      { _singleton: 'social' },
      { $set: update },
      { new: true, upsert: true }
    );
    res.json({ success: true, settings });
  } catch (err) {
    console.error('❌ /admin/social/settings POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/social/post-now  — record a manual post entry
router.post('/social/post-now', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const { platform = 'all', content = 'Manual post from Fixlo Admin' } = req.body;

    const validPlatforms = ['all', 'facebook', 'instagram', 'twitter'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({ error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` });
    }

    const newPost = { platform, content, postedAt: new Date(), status: 'sent' };

    const settings = await SocialSettings.findOneAndUpdate(
      { _singleton: 'social' },
      {
        $push: { recentPosts: { $each: [newPost], $slice: -10 } },
        $set: { updatedAt: new Date() }
      },
      { new: true, upsert: true }
    );

    res.json({ success: true, post: newPost, recentPosts: settings.recentPosts });
  } catch (err) {
    console.error('❌ /admin/social/post-now error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── PART 3: AI Lead Hunter Control ───────────────────────────────────────────
// GET /api/admin/lead-hunter/status
router.get('/lead-hunter/status', async (req, res) => {
  try {
    const lhHealth = getLeadHunterHealth();

    // Persist enabled state from AdminSettings if DB available
    let enabled = true;
    let totalLeadsCaptured = lhHealth.leadsGenerated || 0;
    let leadsCapturedToday = 0;

    if (isDbConnected()) {
      const adminSettings = await AdminSettings.findOne({ _singleton: 'admin' });
      if (adminSettings) enabled = adminSettings.aiLeadHunterEnabled;

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      leadsCapturedToday = await JobRequest.countDocuments({
        source: 'AI_DIAGNOSED',
        createdAt: { $gte: startOfDay }
      });
      totalLeadsCaptured = await JobRequest.countDocuments({ source: 'AI_DIAGNOSED' });
    }

    res.json({
      enabled,
      lastRun: lhHealth.lastRun,
      leadsCapturedToday,
      totalLeadsCaptured
    });
  } catch (err) {
    console.error('❌ /admin/lead-hunter/status error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/lead-hunter/toggle
router.post('/lead-hunter/toggle', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const current = await AdminSettings.findOne({ _singleton: 'admin' });
    const newEnabled = !(current?.aiLeadHunterEnabled ?? true);

    await AdminSettings.findOneAndUpdate(
      { _singleton: 'admin' },
      { $set: { aiLeadHunterEnabled: newEnabled, updatedAt: new Date() } },
      { upsert: true }
    );

    res.json({ success: true, enabled: newEnabled });
  } catch (err) {
    console.error('❌ /admin/lead-hunter/toggle error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/lead-hunter/run-now
router.post('/lead-hunter/run-now', async (req, res) => {
  try {
    const lhHealth = getLeadHunterHealth();
    if (lhHealth.running) {
      return res.status(409).json({ error: 'Lead Hunter is already running' });
    }

    // Fire-and-forget
    huntLeads().catch(err => console.error('[lead-hunter/run-now] background error:', err.message));

    res.json({ success: true, message: 'Lead Hunter triggered', triggeredAt: new Date() });
  } catch (err) {
    console.error('❌ /admin/lead-hunter/run-now error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── PART 4: SEO Engine Control ────────────────────────────────────────────────
// GET /api/admin/seo/status
router.get('/seo/status', async (req, res) => {
  try {
    const seoStats = getSeoStats();

    let enabled = true;
    let totalPages = seoStats.totalPages || 0;
    let indexedPages = 0;
    const SEOPage = require('../models/SEOPage');

    if (isDbConnected()) {
      const adminSettings = await AdminSettings.findOne({ _singleton: 'admin' });
      if (adminSettings) enabled = adminSettings.seoEngineEnabled;

      totalPages = await SEOPage.countDocuments();
      indexedPages = await SEOPage.countDocuments({ indexed: true });
    }

    res.json({
      enabled,
      lastRun: seoStats.lastRun,
      pagesGeneratedToday: seoStats.pagesGeneratedToday || 0,
      totalPages,
      indexedPages
    });
  } catch (err) {
    console.error('❌ /admin/seo/status error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/seo/toggle
router.post('/seo/toggle', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const current = await AdminSettings.findOne({ _singleton: 'admin' });
    const newEnabled = !(current?.seoEngineEnabled ?? true);

    await AdminSettings.findOneAndUpdate(
      { _singleton: 'admin' },
      { $set: { seoEngineEnabled: newEnabled, updatedAt: new Date() } },
      { upsert: true }
    );

    res.json({ success: true, enabled: newEnabled });
  } catch (err) {
    console.error('❌ /admin/seo/toggle error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/seo/run-now
router.post('/seo/run-now', async (req, res) => {
  try {
    const seoStats = getSeoStats();
    if (seoStats.running) {
      return res.status(409).json({ error: 'SEO Engine is already running' });
    }

    // Dynamic require to avoid circular-dep issues
    const { runSEOAgent } = require('../services/seo/seoAgent');
    runSEOAgent().catch(err => console.error('[seo/run-now] background error:', err.message));

    res.json({ success: true, message: 'SEO Engine triggered', triggeredAt: new Date() });
  } catch (err) {
    console.error('❌ /admin/seo/run-now error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── PART 6: Admin Settings ────────────────────────────────────────────────────
// GET /api/admin/settings
router.get('/settings', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    let settings = await AdminSettings.findOne({ _singleton: 'admin' });
    if (!settings) {
      settings = await AdminSettings.create({ _singleton: 'admin' });
    }

    const stripeOk = isStripeKeyValid(process.env.STRIPE_SECRET_KEY);
    const twilioOk = isTwilioSidValid(process.env.TWILIO_ACCOUNT_SID) &&
      !!(process.env.TWILIO_AUTH_TOKEN);

    res.json({
      defaultLeadRadius: settings.defaultLeadRadius,
      maxLeadsPerPro: settings.maxLeadsPerPro,
      autoAssignEnabled: settings.autoAssignEnabled,
      smsPriorityEnabled: settings.smsPriorityEnabled,
      aiLeadHunterEnabled: settings.aiLeadHunterEnabled,
      seoEngineEnabled: settings.seoEngineEnabled,
      stripeWebhookStatus: stripeOk,
      twilioHealthStatus: twilioOk,
      updatedAt: settings.updatedAt
    });
  } catch (err) {
    console.error('❌ /admin/settings GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/settings
router.post('/settings', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const {
      defaultLeadRadius,
      maxLeadsPerPro,
      autoAssignEnabled,
      smsPriorityEnabled,
      aiLeadHunterEnabled,
      seoEngineEnabled
    } = req.body;

    const update = { updatedAt: new Date() };

    if (defaultLeadRadius !== undefined) {
      const r = Number(defaultLeadRadius);
      if (!Number.isFinite(r) || r < 1 || r > 500) {
        return res.status(400).json({ error: 'defaultLeadRadius must be 1-500' });
      }
      update.defaultLeadRadius = r;
    }
    if (maxLeadsPerPro !== undefined) {
      const m = Number(maxLeadsPerPro);
      if (!Number.isFinite(m) || m < 1 || m > 100) {
        return res.status(400).json({ error: 'maxLeadsPerPro must be 1-100' });
      }
      update.maxLeadsPerPro = m;
    }
    if (typeof autoAssignEnabled === 'boolean') update.autoAssignEnabled = autoAssignEnabled;
    if (typeof smsPriorityEnabled === 'boolean') update.smsPriorityEnabled = smsPriorityEnabled;
    if (typeof aiLeadHunterEnabled === 'boolean') update.aiLeadHunterEnabled = aiLeadHunterEnabled;
    if (typeof seoEngineEnabled === 'boolean') update.seoEngineEnabled = seoEngineEnabled;

    const settings = await AdminSettings.findOneAndUpdate(
      { _singleton: 'admin' },
      { $set: update },
      { new: true, upsert: true }
    );

    const stripeOk = isStripeKeyValid(process.env.STRIPE_SECRET_KEY);
    const twilioOk = isTwilioSidValid(process.env.TWILIO_ACCOUNT_SID) &&
      !!(process.env.TWILIO_AUTH_TOKEN);

    res.json({
      success: true,
      settings: {
        defaultLeadRadius: settings.defaultLeadRadius,
        maxLeadsPerPro: settings.maxLeadsPerPro,
        autoAssignEnabled: settings.autoAssignEnabled,
        smsPriorityEnabled: settings.smsPriorityEnabled,
        aiLeadHunterEnabled: settings.aiLeadHunterEnabled,
        seoEngineEnabled: settings.seoEngineEnabled,
        stripeWebhookStatus: stripeOk,
        twilioHealthStatus: twilioOk,
        updatedAt: settings.updatedAt
      }
    });
  } catch (err) {
    console.error('❌ /admin/settings POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
