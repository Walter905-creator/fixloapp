/**
 * FGE SMS Automation Routes
 * GET  /api/fge/sms/templates
 * POST /api/fge/sms/templates
 * PUT  /api/fge/sms/templates/:id
 * DELETE /api/fge/sms/templates/:id
 * POST /api/fge/sms/send         – send single SMS (admin test)
 * POST /api/fge/sms/generate     – AI-generate SMS body
 */

'use strict';

const router = require('express').Router();
const requireAuth = require('../../../middleware/requireAuth');
const requireAdmin = require('../../../middleware/requireAdmin');
const SmsTemplate = require('../models/SmsTemplate');
const { sendSms } = require('../services/smsSender');
const ai = require('../services/aiGenerator');
const { allowedEnum } = require('../middleware/sanitize');

const SMS_TRIGGERS = ['quote_confirmation','job_reminder','job_follow_up','seasonal_reminder',
  'referral_invite','recruiter_update','manual'];

router.use(requireAuth, requireAdmin);

// ─── Templates ────────────────────────────────────────────────────────────────

router.get('/templates', async (req, res) => {
  try {
    const trigger = allowedEnum(req.query.trigger, SMS_TRIGGERS);
    const filter = {};
    if (trigger) filter.trigger = trigger;
    if (req.query.active !== undefined) filter.active = req.query.active === 'true';
    const templates = await SmsTemplate.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, templates });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/templates', async (req, res) => {
  try {
    const tmpl = await SmsTemplate.create(req.body);
    return res.status(201).json({ ok: true, template: tmpl });
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message });
  }
});

router.put('/templates/:id', async (req, res) => {
  try {
    const tmpl = await SmsTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tmpl) return res.status(404).json({ ok: false, error: 'Template not found.' });
    return res.json({ ok: true, template: tmpl });
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message });
  }
});

router.delete('/templates/:id', async (req, res) => {
  try {
    await SmsTemplate.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Send (admin test) ────────────────────────────────────────────────────────

/**
 * POST /api/fge/sms/send
 * Body: { to, body, hasConsent? }
 * Used by admins to test SMS delivery.
 */
router.post('/send', async (req, res) => {
  try {
    const { to, body, hasConsent = true } = req.body;
    if (!to || !body) return res.status(400).json({ ok: false, error: 'to and body required.' });

    const sent = await sendSms({ to, body, hasConsent });
    return res.json({ ok: true, sent });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── AI generation ────────────────────────────────────────────────────────────

router.post('/generate', async (req, res) => {
  try {
    const { topic, audience } = req.body;
    if (!topic) return res.status(400).json({ ok: false, error: 'topic is required.' });
    if (!ai.isAvailable) return res.status(503).json({ ok: false, error: 'OpenAI not configured.' });

    const body = await ai.generateSmsMessage({ topic, audience });
    return res.json({ ok: true, body });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
