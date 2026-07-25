#!/usr/bin/env node
/**
 * importHistoricalMetaLeads.js — One-time idempotent historical Meta lead import
 *
 * Imports 19 historical Meta leads (July 17–24 2026), consolidates the two Hiram
 * Casiano rows into one canonical record, skips the invalid Sample Lead, and sends
 * the next appropriate follow-up reminder to each of the resulting 17 unique contacts.
 *
 * SAFE TO RUN MULTIPLE TIMES:
 *   - Lead creation is idempotent (normalized email + phone deduplication).
 *   - Invite codes are reused when they already exist.
 *   - Messages are idempotent: {leadId}:{channel}:{stage} checked in history before sending.
 *   - Welcome messages are NEVER resent; they are marked as already-sent.
 *
 * Usage:
 *   node server/scripts/importHistoricalMetaLeads.js
 *   node server/scripts/importHistoricalMetaLeads.js --dry-run
 *
 * Required env vars (same as main server):
 *   MONGODB_URI, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL,
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER (or TWILIO_FROM_NUMBER)
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const crypto   = require('crypto');
const sgMail   = require('@sendgrid/mail');

// ── Constants ─────────────────────────────────────────────────────────────────

const DRY_RUN          = process.argv.includes('--dry-run');
const IMPORT_BATCH_ID  = 'historical-meta-import-20260725';
const SIGNUP_URL       = 'https://fixloapp.com/pros';
// Follow-up stage keys (index = smsStep / emailStep counter value)
const REMINDER_STAGES  = ['24h', '72h', '7d', '14d'];
// Template key names used by sendLeadSms / sendLeadEmail
const REMINDER_SMS_KEYS   = ['reminder1', 'reminder2', 'reminder3', 'finalReminder'];
// Interval in ms between Reminder 1 and Reminder 2 to give the scheduler breathing room.
// After this script sends step 0, nextSmsFollowUpAt is set to NOW + NEXT_STEP_DELAY_MS
// so the scheduler does not immediately fire step 1 for overdue historical leads.
const NEXT_STEP_DELAY_MS  = 48 * 60 * 60 * 1000; // 48 hours

// ── Supplied data (19 rows — original problem order preserved for metrics) ────
//
// Row 5 (07/23 Hiram Casiano) and Row 9 (07/22 Hiram Casiano) share the same
// email and phone.  The script processes them in chronological order (sorted
// below) so Row 9 — the earliest — is canonicalized and Row 5 is identified
// as a duplicate during the intra-batch deduplication pass.

const SUPPLIED_ROWS = [
  // Row 1
  {
    rowNumber: 1,
    rawCreated: '07/24/2026 8:09pm',
    name: 'Brad Ralls',
    email: 'bradralls@gmail.com',
    phone: '+15599748307',
    formName: "Fixlo 's form created on Sun Jul 19, 2026 8:22pm",
    originalSource: 'Paid',
    originalChannel: 'Email'
  },
  // Row 2
  {
    rowNumber: 2,
    rawCreated: '07/24/2026 8:01pm',
    name: 'Randy Nesst',
    email: 'rtnesst@gmail.com',
    phone: '+12623270399',
    formName: "Fixlo 's form created on Sun Jul 19, 2026 8:22pm",
    originalSource: 'Paid',
    originalChannel: 'Email'
  },
  // Row 3
  {
    rowNumber: 3,
    rawCreated: '07/24/2026 7:24pm',
    name: 'Lyo Azakura Waffles',
    email: 'igna.lyo@hotmail.com',
    phone: '+13237405650',
    formName: "Fixlo 's form created on Sun Jul 19, 2026 8:22pm",
    originalSource: 'Paid',
    originalChannel: 'Email'
  },
  // Row 4
  {
    rowNumber: 4,
    rawCreated: '07/23/2026 9:49pm',
    name: 'Erick Eduardo',
    email: 'eparkins17@gmail.com',
    phone: '+18334461154',
    formName: "Fixlo 's form created on Sun Jul 19, 2026 8:22pm",
    originalSource: 'Paid',
    originalChannel: 'Email'
  },
  // Row 5 — Hiram Casiano (later occurrence; will be deduplicated)
  {
    rowNumber: 5,
    rawCreated: '07/23/2026 7:22pm',
    name: 'Hiram Casiano',
    email: 'mr.casiano10940@gmail.com',
    phone: '+18456487303',
    formName: "Fixlo 's form created on Sun Jul 19, 2026 8:22pm",
    originalSource: 'Paid',
    originalChannel: 'Email'
  },
  // Row 6
  {
    rowNumber: 6,
    rawCreated: '07/23/2026 12:29pm',
    name: 'Marco Hid',
    email: 'highqualitydrywall21@gmail.com',
    phone: '+16196228394',
    formName: "Fixlo 's form created on Sun Jul 19, 2026 8:22pm",
    originalSource: 'Paid',
    originalChannel: 'Email'
  },
  // Row 7
  {
    rowNumber: 7,
    rawCreated: '07/23/2026 7:24am',
    name: 'Edward Lewis',
    email: 'edwardbuilders@gmail.com',
    phone: '+15109676271',
    formName: "Fixlo 's form created on Sun Jul 19, 2026 8:22pm",
    originalSource: 'Paid',
    originalChannel: 'Email'
  },
  // Row 8
  {
    rowNumber: 8,
    rawCreated: '07/23/2026 4:40am',
    name: 'Terry Frederick',
    email: 'tjfred_92@yahoo.com',
    phone: '+14049217595',
    formName: "Fixlo 's form created on Sun Jul 19, 2026 8:22pm",
    originalSource: 'Paid',
    originalChannel: 'Email'
  },
  // Row 9 — Hiram Casiano (earliest occurrence; canonical)
  {
    rowNumber: 9,
    rawCreated: '07/22/2026 1:18pm',
    name: 'Hiram Casiano',
    email: 'mr.casiano10940@gmail.com',
    phone: '+18456487303',
    formName: "Fixlo 's form created on Sun Jul 19, 2026 8:22pm",
    originalSource: 'Paid',
    originalChannel: 'Email'
  },
  // Row 10
  {
    rowNumber: 10,
    rawCreated: '07/21/2026 1:30pm',
    name: 'Lee Martin',
    email: 'handsonmaintenance621@gmail.com',
    phone: '+18033153009',
    formName: "Fixlo 's form created on Sun Jul 19, 2026 8:22pm",
    originalSource: 'Paid',
    originalChannel: 'Email'
  },
  // Row 11
  {
    rowNumber: 11,
    rawCreated: '07/21/2026 8:24am',
    name: 'Roy Villegas',
    email: 'xproroy13@gmail.com',
    phone: '+15109619036',
    formName: "Fixlo 's form created on Sun Jul 19, 2026 8:22pm",
    originalSource: 'Paid',
    originalChannel: 'Email'
  },
  // Row 12
  {
    rowNumber: 12,
    rawCreated: '07/20/2026 7:55pm',
    name: 'Christopher Ajagu',
    email: 'ajaguc@gmail.com',
    phone: '+13104026902',
    formName: "Fixlo 's form created on Sun Jul 19, 2026 8:22pm",
    originalSource: 'Paid',
    originalChannel: 'Email'
  },
  // Row 13
  {
    rowNumber: 13,
    rawCreated: '07/19/2026 8:51pm',
    name: 'Booker Jones',
    email: 'devettajones@yahoo.com',
    phone: '+12294493677',
    formName: "Fixlo 's form created on Sun Jul 19, 2026 8:22pm",
    originalSource: 'Paid',
    originalChannel: 'Email'
  },
  // Row 14
  {
    rowNumber: 14,
    rawCreated: '07/19/2026 7:41pm',
    name: 'Josh Larsen',
    email: 'jlarsen2@ymail.com',
    phone: '+19493754801',
    formName: "Fixlo 's form created on Sun Jul 19, 2026 8:22pm",
    originalSource: 'Paid',
    originalChannel: 'Email'
  },
  // Row 15
  {
    rowNumber: 15,
    rawCreated: '07/19/2026 6:53pm',
    name: 'John Adams',
    email: 'j47989121@gmail.com',
    phone: '+12832243704',
    formName: "Fixlo 's form created on Sun Jul 19, 2026 8:22pm",
    originalSource: 'Paid',
    originalChannel: 'Email'
  },
  // Row 16 — Sample Lead (no valid contact info — SKIP)
  {
    rowNumber: 16,
    rawCreated: '07/19/2026 9:05am',
    name: 'Sample Lead',
    email: null,
    phone: null,
    formName: null,
    originalSource: 'Direct',
    originalChannel: null,
    invalidSample: true
  },
  // Row 17
  {
    rowNumber: 17,
    rawCreated: '07/19/2026 8:16am',
    name: 'Dave Burnett',
    email: 'berryrass@yahoo.com',
    phone: '+12539998115',
    formName: "Fixlo 's form created on Sat Jul 18, 2026 9:09am",
    originalSource: 'Paid',
    originalChannel: 'Email'
  },
  // Row 18 — email-only (no phone)
  {
    rowNumber: 18,
    rawCreated: '07/18/2026 6:06am',
    name: 'Joshua Noriega',
    email: 'jcnoniega77@yahoo.com',
    phone: null,
    formName: "Fixlo 's form created on Fri Jul 17, 2026 11:17pm",
    originalSource: 'Paid',
    originalChannel: 'Email'
  },
  // Row 19 — email-only (no phone)
  {
    rowNumber: 19,
    rawCreated: '07/17/2026 10:52pm',
    name: 'Marnique Reed',
    email: 'mreed2876@gmail.com',
    phone: null,
    formName: "Fixlo 's form created on Fri Jul 17, 2026 11:17pm",
    originalSource: 'Paid',
    originalChannel: 'Email'
  }
];

// ── Follow-up message templates (from problem requirements 8–15) ───────────────
//
// Template variable syntax: {{variableName}} — resolved by the existing
// metaLeadAutomationService template() function via the custom settings object
// we inject into sendLeadSms / sendLeadEmail.

const STEP_SMS_TEMPLATES = [
  // Step 0 → Reminder 1 (requirement 8)
  'Hi {{firstName}}, are you still interested in growing your business? Your Fixlo invitation is ready. Use code {{invitationCode}} to create your Pro account: https://fixloapp.com/pros \u2014 Reply STOP to opt out.',
  // Step 1 → Reminder 2 (requirement 10)
  'Hi {{firstName}}, your Fixlo invitation is still available. Use code {{invitationCode}} to join and connect with homeowners looking for professionals: https://fixloapp.com/pros \u2014 Reply STOP to opt out.',
  // Step 2 → Reminder 3 (requirement 12)
  'Hi {{firstName}}, homeowners near you may be looking for professionals in your trade. Join Fixlo with code {{invitationCode}}: https://fixloapp.com/pros \u2014 Reply STOP to opt out.',
  // Step 3 → Final Reminder (requirement 14)
  'Final Fixlo reminder, {{firstName}}. Use invitation code {{invitationCode}} to create your Pro account: https://fixloapp.com/pros \u2014 Reply STOP to opt out.'
];

const STEP_EMAIL_SUBJECTS = [
  'Your Fixlo invitation is ready',           // Step 0 (req 9)
  'Grow your business with Fixlo',             // Step 1 (req 11)
  'Homeowners may be looking for your services', // Step 2 (req 13)
  'Final reminder about your Fixlo invitation'  // Step 3 (req 15)
];

// HTML bodies for each reminder email step (requirements 9, 11, 13, 15).
// Variables use {{firstName}} and {{invitationCode}} resolved by template().
function buildEmailHtml(stepIndex) {
  const unsubscribeFooter = `
    <div style="border-top:1px solid #e5e7eb;padding:20px 0;font-size:12px;color:#9ca3af;text-align:center;margin-top:32px;">
      <p>You received this email because you expressed interest in joining Fixlo as a professional.</p>
      <p>To stop receiving these emails, reply with "UNSUBSCRIBE" or contact us at
        <a href="mailto:support@fixloapp.com" style="color:#9ca3af;">support@fixloapp.com</a>.
      </p>
    </div>`;

  const header = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333333;">
      <div style="text-align:center;padding:16px 0 24px;border-bottom:2px solid #e63946;">
        <span style="font-size:28px;font-weight:bold;color:#e63946;letter-spacing:3px;">FIXLO</span>
      </div>
      <div style="padding:30px 0;">`;

  const inviteBox = `
        <div style="background:#f8f9fa;border:2px dashed #e63946;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
          <span style="font-size:22px;font-weight:bold;font-family:'Courier New',monospace;color:#1a1a2e;letter-spacing:4px;">{{invitationCode}}</span>
        </div>`;

  const cta = `
        <div style="text-align:center;margin:28px 0;">
          <a href="${SIGNUP_URL}" style="background-color:#e63946;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;display:inline-block;">
            ${['Create your professional account here', 'Join Fixlo here', 'Complete your professional account here', 'Join here'][stepIndex]}
          </a>
        </div>`;

  const bodies = [
    // Step 0: Reminder 1 (requirement 9)
    `<h2 style="color:#1a1a2e;margin-top:0;">Hi {{firstName}},</h2>
     <p style="line-height:1.6;">We wanted to remind you that your invitation to join Fixlo is still available.</p>
     <p style="line-height:1.6;"><strong>Your invitation code is:</strong></p>
     ${inviteBox}
     ${cta}
     <p style="line-height:1.6;">Fixlo helps professionals connect with homeowners looking for services in their area.</p>
     <p style="line-height:1.6;">The Fixlo Team</p>`,

    // Step 1: Reminder 2 (requirement 11)
    `<h2 style="color:#1a1a2e;margin-top:0;">Hi {{firstName}},</h2>
     <p style="line-height:1.6;">Homeowners use Fixlo to find professionals for construction, remodeling, painting, plumbing, electrical work, landscaping, cleaning, junk removal, and other services.</p>
     <p style="line-height:1.6;"><strong>Your invitation code is:</strong></p>
     ${inviteBox}
     ${cta}
     <p style="line-height:1.6;">The Fixlo Team</p>`,

    // Step 2: Reminder 3 (requirement 13)
    `<h2 style="color:#1a1a2e;margin-top:0;">Hi {{firstName}},</h2>
     <p style="line-height:1.6;">Fixlo is building a network of professionals across the United States.</p>
     <p style="line-height:1.6;"><strong>Your invitation code is still available:</strong></p>
     ${inviteBox}
     ${cta}
     <p style="line-height:1.6;">The Fixlo Team</p>`,

    // Step 3: Final Reminder (requirement 15)
    `<h2 style="color:#1a1a2e;margin-top:0;">Hi {{firstName}},</h2>
     <p style="line-height:1.6;">This is the final reminder regarding your invitation to join Fixlo.</p>
     <p style="line-height:1.6;"><strong>Your invitation code is:</strong></p>
     ${inviteBox}
     ${cta}
     <p style="line-height:1.6;">The Fixlo Team</p>`
  ];

  return `${header}${bodies[stepIndex]}</div>${unsubscribeFooter}</div>`;
}

// Pre-build HTML bodies
const STEP_EMAIL_BODIES = [0, 1, 2, 3].map(buildEmailHtml);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse "MM/DD/YYYY H:MMam/pm" into a JS Date (UTC). */
function parseSuppliedDate(str) {
  const m = String(str || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(am|pm)$/i);
  if (!m) return null;
  const [, mon, day, year, hr, min, ap] = m;
  let hour = parseInt(hr, 10);
  if (ap.toLowerCase() === 'pm' && hour < 12) hour += 12;
  if (ap.toLowerCase() === 'am' && hour === 12) hour = 0;
  return new Date(Date.UTC(parseInt(year, 10), parseInt(mon, 10) - 1, parseInt(day, 10), hour, parseInt(min, 10)));
}

