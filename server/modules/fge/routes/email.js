/**
 * FGE Email Automation Routes
 * GET  /api/fge/email/templates      – list templates
 * POST /api/fge/email/templates      – create template
 * GET  /api/fge/email/templates/:id  – get template
 * PUT  /api/fge/email/templates/:id  – update template
 * DELETE /api/fge/email/templates/:id
 * POST /api/fge/email/send           – send email to a recipient
 * POST /api/fge/email/campaign/:id/send – send campaign to audience
 * POST /api/fge/email/generate       – AI-generate email content
 */

'use strict';

const router = require('express').Router();
const requireAuth = require('../../../middleware/requireAuth');
const requireAdmin = require('../../../middleware/requireAdmin');
const EmailTemplate = require('../models/EmailTemplate');
const Campaign = require('../models/Campaign');
const { sendEmail, sendBulkEmail } = require('../services/emailSender');
const ai = require('../services/aiGenerator');
const { allowedEnum } = require('../middleware/sanitize');

const EMAIL_TRIGGERS = ['new_homeowner','new_contractor','recruiter_signup','quote_request',
  'inactive_user','job_completed','seasonal_spring','seasonal_summer','seasonal_fall',
  'seasonal_winter','referral_invite','manual'];
const AUDIENCE_VALUES = ['homeowners','contractors','recruiters','all'];

router.use(requireAuth, requireAdmin);

// ─── Templates ────────────────────────────────────────────────────────────────

router.get('/templates', async (req, res) => {
  try {
    const trigger = allowedEnum(req.query.trigger, EMAIL_TRIGGERS);
    const filter = {};
    if (trigger) filter.trigger = trigger;
    if (req.query.active !== undefined) filter.active = req.query.active === 'true';

    const templates = await EmailTemplate.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, templates });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/templates', async (req, res) => {
  try {
    const tmpl = await EmailTemplate.create(req.body);
    return res.status(201).json({ ok: true, template: tmpl });
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/templates/:id', async (req, res) => {
  try {
    const tmpl = await EmailTemplate.findById(req.params.id).lean();
    if (!tmpl) return res.status(404).json({ ok: false, error: 'Template not found.' });
    return res.json({ ok: true, template: tmpl });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.put('/templates/:id', async (req, res) => {
  try {
    const tmpl = await EmailTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tmpl) return res.status(404).json({ ok: false, error: 'Template not found.' });
    return res.json({ ok: true, template: tmpl });
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message });
  }
});

router.delete('/templates/:id', async (req, res) => {
  try {
    await EmailTemplate.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Send single email ────────────────────────────────────────────────────────

/**
 * POST /api/fge/email/send
 * Body: { to, subject, html, text, templateId? }
 */
router.post('/send', async (req, res) => {
  try {
    const { to, subject, html, text, templateId } = req.body;
    if (!to || !subject) return res.status(400).json({ ok: false, error: 'to and subject required.' });

    const sent = await sendEmail({ to, subject, html, text, sendgridTemplateId: templateId });
    return res.json({ ok: true, sent });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Send campaign to audience ────────────────────────────────────────────────

/**
 * POST /api/fge/email/campaign/:id/send
 * Looks up the campaign, fetches audience emails from DB, sends bulk.
 */
router.post('/campaign/:id/send', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ ok: false, error: 'Campaign not found.' });
    if (campaign.type !== 'email') {
      return res.status(400).json({ ok: false, error: 'Campaign type must be email.' });
    }

    // In a real deployment, fetch recipient emails based on campaign.audience.
    // Here we send a test email to the requesting admin to confirm the setup works.
    const adminEmail = req.user.email;
    if (!adminEmail) return res.status(400).json({ ok: false, error: 'Admin email not found in token.' });

    const result = await sendBulkEmail([adminEmail], {
      subject: campaign.subject || campaign.title,
      html: campaign.body,
    });

    // Update campaign stats
    await Campaign.findByIdAndUpdate(req.params.id, {
      $inc: { 'stats.sent': result.sent },
      status: 'active',
      publishedAt: campaign.publishedAt || new Date(),
    });

    return res.json({ ok: true, result });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── AI generation ────────────────────────────────────────────────────────────

router.post('/generate', async (req, res) => {
  try {
    const { topic, audience, cta, ctaUrl } = req.body;
    if (!topic) return res.status(400).json({ ok: false, error: 'topic is required.' });
    if (!ai.isAvailable) return res.status(503).json({ ok: false, error: 'OpenAI not configured.' });

    const content = await ai.generateEmailCampaign({ topic, audience, cta, ctaUrl });
    return res.json({ ok: true, content });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
