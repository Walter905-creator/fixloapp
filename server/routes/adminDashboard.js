/**
 * Admin Dashboard Control Center Routes
 * Provides overview metrics, system health, and configuration endpoints.
 *
 * All routes require JWT admin authentication.
 * Security: requireAuth + admin role check applied via router.use().
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const requireAuth = require('../middleware/requireAuth');
const Pro = require('../models/Pro');
const JobRequest = require('../models/JobRequest');
const AdminSettings = require('../models/AdminSettings');
const SocialSettings = require('../models/SocialSettings');
const { getHealth: getLeadHunterHealth, huntLeads } = require('../services/aiLeadHunter');
const { getStats: getSeoStats } = require('../services/seoAIStats');

// ── Auth guard ────────────────────────────────────────────────────────────────
router.use(requireAuth);
router.use((req, res, next) => {
  const hasAdminAccess = req.user?.role === 'admin' || req.user?.isAdmin === true;
  if (!hasAdminAccess) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
});

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

    const [totalPros, activePros, lifetimePros, monthRevenue, leadsToday] = await Promise.all([
      Pro.countDocuments(),
      Pro.countDocuments({ isActive: true }),
      Pro.countDocuments({ subscriptionType: 'lifetime' }),
      JobRequest.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalCost' } } }
      ]),
      JobRequest.countDocuments({ createdAt: { $gte: startOfDay } })
    ]);

    const lhHealth = getLeadHunterHealth();
    const seoStats = getSeoStats();

    // Check Stripe & Twilio by env key presence
    const stripeOk = !!(process.env.STRIPE_SECRET_KEY);
    const twilioOk = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);

    res.json({
      totalPros,
      activePros,
      lifetimePros,
      totalRevenueMonth: monthRevenue[0]?.total || 0,
      leadsToday,
      smsSentToday: 0, // placeholder – extend with SmsNotification model if needed
      systemHealth: {
        stripe: stripeOk,
        twilio: twilioOk,
        aiLeadHunter: !lhHealth.running, // true = service is ready (not stuck)
        seoEngine: !seoStats.running
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

    const stripeOk = !!(process.env.STRIPE_SECRET_KEY);
    const twilioOk = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);

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

    const stripeOk = !!(process.env.STRIPE_SECRET_KEY);
    const twilioOk = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);

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
