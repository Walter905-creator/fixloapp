/**
 * FGE Marketing Center Routes
 * POST /api/fge/marketing/generate
 * POST /api/fge/marketing/campaign
 * GET  /api/fge/marketing/campaigns
 * GET  /api/fge/marketing/campaigns/:id
 * PUT  /api/fge/marketing/campaigns/:id
 * DELETE /api/fge/marketing/campaigns/:id
 * POST /api/fge/marketing/image
 *
 * All routes: requireAuth + requireAdmin
 */

'use strict';

const router = require('express').Router();
const requireAuth = require('../../../middleware/requireAuth');
const requireAdmin = require('../../../middleware/requireAdmin');
const Campaign = require('../models/Campaign');
const FGEImage = require('../models/FGEImage');
const { enqueue } = require('../services/queue');
const ai = require('../services/aiGenerator');
const { allowedEnum, regexFilter, posInt } = require('../middleware/sanitize');

const CAMPAIGN_TYPES   = ['email','sms','blog','facebook','instagram','linkedin','x','google_business','landing_page','seasonal'];
const CAMPAIGN_STATUSES = ['draft','scheduled','active','paused','completed','failed'];
const AUDIENCE_VALUES   = ['homeowners','contractors','recruiters','all'];

// Apply admin guard to all marketing routes
router.use(requireAuth, requireAdmin);

// ─── Generate content on demand ──────────────────────────────────────────────

/**
 * POST /api/fge/marketing/generate
 * Body: { type, topic, service?, city?, audience?, cta?, ctaUrl?, platform? }
 * Generates AI content and optionally saves it as a draft campaign.
 */
router.post('/generate', async (req, res) => {
  try {
    const { type, topic, service, city, audience, cta, ctaUrl, platform, saveDraft } = req.body;

    if (!type || !topic) {
      return res.status(400).json({ ok: false, error: 'type and topic are required.' });
    }

    if (!ai.isAvailable) {
      return res.status(503).json({ ok: false, error: 'OpenAI is not configured on this server.' });
    }

    let content;
    switch (type) {
      case 'blog':
        content = await ai.generateBlogArticle({ topic, service, city });
        break;
      case 'email':
        content = await ai.generateEmailCampaign({ topic, audience, cta, ctaUrl });
        break;
      case 'sms':
        content = { body: await ai.generateSmsMessage({ topic, audience }) };
        break;
      case 'facebook':
      case 'instagram':
      case 'linkedin':
      case 'x':
      case 'google_business':
        content = { body: await ai.generateSocialPost({ platform: type, topic, service }) };
        break;
      default:
        return res.status(400).json({ ok: false, error: `Unknown content type: ${type}` });
    }

    // Optionally persist as a draft campaign
    let campaign = null;
    if (saveDraft) {
      campaign = await Campaign.create({
        title: content.title || content.subject || topic,
        type,
        body: content.body || content.bodyHtml,
        excerpt: content.excerpt || content.previewText,
        subject: content.subject,
        audience: audience || 'all',
        status: 'draft',
        generatedByAI: true,
        aiPrompt: topic,
        createdBy: req.user.id || req.user.email,
        tags: content.tags || [],
      });
    }

    return res.json({ ok: true, content, campaign });
  } catch (err) {
    console.error('[FGE Marketing] generate error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Campaign CRUD ────────────────────────────────────────────────────────────

router.post('/campaign', async (req, res) => {
  try {
    const campaign = await Campaign.create({ ...req.body, createdBy: req.user.id || req.user.email });
    return res.status(201).json({ ok: true, campaign });
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/campaigns', async (req, res) => {
  try {
    const page  = posInt(req.query.page, 1);
    const limit = posInt(req.query.limit, 20);
    const type   = allowedEnum(req.query.type,   CAMPAIGN_TYPES);
    const status = allowedEnum(req.query.status, CAMPAIGN_STATUSES);
    const filter = {};
    if (type)   filter.type   = type;
    if (status) filter.status = status;

    const [campaigns, total] = await Promise.all([
      Campaign.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Campaign.countDocuments(filter),
    ]);

    return res.json({ ok: true, campaigns, total, page, limit });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/campaigns/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).lean();
    if (!campaign) return res.status(404).json({ ok: false, error: 'Campaign not found.' });
    return res.json({ ok: true, campaign });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.put('/campaigns/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!campaign) return res.status(404).json({ ok: false, error: 'Campaign not found.' });
    return res.json({ ok: true, campaign });
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message });
  }
});

router.delete('/campaigns/:id', async (req, res) => {
  try {
    await Campaign.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Image Generation ─────────────────────────────────────────────────────────

/**
 * POST /api/fge/marketing/image
 * Body: { prompt, size? }
 */
router.post('/image', async (req, res) => {
  try {
    const { prompt, size } = req.body;
    if (!prompt) return res.status(400).json({ ok: false, error: 'prompt is required.' });
    if (!ai.isAvailable) return res.status(503).json({ ok: false, error: 'OpenAI not configured.' });

    // Enqueue heavy image generation job
    const job = await enqueue({ type: 'image_generation', priority: 7, payload: { prompt, size } });
    return res.json({ ok: true, jobId: job._id, message: 'Image generation queued.' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Campaign publish/schedule ────────────────────────────────────────────────

/**
 * POST /api/fge/marketing/campaigns/:id/publish
 */
router.post('/campaigns/:id/publish', async (req, res) => {
  try {
    const { scheduledAt } = req.body;
    const update = scheduledAt
      ? { status: 'scheduled', scheduledAt: new Date(scheduledAt) }
      : { status: 'active', publishedAt: new Date() };

    const campaign = await Campaign.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!campaign) return res.status(404).json({ ok: false, error: 'Campaign not found.' });
    return res.json({ ok: true, campaign });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
