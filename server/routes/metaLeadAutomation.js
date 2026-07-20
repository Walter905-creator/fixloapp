const express = require('express');
const rateLimit = require('express-rate-limit');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const { inboundSmsController } = require('../controllers/inboundSmsController');
const { inboundEmailController } = require('../controllers/inboundEmailController');
const {
  getSettings,
  saveSettings,
  verifyMetaSignature,
  processMetaWebhookPayload,
  processFollowUpCycle,
  reconcileLeadRegistrations,
  handleTwilioStatusWebhook,
  handleSendGridEvents,
  listLeads,
  getLeadDetails,
  computeDashboardMetrics,
  performManualAction
} = require('../services/metaLeadAutomationService');

const router = express.Router();

const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many webhook requests' }
});

const adminMutationRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests' }
});

router.get('/webhook/meta-leads', webhookRateLimit, (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    const safeChallenge = String(challenge || '').replace(/[<>]/g, '');
    return res.status(200).type('text/plain').send(safeChallenge);
  }

  return res.status(403).json({ ok: false, error: 'Webhook verification failed' });
});

router.post('/webhook/meta-leads', webhookRateLimit, async (req, res) => {
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
    const signature = req.headers['x-hub-signature-256'];

    if (!verifyMetaSignature(rawBody, signature)) {
      return res.status(401).json({ ok: false, error: 'Invalid Meta signature' });
    }

    const parsed = JSON.parse(rawBody.toString('utf8'));
    const result = await processMetaWebhookPayload(parsed);

    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/webhook/twilio/meta-leads/status', webhookRateLimit, express.urlencoded({ extended: false }), async (req, res) => {
  try {
    await handleTwilioStatusWebhook(req.body || {});
    return res.status(200).send('ok');
  } catch (error) {
    return res.status(500).type('text/plain').send('status_webhook_error');
  }
});

router.post('/webhook/twilio/meta-leads/inbound', webhookRateLimit, express.urlencoded({ extended: false }), async (req, res) => {
  return inboundSmsController(req, res);
});

router.post('/webhook/sendgrid/meta-leads/events', webhookRateLimit, express.json({ type: 'application/json' }), async (req, res) => {
  try {
    await handleSendGridEvents(req.body || []);
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/webhook/sendgrid/meta-leads/inbound', webhookRateLimit, express.urlencoded({ extended: true }), async (req, res) => inboundEmailController(req, res));

router.get('/api/admin/meta-leads/settings', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const settings = await getSettings();
    return res.json({ ok: true, settings });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/api/admin/meta-leads/settings', requireAuth, requireAdmin, adminMutationRateLimit, async (req, res) => {
  try {
    const settings = await saveSettings(req.body || {});
    return res.json({ ok: true, settings });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/api/admin/meta-leads/dashboard', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [metrics, settings] = await Promise.all([computeDashboardMetrics(), getSettings()]);
    return res.json({ ok: true, metrics, settings });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/api/admin/meta-leads', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await listLeads(req.query || {});
    return res.json({ ok: true, ...data });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/api/admin/meta-leads/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await getLeadDetails(req.params.id);
    if (!data) return res.status(404).json({ ok: false, error: 'Lead not found' });
    return res.json({ ok: true, ...data });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/api/admin/meta-leads/:id/actions/:action', requireAuth, requireAdmin, adminMutationRateLimit, async (req, res) => {
  try {
    const actionMap = {
      'resend-sms': 'resend_sms',
      'resend-email': 'resend_email',
      'pause': 'pause',
      'resume': 'resume',
      'mark-closed': 'mark_closed',
      'take-over': 'take_over',
      'release-takeover': 'release_takeover',
      'send-manual-sms': 'send_manual_sms',
      'send-manual-email': 'send_manual_email',
      'mark-not-interested': 'mark_not_interested',
      'mark-resolved': 'mark_resolved',
      'assign-recruiter': 'assign_recruiter',
      'add-note': 'add_note'
    };

    const action = actionMap[req.params.action];
    if (!action) return res.status(400).json({ ok: false, error: 'Invalid action' });

    const lead = await performManualAction(req.params.id, action, req.body || {});
    return res.json({ ok: true, lead });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/api/admin/meta-leads/jobs/followups/run', requireAuth, requireAdmin, adminMutationRateLimit, async (_req, res) => {
  try {
    const result = await processFollowUpCycle();
    return res.json({ ok: true, result });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/api/admin/meta-leads/jobs/reconcile/run', requireAuth, requireAdmin, adminMutationRateLimit, async (_req, res) => {
  try {
    const result = await reconcileLeadRegistrations();
    return res.json({ ok: true, result });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;
