/**
 * sendOwnerAlert — Reusable owner SMS notification helper
 *
 * Sends an SMS alert to the Fixlo owner phone for key business events:
 *   - recruiter_signup: A new recruiter signed up
 *   - pro_signup:       A new pro signed up
 *   - new_lead:         A new homeowner lead/service request was submitted
 *
 * Behavior:
 *   - Only sends in production OR when ENABLE_OWNER_SMS_ALERTS=true
 *   - Logs every attempt (sent / failed / skipped) to OwnerAlertLog
 *   - If env vars are missing, logs a warning and returns without crashing
 *   - Prevents duplicate alerts via idempotency key
 *   - Never blocks the caller — always wraps in try/catch
 *   - Never exposes Twilio credentials to frontend
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_PHONE_NUMBER   (or TWILIO_PHONE for legacy compat)
 *   OWNER_PHONE_NUMBER
 *
 * Optional:
 *   ENABLE_OWNER_SMS_ALERTS=true  (enables sending outside production)
 */

const { getTwilioClient } = require('./twilio');

// Lazy require to avoid circular dependencies
function getOwnerAlertLog() {
  return require('../models/OwnerAlertLog');
}

/**
 * Build SMS message text for each event type.
 *
 * @param {string} type - 'recruiter_signup' | 'pro_signup' | 'new_lead'
 * @param {object} data - Event-specific data fields
 * @returns {string} Formatted SMS body
 */
function buildMessage(type, data) {
  switch (type) {
    case 'recruiter_signup':
      return (
        `Fixlo Alert: New recruiter signed up. ` +
        `Name: ${data.name || 'Unknown'}. ` +
        `Phone: ${data.phone || 'N/A'}. ` +
        `Source: ${data.source || 'direct'}.`
      );

    case 'pro_signup':
      return (
        `Fixlo Alert: New pro signed up. ` +
        `Name: ${data.name || 'Unknown'}. ` +
        `Trade: ${data.trade || 'N/A'}. ` +
        `Location: ${data.location || 'N/A'}. ` +
        `Phone: ${data.phone || 'N/A'}.`
      );

    case 'new_lead':
      return (
        `Fixlo Alert: New homeowner lead. ` +
        `Service: ${data.service || 'N/A'}. ` +
        `Location: ${data.location || 'N/A'}. ` +
        `Customer: ${data.name || 'Unknown'}. ` +
        `Phone: ${data.phone || 'N/A'}.`
      );

    default:
      return `Fixlo Alert: Event type "${type}" occurred.`;
  }
}

/**
 * Send an SMS alert to the Fixlo owner.
 *
 * @param {string} type    - Alert type: 'recruiter_signup' | 'pro_signup' | 'new_lead'
 * @param {object} data    - Event data used to build the SMS body
 * @param {string} [idempotencyKey] - Optional unique key to prevent duplicate sends
 * @returns {Promise<void>}  Always resolves; never throws
 */
async function sendOwnerAlert(type, data, idempotencyKey) {
  // ── Guard: only send in production or when explicitly enabled ────────────────
  const isProduction = process.env.NODE_ENV === 'production';
  const isExplicitlyEnabled = process.env.ENABLE_OWNER_SMS_ALERTS === 'true';

  if (!isProduction && !isExplicitlyEnabled) {
    console.log(`[OwnerAlert] Skipped (not production, ENABLE_OWNER_SMS_ALERTS not set) — type: ${type}`);
    return;
  }

  // ── Guard: required env vars ─────────────────────────────────────────────────
  const ownerPhone = process.env.OWNER_PHONE_NUMBER;
  const fromPhone =
    process.env.TWILIO_PHONE_NUMBER ||
    process.env.TWILIO_PHONE ||
    process.env.TWILIO_FROM_NUMBER;

  if (!ownerPhone) {
    console.warn('[OwnerAlert] ⚠️ OWNER_PHONE_NUMBER not set — skipping owner alert');
    return;
  }

  if (!fromPhone) {
    console.warn('[OwnerAlert] ⚠️ TWILIO_PHONE_NUMBER not set — skipping owner alert');
    return;
  }

  const cli = getTwilioClient();
  if (!cli) {
    console.warn('[OwnerAlert] ⚠️ Twilio client not initialized (missing credentials) — skipping owner alert');
    return;
  }

  const message = buildMessage(type, data);

  // ── Guard: idempotency check ─────────────────────────────────────────────────
  if (idempotencyKey) {
    try {
      const OwnerAlertLog = getOwnerAlertLog();
      const existing = await OwnerAlertLog.findOne({ idempotencyKey });
      if (existing) {
        console.log(`[OwnerAlert] Duplicate prevented — idempotencyKey already used: ${idempotencyKey}`);
        return;
      }
    } catch (dbErr) {
      // Non-fatal: proceed even if DB check fails
      console.warn('[OwnerAlert] ⚠️ Could not check idempotency (DB error):', dbErr.message);
    }
  }

  // ── Send SMS ─────────────────────────────────────────────────────────────────
  try {
    const result = await cli.messages.create({
      to: ownerPhone,
      from: fromPhone,
      body: message
    });

    console.log(`[OwnerAlert] ✅ Sent — type: ${type}, SID: ${result.sid}`);

    // Log to DB (non-fatal if DB is unavailable)
    try {
      const OwnerAlertLog = getOwnerAlertLog();
      await OwnerAlertLog.create({
        type,
        message,
        recipientPhone: ownerPhone,
        twilioMessageSid: result.sid,
        status: 'sent',
        idempotencyKey: idempotencyKey || undefined
      });
    } catch (logErr) {
      console.warn('[OwnerAlert] ⚠️ Could not save alert log:', logErr.message);
    }
  } catch (smsErr) {
    console.error(`[OwnerAlert] ❌ SMS failed — type: ${type}, error: ${smsErr.message}`);

    // Log failure to DB (non-fatal)
    try {
      const OwnerAlertLog = getOwnerAlertLog();
      await OwnerAlertLog.create({
        type,
        message,
        recipientPhone: ownerPhone,
        twilioMessageSid: null,
        status: 'failed',
        errorMessage: smsErr.message,
        idempotencyKey: idempotencyKey || undefined
      });
    } catch (logErr) {
      console.warn('[OwnerAlert] ⚠️ Could not save failure log:', logErr.message);
    }
  }
}

module.exports = { sendOwnerAlert };
