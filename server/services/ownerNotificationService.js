/**
 * ownerNotificationService — Centralized Owner Email Notification System
 *
 * Sends professional HTML email alerts to the Fixlo owner (OWNER_EMAIL) via
 * SendGrid whenever important platform events occur.
 *
 * Usage:
 *   const { notify } = require('./ownerNotificationService');
 *   notify('homeowner_signup', { name, email, phone, city, state, userId })
 *     .catch(() => {}); // fire-and-forget; never blocks caller
 *
 * Supported event types:
 *   homeowner_signup     – New homeowner account created
 *   pro_registered       – New professional registered
 *   recruiter_registered – New recruiter registered
 *   service_request      – New service request submitted
 *   quote_purchased      – New quote/lead purchased (Stripe payment)
 *   pro_subscription     – Subscription created/renewed/cancelled/payment_failed
 *   background_check     – Background check requested/completed/passed/failed
 *   referral_commission  – Referral commission earned
 *   password_reset       – Password reset requested
 *   contact_form         – Contact form submission
 *   system_error         – System-level error (SendGrid/Stripe/Twilio/Mongo/etc.)
 *
 * Design principles:
 *   - Uses existing SendGrid integration (@sendgrid/mail) — no duplicated code
 *   - Logs every notification attempt (sent / failed / skipped)
 *   - Retries once on transient email failure
 *   - Never interrupts the main user workflow
 *   - Never includes passwords, JWT tokens, reset tokens, API keys, or secrets
 *   - Future-ready: channel registry allows SMS/Push to be added without
 *     changing any event-emitting code
 *
 * Required env vars:
 *   SENDGRID_API_KEY
 *   OWNER_EMAIL
 *
 * Optional env vars:
 *   SENDGRID_FROM_EMAIL   (default: noreply@fixloapp.com)
 *   NODE_ENV              (shown in email footer)
 */

'use strict';

const sgMail = require('@sendgrid/mail');

// ── SendGrid initialisation ───────────────────────────────────────────────────
let _sgReady = false;

function _initSendGrid() {
  if (_sgReady) return true;
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn('[OwnerNotify] ⚠️  SENDGRID_API_KEY not set — email notifications disabled');
    return false;
  }
  sgMail.setApiKey(apiKey);
  _sgReady = true;
  return true;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@fixloapp.com';
const ENV_LABEL  = (process.env.NODE_ENV || 'development').toUpperCase();

// ── HTML helpers ──────────────────────────────────────────────────────────────

