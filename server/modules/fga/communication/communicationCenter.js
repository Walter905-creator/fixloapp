'use strict';

/**
 * FGA Communication Center
 *
 * Single unified layer for all outbound messages.
 * Supports: Email (SendGrid) and SMS (Twilio).
 * Designed for easy expansion to Push, WhatsApp, and Voice.
 *
 * Every message sent through this center is persisted to FGAMessage
 * and a timeline entry is appended to the lead (if leadId is supplied).
 *
 * Usage:
 *   const comm = require('./communicationCenter');
 *   await comm.sendEmail({ to, subject, html, leadId, triggerEvent });
 *   await comm.sendSms({ to, body, leadId, triggerEvent });
 */

const FGAMessage = require('../models/FGAMessage');
const eventBus   = require('../events/eventBus');
const FGA_EVENTS = require('../events/eventTypes');

// ── SendGrid ─────────────────────────────────────────────────────────────────
let _sgMail = null;
function _getSgMail() {
  if (!_sgMail) {
    if (!process.env.SENDGRID_API_KEY) return null;
    _sgMail = require('@sendgrid/mail');
    _sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }
  return _sgMail;
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@fixloapp.com';

// ── Twilio ────────────────────────────────────────────────────────────────────
let _twilioClient = null;
function _getTwilioClient() {
  if (!_twilioClient) {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return null;
    _twilioClient = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return _twilioClient;
}

// Max retry attempts for send operations
const MAX_SEND_ATTEMPTS = 2;
const FROM_PHONE = process.env.TWILIO_FROM_NUMBER;



/**
 * Persist a message record and publish the appropriate FGA event.
 */
async function _log(fields) {
  try {
    const msg = await FGAMessage.create(fields);
    return msg;
  } catch (err) {
    console.error('[FGA:CommCenter] ❌ Failed to log message:', err.message);
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send an email via SendGrid.
 *
 * @param {object} opts
 * @param {string}  opts.to              - Recipient email address
 * @param {string}  opts.subject         - Email subject
 * @param {string}  opts.html            - HTML body
 * @param {string}  [opts.text]          - Optional plain-text fallback
 * @param {string}  [opts.from]          - Override sender address
 * @param {*}       [opts.leadId]        - FGALead._id for timeline linking
 * @param {string}  [opts.triggerEvent]  - FGA event name that triggered this
 * @param {string}  [opts.recipientType] - 'homeowner'|'professional'|'recruiter'|'owner'
 * @param {*}       [opts.recipientId]   - Mongoose ObjectId of the recipient
 * @param {object}  [opts.metadata]      - Extra fields stored on FGAMessage
 * @returns {Promise<FGAMessage>}
 */
async function sendEmail(opts = {}) {
  const { to, subject, html, text, from, leadId, triggerEvent, recipientType, recipientId, metadata } = opts;

  const logEntry = {
    channel: 'email',
    recipientType: recipientType || 'other',
    recipientId:   recipientId   || null,
    recipientAddress: to,
    subject: subject || '',
    body:    html || text || '',
    provider: 'sendgrid',
    triggerEvent: triggerEvent || '',
    leadId: leadId || null,
    metadata: metadata || {},
    status: 'queued',
  };

  const sg = _getSgMail();
  if (!sg) {
    logEntry.status = 'failed';
    logEntry.errorMessage = 'SendGrid not configured (SENDGRID_API_KEY missing)';
    console.warn('[FGA:CommCenter] ⚠️ SendGrid not configured — email skipped');
    return _log(logEntry);
  }

  if (!to) {
    logEntry.status = 'failed';
    logEntry.errorMessage = 'Recipient email address is required';
    return _log(logEntry);
  }

  const msg = {
    to,
    from: from || FROM_EMAIL,
    subject: subject || '(no subject)',
    html:    html    || '',
  };
  if (text) msg.text = text;

  for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt++) {
    try {
      const [response] = await sg.send(msg);
      logEntry.status = 'sent';
      logEntry.sentAt = new Date();
      logEntry.providerMessageId = (response.headers && response.headers['x-message-id']) || '';
      console.log(`[FGA:CommCenter] ✅ Email sent to ${to} (attempt ${attempt})`);
      break;
    } catch (err) {
      if (attempt < MAX_SEND_ATTEMPTS) {
        console.warn(`[FGA:CommCenter] ⚠️ Email failed (attempt ${attempt}), retrying:`, err.message);
      } else {
        logEntry.status = 'failed';
        logEntry.errorMessage = err.message;
        console.error('[FGA:CommCenter] ❌ Email failed after retry:', err.message);
      }
    }
  }

  const record = await _log(logEntry);

  // Publish event
  await eventBus.publish(FGA_EVENTS.EMAIL_SENT, { to, subject, leadId, recordId: record?._id });

  return record;
}

/**
 * Send an SMS via Twilio.
 *
 * @param {object} opts
 * @param {string}  opts.to              - Recipient phone (E.164 format preferred)
 * @param {string}  opts.body            - SMS message body
 * @param {*}       [opts.leadId]        - FGALead._id for timeline linking
 * @param {string}  [opts.triggerEvent]  - FGA event that triggered this
 * @param {string}  [opts.recipientType] - 'homeowner'|'professional'|'recruiter'|'owner'
 * @param {*}       [opts.recipientId]   - Mongoose ObjectId of the recipient
 * @param {object}  [opts.metadata]      - Extra fields stored on FGAMessage
 * @returns {Promise<FGAMessage>}
 */
async function sendSms(opts = {}) {
  const { to, body, leadId, triggerEvent, recipientType, recipientId, metadata } = opts;

  const logEntry = {
    channel: 'sms',
    recipientType: recipientType || 'other',
    recipientId:   recipientId   || null,
    recipientAddress: to,
    subject: '',
    body:    body || '',
    provider: 'twilio',
    triggerEvent: triggerEvent || '',
    leadId: leadId || null,
    metadata: metadata || {},
    status: 'queued',
  };

  const twilio = _getTwilioClient();
  if (!twilio) {
    logEntry.status = 'failed';
    logEntry.errorMessage = 'Twilio not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN missing)';
    console.warn('[FGA:CommCenter] ⚠️ Twilio not configured — SMS skipped');
    return _log(logEntry);
  }

  if (!to || !body) {
    logEntry.status = 'failed';
    logEntry.errorMessage = 'Recipient phone and message body are required';
    return _log(logEntry);
  }

  if (!FROM_PHONE) {
    logEntry.status = 'failed';
    logEntry.errorMessage = 'TWILIO_FROM_NUMBER not configured';
    return _log(logEntry);
  }

  for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt++) {
    try {
      const message = await twilio.messages.create({ to, from: FROM_PHONE, body });
      logEntry.status = 'sent';
      logEntry.sentAt = new Date();
      logEntry.providerMessageId = message.sid;
      console.log(`[FGA:CommCenter] ✅ SMS sent to ${to} (sid: ${message.sid}, attempt ${attempt})`);
      break;
    } catch (err) {
      if (attempt < MAX_SEND_ATTEMPTS) {
        console.warn(`[FGA:CommCenter] ⚠️ SMS failed (attempt ${attempt}), retrying:`, err.message);
      } else {
        logEntry.status = 'failed';
        logEntry.errorMessage = err.message;
        console.error('[FGA:CommCenter] ❌ SMS failed after retry:', err.message);
      }
    }
  }

  const record = await _log(logEntry);

  const evtType = logEntry.status === 'sent' ? FGA_EVENTS.SMS_SENT : FGA_EVENTS.SMS_FAILED;
  await eventBus.publish(evtType, { to, leadId, recordId: record?._id });

  return record;
}

module.exports = { sendEmail, sendSms };