/** Normalize a phone number to E.164.  Returns '' if not normalizable. */
function normalizePhone(raw) {
  if (!raw) return '';
  try {
    const { normalizeE164 } = require('../utils/twilio');
    return normalizeE164(String(raw).trim()) || '';
  } catch {
    const digits = String(raw).replace(/\D/g, '');
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits[0] === '1') return `+${digits}`;
    return '';
  }
}

/** Normalize an email to lowercase, trimmed. Returns '' for "none"/null/empty. */
function normalizeEmail(raw) {
  const v = String(raw || '').trim().toLowerCase();
  return (v && v !== 'none' && v.includes('@')) ? v : '';
}

/** Split a full name into { firstName, lastName }. */
function splitName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || '';
  const lastName  = parts.join(' ');
  return { firstName, lastName };
}

/** Mask an email for safe log output: "b***s@gmail.com". */
function maskEmail(email) {
  if (!email) return '(none)';
  const [local, domain] = email.split('@');
  if (!local || !domain) return '(invalid)';
  const masked = local.length <= 2 ? local[0] + '*' : `${local[0]}***${local.slice(-1)}`;
  return `${masked}@${domain}`;
}

/** Return last 4 digits of a phone number, or "(none)". */
function maskPhone(phone) {
  if (!phone) return '(none)';
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 4 ? `...${digits.slice(-4)}` : '(short)';
}