function _htmlWrap(eventLabel, rows) {
  const now = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'full',
    timeStyle: 'long'
  });

  const tableRows = rows
    .map(([label, value]) => {
      const safe = String(value ?? 'N/A').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `
        <tr>
          <td style="padding:8px 12px;font-weight:600;color:#374151;white-space:nowrap;
                     border-bottom:1px solid #e5e7eb;width:35%">${label}</td>
          <td style="padding:8px 12px;color:#111827;border-bottom:1px solid #e5e7eb;
                     word-break:break-word">${safe}</td>
        </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:8px;overflow:hidden;
                    box-shadow:0 1px 3px rgba(0,0,0,.12)">

        <!-- Header -->
        <tr>
          <td style="background:#1d4ed8;padding:24px 32px">
            <p style="margin:0;font-size:11px;color:#93c5fd;letter-spacing:.1em;
                      text-transform:uppercase">Fixlo Owner Notification</p>
            <h1 style="margin:6px 0 0;font-size:22px;color:#ffffff">${eventLabel}</h1>
          </td>
        </tr>

        <!-- Meta row -->
        <tr>
          <td style="background:#eff6ff;padding:12px 32px;border-bottom:1px solid #dbeafe">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#1e40af">
                  <strong>Time:</strong> ${now}
                </td>
                <td align="right" style="font-size:13px;color:#1e40af">
                  <strong>Environment:</strong> ${ENV_LABEL}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Data table -->
        <tr>
          <td style="padding:24px 32px">
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden">
              ${tableRows}
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;
                     border-top:1px solid #e5e7eb;text-align:center">
            <p style="margin:0;font-size:11px;color:#9ca3af">
              Generated automatically by Fixlo. Do not reply to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Template builders ─────────────────────────────────────────────────────────

const _TEMPLATES = {

  homeowner_signup(p) {
    return {
      subject: '👤 New Homeowner Account Created',
      html: _htmlWrap('New Homeowner Account Created', [
        ['Name',        p.name],
        ['Email',       p.email],
        ['Phone',       p.phone],
        ['City',        p.city],
        ['State',       p.state],
        ['Signup Date', p.signupDate || 'N/A'],
        ['User ID',     p.userId]
      ])
    };
  },

  pro_registered(p) {
    return {
      subject: '🔧 New Professional Registered',
      html: _htmlWrap('New Professional Registered', [
        ['Name',              p.name],
        ['Trade',             p.trade],
        ['Email',             p.email],
        ['Phone',             p.phone],
        ['City',              p.city],
        ['State',             p.state],
        ['Subscription Plan', p.subscriptionPlan || 'N/A'],
        ['Referral Code',     p.referralCode || 'None'],
        ['Signup Date',       p.signupDate || 'N/A']
      ])
    };
  },

  recruiter_registered(p) {
    return {
      subject: '🤝 New Recruiter Registered',
      html: _htmlWrap('New Recruiter Registered', [
        ['Name',          p.name],
        ['Email',         p.email],
        ['Phone',         p.phone],
        ['Referral Code', p.referralCode || 'None'],
        ['Signup Date',   p.signupDate || 'N/A']
      ])
    };
  },

  service_request(p) {
    return {
      subject: `🏠 New Service Request: ${p.service || 'Service'}`,
      html: _htmlWrap('New Service Request Submitted', [
        ['Requested Service', p.service],
        ['Homeowner Name',    p.homeownerName],
        ['Email',             p.email],
        ['Phone',             p.phone],
        ['City',              p.city],
        ['State',             p.state],
        ['Requested Date',    p.requestedDate || new Date().toISOString()],
        ['Lead ID',           p.leadId]
      ])
    };
  },

  quote_purchased(p) {
    return {
      subject: `💳 New Quote Purchased — $${Number(p.amountPaid || 0).toFixed(2)}`,
      html: _htmlWrap('New Quote Purchased', [
        ['Homeowner',           p.homeowner],
        ['Amount Paid',         `$${Number(p.amountPaid || 0).toFixed(2)}`],
        ['Stripe Payment ID',   p.stripePaymentIntentId],
        ['Service',             p.service],
        ['City',                p.city]
      ])
    };
  },

  pro_subscription(p) {
    const eventMap = {
      created:        '✅ Subscription Created',
      renewed:        '🔄 Subscription Renewed',
      cancelled:      '❌ Subscription Cancelled',
      payment_failed: '⚠️  Subscription Payment Failed'
    };
    const label = eventMap[p.subscriptionEvent] || `Subscription — ${p.subscriptionEvent}`;
    return {
      subject: `💼 Pro Subscription: ${label}`,
      html: _htmlWrap(`Pro Subscription: ${label}`, [
        ['Pro Name',          p.proName],
        ['Plan',              p.plan],
        ['Amount',            p.amount ? `$${Number(p.amount).toFixed(2)}` : 'N/A'],
        ['Stripe Customer ID', p.stripeCustomerId],
        ['Subscription Event', p.subscriptionEvent]
      ])
    };
  },

  background_check(p) {
    const statusMap = {
      requested:  '📋 Background Check Requested',
      completed:  '✅ Background Check Completed',
      passed:     '✅ Background Check Passed (Clear)',
      failed:     '❌ Background Check Failed (Consider/Suspended)'
    };
    const label = statusMap[p.checkStatus] || `Background Check — ${p.checkStatus}`;
    return {
      subject: `🔍 ${label}`,
      html: _htmlWrap(label, [
        ['Pro Name',    p.proName],
        ['Pro Email',   p.proEmail],
        ['Status',      p.checkStatus],
        ['Candidate ID', p.candidateId],
        ['Report ID',   p.reportId || 'N/A'],
        ['Timestamp',   p.timestamp || new Date().toISOString()]
      ])
    };
  },

  referral_commission(p) {
    return {
      subject: `💰 Referral Commission Earned — $${Number(p.amount || 0).toFixed(2)}`,
      html: _htmlWrap('Referral Commission Earned', [
        ['Recruiter',        p.recruiter],
        ['Professional',     p.professional],
        ['Amount',           `$${Number(p.amount || 0).toFixed(2)}`],
        ['Referral Level',   `Level ${p.referralLevel}`],
        ['Commission ID',    p.commissionId || 'N/A']
      ])
    };
  },

  password_reset(p) {
    return {
      subject: '🔑 Password Reset Requested',
      html: _htmlWrap('Password Reset Requested', [
        ['User Type',  p.userType || 'Unknown'],
        ['Identifier', p.identifier],
        ['Timestamp',  p.timestamp || new Date().toISOString()]
      ])
    };
  },

  contact_form(p) {
    return {
      subject: `📬 Contact Form: ${p.subject || 'Message'}`,
      html: _htmlWrap('Contact Form Submission', [
        ['Name',      p.name],
        ['Email',     p.email],
        ['Subject',   p.subject],
        ['Message',   (p.message || '').substring(0, 2000)]
      ])
    };
  },

  system_error(p) {
    return {
      subject: `🚨 System Error: ${p.errorType || 'Unknown'}`,
      html: _htmlWrap(`System Error: ${p.errorType || 'Unknown'}`, [
        ['Error Type',   p.errorType],
        ['Message',      (p.errorMessage || 'No message').substring(0, 500)],
        ['Stack Trace',  (p.stackTrace  || 'N/A').substring(0, 1000)],
        ['Timestamp',    p.timestamp || new Date().toISOString()]
      ])
    };
  }
};

// ── Core send function ────────────────────────────────────────────────────────

async function _sendEmail(subject, html) {
  if (!_initSendGrid()) return { disabled: true };

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail) {
    console.warn('[OwnerNotify] ⚠️  OWNER_EMAIL not set — skipping owner notification');
    return { disabled: true };
  }

  const msg = {
    to:      ownerEmail,
    from:    FROM_EMAIL,
    subject,
    html
  };

  const result = await sgMail.send(msg);
  return result;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send an owner notification email for the given event.
 * Retries once on failure. Logs every attempt.
 * Resolves even when the email could not be sent.
 *
 * @param {string} eventType  - One of the supported event type strings
 * @param {object} payload    - Event data (see template builders above)
 * @returns {Promise<void>}   - Always resolves; never rejects
 */
async function notify(eventType, payload = {}) {
  // ── Build template ────────────────────────────────────────────────────────
  const builder = _TEMPLATES[eventType];
  if (!builder) {
    console.warn(`[OwnerNotify] ⚠️  Unknown event type: "${eventType}" — skipping`);
    return;
  }

  let template;
  try {
    template = builder(payload);
  } catch (buildErr) {
    console.error(`[OwnerNotify] ❌ Template build error for "${eventType}":`, buildErr.message);
    return;
  }

  // ── Log the notification attempt ─────────────────────────────────────────
  console.log(`[OwnerNotify] 📧 Sending owner notification — event: ${eventType}`);

  // ── Send email (with one retry) ─────────────────────────────────────────
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await _sendEmail(template.subject, template.html);
      console.log(`[OwnerNotify] ✅ Email sent — event: ${eventType} (attempt ${attempt})`);
      break; // success — stop retry loop
    } catch (sendErr) {
      if (attempt === 1) {
        console.warn(
          `[OwnerNotify] ⚠️  Email failed (attempt 1), retrying — event: ${eventType} | error: ${sendErr.message}`
        );
      } else {
        console.error(
          `[OwnerNotify] ❌ Email failed after retry — event: ${eventType} | error: ${sendErr.message}`
        );
      }
    }
  }

  // ── Fan out to additional registered channels (SMS, Push, etc.) ────────
  for (const channel of _channels) {
    try {
      await channel.handler(eventType, payload);
      console.log(`[OwnerNotify] ✅ Channel "${channel.name}" notified — event: ${eventType}`);
    } catch (channelErr) {
      console.error(
        `[OwnerNotify] ❌ Channel "${channel.name}" failed — event: ${eventType} | error: ${channelErr.message}`
      );
    }
  }
}

/**
 * Channel registry — makes the service future-ready for SMS/Push notifications.
 *
 * Additional channel handlers can be registered here without changing any of
 * the event-emitting code elsewhere in the codebase.
 *
 * Example (add SMS channel in the future):
 *   ownerNotificationService.registerChannel('sms', async (eventType, payload) => { ... });
 *
 * The `notify()` function already fans out to all registered channels.
 */
const _channels = [];

function registerChannel(name, handler) {
  if (typeof handler !== 'function') {
    throw new TypeError(`[OwnerNotify] Channel handler for "${name}" must be a function`);
  }
  _channels.push({ name, handler });
  console.log(`[OwnerNotify] ✅ Channel registered: ${name}`);
}

module.exports = { notify, registerChannel };
