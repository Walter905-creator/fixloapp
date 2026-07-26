/**
 * homeownerFollowUpService.js
 *
 * Reusable service for sending the standard Fixlo initial follow-up
 * to a homeowner lead (stored as a JobRequest document).
 *
 * Reuses:
 *  - utils/twilio → sendSms (Twilio)
 *  - services/emailService → sendEmail (SendGrid)
 */

'use strict';

const { sendSms } = require('../utils/twilio');
const { sendEmail } = require('./emailService');

/**
 * Build the initial follow-up SMS body for a homeowner.
 * @param {string} firstName
 * @returns {string}
 */
function buildSmsBody(firstName) {
  return `Hi ${firstName}, thanks for contacting Fixlo!

We're ready to help you get matched with a trusted local professional.

To continue your request, please complete your service request here:
https://www.fixloapp.com/request

If you have any questions, simply reply to this message.

— Fixlo
Find. Book. Get It Done.`;
}

/**
 * Build the initial follow-up email subject and HTML body.
 * @param {string} firstName
 * @returns {{ subject: string, html: string }}
 */
function buildEmailContent(firstName) {
  const subject = 'Complete Your Fixlo Service Request';
  const html = `<p>Hi ${firstName},</p>

<p>Thank you for contacting Fixlo.</p>

<p>To match you with the right local professional, please complete your service request using the link below:</p>

<p><a href="https://www.fixloapp.com/request">https://www.fixloapp.com/request</a></p>

<p>Once submitted, we'll begin matching you with qualified professionals in your area.</p>

<p>If you need assistance, simply reply to this email.</p>

<p>Thank you,<br>
The Fixlo Team<br>
Find. Book. Get It Done.</p>`;

  return { subject, html };
}

/**
 * Send the initial follow-up SMS and email to a homeowner lead.
 *
 * Checks:
 *  - Lead must not have already received the initial follow-up.
 *  - Lead must not have opted out of the respective channel.
 *
 * Updates the lead document on success:
 *  - initialFollowUpSent = true
 *  - initialFollowUpSentAt = now
 *  - followUpHistory entry appended
 *
 * @param {import('../models/JobRequest')} lead  - Mongoose JobRequest document
 * @param {object} [options]
 * @param {string} [options.triggeredBy]         - Admin user identifier (email/id)
 * @returns {Promise<{ smsSent: boolean, emailSent: boolean, smsError?: string, emailError?: string }>}
 */
async function sendInitialFollowUp(lead, options = {}) {
  const { triggeredBy = 'admin' } = options;

  if (lead.initialFollowUpSent) {
    const err = new Error('Initial follow-up has already been sent for this lead.');
    err.code = 'ALREADY_SENT';
    throw err;
  }

  const firstName = (lead.name || '').split(' ')[0] || lead.name || 'there';

  let smsSent = false;
  let emailSent = false;
  let smsError;
  let emailError;

  // ── SMS ──────────────────────────────────────────────────────────────────────
  const canSendSms = lead.phone && !lead.smsOptOut;
  if (canSendSms) {
    try {
      const body = buildSmsBody(firstName);
      await sendSms(lead.phone, body);
      smsSent = true;
      console.log(`✅ [homeownerFollowUp] SMS sent to ${lead.phone} for lead ${lead._id}`);
    } catch (err) {
      smsError = err.message;
      console.error(`❌ [homeownerFollowUp] SMS failed for lead ${lead._id}: ${err.message}`);
    }
  } else {
    console.log(`📵 [homeownerFollowUp] SMS skipped for lead ${lead._id}: phone=${!!lead.phone} smsOptOut=${lead.smsOptOut}`);
  }

  // ── Email ─────────────────────────────────────────────────────────────────────
  const canSendEmail = lead.email && !lead.emailOptOut;
  if (canSendEmail) {
    try {
      const { subject, html } = buildEmailContent(firstName);
      await sendEmail(lead.email, subject, html);
      emailSent = true;
      console.log(`✅ [homeownerFollowUp] Email sent to ${lead.email} for lead ${lead._id}`);
    } catch (err) {
      emailError = err.message;
      console.error(`❌ [homeownerFollowUp] Email failed for lead ${lead._id}: ${err.message}`);
    }
  } else {
    console.log(`📧 [homeownerFollowUp] Email skipped for lead ${lead._id}: email=${!!lead.email} emailOptOut=${lead.emailOptOut}`);
  }

  // ── Persist result ────────────────────────────────────────────────────────────
  lead.initialFollowUpSent = true;
  lead.initialFollowUpSentAt = new Date();
  lead.followUpHistory = lead.followUpHistory || [];
  lead.followUpHistory.push({
    type: 'initial',
    sentAt: new Date(),
    smsSent,
    emailSent,
    triggeredBy
  });
  await lead.save();

  const result = { smsSent, emailSent };
  if (smsError) result.smsError = smsError;
  if (emailError) result.emailError = emailError;
  return result;
}

module.exports = { sendInitialFollowUp };