/** Deterministic identity hash for generating metaLeadId / leadUniqueId. */
function buildIdentityHash(email, phone) {
  return crypto
    .createHash('sha1')
    .update(`${email}|${phone}|${IMPORT_BATCH_ID}`)
    .digest('hex')
    .slice(0, 24);
}

/** Sync legacy nextFollowUpAt from channel-specific dates. */
function syncLegacyFollowUpPointers(lead) {
  const candidates = [
    lead.followUp.nextSmsFollowUpAt,
    lead.followUp.nextEmailFollowUpAt
  ].filter(Boolean).map((d) => new Date(d));
  if (!candidates.length) {
    lead.followUp.nextFollowUpAt = null;
    return;
  }
  candidates.sort((a, b) => a - b);
  lead.followUp.nextFollowUpAt = candidates[0];
}

/** Return true if smsHistory has an outbound entry for the given stage. */
function hasSmsEntryForStage(lead, stage) {
  return (lead.smsHistory || []).some(
    (h) => h.direction === 'outbound' && (h.followUpStage === stage || h.templateKey === stage)
  );
}

/** Return true if emailHistory has an entry for the given stage. */
function hasEmailEntryForStage(lead, stage) {
  return (lead.emailHistory || []).some(
    (h) => h.followUpStage === stage || h.templateKey === stage
  );
}

