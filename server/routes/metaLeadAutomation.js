const express = require('express');
const rateLimit = require('express-rate-limit');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const { verify } = require('../utils/jwt');
const {
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
  getLeadDetails,
  computeDashboardMetrics,
  performManualAction,
  retryFailedInitialMetaLeadSmsBatch
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

// ── Diagnostic middleware for Meta Leads admin routes ─────────────────────────
//
// Logs the full authentication state when an admin route is entered so that
// any future auth regression can be traced without touching production code.
// Remove or gate behind NODE_ENV once the auth path is stable.
//
// NOTE: This middleware intentionally verifies the JWT independently of
// requireAuth so it can report the decoded payload even if requireAuth later
// rejects the request.  The extra verification is acceptable overhead for a
// diagnostic helper.
function metaAuthDiag(req, _res, next) {
  const hasAuthHeader = !!(req.headers.authorization);
  const raw = req.headers.authorization || '';
  const hasBearerPrefix = raw.startsWith('Bearer ');
  // Slice only to check presence — the token value is never logged.
  const token = hasBearerPrefix ? raw.slice(7) : null;
  let jwtOk = false;
  let decoded = null;
  if (token) {
    try {
      decoded = verify(token);
      jwtOk = true;
    } catch (err) {
      // JWT is invalid or expired; requireAuth will send the 401 response.
      console.log(`[META_AUTH] JWT decode error: ${err.message}`);
    }
  }
  console.log('[META_AUTH] route entered');
  console.log(`[META_AUTH] authorization header present: ${hasAuthHeader ? 'yes' : 'no'}`);
  console.log(`[META_AUTH] bearer token parsed: ${hasBearerPrefix ? 'yes' : 'no'}`);
  console.log(`[META_AUTH] JWT verified: ${jwtOk ? 'yes' : 'no'}`);
  console.log(`[META_AUTH] decoded role: ${decoded?.role ?? '(none)'}`);
  console.log(`[META_AUTH] decoded isAdmin: ${decoded?.isAdmin ?? '(none)'}`);
  console.log(`[META_AUTH] req.user present: ${req.user ? 'yes' : 'no'}`);
  console.log(`[META_AUTH] req.admin present: ${req.admin ? 'yes' : 'no'}`);
  next();
}

// ── Admin sub-router ─────────────────────────────────────────────────────────
//
// All routes in this group require a valid admin JWT (same middleware chain as
// GET /api/admin/pros via admin.js).  Mounted at /api/admin/meta-leads so the
// outer router (which has no path prefix in index.js) sees the full path and
// passes /api/admin/meta-leads/* to this sub-router.
const adminRouter = express.Router();
adminRouter.use(metaAuthDiag);
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

// GET /api/admin/meta-leads  (list)
adminRouter.get('/', async (req, res) => {
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
adminRouter.post(
  '/retry-failed-initial-sms-20260719',
  adminMutationRateLimit,
  async (_req, res) => {
    const TARGET_IDS = [
      '6a5f4c298a89f5ec882f359c',
      '6a5f4c2b8a89f5ec882f35b2',
      '6a5f4c2c8a89f5ec882f35c8'
    ];

    try {
      const results = await retryFailedInitialMetaLeadSmsBatch({ targetIds: TARGET_IDS });
      return res.json({ ok: true, results });
    } catch (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }
  }
);

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
