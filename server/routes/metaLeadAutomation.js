const express = require('express');
const rateLimit = require('express-rate-limit');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const {
  getSettings,
  saveSettings,
  verifyMetaSignature,
  processMetaWebhookPayload,
  processMetaLead,
  processFollowUpCycle,
  reconcileLeadRegistrations,
  backfillFormLeads,
  getWebhookDiagnostics,
  handleTwilioStatusWebhook,
  handleTwilioInboundWebhook,
  handleSendGridEvents,
  listLeads,
  getLeadDetails,
  computeDashboardMetrics,
  performManualAction,
  importManualLead
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

  console.log('[META_WEBHOOK] Verification request received', { mode, hasToken: !!token, hasChallenge: !!challenge });

  if (mode === 'subscribe' && token && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    const safeChallenge = String(challenge || '').replace(/[<>]/g, '');
    console.log('[META_WEBHOOK] Verification succeeded');
    return res.status(200).type('text/plain').send(safeChallenge);
  }

  console.warn('[META_WEBHOOK] Verification failed', { mode, tokenMatch: token === process.env.META_WEBHOOK_VERIFY_TOKEN });
  return res.status(403).json({ ok: false, error: 'Webhook verification failed' });
});

router.post('/webhook/meta-leads', webhookRateLimit, async (req, res) => {
  console.log('[META_WEBHOOK] POST received');

  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
    const signature = req.headers['x-hub-signature-256'];

    if (!verifyMetaSignature(rawBody, signature)) {
      console.warn('[META_WEBHOOK] Signature validation failed');
      return res.status(401).json({ ok: false, error: 'Invalid Meta signature' });
    }

    const parsed = JSON.parse(rawBody.toString('utf8'));

    // ── Log the leadgen events found before any async work ──────────────
    const entries = Array.isArray(parsed?.entry) ? parsed.entry : [];
    const changes = entries.flatMap((e) => Array.isArray(e?.changes) ? e.changes : []);
    const leadgenChanges = changes.filter((c) => c?.field === 'leadgen');

    for (const change of leadgenChanges) {
      const pageId = change?.value?.page_id;
      const formId = change?.value?.form_id;
      const leadId = change?.value?.leadgen_id;
      console.log('[META_WEBHOOK] leadgen event found', { pageId, formId });
      console.log('[META_WEBHOOK] Lead ID', { leadId });
    }

    // ── Acknowledge Meta immediately — MUST respond within 5 seconds ────
    res.status(200).json({ ok: true, received: leadgenChanges.length });
    console.log('[META_WEBHOOK] Event acknowledged');

    // ── Process leads asynchronously after response ──────────────────────
    processMetaWebhookPayload(parsed).catch((err) => {
      console.error('[META_WEBHOOK] Async processing error', { message: err.message });
    });
  } catch (error) {
    // Only reached if the sync code above throws (e.g., JSON parse error)
    if (!res.headersSent) {
      return res.status(500).json({ ok: false, error: error.message });
    }
    console.error('[META_WEBHOOK] Uncaught sync error', { message: error.message });
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

// ── Manual single-lead import ────────────────────────────────────────────────
// Accepts a manually entered Meta lead (name, email, phone, trade, etc.) and
// runs it through the same processMetaLead pipeline as webhook-delivered leads.
router.post('/api/admin/meta-leads/import', requireAuth, requireAdmin, adminMutationRateLimit, async (req, res) => {
  try {
    const body = req.body || {};
    const metaLeadId = String(body.metaLeadId || '').trim();
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();
    const fullName = String(body.fullName || '').trim();
    const email = String(body.email || '').trim();
    const phone = String(body.phone || '').trim();
    const trade = String(body.trade || '').trim();
    const formId = String(body.formId || '').trim();

    if (!metaLeadId) {
      return res.status(400).json({ ok: false, error: 'metaLeadId is required' });
    }
    if (!email && !phone) {
      return res.status(400).json({ ok: false, error: 'At least one of email or phone is required' });
    }

    const result = await processMetaLead({
      source: 'manual_meta_import',
      metaLeadId,
      firstName,
      lastName,
      fullName: fullName || undefined,
      email,
      phone,
      trade,
      city: String(body.city || '').trim(),
      state: String(body.state || '').trim(),
      zipCode: String(body.zipCode || '').trim(),
      formId,
      submittedAt: body.submittedAt || null,
      manualImport: true,
      notes: 'Manually imported via admin endpoint'
    });

    if (result.skipped) {
      return res.status(409).json({ ok: false, skipped: true, reason: result.skippedReason, existingId: result.existingId || null });
    }

    return res.status(201).json({
      success: true,
      leadId: String(result.lead._id),
      collection: 'metaleads',
      inviteCodeCreated: !!result.invitationCode,
      invitationCode: result.invitationCode || null,
      sms: {
        attempted: !!result.smsResult,
        messageSid: result.smsResult?.sid || null,
        status: result.smsResult?.success ? 'queued' : result.smsResult?.reason || 'not_attempted'
      },
      email: {
        attempted: !!result.emailResult,
        messageId: result.emailResult?.messageId || null,
        status: result.emailResult?.success ? 'accepted' : result.emailResult?.reason || 'not_attempted'
      },
      followUpScheduled: result.lead?.followUp?.status === 'active'
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// ── Batch manual import ──────────────────────────────────────────────────────
router.post('/api/admin/meta-leads/import/batch', requireAuth, requireAdmin, adminMutationRateLimit, async (req, res) => {
  try {
    const leads = Array.isArray(req.body?.leads) ? req.body.leads : [];
    if (!leads.length) {
      return res.status(400).json({ ok: false, error: 'leads array is required and must not be empty' });
    }
    if (leads.length > 50) {
      return res.status(400).json({ ok: false, error: 'Batch size cannot exceed 50 leads' });
    }

    const results = [];
    for (const item of leads) {
      try {
        const metaLeadId = String(item.metaLeadId || '').trim();
        if (!metaLeadId) { results.push({ skipped: true, reason: 'missing metaLeadId' }); continue; }

        const result = await processMetaLead({
          source: 'manual_meta_import',
          metaLeadId,
          firstName: String(item.firstName || '').trim(),
          lastName: String(item.lastName || '').trim(),
          fullName: item.fullName ? String(item.fullName).trim() : undefined,
          email: String(item.email || '').trim(),
          phone: String(item.phone || '').trim(),
          trade: String(item.trade || '').trim(),
          city: String(item.city || '').trim(),
          state: String(item.state || '').trim(),
          zipCode: String(item.zipCode || '').trim(),
          formId: String(item.formId || '').trim(),
          submittedAt: item.submittedAt || null,
          manualImport: true,
          notes: 'Manually imported via admin batch endpoint'
        });

        results.push({
          metaLeadId,
          skipped: result.skipped,
          reason: result.skippedReason || null,
          leadId: result.lead ? String(result.lead._id) : null,
          invitationCode: result.invitationCode || null,
          smsAttempted: !!(result.smsResult),
          emailAttempted: !!(result.emailResult)
        });
      } catch (itemErr) {
        results.push({ metaLeadId: item.metaLeadId || '', failed: true, reason: itemErr.message });
      }
    }

    return res.json({
      ok: true,
      total: leads.length,
      imported: results.filter((r) => !r.skipped && !r.failed).length,
      skipped: results.filter((r) => r.skipped).length,
      failed: results.filter((r) => r.failed).length,
      results
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// ── Backfill by Meta Form ID ─────────────────────────────────────────────────
// Fetches recent leads directly from Meta for a given form_id and imports
// any that are not already in MongoDB.
router.post('/api/admin/meta-leads/backfill/form/:formId', requireAuth, requireAdmin, adminMutationRateLimit, async (req, res) => {
  try {
    const formId = String(req.params.formId || '').trim();
    const pageId = String(req.body?.pageId || process.env.META_PAGE_ID || '').trim();
    const limit = Number(req.body?.limit || 50);

    if (!formId) return res.status(400).json({ ok: false, error: 'formId is required' });
    if (!pageId) return res.status(400).json({ ok: false, error: 'pageId is required (pass in body or set META_PAGE_ID env var)' });

    const report = await backfillFormLeads(formId, pageId, { limit });
    return res.json({ ok: true, report });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// ── Single-lead recovery ─────────────────────────────────────────────────────
// Accepts either a metaLeadId (to fetch from Meta Graph API) or full lead data
// for a manual recovery insert.
router.post('/api/admin/meta-leads/recover', requireAuth, requireAdmin, adminMutationRateLimit, async (req, res) => {
  try {
    const body = req.body || {};
    const metaLeadIdRaw = String(body.metaLeadId || '').trim();

    let result;

    // If given a numeric Meta lead ID, fetch the full data from Meta first
    if (metaLeadIdRaw && /^\d{5,40}$/.test(metaLeadIdRaw)) {
      const pageId = String(body.pageId || process.env.META_PAGE_ID || '').trim();
      if (!pageId) return res.status(400).json({ ok: false, error: 'pageId is required to fetch from Meta API' });

      const formIdForBackfill = String(body.formId || '').trim();
      if (!formIdForBackfill) return res.status(400).json({ ok: false, error: 'formId is required when recovering a numeric Meta lead ID' });

      // Use internal backfill flow to fetch single lead
      const report = await backfillFormLeads(formIdForBackfill, pageId, { limit: 1 });
      const found = report.results.find((r) => r.metaLeadId === metaLeadIdRaw);
      if (found) {
        result = {
          skipped: found.skipped,
          skippedReason: found.reason || null,
          lead: found.mongoId ? { _id: found.mongoId } : null,
          invitationCode: found.invitationCode,
          smsResult: found.sms,
          emailResult: found.email
        };
      } else {
        // Single-ID recovery path: treat as manual import with known fields
        result = await processMetaLead({
          source: 'manual_meta_import',
          metaLeadId: metaLeadIdRaw,
          firstName: String(body.firstName || '').trim(),
          lastName: String(body.lastName || '').trim(),
          fullName: body.fullName ? String(body.fullName).trim() : undefined,
          email: String(body.email || '').trim(),
          phone: String(body.phone || '').trim(),
          trade: String(body.trade || '').trim(),
          city: String(body.city || '').trim(),
          state: String(body.state || '').trim(),
          zipCode: String(body.zipCode || '').trim(),
          formId: String(body.formId || '').trim(),
          submittedAt: body.submittedAt || null,
          manualImport: true,
          notes: 'Recovered via admin recovery endpoint'
        });
      }
    } else {
      // No numeric metaLeadId — treat as purely manual recovery
      if (!metaLeadIdRaw) return res.status(400).json({ ok: false, error: 'metaLeadId is required' });

      result = await processMetaLead({
        source: 'manual_meta_import',
        metaLeadId: metaLeadIdRaw,
        firstName: String(body.firstName || '').trim(),
        lastName: String(body.lastName || '').trim(),
        fullName: body.fullName ? String(body.fullName).trim() : undefined,
        email: String(body.email || '').trim(),
        phone: String(body.phone || '').trim(),
        trade: String(body.trade || '').trim(),
        city: String(body.city || '').trim(),
        state: String(body.state || '').trim(),
        zipCode: String(body.zipCode || '').trim(),
        formId: String(body.formId || '').trim(),
        submittedAt: body.submittedAt || null,
        manualImport: true,
        notes: 'Recovered via admin recovery endpoint'
      });
    }

    if (result.skipped) {
      return res.status(409).json({ ok: false, skipped: true, reason: result.skippedReason, existingId: result.existingId || null });
    }

    return res.status(201).json({
      success: true,
      leadId: result.lead ? String(result.lead._id) : null,
      collection: 'metaleads',
      inviteCodeCreated: !!result.invitationCode,
      sms: {
        attempted: !!(result.smsResult),
        messageSid: result.smsResult?.sid || null,
        status: result.smsResult?.success ? 'queued' : result.smsResult?.reason || 'not_attempted'
      },
      email: {
        attempted: !!(result.emailResult),
        messageId: result.emailResult?.messageId || null,
        status: result.emailResult?.success ? 'accepted' : result.emailResult?.reason || 'not_attempted'
      },
      followUpScheduled: result.lead?.followUp?.status === 'active'
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// ── Meta Lead Diagnostics ────────────────────────────────────────────────────
router.get('/api/admin/meta-leads/diagnostics', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const diagnostics = await getWebhookDiagnostics();
    return res.json({ ok: true, diagnostics });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;