/**
 * Find the first step (0-indexed) that has not yet been attempted for the given
 * channel.  Returns null when all 4 steps have been sent.
 */
function getNextUnsentStep(lead, channel) {
  for (let i = 0; i < REMINDER_STAGES.length; i++) {
    const stage = REMINDER_STAGES[i];
    const alreadySent = channel === 'sms'
      ? hasSmsEntryForStage(lead, stage)
      : hasEmailEntryForStage(lead, stage);
    if (!alreadySent) return i;
  }
  return null;
}

/**
 * Log a MetaLeadEvent.  Non-fatal: logs to stderr on failure.
 */
async function logEvent(MetaLeadEvent, leadId, eventType, channel, title, description = '', metadata = {}) {
  try {
    await MetaLeadEvent.create({ leadId, eventType, channel, title, description, metadata, occurredAt: new Date() });
  } catch (err) {
    console.error(`[HISTORICAL_META_IMPORT] Event log failed: ${err.message}`);
  }
}

/**
 * Generate a unique invitation code and create an InviteCode document.
 * Returns the code string.
 */
async function createInviteCode(InviteCode, lead, settings) {
  const chars  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const prefix = settings.invitationCodePrefix || 'FIXLO';
  const length = Math.min(10, Math.max(8, Number(settings.invitationCodeLength || 8)));
  const expiryDays = Number(settings.invitationCodeExpiryDays || 30);

  for (let attempt = 0; attempt < 20; attempt++) {
    const random = Array.from({ length }, () => chars[crypto.randomInt(chars.length)]).join('');
    const code   = `${prefix}-${random}`;
    const exists = await InviteCode.findOne({ code }).lean();
    if (exists) continue;

    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
    const invite = await InviteCode.create({
      code,
      membershipDuration: '30days',
      planType: 'promo',
      usesAllowed: 1,
      usesRemaining: 1,
      assignedName: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
      assignedEmail: lead.email || undefined,
      assignedPhone: lead.phone || undefined,
      notes: `Historical Meta lead import ${IMPORT_BATCH_ID} for ${lead.metaLeadId}`,
      expiresAt,
      createdByEmail: 'historical-meta-import@system.local'
    });

    lead.invitationCode   = code;
    lead.invitationCodeId = invite._id;
    lead.invitationExpiresAt = expiresAt;
    return code;
  }
  throw new Error('Unable to generate unique invitation code after 20 attempts');
}

// ── Per-step custom settings injection ────────────────────────────────────────
//
// sendLeadSms / sendLeadEmail from the service read templates from the settings
// object we pass.  We inject the correct template for the specific step we're
// sending, so the existing idempotency, history-logging, and event-logging
// inside those functions still apply.

function buildCustomSettings(baseSettings, stepIndex) {
  return {
    ...baseSettings,
    smsTemplates: {
      ...baseSettings.smsTemplates,
      reminder1:     STEP_SMS_TEMPLATES[0],
      reminder2:     STEP_SMS_TEMPLATES[1],
      reminder3:     STEP_SMS_TEMPLATES[2],
      finalReminder: STEP_SMS_TEMPLATES[3]
    },
    emailTemplates: {
      ...baseSettings.emailTemplates,
      reminderSubject: STEP_EMAIL_SUBJECTS[stepIndex],
      reminderBody:    STEP_EMAIL_BODIES[stepIndex]
    }
  };
}

// ── Main per-lead processor ───────────────────────────────────────────────────

/**
 * Process one canonical lead row through the full import + recovery flow.
 *
 * @returns {object} per-lead result summary
 */
