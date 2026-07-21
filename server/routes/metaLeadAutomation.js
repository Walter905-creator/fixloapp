const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const MetaLead = require('../models/MetaLead');
const {
  getSettings,
  getStatusCallbackUrl,
  saveSettings,
  verifyMetaSignature,
  processMetaWebhookPayload,
  processFollowUpCycle,
  reconcileLeadRegistrations,
  handleTwilioStatusWebhook,
  handleTwilioInboundWebhook,
  handleSendGridEvents,
  listLeads,
  getLeadDetails,
  computeDashboardMetrics,
  performManualAction
} = require('../services/metaLeadAutomationService');
const { sendSms } = require('../utils/twilio');

const router = express.Router();

// Log that the status-callback route is mounted (satisfies startup diagnostic #7).
console.log('[TWILIO_CONFIG] Callback route mounted: yes — POST /webhook/twilio/meta-leads/status');

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

/**
 * Verify that a Twilio webhook request is genuinely from Twilio by validating
 * the X-Twilio-Signature header using the Auth Token.
 *
 * Returns true when:
 *  - TWILIO_AUTH_TOKEN is not set (allows local dev without credentials)
 *  - The computed HMAC-SHA1 matches the header value
 */
function verifyTwilioSignature(req) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return true; // skip validation when credentials are absent (dev/test)

  const signature = req.headers['x-twilio-signature'] || '';
  if (!signature) return false;

  // Build the URL that Twilio used when it sent the request.
  const callbackUrl = getStatusCallbackUrl();
  if (!callbackUrl) return false;

  // Sort POST params and append to URL exactly as Twilio does.
  const params = req.body || {};
  const sortedKeys = Object.keys(params).sort();
  const paramStr = sortedKeys.map((k) => `${k}${params[k]}`).join('');
  const stringToSign = `${callbackUrl}${paramStr}`;

  const expected = crypto
    .createHmac('sha1', authToken)
    .update(Buffer.from(stringToSign, 'utf8'))
    .digest('base64');

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

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
  // Validate Twilio signature to reject spoofed requests.
  if (!verifyTwilioSignature(req)) {
    return res.status(403).type('text/plain').send('forbidden');
  }
  try {
    await handleTwilioStatusWebhook(req.body || {});
    return res.status(200).send('ok');
  } catch (error) {
    return res.status(500).type('text/plain').send('status_webhook_error');
  }
});

router.post('/webhook/twilio/meta-leads/inbound', webhookRateLimit, express.urlencoded({ extended: false }), async (req, res) => {
  try {
    await handleTwilioInboundWebhook(req.body || {});
    return res.status(200).send('<Response></Response>');
  } catch (error) {
    return res.status(500).type('text/plain').send('inbound_webhook_error');
  }
});

router.post('/webhook/sendgrid/meta-leads/events', webhookRateLimit, express.json({ type: 'application/json' }), async (req, res) => {
  try {
    await handleSendGridEvents(req.body || []);
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

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

/**
 * One-time idempotent retry endpoint for the three Meta leads whose initial SMS
 * failed because of the invalid relative StatusCallback URL (2026-07-19 incident).
 *
 * POST /api/admin/meta-leads/retry-failed-initial-sms-20260719
 *
 * For each lead the endpoint:
 *  - Returns ALREADY_SENT if a valid Twilio SID already exists in smsHistory.
 *  - Retries only the initial SMS (templateKey="immediate") when no SID exists.
 *  - Never creates new documents, invite codes, emails, or follow-ups.
 *  - Is fully idempotent — safe to call multiple times.
 */
router.post(
  '/api/admin/meta-leads/retry-failed-initial-sms-20260719',
  requireAuth,
  requireAdmin,
  adminMutationRateLimit,
  async (_req, res) => {
    const TARGET_IDS = [
      '6a5f4c298a89f5ec882f359c',
      '6a5f4c2b8a89f5ec882f35b2',
      '6a5f4c2c8a89f5ec882f35c8'
    ];

    const callbackUrl = getStatusCallbackUrl();
    if (!callbackUrl) {
      return res.status(500).json({
        ok: false,
        error: 'BACKEND_PUBLIC_URL is not configured — cannot build absolute StatusCallback URL. Set BACKEND_PUBLIC_URL=https://fixloapp.onrender.com in Render.'
      });
    }

    const settings = await getSettings();
    const results = [];

    for (const leadId of TARGET_IDS) {
      let lead;
      try {
        lead = await MetaLead.findById(leadId);
      } catch (err) {
        results.push({ leadId, status: 'ERROR', error: `DB lookup failed: ${err.message}` });
        continue;
      }

      if (!lead) {
        results.push({ leadId, status: 'NOT_FOUND' });
        continue;
      }

      // Check if we already have a valid Twilio SID for an outbound initial SMS.
      const existingSid = (lead.smsHistory || [])
        .filter((h) => h.direction === 'outbound' && h.templateKey === 'immediate')
        .map((h) => h.messageSid)
        .find((sid) => sid && /^SM[a-fA-F0-9]{32}$/.test(sid));

      if (existingSid) {
        results.push({
          name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.email,
          leadId,
          status: 'ALREADY_SENT',
          twilioMessageSid: existingSid,
          statusCallback: callbackUrl
        });
        continue;
      }

      // Build message body from stored settings template.
      const vars = {
        firstName: lead.firstName || 'there',
        lastName: lead.lastName || '',
        trade: lead.trade || 'your trade',
        tradeSuffix: lead.trade ? ` for ${lead.trade}` : '',
        invitationCode: lead.invitationCode || '',
        signupLink: settings.signupLink,
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone || ''
      };
      const templateStr = settings.smsTemplates?.immediate || '';
      const body = templateStr.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) =>
        vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : ''
      );

      if (!lead.phone) {
        results.push({ leadId, status: 'SKIPPED', reason: 'missing_phone' });
        continue;
      }
      if (!body.trim()) {
        results.push({ leadId, status: 'SKIPPED', reason: 'missing_template' });
        continue;
      }

      try {
        console.log(`[META_SMS] Retry initial SMS for lead ${leadId}`);
        const twilioRes = await sendSms(lead.phone, body, { statusCallback: callbackUrl });
        console.log(`[META_SMS] Retry accepted SID=${twilioRes.sid} for lead ${leadId}`);

        lead.smsStatus = 'sent';
        lead.smsHistory.push({
          messageSid: twilioRes.sid,
          direction: 'outbound',
          status: twilioRes.status || 'queued',
          body,
          templateKey: 'immediate',
          sentAt: new Date(),
          updatedAt: new Date()
        });
        await lead.save();

        results.push({
          name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.email,
          leadId,
          status: 'SENT',
          twilioMessageSid: twilioRes.sid,
          twilioStatus: twilioRes.status || 'queued',
          statusCallback: callbackUrl
        });
      } catch (err) {
        console.error(`[META_SMS] Retry failed for lead ${leadId}: ${err.message}`);
        results.push({
          name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.email,
          leadId,
          status: 'FAILED',
          error: err.message
        });
      }
    }

    return res.json({ ok: true, results });
  }
);

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

