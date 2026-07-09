/**
 * FGE Admin Settings Routes
 * GET  /api/fge/settings          – get current settings (keys masked)
 * PUT  /api/fge/settings          – update settings
 * POST /api/fge/settings/test/:service – test a service connection
 *
 * Stores API keys in the existing AdminSettings model so they are
 * shared with the rest of the application.
 */

'use strict';

const router = require('express').Router();
const requireAuth = require('../../../middleware/requireAuth');
const requireAdmin = require('../../../middleware/requireAdmin');
const AdminSettings = require('../../../models/AdminSettings');

router.use(requireAuth, requireAdmin);

// ─── Key mask helper ──────────────────────────────────────────────────────────

function maskKey(value) {
  if (!value || value.length < 8) return value ? '***' : '';
  return value.slice(0, 4) + '*'.repeat(value.length - 8) + value.slice(-4);
}

function maskSettings(settings) {
  if (!settings) return {};
  const masked = { ...settings };
  const sensitiveFields = [
    'openaiApiKey', 'sendgridApiKey', 'twilioAuthToken',
    'stripeSecretKey', 'cloudinaryApiSecret', 'googleAnalyticsSecret',
    'googleSearchConsoleSecret',
  ];
  for (const field of sensitiveFields) {
    if (masked[field]) masked[field] = maskKey(masked[field]);
  }
  return masked;
}

// ─── Get settings ─────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const settings = await AdminSettings.findOne().lean();
    return res.json({ ok: true, settings: maskSettings(settings || {}) });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Update settings ──────────────────────────────────────────────────────────

/**
 * Returns true if a string value is a masked placeholder (e.g. "••••••••1234" or "****").
 * These are sent back from the GET endpoint to avoid exposing secrets; we skip them on save.
 */
function isMaskedValue(value) {
  if (typeof value !== 'string') return false;
  // A masked value has its middle characters replaced with 3+ asterisks
  return /^\*{3,}$/.test(value.replace(/^.{4}/, '').replace(/.{4}$/, ''));
}

router.put('/', async (req, res) => {
  try {
    const BLOCKED = new Set(['__proto__', 'constructor', 'prototype']);
    // Build a clean update object: skip masked placeholders and operator keys
    const updates = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (key.startsWith('$') || BLOCKED.has(key)) continue;
      if (isMaskedValue(value)) continue; // skip masked values — retain existing secret
      updates[key] = value;
    }

    const settings = await AdminSettings.findOneAndUpdate({}, { $set: updates }, {
      upsert: true,
      new: true,
    });

    return res.json({ ok: true, settings: maskSettings(settings) });
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message });
  }
});

// ─── Test connections ─────────────────────────────────────────────────────────

router.post('/test/:service', async (req, res) => {
  try {
    const { service } = req.params;
    let result = { ok: false, message: 'Service not supported.' };

    switch (service) {
      case 'openai': {
        if (!process.env.OPENAI_API_KEY) {
          result = { ok: false, message: 'OPENAI_API_KEY not set.' };
          break;
        }
        const OpenAI = require('openai');
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        await client.models.list();
        result = { ok: true, message: 'OpenAI connection successful.' };
        break;
      }
      case 'sendgrid': {
        result = process.env.SENDGRID_API_KEY
          ? { ok: true, message: 'SendGrid API key is set.' }
          : { ok: false, message: 'SENDGRID_API_KEY not set.' };
        break;
      }
      case 'twilio': {
        result =
          process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
            ? { ok: true, message: 'Twilio credentials are set.' }
            : { ok: false, message: 'Twilio credentials not set.' };
        break;
      }
      case 'stripe': {
        result = process.env.STRIPE_SECRET_KEY
          ? { ok: true, message: 'Stripe key is set.' }
          : { ok: false, message: 'STRIPE_SECRET_KEY not set.' };
        break;
      }
      case 'cloudinary': {
        result =
          process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY
            ? { ok: true, message: 'Cloudinary credentials are set.' }
            : { ok: false, message: 'Cloudinary credentials not set.' };
        break;
      }
      default:
        result = { ok: false, message: `Unknown service: ${service}` };
    }

    return res.json({ ok: result.ok, ...result });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
