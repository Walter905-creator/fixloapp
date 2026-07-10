/**
 * FGE SMS Sender Service
 *
 * Wraps Twilio for SMS automation. Respects user SMS consent.
 * Degrades gracefully when Twilio credentials are not configured.
 *
 * NOTE: Uses the existing Twilio credentials already in the app's environment,
 * so no duplicate configuration is required.
 */

'use strict';

const TWILIO_AVAILABLE =
  !!(process.env.TWILIO_ACCOUNT_SID &&
     process.env.TWILIO_AUTH_TOKEN &&
     process.env.TWILIO_FROM_NUMBER);

let twilioClient = null;
if (TWILIO_AVAILABLE) {
  try {
    twilioClient = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  } catch (e) {
    console.warn('[FGE] Twilio init failed:', e.message);
  }
}

const FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || '';

/**
 * Send an SMS to a single recipient.
 * @param {object} opts
 * @param {string} opts.to          - E.164 phone number (e.g. +17045551234).
 * @param {string} opts.body        - Message text (max 1600 chars).
 * @param {boolean} [opts.hasConsent] - Whether the user has consented to SMS.
 * @returns {Promise<boolean>} true if sent.
 */
async function sendSms({ to, body, hasConsent = true }) {
  if (!twilioClient) {
    console.warn('[FGE SMS] Twilio not configured — SMS not sent to', to);
    return false;
  }

  if (!hasConsent) {
    console.warn('[FGE SMS] Skipping — no SMS consent for', to);
    return false;
  }

  if (!to || !to.startsWith('+')) {
    console.warn('[FGE SMS] Invalid phone number:', to);
    return false;
  }

  try {
    await twilioClient.messages.create({
      from: FROM_NUMBER,
      to,
      body,
    });
    return true;
  } catch (err) {
    console.error('[FGE SMS] Send failed:', err.message);
    throw err;
  }
}

/**
 * Send SMS to multiple recipients. Respects consent flag per entry.
 * @param {Array<{to:string, body:string, hasConsent?:boolean}>} messages
 * @returns {Promise<{sent:number, skipped:number, failed:number}>}
 */
async function sendBulkSms(messages) {
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const msg of messages) {
    try {
      const ok = await sendSms(msg);
      if (ok) sent++;
      else skipped++;
    } catch {
      failed++;
    }
  }

  return { sent, skipped, failed };
}

module.exports = {
  sendSms,
  sendBulkSms,
  isAvailable: TWILIO_AVAILABLE && !!twilioClient,
};
