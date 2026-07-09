/**
 * FGE Email Sender Service
 *
 * Wraps SendGrid for transactional and marketing email delivery.
 * Degrades gracefully when SENDGRID_API_KEY is not configured.
 */

'use strict';

const SENDGRID_AVAILABLE = !!process.env.SENDGRID_API_KEY;

let sgMail = null;
if (SENDGRID_AVAILABLE) {
  try {
    sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  } catch (e) {
    console.warn('[FGE] SendGrid init failed:', e.message);
  }
}

const DEFAULT_FROM = process.env.FGE_EMAIL_FROM || 'hello@fixloapp.com';
const DEFAULT_FROM_NAME = process.env.FGE_EMAIL_FROM_NAME || 'Fixlo';

/**
 * Send a single email.
 * @param {object} opts
 * @param {string}   opts.to           - Recipient email.
 * @param {string}   opts.subject      - Email subject.
 * @param {string}   [opts.html]       - HTML body.
 * @param {string}   [opts.text]       - Plain text body.
 * @param {string}   [opts.fromEmail]  - Override sender address.
 * @param {string}   [opts.fromName]   - Override sender name.
 * @param {string}   [opts.templateId] - SendGrid dynamic template ID.
 * @param {object}   [opts.templateData] - Template variable substitution data.
 * @returns {Promise<boolean>} true if sent, false if SendGrid unavailable.
 */
async function sendEmail({ to, subject, html, text, fromEmail, fromName, templateId, templateData }) {
  if (!sgMail) {
    console.warn('[FGE Email] SendGrid not configured — email not sent to', to);
    return false;
  }

  const msg = {
    to,
    from: { email: fromEmail || DEFAULT_FROM, name: fromName || DEFAULT_FROM_NAME },
    subject,
  };

  if (templateId) {
    msg.templateId = templateId;
    if (templateData) msg.dynamicTemplateData = templateData;
  } else {
    if (html) msg.html = html;
    if (text) msg.text = text;
  }

  try {
    await sgMail.send(msg);
    return true;
  } catch (err) {
    console.error('[FGE Email] Send failed:', err?.response?.body || err.message);
    throw err;
  }
}

/**
 * Send a bulk email campaign to a list of recipients.
 * Uses SendGrid's personalizations for efficient delivery.
 * @param {string[]} recipients - Array of email addresses.
 * @param {object} msgOpts      - Same options as sendEmail (minus `to`).
 * @returns {Promise<{sent:number, failed:number}>}
 */
async function sendBulkEmail(recipients, msgOpts) {
  if (!sgMail) {
    console.warn('[FGE Email] SendGrid not configured — bulk email not sent.');
    return { sent: 0, failed: recipients.length };
  }

  // SendGrid supports up to 1000 personalizations per request
  const CHUNK_SIZE = 1000;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
    const chunk = recipients.slice(i, i + CHUNK_SIZE);
    const personalizations = chunk.map((email) => ({ to: [{ email }] }));

    const msg = {
      personalizations,
      from: {
        email: msgOpts.fromEmail || DEFAULT_FROM,
        name: msgOpts.fromName || DEFAULT_FROM_NAME,
      },
      subject: msgOpts.subject,
    };

    if (msgOpts.templateId) {
      msg.templateId = msgOpts.templateId;
      if (msgOpts.templateData) msg.dynamicTemplateData = msgOpts.templateData;
    } else {
      if (msgOpts.html) msg.html = msgOpts.html;
      if (msgOpts.text) msg.text = msgOpts.text;
    }

    try {
      await sgMail.send(msg);
      sent += chunk.length;
    } catch (err) {
      console.error('[FGE Email] Bulk chunk failed:', err?.response?.body || err.message);
      failed += chunk.length;
    }
  }

  return { sent, failed };
}

module.exports = {
  sendEmail,
  sendBulkEmail,
  isAvailable: SENDGRID_AVAILABLE && !!sgMail,
};
