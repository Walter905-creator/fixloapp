const express = require('express');
const rateLimit = require('express-rate-limit');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const {
  CANONICAL_PRO_SIGNUP_URL,
  FULL_RECONCILIATION_FORM_ID,
  getStatusCallbackUrl,
  getSettings,
  saveSettings,
  verifyMetaSignature,
  processMetaWebhookPayload,
  processFollowUpCycle,
  reconcileLeadRegistrations,
  validateTwilioSignature,
  handleTwilioStatusWebhook,
  handleTwilioInboundWebhook,
  handleSendGridEvents,
  listLeads,
  auditMetaLeadChannelCoverage,
  getLeadDetails,
  computeDashboardMetrics,
  performManualAction,
  recoverHistoricalMetaLeadsByForm,
  saveWebhookEvent,
  markWebhookEventProcessed,
  markWebhookEventFailed,
  performFullMetaReconciliation,
  getLastReconciliationRun
} = require('../services/metaLeadAutomationService');

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

// ── Webhook routes (no auth — carry their own cryptographic origin proof) ────

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
  // Persist the raw payload to MongoDB FIRST so a server restart cannot lose a
  // lead.  The 200 response is returned immediately after signature verification;
  // processing then continues asynchronously.
  let eventDoc = null;
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
    const signature = req.headers['x-hub-signature-256'] || '';

    if (!verifyMetaSignature(rawBody, signature)) {
      return res.status(401).json({ ok: false, error: 'Invalid Meta signature' });
    }

    const parsed = JSON.parse(rawBody.toString('utf8'));

    // Write durable event record before any processing.
    eventDoc = await saveWebhookEvent(parsed, signature);

    // Return 200 immediately — Meta does not wait for processing.
    res.status(200).json({ ok: true });

    // Process asynchronously so a slow/failing pipeline cannot block the response.
    setImmediate(async () => {
      try {
        const result = await processMetaWebhookPayload(parsed);
        await markWebhookEventProcessed(eventDoc?._id, result);
      } catch (asyncError) {
        console.error(`[META_WEBHOOK] Async processing failed: ${asyncError.message}`);
        await markWebhookEventFailed(eventDoc?._id, asyncError.message);
      }
    });
  } catch (error) {
    if (eventDoc?._id) await markWebhookEventFailed(eventDoc._id, error.message);
    // Only send an error response if we haven't already responded.
    if (!res.headersSent) {
      return res.status(500).json({ ok: false, error: error.message });
    }
  }
});