async function processOneLead({
  row,
  MetaLead,
  MetaLeadEvent,
  InviteCode,
  Pro,
  sendLeadSms,
  sendLeadEmail,
  baseSettings,
  now
}) {
  const { firstName, lastName } = splitName(row.name);
  const email = normalizeEmail(row.email);
  const phone = normalizePhone(row.phone);
  const originalCreatedAt = parseSuppliedDate(row.rawCreated) || new Date();

  const result = {
    name:             row.name,
    maskedEmail:      maskEmail(email),
    maskedPhone:      maskPhone(phone),
    isNew:            false,
    isExisting:       false,
    alreadyRegistered: false,
    smsUnavailable:   !phone,
    nextStepIndex:    null,
    nextStepStage:    null,
    smsResult:        null,
    emailResult:      null,
    nextFollowUpAt:   null,
    error:            null
  };

  // ── 1. Find or create the MetaLead ────────────────────────────────────────
  const orConditions = [];
  if (email) orConditions.push({ email });
  if (phone) orConditions.push({ phone });

  let lead = orConditions.length
    ? await MetaLead.findOne({ $or: orConditions })
    : null;

  if (!lead) {
    const hash = buildIdentityHash(email, phone);
    lead = await MetaLead.create({
      leadUniqueId:      `HISTORICAL-META-${hash.toUpperCase()}`,
      metaLeadId:        `historical-meta-${hash}`,
      source:            'recovered_meta_lead',
      manualImport:      true,
      importBatchId:     IMPORT_BATCH_ID,
      firstName,
      lastName,
      phone,
      email,
      submissionTimestamp: originalCreatedAt,
      campaign: {
        formName: row.formName || ''
      },
      notes: `Historical Meta lead import ${IMPORT_BATCH_ID}. Original created: ${row.rawCreated}. Source: ${row.originalSource || 'Paid'}.`,
      leadStatus: 'in_progress',
      contactability: {
        smsAvailable:   !!phone,
        emailAvailable: !!email
      },
      followUp: {
        step: 0, smsStep: 0, emailStep: 0,
        status: 'active',
        smsEnabled:  !!phone,
        emailEnabled: !!email,
        lastFollowUpAt:    null,
        nextFollowUpAt:    null,
        nextSmsFollowUpAt: null,
        nextEmailFollowUpAt: null
      }
    });

    await logEvent(MetaLeadEvent, lead._id, 'lead_submitted', 'admin',
      'Historical Meta lead imported',
      `Batch ${IMPORT_BATCH_ID} — original created ${row.rawCreated}`,
      { importBatchId: IMPORT_BATCH_ID, originalSource: row.originalSource, formName: row.formName, rowNumber: row.rowNumber }
    );

    result.isNew = true;
  } else {
    result.isExisting = true;

    // Update metadata that was missing or empty without clobbering richer data.
    let updated = false;
    if (!lead.firstName && firstName)           { lead.firstName = firstName; updated = true; }
    if (!lead.lastName  && lastName)            { lead.lastName  = lastName;  updated = true; }
    if (!lead.importBatchId)                    { lead.importBatchId = IMPORT_BATCH_ID; updated = true; }
    if (!lead.submissionTimestamp && originalCreatedAt) { lead.submissionTimestamp = originalCreatedAt; updated = true; }
    if (!lead.campaign?.formName && row.formName) {
      lead.campaign = { ...(lead.campaign || {}), formName: row.formName };
      updated = true;
    }
    if (updated) await lead.save();
  }

  // ── 2. Check if already registered ───────────────────────────────────────
  if (lead.registrationStatus !== 'not_registered') {
    result.alreadyRegistered = true;
    result.nextStepStage = 'sequence_completed';
    return result;
  }

  // Also check the Pro collection (may have registered after this lead was created).
  const proConditions = [];
  if (email) proConditions.push({ email });
  if (phone) proConditions.push({ phone });
  if (lead.invitationCode) proConditions.push({ inviteCode: lead.invitationCode });
  if (proConditions.length) {
    const pro = await Pro.findOne({ $or: proConditions }).select('_id subscriptionStatus').lean();
    if (pro) {
      lead.registrationStatus = pro.subscriptionStatus === 'active' ? 'subscribed' : 'registered';
      lead.registrationProId  = pro._id;
      lead.leadStatus = lead.registrationStatus;
      lead.followUp.status = 'completed';
      lead.followUp.smsEnabled  = false;
      lead.followUp.emailEnabled = false;
      lead.followUp.nextSmsFollowUpAt  = null;
      lead.followUp.nextEmailFollowUpAt = null;
      lead.followUp.nextFollowUpAt = null;
      await lead.save();
      await logEvent(MetaLeadEvent, lead._id, 'account_created', 'registration',
        'Lead already registered', 'Detected during historical import', { proId: pro._id });
      result.alreadyRegistered = true;
      result.nextStepStage = 'already_registered';
      return result;
    }
  }

  // ── 3. Ensure invitation code ─────────────────────────────────────────────
  if (!lead.invitationCode) {
    if (!DRY_RUN) {
      await createInviteCode(InviteCode, lead, baseSettings);
      await lead.save();
      await logEvent(MetaLeadEvent, lead._id, 'invitation_issued', 'invitation',
        'Invitation code issued', lead.invitationCode,
        { inviteCodeId: lead.invitationCodeId, expiresAt: lead.invitationExpiresAt });
    }
  }

  // ── 4. Mark welcome as already sent (idempotent) ──────────────────────────
  // We push placeholder history entries so:
  //   a) the immediate step is treated as sent — reminders will be the next send
  //   b) sendLeadSms / sendLeadEmail idempotency checks skip 'immediate' stage
  //   c) the normal scheduler will not send a second welcome message
  const welcomeSentAt = originalCreatedAt;

  const hasSmsWelcome   = hasSmsEntryForStage(lead, 'immediate');
  const hasEmailWelcome = hasEmailEntryForStage(lead, 'immediate');
  let welcomeUpdated = false;

  if (!hasSmsWelcome && phone) {
    lead.smsHistory.push({
      direction:     'outbound',
      status:        'sent',
      body:          '[Historical import: original welcome SMS assumed sent before system integration]',
      templateKey:   'immediate',
      followUpStage: 'immediate',
      idempotencyKey: `${String(lead._id)}:sms:immediate:historical-assumed`,
      sentAt:        welcomeSentAt,
      updatedAt:     now
    });
    lead.followUp.initialSmsSentAt = welcomeSentAt;
    if (!lead.smsStatus || lead.smsStatus === 'pending') lead.smsStatus = 'sent';
    welcomeUpdated = true;
  }

  if (!hasEmailWelcome && email) {
    lead.emailHistory.push({
      messageId:     null,
      status:        'processed',
      subject:       '[Historical import: original welcome email assumed sent before system integration]',
      templateKey:   'immediate',
      followUpStage: 'immediate',
      idempotencyKey: `${String(lead._id)}:email:immediate:historical-assumed`,
      sentAt:        welcomeSentAt,
      updatedAt:     now
    });
    lead.followUp.initialEmailSentAt = welcomeSentAt;
    if (!lead.emailStatus || lead.emailStatus === 'pending') lead.emailStatus = 'processed';
    welcomeUpdated = true;
  }

  if (welcomeUpdated && !DRY_RUN) {
    await lead.save();
  }

  // ── 5. Determine the next unsent step for each channel ───────────────────
  const nextSmsStep   = phone  && !lead.smsOptOut ? getNextUnsentStep(lead, 'sms')   : null;
  const nextEmailStep = email
    && String(lead.emailStatus || '').toLowerCase() !== 'unsubscribed'
    ? getNextUnsentStep(lead, 'email')
    : null;

  // Pick the "primary" step for logging (SMS-first, then email-only).
  const primaryStep = nextSmsStep !== null ? nextSmsStep : nextEmailStep;

  if (primaryStep === null) {
    // All reminder steps already sent for both channels.
    result.nextStepStage = 'all_steps_sent';
    result.nextFollowUpAt = lead.followUp.nextFollowUpAt || null;
    if (!lead.historicalRecoveryCompleted && !DRY_RUN) {
      lead.historicalRecoveryCompleted = true;
      lead.followUp.status = lead.followUp.status === 'active' ? 'active' : lead.followUp.status;
      await lead.save();
    }
    return result;
  }

  result.nextStepIndex = primaryStep;
  result.nextStepStage = REMINDER_STAGES[primaryStep];

  // ── 6. Check suppression before sending ──────────────────────────────────
  const smsOptedOut = lead.smsOptOut;
  const emailUnsub  = String(lead.emailStatus || '').toLowerCase() === 'unsubscribed';

  // ── 7. Send next reminder ─────────────────────────────────────────────────
  //
  // We send the step determined per-channel independently.
  // One send each (SMS + email) — not all overdue steps at once.

  let smsSentOk   = false;
  let emailSentOk = false;

  if (!DRY_RUN) {
    // ── SMS ──────────────────────────────────────────────────────────────
    if (phone && !smsOptedOut && nextSmsStep !== null) {
      const stage      = REMINDER_STAGES[nextSmsStep];
      const templateKey = REMINDER_SMS_KEYS[nextSmsStep];
      const custom     = buildCustomSettings(baseSettings, nextSmsStep);

      try {
        const res = await sendLeadSms(lead, templateKey, custom, {
          stage,
          persist: false  // we will save the lead ourselves below
        });
        result.smsResult = res.skipped ? 'already_sent' : (res.success ? 'sent' : `failed: ${res.reason || res.error}`);
        smsSentOk = res.success && !res.skipped;
      } catch (err) {
        result.smsResult = `error: ${err.message}`;
      }
    } else if (!phone) {
      result.smsResult = 'unavailable_no_phone';
    } else if (smsOptedOut) {
      result.smsResult = 'skipped_opted_out';
    } else {
      result.smsResult = 'all_steps_sent';
    }

    // ── Email ─────────────────────────────────────────────────────────────
    if (email && !emailUnsub && nextEmailStep !== null) {
      const stage  = REMINDER_STAGES[nextEmailStep];
      const custom = buildCustomSettings(baseSettings, nextEmailStep);

      try {
        const res = await sendLeadEmail(lead, 'reminder', custom, {
          stage,
          persist: false
        });
        result.emailResult = res.skipped ? 'already_sent' : (res.success ? 'sent' : `failed: ${res.reason || res.error}`);
        emailSentOk = res.success && !res.skipped;
      } catch (err) {
        result.emailResult = `error: ${err.message}`;
      }
    } else if (!email) {
      result.emailResult = 'unavailable_no_email';
    } else if (emailUnsub) {
      result.emailResult = 'skipped_unsubscribed';
    } else {
      result.emailResult = 'all_steps_sent';
    }

  } else {
    // Dry run — report what would be sent
    result.smsResult   = phone && !smsOptedOut && nextSmsStep !== null   ? `dry_run_would_send_step_${nextSmsStep}` : (phone ? 'dry_run_opted_out_or_done' : 'dry_run_no_phone');
    result.emailResult = email && !emailUnsub && nextEmailStep !== null  ? `dry_run_would_send_step_${nextEmailStep}` : (email ? 'dry_run_unsubscribed_or_done' : 'dry_run_no_email');
  }

  // ── 8. Update follow-up state ─────────────────────────────────────────────
  if (!DRY_RUN) {
    const sentStep = primaryStep;
    const sentSmsStep   = nextSmsStep   !== null ? nextSmsStep   : Number(lead.followUp.smsStep   || 0);
    const sentEmailStep = nextEmailStep !== null ? nextEmailStep : Number(lead.followUp.emailStep || 0);

    // Advance step counters only for successful (non-skipped) sends.
    const newSmsStep   = (smsSentOk   ? sentSmsStep   + 1 : sentSmsStep);
    const newEmailStep = (emailSentOk ? sentEmailStep + 1 : sentEmailStep);

    lead.followUp.smsStep   = newSmsStep;
    lead.followUp.emailStep = newEmailStep;
    lead.followUp.step      = Math.max(newSmsStep, newEmailStep);

    // Schedule the next step: use NOW + delay so the normal scheduler
    // doesn't immediately fire all overdue historical steps.
    const nextStepTime = new Date(now.getTime() + NEXT_STEP_DELAY_MS);

    if (phone && !smsOptedOut && newSmsStep < REMINDER_STAGES.length) {
      lead.followUp.smsEnabled          = true;
      lead.followUp.nextSmsFollowUpAt   = nextStepTime;
      lead.followUp.lastSmsFollowUpAt   = smsSentOk ? now : (lead.followUp.lastSmsFollowUpAt || null);
    } else {
      lead.followUp.smsEnabled          = false;
      lead.followUp.nextSmsFollowUpAt   = null;
    }

    if (email && !emailUnsub && newEmailStep < REMINDER_STAGES.length) {
      lead.followUp.emailEnabled          = true;
      lead.followUp.nextEmailFollowUpAt   = nextStepTime;
      lead.followUp.lastEmailFollowUpAt   = emailSentOk ? now : (lead.followUp.lastEmailFollowUpAt || null);
    } else {
      lead.followUp.emailEnabled          = false;
      lead.followUp.nextEmailFollowUpAt   = null;
    }

    const hasActiveChannel = (lead.followUp.smsEnabled && !!lead.followUp.nextSmsFollowUpAt)
      || (lead.followUp.emailEnabled && !!lead.followUp.nextEmailFollowUpAt);

    lead.followUp.status      = hasActiveChannel ? 'active' : 'completed';
    lead.followUp.lastFollowUpAt = now;
    lead.contactability = {
      smsAvailable:   lead.followUp.smsEnabled,
      emailAvailable: lead.followUp.emailEnabled
    };
    lead.historicalRecoveryCompleted = true;
    syncLegacyFollowUpPointers(lead);

    await lead.save();

    await logEvent(MetaLeadEvent, lead._id, 'historical_recovery_completed', 'system',
      'Historical recovery follow-up sent',
      `Step ${sentStep} (${REMINDER_STAGES[sentStep]}) dispatched during batch ${IMPORT_BATCH_ID}`,
      {
        importBatchId: IMPORT_BATCH_ID,
        sentStep,
        smsResult:   result.smsResult,
        emailResult: result.emailResult,
        nextSmsFollowUpAt:   lead.followUp.nextSmsFollowUpAt,
        nextEmailFollowUpAt: lead.followUp.nextEmailFollowUpAt
      }
    );
  }

  result.nextFollowUpAt = lead.followUp.nextFollowUpAt || null;
  return result;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (DRY_RUN) {
    console.log('[HISTORICAL_META_IMPORT] *** DRY RUN MODE — no writes, no messages ***\n');
  }

  // ── DB connect ────────────────────────────────────────────────────────────
  if (!process.env.MONGODB_URI) {
    console.error('[HISTORICAL_META_IMPORT] FATAL: MONGODB_URI is not set.');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);

  // ── Load models and service functions AFTER connect ────────────────────────
  const MetaLead      = require('../models/MetaLead');
  const MetaLeadEvent = require('../models/MetaLeadEvent');
  const InviteCode    = require('../models/InviteCode');
  const Pro           = require('../models/Pro');
  const { getSettings, sendLeadSms, sendLeadEmail } = require('../services/metaLeadAutomationService');

  if (!DRY_RUN) {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('[HISTORICAL_META_IMPORT] WARNING: SENDGRID_API_KEY not set — email sends will fail.');
    } else {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }

  const baseSettings = await getSettings();
  const now          = new Date();

  // ── Pre-process: sort chronologically (earliest first), skip invalid rows,
  //    and detect intra-batch duplicates by normalized email / phone.
  const sortedRows = [...SUPPLIED_ROWS].sort((a, b) => {
    const da = parseSuppliedDate(a.rawCreated) || new Date(0);
    const db = parseSuppliedDate(b.rawCreated) || new Date(0);
    return da - db;
  });

  const seenEmails = new Map();   // normalizedEmail → rowNumber of first occurrence
  const seenPhones = new Map();   // normalizedPhone → rowNumber of first occurrence

  const dedupedRows    = [];  // unique contacts to process
  let   invalidSkipped = 0;
  let   duplicateConsolidated = 0;

  for (const row of sortedRows) {
    if (row.invalidSample) { invalidSkipped++; continue; }

    const email = normalizeEmail(row.email);
    const phone = normalizePhone(row.phone);

    if (!email && !phone) { invalidSkipped++; continue; }

    // Intra-batch duplicate detection
    const dupEmail = email && seenEmails.has(email);
    const dupPhone = phone && seenPhones.has(phone);

    if (dupEmail || dupPhone) {
      duplicateConsolidated++;
      console.log(
        `[HISTORICAL_META_IMPORT] Row ${row.rowNumber} (${row.name}) consolidated into earlier row ` +
        `${dupEmail ? seenEmails.get(email) : seenPhones.get(phone)}.`
      );
      continue;
    }

    if (email) seenEmails.set(email, row.rowNumber);
    if (phone) seenPhones.set(phone, row.rowNumber);
    dedupedRows.push(row);
  }

  const uniqueContacts = dedupedRows.length;

  // ── Output header metrics ─────────────────────────────────────────────────
  console.log(`[HISTORICAL_META_IMPORT] Supplied rows: ${SUPPLIED_ROWS.length}`);
  console.log(`[HISTORICAL_META_IMPORT] Invalid sample rows skipped: ${invalidSkipped}`);
  console.log(`[HISTORICAL_META_IMPORT] Duplicate rows consolidated: ${duplicateConsolidated}`);
  console.log(`[HISTORICAL_META_IMPORT] Expected unique contacts: ${uniqueContacts}`);
  console.log('');

  // ── Process each unique contact ───────────────────────────────────────────
  let countCreated     = 0;
  let countExisting    = 0;
  let countRegistered  = 0;
  let countUnsubSkipped = 0;
  let countSmsSent     = 0;
  let countEmailSent   = 0;
  let countSmsUnavail  = 0;
  let countSmsFailed   = 0;
  let countEmailFailed = 0;
  let countActiveLeft  = 0;

  const contactResults = [];

  for (const row of dedupedRows) {
    let result;
    try {
      result = await processOneLead({
        row,
        MetaLead,
        MetaLeadEvent,
        InviteCode,
        Pro,
        sendLeadSms,
        sendLeadEmail,
        baseSettings,
        now
      });
    } catch (err) {
      console.error(`[HISTORICAL_META_IMPORT] ERROR processing ${row.name}: ${err.message}`);
      result = {
        name:          row.name,
        maskedEmail:   maskEmail(normalizeEmail(row.email)),
        maskedPhone:   maskPhone(normalizePhone(row.phone)),
        isNew:         false,
        isExisting:    false,
        alreadyRegistered: false,
        smsUnavailable: false,
        nextStepIndex: null,
        nextStepStage: 'error',
        smsResult:     `error: ${err.message}`,
        emailResult:   `error: ${err.message}`,
        nextFollowUpAt: null,
        error:         err.message
      };
    }

    // Tally metrics
    if (result.isNew)      countCreated++;
    if (result.isExisting) countExisting++;
    if (result.alreadyRegistered) {
      countRegistered++;
    } else {
      if (result.smsUnavailable) {
        countSmsUnavail++;
      } else if (result.smsResult === 'sent')       countSmsSent++;
      else if (String(result.smsResult || '').startsWith('fail'))  countSmsFailed++;
      else if (String(result.smsResult || '').startsWith('error')) countSmsFailed++;
      else if (result.smsResult === 'skipped_opted_out') countUnsubSkipped++;

      if (result.emailResult === 'sent')      countEmailSent++;
      else if (String(result.emailResult || '').startsWith('fail'))  countEmailFailed++;
      else if (String(result.emailResult || '').startsWith('error')) countEmailFailed++;
      else if (result.emailResult === 'skipped_unsubscribed') countUnsubSkipped++;

      if (result.nextFollowUpAt && new Date(result.nextFollowUpAt) > now) countActiveLeft++;
    }

    contactResults.push(result);
  }

  // ── Summary metrics ───────────────────────────────────────────────────────
  console.log(`[HISTORICAL_META_IMPORT] Created: ${countCreated}`);
  console.log(`[HISTORICAL_META_IMPORT] Existing updated: ${countExisting}`);
  console.log(`[HISTORICAL_META_IMPORT] Already registered: ${countRegistered}`);
  console.log(`[HISTORICAL_META_IMPORT] Unsubscribed skipped: ${countUnsubSkipped}`);
  console.log(`[HISTORICAL_META_IMPORT] SMS sent: ${countSmsSent}`);
  console.log(`[HISTORICAL_META_IMPORT] Email sent: ${countEmailSent}`);
  console.log(`[HISTORICAL_META_IMPORT] SMS unavailable: ${countSmsUnavail}`);
  console.log(`[HISTORICAL_META_IMPORT] SMS failed: ${countSmsFailed}`);
  console.log(`[HISTORICAL_META_IMPORT] Email failed: ${countEmailFailed}`);
  console.log(`[HISTORICAL_META_IMPORT] Active follow-ups remaining: ${countActiveLeft}`);
  console.log('');

  // ── Per-contact safe output ────────────────────────────────────────────────
  console.log('─'.repeat(72));
  console.log('Per-contact results (invite codes and full contact info are masked):');
  console.log('─'.repeat(72));

  for (const r of contactResults) {
    const outcome    = r.alreadyRegistered ? 'REGISTERED' : (r.isNew ? 'CREATED' : 'EXISTING');
    const stepLabel  = r.nextStepStage || 'N/A';
    const smsLabel   = r.smsResult    || (r.smsUnavailable ? 'no_phone' : 'N/A');
    const emailLabel = r.emailResult  || 'N/A';
    const nextAt     = r.nextFollowUpAt ? new Date(r.nextFollowUpAt).toISOString() : 'N/A';

    console.log(`  ${r.name}`);
    console.log(`    Email:          ${r.maskedEmail}`);
    console.log(`    Phone:          ${r.maskedPhone}`);
    console.log(`    Outcome:        ${outcome}`);
    console.log(`    Next step:      ${stepLabel}`);
    console.log(`    SMS:            ${smsLabel}`);
    console.log(`    Email:          ${emailLabel}`);
    console.log(`    Next follow-up: ${nextAt}`);
    console.log(`    Registered:     ${r.alreadyRegistered}`);
    if (r.error) console.log(`    Error:          ${r.error}`);
    console.log('');
  }

  await mongoose.disconnect();
  console.log('[HISTORICAL_META_IMPORT] Complete.');
}

main().catch(async (err) => {
  console.error(`[HISTORICAL_META_IMPORT] FATAL: ${err.message}`);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