router.post('/webhook/twilio/meta-leads/status', webhookRateLimit, express.urlencoded({ extended: false }), async (req, res) => {
  // Validate Twilio signature to reject spoofed requests.
  const configuredCallbackUrl = getStatusCallbackUrl();
  const requestUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  if (configuredCallbackUrl && configuredCallbackUrl !== requestUrl) {
    return res.status(403).type('text/plain').send('forbidden');
  }
  if (!validateTwilioSignature({ signature: req.headers['x-twilio-signature'] || '', url: requestUrl, params: req.body || {} })) {
    return res.status(403).type('text/plain').send('forbidden');
  }
  try {
    await handleTwilioStatusWebhook(req.body || {});
  } catch (error) {
    console.error(`[META_SMS] Status webhook processing failed: ${error.message}`);
  }
  return res.status(200).type('text/plain').send('ok');
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

// ── Admin sub-router ─────────────────────────────────────────────────────────
//
// All routes in this group require a valid admin JWT (same middleware chain as
// GET /api/admin/pros via admin.js).  Mounted at /api/admin/meta-leads so the
// outer router (which has no path prefix in index.js) sees the full path and
// passes /api/admin/meta-leads/* to this sub-router.
const adminRouter = express.Router();
adminRouter.use(requireAuth);
adminRouter.use(requireAdmin);

// GET /api/admin/meta-leads/settings
adminRouter.get('/settings', async (_req, res) => {
  try {
    const settings = await getSettings();
    return res.json({ ok: true, settings });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/admin/meta-leads/settings
adminRouter.post('/settings', adminMutationRateLimit, async (req, res) => {
  try {
    const settings = await saveSettings(req.body || {});
    return res.json({ ok: true, settings });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/admin/meta-leads/dashboard
adminRouter.get('/dashboard', async (_req, res) => {
  try {
    const [metrics, settings] = await Promise.all([computeDashboardMetrics(), getSettings()]);
    return res.json({ ok: true, metrics, settings });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/admin/meta-leads/jobs/followups/run
adminRouter.post('/jobs/followups/run', adminMutationRateLimit, async (_req, res) => {
  try {
    const result = await processFollowUpCycle();
    return res.json({ ok: true, result });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/admin/meta-leads/jobs/reconcile/run
adminRouter.post('/jobs/reconcile/run', adminMutationRateLimit, async (_req, res) => {
  try {
    const result = await reconcileLeadRegistrations();
    return res.json({ ok: true, result });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/admin/meta-leads/jobs/meta-reconcile/run
// Full production reconciliation — fetches every available Meta lead for the
// configured form, compares against MongoDB, imports missing, completes
// incomplete.  Idempotent and safe to trigger manually.
adminRouter.post('/jobs/meta-reconcile/run', adminMutationRateLimit, async (req, res) => {
  try {
    const formId = String(req.body?.formId || FULL_RECONCILIATION_FORM_ID).trim();
    const result = await performFullMetaReconciliation({ formId, triggeredBy: 'admin' });
    return res.json({ ok: true, result });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/admin/meta-leads/reconciliation/last
// Returns the most recent full reconciliation run and the next scheduled time.
adminRouter.get('/reconciliation/last', async (req, res) => {
  try {
    const formId = String(req.query?.formId || FULL_RECONCILIATION_FORM_ID).trim();
    const data = await getLastReconciliationRun(formId);
    return res.json({ ok: true, ...data });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/admin/meta-leads  (list)
adminRouter.get('/', async (req, res) => {
  try {
    const data = await listLeads(req.query || {});
    return res.json({ ok: true, ...data });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/admin/meta-leads/audit/contact-channels
adminRouter.get('/audit/contact-channels', async (req, res) => {
  try {
    const limit = Number(req.query?.limit || 500);
    const report = await auditMetaLeadChannelCoverage(limit);
    return res.json({ ok: true, ...report });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/admin/meta-leads/recover-historical
adminRouter.post('/recover-historical', adminMutationRateLimit, async (req, res) => {
  const formId = String(req.body?.formId || '').trim();
  const leads = Array.isArray(req.body?.leads) ? req.body.leads : [];

  if (!formId) {
    return res.status(400).json({ ok: false, error: 'formId is required' });
  }
  if (!leads.length) {
    return res.status(400).json({ ok: false, error: 'leads array is required' });
  }

  try {
    await saveSettings({ signupLink: CANONICAL_PRO_SIGNUP_URL });
    const report = await recoverHistoricalMetaLeadsByForm({ formId, targets: leads });
    return res.json({ ok: true, report });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/admin/meta-leads/:id  (must come after all fixed-path GET routes)
adminRouter.get('/:id', async (req, res) => {
  try {
    const data = await getLeadDetails(req.params.id);
    if (!data) return res.status(404).json({ ok: false, error: 'Lead not found' });
    return res.json({ ok: true, ...data });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/admin/meta-leads/:id/actions/:action  (must come after all fixed-path POST routes)
adminRouter.post('/:id/actions/:action', adminMutationRateLimit, async (req, res) => {
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

// Mount the admin sub-router.  The outer router has no path prefix in index.js
// so it sees full paths; /api/admin/meta-leads is stripped before adminRouter.
router.use('/api/admin/meta-leads', adminRouter);

module.exports = router;

