const crypto = require('crypto');
const axios = require('axios');
const sgMail = require('@sendgrid/mail');

const AdminSettings = require('../models/AdminSettings');
const InviteCode = require('../models/InviteCode');
const MetaLead = require('../models/MetaLead');
const MetaLeadEvent = require('../models/MetaLeadEvent');
const Notification = require('../models/Notification');
const Pro = require('../models/Pro');
const { sendSms, normalizeE164 } = require('../utils/twilio');
const { sendOwnerNotification } = require('../utils/smsSender');

const STOP_KEYWORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END']);
const START_KEYWORDS = new Set(['START', 'YES', 'UNSTOP']);
const CANONICAL_PRO_SIGNUP_URL = 'https://fixloapp.com/pros';

/** Regex for a valid Twilio Message SID. Exported so route/retry code can reuse it. */
const TWILIO_SID_REGEX = /^SM[a-fA-F0-9]{32}$/;
const META_LEAD_STATUS_CALLBACK_PATH = '/webhook/twilio/meta-leads/status';
const INVALID_STATUS_CALLBACK_PATTERNS = [
  /statuscallback/i,
  /status callback/i,
  /callback url/i,
  /invalid callback/i,
  /relative url/i,
  /absolute url/i,
  /must be a valid url/i,
  /must be absolute/i
];
const SMS_STATUS_PRECEDENCE = {
  pending: 0,
  queued: 1,
  sent: 2,
  failed: 3,
  undelivered: 3,
  delivered: 4,
  opted_out: 5
};
const FOLLOW_UP_SCHEDULE_HOURS = [24, 72, 168, 336];

let sendgridReady = false;
function ensureSendGrid() {
  if (sendgridReady) return true;
  if (!process.env.SENDGRID_API_KEY) return false;
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  sendgridReady = true;
  return true;
}

function getPageToken(pageId) {
  const defaultToken = process.env.META_PAGE_ACCESS_TOKEN || '';
  if (!process.env.META_PAGE_ACCESS_TOKENS) return defaultToken;
  try {
    const map = JSON.parse(process.env.META_PAGE_ACCESS_TOKENS);
    return map?.[pageId] || defaultToken;
  } catch {
    return defaultToken;
  }
}

function getAnyMetaAccessToken() {
  const defaultToken = process.env.META_PAGE_ACCESS_TOKEN || '';
  if (defaultToken) return defaultToken;
  if (!process.env.META_PAGE_ACCESS_TOKENS) return '';
  try {
    const map = JSON.parse(process.env.META_PAGE_ACCESS_TOKENS);
    return Object.values(map || {}).find((value) => String(value || '').trim()) || '';
  } catch {
    return '';
  }
}

function getDefaultPageId() {
  if (process.env.META_PAGE_ID && isNumericMetaId(String(process.env.META_PAGE_ID))) {
    return String(process.env.META_PAGE_ID);
  }
  if (!process.env.META_PAGE_ACCESS_TOKENS) return '';
  try {
    const map = JSON.parse(process.env.META_PAGE_ACCESS_TOKENS);
    return Object.keys(map || {}).find((key) => isNumericMetaId(String(key))) || '';
  } catch {
    return '';
  }
}

function normalizeProSignupLink(value) {
  const raw = String(value || '').trim();
  if (!raw) return CANONICAL_PRO_SIGNUP_URL;
  if (/^https:\/\/(?:www\.)?fixloapp\.com\/pros(?:\/signup)?\/?$/i.test(raw)) {
    return CANONICAL_PRO_SIGNUP_URL;
  }
  return raw;
}

function normalizePhone(phone) {
  if (!phone) return '';
  const normalized = normalizeE164(phone);
  return normalized || phone.trim();
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isNumericMetaId(value) {
  return typeof value === 'string' && /^\d{5,40}$/.test(value);
}

function buildDefaults() {
  return {
    enabled: true,
    invitationCodePrefix: 'FIXLO',
    invitationCodeLength: 8,
    invitationCodeExpiryDays: 30,
    signupLink: normalizeProSignupLink(process.env.PRO_SIGNUP_URL || CANONICAL_PRO_SIGNUP_URL),
    supportEmail: process.env.SENDGRID_REPLY_TO_EMAIL || 'support@fixloapp.com',
    supportPhone: process.env.SUPPORT_PHONE || '',
    followUpTimingsHours: FOLLOW_UP_SCHEDULE_HOURS,
    automaticReminders: true,
    ownerNotifications: {
      newLead: true,
      registered: true,
      invitationRedeemed: true,
      subscribed: true
    },
    smsTemplates: {
      immediate: 'Hi {{firstName}}! Thanks for your interest in joining Fixlo. Your invitation code is {{invitationCode}}. Use it during signup: {{signupLink}}. Reply STOP to opt out.',
      reminder1: 'Hi {{firstName}}, quick reminder from Fixlo. Your invitation code {{invitationCode}} is ready for {{trade}} pros. Sign up here: {{signupLink}}. Reply STOP to opt out.',
      reminder2: 'Hi {{firstName}}, we would love to welcome you to Fixlo{{tradeSuffix}}. Your code {{invitationCode}} is still active: {{signupLink}}. Reply STOP to opt out.',
      reminder3: 'Hi {{firstName}}, opportunities are waiting on Fixlo{{tradeSuffix}}. Use code {{invitationCode}} to join: {{signupLink}}. Reply STOP to opt out.',
      finalReminder: 'Final reminder from Fixlo, {{firstName}}. Your invitation code {{invitationCode}} expires soon: {{signupLink}}. Reply STOP to opt out.',
      unsubscribed: 'You have been unsubscribed from Fixlo SMS updates. Reply START to subscribe again.',
      resumed: 'You are subscribed again to Fixlo SMS updates. Reply STOP to unsubscribe.'
    },
    emailTemplates: {
      immediateSubject: 'Welcome to Fixlo — Your Invitation Code Inside',
      immediateBody: '<p>Hi {{firstName}},</p><p>Thanks for your interest in joining Fixlo.</p><p><strong>Your invitation code:</strong> {{invitationCode}}</p><p>Use this code during signup: <a href="{{signupLink}}">Join Fixlo</a></p><p>Benefits of Fixlo:</p><ul><li>Trusted homeowner leads</li><li>Flexible growth tools</li><li>Priority support</li></ul><p>Need help? Contact {{supportEmail}}</p><p>— The Fixlo Team</p>',
      reminderSubject: 'Reminder: Your Fixlo invitation is waiting',
      reminderBody: '<p>Hi {{firstName}},</p><p>Your Fixlo invitation code is still active: <strong>{{invitationCode}}</strong></p><p>Complete signup here: <a href="{{signupLink}}">Join Fixlo</a></p><p>Trade: {{trade}}</p><p>— The Fixlo Team</p>'
    }
  };
}

async function getSettings() {
  const defaults = buildDefaults();
  const settings = await AdminSettings.findOne({ _singleton: 'admin' }).lean();
  const saved = settings?.metaLeadAutomation || {};
  const merged = {
    ...defaults,
    ...saved,
    ownerNotifications: { ...defaults.ownerNotifications, ...(saved.ownerNotifications || {}) },
    smsTemplates: { ...defaults.smsTemplates, ...(saved.smsTemplates || {}) },
    emailTemplates: { ...defaults.emailTemplates, ...(saved.emailTemplates || {}) },
    followUpTimingsHours: Array.isArray(saved.followUpTimingsHours) && saved.followUpTimingsHours.length === 4
      ? saved.followUpTimingsHours.map((n) => Number(n))
      : defaults.followUpTimingsHours
  };
  merged.signupLink = normalizeProSignupLink(merged.signupLink);
  return merged;
}

async function saveSettings(nextSettings = {}) {
  const current = await getSettings();
  const merged = {
    ...current,
    ...nextSettings,
    ownerNotifications: { ...current.ownerNotifications, ...(nextSettings.ownerNotifications || {}) },
    smsTemplates: { ...current.smsTemplates, ...(nextSettings.smsTemplates || {}) },
    emailTemplates: { ...current.emailTemplates, ...(nextSettings.emailTemplates || {}) }
  };
  merged.signupLink = normalizeProSignupLink(merged.signupLink);

  await AdminSettings.findOneAndUpdate(
    { _singleton: 'admin' },
    { $set: { metaLeadAutomation: merged, updatedAt: new Date() } },
    { upsert: true }
  );

  return merged;
}

function template(str = '', vars = {}) {
  return String(str).replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const value = vars[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

async function logEvent(leadId, eventType, channel, title, description = '', metadata = {}) {
  await MetaLeadEvent.create({
    leadId,
    eventType,
    channel,
    title,
    description,
    metadata,
    occurredAt: new Date()
  });
}

async function notifyAdmins(type, title, message, relatedId, relatedType = 'MetaLead') {
  const admins = await Pro.find({ role: 'admin' }).select('_id').limit(100);
  if (!admins.length) return;
  await Notification.insertMany(
    admins.map((admin) => ({
      userId: admin._id,
      userRole: 'admin',
      type,
      title,
      message,
      relatedId,
      relatedType,
      actionUrl: relatedId ? `/dashboard/admin/lead-automation/${relatedId}` : '/dashboard/admin/lead-automation'
    }))
  );
}

async function notifyOwnerIfEnabled(lead, settings, reason) {
  if (!lead?.phone) return;
  const map = {
    new_lead: 'newLead',
    registered: 'registered',
    invitation_redeemed: 'invitationRedeemed',
    subscribed: 'subscribed'
  };
  if (!settings.ownerNotifications?.[map[reason]]) return;

  const ownerPhone = process.env.OWNER_PHONE || process.env.OWNER_PHONE_NUMBER;
  if (!ownerPhone) return;

  await sendOwnerNotification(ownerPhone, {
    _id: lead._id,
    trade: lead.trade || 'General Services',
    city: lead.city || 'Unknown',
    state: lead.state || '',
    address: `${lead.city || ''} ${lead.state || ''}`.trim(),
    name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.email || 'Meta Lead',
    phone: lead.phone,
    description: `Meta lead event: ${reason}`
  });
}

function buildMessageVars(lead, settings) {
  const firstName = lead.firstName || 'there';
  const trade = lead.trade || 'your trade';
  return {
    firstName,
    lastName: lead.lastName || '',
    trade,
    tradeSuffix: lead.trade ? ` for ${lead.trade}` : '',
    invitationCode: lead.invitationCode,
    signupLink: settings.signupLink,
    supportEmail: settings.supportEmail,
    supportPhone: settings.supportPhone || ''
  };
}

function isAbsoluteUrl(value = '') {
  return /^https?:\/\//i.test(String(value).trim());
}

function stripTrailingSlashes(value = '') {
  return String(value || '').trim().replace(/\/+$/, '');
}

function normalizeTwilioSid(value) {
  const sid = String(value || '').trim();
  return TWILIO_SID_REGEX.test(sid) ? sid : null;
}

function hasValidTwilioSid(value) {
  return normalizeTwilioSid(value) !== null;
}

function getLeadDisplayName(lead = {}) {
  return `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.email || String(lead._id || '');
}

function getInitialOutboundSmsHistory(lead = {}) {
  return (lead.smsHistory || []).filter((item) => item.direction === 'outbound' && item.templateKey === 'immediate');
}

function findInitialOutboundSmsWithSid(lead = {}) {
  return getInitialOutboundSmsHistory(lead).find((item) => hasValidTwilioSid(item.messageSid)) || null;
}

function wasInvalidStatusCallbackFailure(historyItem = {}) {
  if (!historyItem || hasValidTwilioSid(historyItem.messageSid)) return false;
  const status = String(historyItem.status || '').toLowerCase();
  if (status !== 'failed') return false;
  const haystack = `${historyItem.errorMessage || ''} ${historyItem.errorCode || ''}`;
  return INVALID_STATUS_CALLBACK_PATTERNS.some((pattern) => pattern.test(haystack));
}

function getRetryBlockReason(lead = {}) {
  const initialHistory = getInitialOutboundSmsHistory(lead);
  if (!initialHistory.length) return 'initial_sms_not_found';
  if (findInitialOutboundSmsWithSid(lead)) return 'existing_valid_sid';

  const failedEntries = initialHistory.filter((item) => String(item.status || '').toLowerCase() === 'failed');
  if (!failedEntries.length) return 'initial_sms_not_failed';

  const hasAmbiguousNonFailedAttempt = initialHistory.some((item) => !hasValidTwilioSid(item.messageSid)
    && String(item.status || '').toLowerCase() !== 'failed');
  if (hasAmbiguousNonFailedAttempt) return 'ambiguous_existing_attempt';

  return failedEntries.some((item) => wasInvalidStatusCallbackFailure(item))
    ? null
    : 'failure_not_invalid_status_callback_url';
}

function shouldPromoteLeadSmsStatus(currentStatus, nextStatus) {
  if (!nextStatus) return false;
  const currentRank = SMS_STATUS_PRECEDENCE[String(currentStatus || '').toLowerCase()] ?? 0;
  const nextRank = SMS_STATUS_PRECEDENCE[String(nextStatus || '').toLowerCase()] ?? 0;
  return nextRank >= currentRank;
}

/**
 * Build the absolute HTTPS StatusCallback URL for Twilio.
 *
 * Priority order:
 *   1. BACKEND_PUBLIC_URL  (preferred — set this in Render)
 *   2. META_LEAD_SMS_STATUS_CALLBACK_URL  (legacy explicit override)
 *   3. SERVER_BASE_URL  (legacy fallback)
 *
 * Returns null when no absolute URL can be constructed so callers can
 * omit the callback rather than pass a relative path that Twilio rejects.
 */
function getStatusCallbackUrl() {
  const explicit = stripTrailingSlashes(process.env.META_LEAD_SMS_STATUS_CALLBACK_URL);
  if (isAbsoluteUrl(explicit)) {
    return explicit;
  }

  const backendBaseUrl = stripTrailingSlashes(process.env.BACKEND_PUBLIC_URL);
  if (isAbsoluteUrl(backendBaseUrl)) {
    return `${backendBaseUrl}${META_LEAD_STATUS_CALLBACK_PATH}`;
  }

  const fallbackBaseUrl = stripTrailingSlashes(process.env.SERVER_BASE_URL);
  if (isAbsoluteUrl(fallbackBaseUrl)) {
    return `${fallbackBaseUrl}${META_LEAD_STATUS_CALLBACK_PATH}`;
  }

  // No absolute base available — log and return null.
  if (process.env.NODE_ENV === 'production') {
    console.error('[TWILIO_CONFIG] ERROR: BACKEND_PUBLIC_URL is not set. Cannot build an absolute StatusCallback URL.');
    console.error('[TWILIO_CONFIG] Set BACKEND_PUBLIC_URL=https://fixloapp.onrender.com in your Render environment.');
  } else {
    console.warn('[TWILIO_CONFIG] BACKEND_PUBLIC_URL not set; StatusCallback will be omitted for this send.');
  }
  return null;
}

function validateTwilioSignature({ authToken = process.env.TWILIO_AUTH_TOKEN, signature = '', url = '', params = {} } = {}) {
  if (!authToken) return true;
  if (!signature || !url) return false;

  const sortedKeys = Object.keys(params || {}).sort();
  const stringToSign = `${url}${sortedKeys.map((key) => `${key}${params[key]}`).join('')}`;
  const expected = crypto
    .createHmac('sha1', authToken)
    .update(Buffer.from(stringToSign, 'utf8'))
    .digest('base64');

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

// ── Startup diagnostics ──────────────────────────────────────────────────────
(function logTwilioConfig() {
  const callbackUrl = getStatusCallbackUrl();
  const hasUrl = Boolean(callbackUrl);
  console.log(`[TWILIO_CONFIG] Public backend URL configured: ${hasUrl ? 'yes' : 'no'}`);
  if (hasUrl) {
    console.log(`[TWILIO_CONFIG] Meta lead callback URL: ${callbackUrl}`);
  }
  // Route mount confirmation is logged by the route file on startup.
})();

async function sendLeadSms(lead, templateKey, settings, force = false) {
  if (!lead.phone) return { success: false, reason: 'missing_phone' };
  if (lead.smsOptOut && !force) return { success: false, reason: 'opted_out' };

  const vars = buildMessageVars(lead, settings);
  const body = template(settings.smsTemplates?.[templateKey] || '', vars);
  if (!body.trim()) return { success: false, reason: 'missing_template' };

  const callbackUrl = getStatusCallbackUrl();
  const smsOptions = {};
  if (callbackUrl) {
    smsOptions.statusCallback = callbackUrl;
    console.log(`[META_SMS] Status callback URL valid: ${callbackUrl}`);
  } else {
    console.warn(`[META_SMS] Sending SMS without StatusCallback (BACKEND_PUBLIC_URL not configured)`);
  }

  console.log(`[META_SMS] Sending initial SMS to lead ${lead._id} template=${templateKey}`);

  try {
    const twilioRes = await sendSms(lead.phone, body, smsOptions);
    console.log(`[META_SMS] Twilio accepted SID=${twilioRes.sid}`);
    lead.smsStatus = 'sent';
    lead.smsHistory.push({
      messageSid: twilioRes.sid,
      direction: 'outbound',
      status: twilioRes.status || 'sent',
      body,
      templateKey,
      sentAt: new Date(),
      updatedAt: new Date()
    });
    await lead.save();

    await logEvent(lead._id, 'sms_sent', 'sms', 'SMS sent', `Template ${templateKey}`, {
      sid: twilioRes.sid,
      status: twilioRes.status,
      templateKey
    });

    return { success: true, sid: twilioRes.sid };
  } catch (error) {
    console.error(`[META_SMS] Twilio rejected error=${error.message} code=${error.code || 'N/A'}`);
    lead.smsStatus = 'failed';
    lead.smsHistory.push({
      direction: 'outbound',
      status: 'failed',
      body,
      templateKey,
      sentAt: new Date(),
      updatedAt: new Date(),
      errorCode: error.code ? String(error.code) : null,
      errorMessage: error.message
    });
    await lead.save();

    await logEvent(lead._id, 'sms_failed', 'sms', 'SMS failed', error.message, {
      templateKey,
      errorCode: error.code || null
    });

    return { success: false, error: error.message };
  }
}

async function sendLeadEmail(lead, templateKey, settings) {
  if (!lead.email) return { success: false, reason: 'missing_email' };
  if (!ensureSendGrid()) return { success: false, reason: 'sendgrid_not_configured' };

  const vars = buildMessageVars(lead, settings);
  const subjectTemplate = templateKey === 'immediate' ? settings.emailTemplates?.immediateSubject : settings.emailTemplates?.reminderSubject;
  const bodyTemplate = templateKey === 'immediate' ? settings.emailTemplates?.immediateBody : settings.emailTemplates?.reminderBody;

  const subject = template(subjectTemplate || '', vars);
  const html = template(bodyTemplate || '', vars);

  if (!subject || !html) return { success: false, reason: 'missing_template' };

  try {
    const msg = {
      to: lead.email,
      from: process.env.SENDGRID_FROM_EMAIL || 'notifications@fixloapp.com',
      replyTo: settings.supportEmail,
      subject,
      html,
      customArgs: {
        metaLeadId: String(lead._id),
        templateKey
      }
    };

    const [response] = await sgMail.send(msg);
    const messageId = response?.headers?.['x-message-id'] || null;

    lead.emailStatus = 'processed';
    lead.emailHistory.push({
      messageId,
      status: 'processed',
      subject,
      templateKey,
      sentAt: new Date(),
      updatedAt: new Date()
    });
    await lead.save();

    await logEvent(lead._id, 'email_sent', 'email', 'Email sent', `Template ${templateKey}`, {
      messageId,
      templateKey
    });

    return { success: true, messageId };
  } catch (error) {
    lead.emailStatus = 'pending';
    lead.emailHistory.push({
      messageId: null,
      status: 'dropped',
      subject,
      templateKey,
      sentAt: new Date(),
      updatedAt: new Date(),
      reason: error.message
    });
    await lead.save();

    await logEvent(lead._id, 'email_failed', 'email', 'Email failed', error.message, { templateKey });

    return { success: false, error: error.message };
  }
}

function reminderTemplateByStep(step) {
  if (step === 0) return 'reminder1';
  if (step === 1) return 'reminder2';
  if (step === 2) return 'reminder3';
  return 'finalReminder';
}

function getNextFollowUpAt(createdAt, timings, step) {
  const hourOffset = timings[step];
  if (hourOffset === undefined) return null;
  return new Date(new Date(createdAt).getTime() + (hourOffset * 60 * 60 * 1000));
}

async function markSequenceStopped(lead, reason) {
  lead.followUp.status = 'stopped';
  lead.followUp.stoppedReason = reason;
  lead.followUp.nextFollowUpAt = null;
  await lead.save();

  await logEvent(lead._id, 'followup_stopped', 'system', 'Follow-up stopped', reason);
}

async function maybeSyncRegistration(lead, settings) {
  if (lead.registrationStatus !== 'not_registered') return;

  const phone = normalizePhone(lead.phone);
  const query = { $or: [] };
  if (lead.email) query.$or.push({ email: lead.email.toLowerCase() });
  if (phone) query.$or.push({ phone });
  if (!query.$or.length) return;

  const pro = await Pro.findOne(query);
  if (!pro) return;

  const newStatus = pro.subscriptionStatus === 'active' ? 'subscribed' : 'registered';
  const wasNotRegistered = lead.registrationStatus === 'not_registered';

  lead.registrationStatus = newStatus;
  lead.registrationProId = pro._id;
  lead.leadStatus = newStatus === 'subscribed' ? 'subscribed' : 'registered';
  await lead.save();

  if (wasNotRegistered) {
    await markSequenceStopped(lead, 'account_created');
    await logEvent(lead._id, 'account_created', 'registration', 'Account created', 'Lead converted to Fixlo pro', {
      proId: pro._id,
      status: newStatus
    });

    await notifyOwnerIfEnabled(lead, settings, newStatus === 'subscribed' ? 'subscribed' : 'registered');
    await notifyAdmins('new_lead', 'Meta lead converted', `${lead.firstName || 'Lead'} ${lead.lastName || ''} is now ${newStatus}.`, lead._id);
  }
}

async function syncInvitationRedemption(lead, settings) {
  if (!lead.invitationCode || lead.invitationRedeemedAt) return;

  const invite = await InviteCode.findOne({ code: lead.invitationCode, redeemed: true });
  if (!invite) return;

  const latestRedemption = invite.redeemedByList?.[invite.redeemedByList.length - 1] || null;

  lead.invitationRedeemedAt = invite.redeemedAt || latestRedemption?.redeemedAt || new Date();
  if (invite.redeemedByUserId) {
    lead.invitationRedeemedByProId = invite.redeemedByUserId;
    lead.registrationProId = invite.redeemedByUserId;
  }
  await lead.save();

  await markSequenceStopped(lead, 'invitation_redeemed');
  await logEvent(lead._id, 'invitation_redeemed', 'invitation', 'Invitation redeemed', lead.invitationCode, {
    inviteCodeId: invite._id,
    redeemedBy: invite.redeemedByUserId || null
  });

  await notifyOwnerIfEnabled(lead, settings, 'invitation_redeemed');
  await notifyAdmins('new_lead', 'Invitation redeemed', `Invitation code ${lead.invitationCode} was redeemed.`, lead._id);
}

async function processLeadFollowUp(lead, settings) {
  if (!settings.automaticReminders) return;
  if (lead.followUp.status !== 'active') return;
  if (lead.registrationStatus !== 'not_registered') return;
  if (lead.smsOptOut) return;

  const nextStep = Number(lead.followUp.step || 0);
  const templateKey = reminderTemplateByStep(nextStep);

  await sendLeadSms(lead, templateKey, settings);
  await sendLeadEmail(lead, 'reminder', settings);

  lead.followUp.lastFollowUpAt = new Date();
  lead.followUp.step = nextStep + 1;

  const nextAt = getNextFollowUpAt(lead.createdAt, settings.followUpTimingsHours, lead.followUp.step);
  if (nextAt) {
    lead.followUp.nextFollowUpAt = nextAt;
  } else {
    lead.followUp.status = 'completed';
    lead.followUp.nextFollowUpAt = null;
    lead.leadStatus = 'closed';
  }
  await lead.save();

  await logEvent(lead._id, 'followup_sent', 'system', 'Automated follow-up sent', `Step ${lead.followUp.step}`, {
    templateKey,
    nextFollowUpAt: lead.followUp.nextFollowUpAt
  });
}

async function createUniqueInvitationCode(settings, maxAttempts = 20) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const prefix = settings.invitationCodePrefix || 'FIXLO';
  const length = Math.min(10, Math.max(8, Number(settings.invitationCodeLength || 8)));

  for (let i = 0; i < maxAttempts; i++) {
    const random = Array.from({ length }, () => chars[crypto.randomInt(chars.length)]).join('');
    const code = `${prefix}-${random}`;
    const exists = await InviteCode.findOne({ code }).lean();
    if (!exists) return code;
  }

  throw new Error('Unable to generate unique invitation code');
}

async function createInviteForLead(lead, settings) {
  const code = await createUniqueInvitationCode(settings);
  const expiresAt = new Date(Date.now() + (Number(settings.invitationCodeExpiryDays || 30) * 24 * 60 * 60 * 1000));

  const invite = await InviteCode.create({
    code,
    membershipDuration: '30days',
    planType: 'promo',
    usesAllowed: 1,
    usesRemaining: 1,
    assignedName: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
    assignedEmail: lead.email || undefined,
    assignedPhone: lead.phone || undefined,
    assignedState: lead.state || undefined,
    assignedTrade: lead.trade || undefined,
    notes: `Meta lead automation for ${lead.metaLeadId}`,
    expiresAt,
    createdByEmail: 'meta-lead-automation@system.local'
  });

  lead.invitationCode = code;
  lead.invitationCodeId = invite._id;
  lead.invitationExpiresAt = expiresAt;
  await lead.save();

  await logEvent(lead._id, 'invitation_issued', 'invitation', 'Invitation code issued', code, {
    inviteCodeId: invite._id,
    expiresAt
  });

  return invite;
}

function sourceFromPayload(payload = {}, fields = {}) {
  const candidates = [
    payload?.platform,
    fields?.platform,
    fields?.lead_source,
    fields?.source
  ].filter(Boolean).join(' ').toLowerCase();

  if (candidates.includes('insta')) return 'instagram';
  if (candidates.includes('facebook')) return 'facebook';
  return 'meta_unknown';
}

function mapFieldData(fieldData = []) {
  const out = {};
  fieldData.forEach((entry) => {
    const key = String(entry?.name || '').toLowerCase();
    const value = Array.isArray(entry?.values) ? entry.values[0] : entry?.value;
    out[key] = value;
  });
  return out;
}

function pickField(fields, keys = []) {
  for (const key of keys) {
    if (fields[key] !== undefined && fields[key] !== null && fields[key] !== '') {
      return String(fields[key]).trim();
    }
  }
  return '';
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function buildLeadFullName(fields = {}) {
  const fullName = pickField(fields, ['full_name', 'first_name', 'firstname']);
  const lastName = pickField(fields, ['last_name', 'lastname']);
  if (fullName && !lastName) return fullName.trim();
  return `${fullName} ${lastName}`.trim();
}

function buildDuplicateConditions({ email = '', phone = '' } = {}) {
  const conditions = [];
  if (email) conditions.push({ email });
  if (phone) conditions.push({ phone });
  return conditions;
}

async function findExistingMetaLeadByContact({ email = '', phone = '' } = {}, metaLeadModel = MetaLead) {
  const duplicateConditions = buildDuplicateConditions({ email, phone });
  if (!duplicateConditions.length) return null;
  const query = metaLeadModel.findOne({ $or: duplicateConditions });
  if (query && typeof query.select === 'function') {
    return query.select('_id metaLeadId email phone firstName lastName').lean();
  }
  return query;
}

function isDuplicateSkipReason(reason = '') {
  return /already exists|duplicate/i.test(String(reason || ''));
}

async function fetchMetaFormLeads(formId, deps = {}) {
  const axiosInstance = deps.axiosInstance || axios;
  const token = deps.accessToken || getAnyMetaAccessToken();
  const pageSize = Number(deps.pageSize || 100);

  if (!isNumericMetaId(String(formId || ''))) {
    throw new Error('Invalid Meta form ID');
  }
  if (!token) {
    throw new Error('Missing Meta page access token');
  }

  const { data: form } = await axiosInstance.get(`https://graph.facebook.com/v20.0/${formId}`, {
    params: {
      access_token: token,
      fields: 'id,name,page_id'
    },
    timeout: 15000
  });

  const leads = [];
  let after = null;

  do {
    const params = {
      access_token: token,
      fields: 'id,created_time,field_data,form_id,ad_id,campaign_id,adgroup_id,is_organic,platform',
      limit: pageSize
    };
    if (after) params.after = after;

    const { data } = await axiosInstance.get(`https://graph.facebook.com/v20.0/${formId}/leads`, {
      params,
      timeout: 15000
    });

    leads.push(...(Array.isArray(data?.data) ? data.data : []));
    after = data?.paging?.cursors?.after || null;
  } while (after);

  return {
    form,
    pageId: String(form?.page_id || deps.pageId || getDefaultPageId() || ''),
    leads
  };
}

function matchesHistoricalTarget(target = {}, metaLeadData = {}) {
  const fields = mapFieldData(metaLeadData.field_data || []);
  const targetEmail = normalizeText(target.email);
  const targetPhone = normalizePhone(target.phone);
  const targetName = normalizeText(target.fullName);

  const metaEmail = normalizeText(pickField(fields, ['email', 'email_address']));
  const metaPhone = normalizePhone(pickField(fields, ['phone_number', 'phone', 'mobile_phone']));
  const metaName = normalizeText(buildLeadFullName(fields));

  if (targetEmail && metaEmail && targetEmail === metaEmail) return true;
  if (targetPhone && metaPhone && targetPhone === metaPhone) return true;
  if (targetName && metaName && targetName === metaName) return true;
  return false;
}

function summarizeRecoveredLead({ lead, status, source, reason = null, metaLeadId = null }) {
  const lastSms = Array.isArray(lead?.smsHistory) && lead.smsHistory.length ? lead.smsHistory[lead.smsHistory.length - 1] : null;
  const lastEmail = Array.isArray(lead?.emailHistory) && lead.emailHistory.length ? lead.emailHistory[lead.emailHistory.length - 1] : null;
  return {
    status,
    source,
    reason,
    matchedMetaLeadId: metaLeadId,
    leadId: lead ? String(lead._id) : null,
    name: lead ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim() : '',
    inviteCodeStatus: lead?.invitationCode ? 'created' : 'missing',
    inviteCode: lead?.invitationCode || null,
    smsStatus: lastSms?.status || lead?.smsStatus || 'not_sent',
    twilioMessageSid: lastSms?.messageSid || null,
    emailStatus: lastEmail?.status || lead?.emailStatus || 'not_sent',
    emailMessageId: lastEmail?.messageId || null,
    followUpStatus: lead?.followUp?.status || 'inactive',
    nextFollowUpAt: lead?.followUp?.nextFollowUpAt || null
  };
}

async function fetchMetaLeadData(metaLeadId, pageId) {
  if (!isNumericMetaId(metaLeadId) || !isNumericMetaId(pageId)) {
    throw new Error('Invalid Meta identifiers');
  }

  const token = getPageToken(pageId);
  if (!token) throw new Error('Missing Meta page access token');

  const { data } = await axios.get(`https://graph.facebook.com/v20.0/${metaLeadId}`, {
    params: {
      access_token: token,
      fields: 'id,created_time,field_data,form_id,ad_id,campaign_id,adgroup_id,is_organic,platform'
    },
    timeout: 15000
  });

  const [form, campaign, adSet, ad] = await Promise.all([
    data.form_id ? axios.get(`https://graph.facebook.com/v20.0/${data.form_id}`, {
      params: { access_token: token, fields: 'id,name' }, timeout: 15000
    }).then((r) => r.data).catch(() => null) : null,
    data.campaign_id ? axios.get(`https://graph.facebook.com/v20.0/${data.campaign_id}`, {
      params: { access_token: token, fields: 'id,name' }, timeout: 15000
    }).then((r) => r.data).catch(() => null) : null,
    data.adgroup_id ? axios.get(`https://graph.facebook.com/v20.0/${data.adgroup_id}`, {
      params: { access_token: token, fields: 'id,name' }, timeout: 15000
    }).then((r) => r.data).catch(() => null) : null,
    data.ad_id ? axios.get(`https://graph.facebook.com/v20.0/${data.ad_id}`, {
      params: { access_token: token, fields: 'id,name' }, timeout: 15000
    }).then((r) => r.data).catch(() => null) : null
  ]);

  return { data, form, campaign, adSet, ad };
}

async function createOrUpdateLeadFromMeta(change) {
  const settings = await getSettings();
  const metaLeadId = change?.value?.leadgen_id;
  const pageId = change?.value?.page_id;
  if (!metaLeadId || !pageId || !isNumericMetaId(String(metaLeadId)) || !isNumericMetaId(String(pageId))) {
    return { skipped: true, reason: 'Missing leadgen_id or page_id' };
  }

  const existing = await MetaLead.findOne({ metaLeadId });
  if (existing) {
    await logEvent(existing._id, 'duplicate_webhook', 'meta', 'Duplicate webhook ignored', metaLeadId);
    return { skipped: true, reason: 'Duplicate lead', lead: existing };
  }

  const enriched = await fetchMetaLeadData(metaLeadId, pageId);
  const fields = mapFieldData(enriched.data?.field_data || []);

  const firstName = pickField(fields, ['first_name', 'firstname', 'full_name']);
  const lastName = pickField(fields, ['last_name', 'lastname']);
  const phone = normalizePhone(pickField(fields, ['phone_number', 'phone', 'mobile_phone']));
  const email = pickField(fields, ['email', 'email_address']).toLowerCase();
  const trade = pickField(fields, ['trade', 'service', 'service_type']);
  const city = pickField(fields, ['city']);
  const state = pickField(fields, ['state', 'region']);
  const zipCode = pickField(fields, ['zip', 'zipcode', 'postal_code']);

  const lead = await MetaLead.create({
    leadUniqueId: `META-${metaLeadId}`,
    metaLeadId,
    source: sourceFromPayload(enriched.data, fields),
    firstName,
    lastName,
    phone,
    email,
    trade,
    city,
    state,
    zipCode,
    submissionTimestamp: parseDate(enriched.data?.created_time) || new Date(),
    campaign: {
      campaignId: enriched.data?.campaign_id || '',
      campaignName: enriched.campaign?.name || '',
      adSetId: enriched.data?.adgroup_id || '',
      adSetName: enriched.adSet?.name || '',
      adId: enriched.data?.ad_id || '',
      adName: enriched.ad?.name || '',
      formId: enriched.data?.form_id || '',
      formName: enriched.form?.name || ''
    },
    utm: {
      source: pickField(fields, ['utm_source']),
      medium: pickField(fields, ['utm_medium']),
      campaign: pickField(fields, ['utm_campaign']),
      term: pickField(fields, ['utm_term']),
      content: pickField(fields, ['utm_content'])
    },
    leadStatus: 'in_progress',
    followUp: {
      step: 0,
      status: 'active',
      lastFollowUpAt: null,
      nextFollowUpAt: getNextFollowUpAt(new Date(), settings.followUpTimingsHours, 0)
    }
  });

  await logEvent(lead._id, 'lead_submitted', 'meta', 'Lead submitted from Meta', `Meta lead ${metaLeadId}`, {
    pageId,
    campaignId: enriched.data?.campaign_id,
    formId: enriched.data?.form_id
  });

  await createInviteForLead(lead, settings);

  await sendLeadSms(lead, 'immediate', settings);
  await sendLeadEmail(lead, 'immediate', settings);

  lead.followUp.lastFollowUpAt = new Date();
  lead.followUp.nextFollowUpAt = getNextFollowUpAt(lead.createdAt, settings.followUpTimingsHours, 0);
  await lead.save();

  await logEvent(lead._id, 'followup_started', 'system', 'Follow-up sequence started', 'Immediate SMS/email sent', {
    nextFollowUpAt: lead.followUp.nextFollowUpAt
  });

  await notifyOwnerIfEnabled(lead, settings, 'new_lead');
  await notifyAdmins('new_lead', 'New Meta Lead', `${lead.firstName || 'New'} ${lead.lastName || 'lead'} captured from Meta lead ads.`, lead._id);

  return { skipped: false, lead };
}

async function processMetaWebhookPayload(payload) {
  const entries = Array.isArray(payload?.entry) ? payload.entry : [];
  const changes = entries.flatMap((entry) => Array.isArray(entry?.changes) ? entry.changes : []);

  const leadChanges = changes.filter((change) => change?.field === 'leadgen');
  const results = [];

  for (const change of leadChanges) {
    try {
      const result = await createOrUpdateLeadFromMeta(change);
      results.push({ ok: true, ...result });
    } catch (error) {
      results.push({ ok: false, error: error.message });
    }
  }

  return {
    receivedChanges: changes.length,
    processedLeads: results.filter((r) => r.ok && !r.skipped).length,
    duplicates: results.filter((r) => r.ok && r.skipped).length,
    failures: results.filter((r) => !r.ok).length,
    results
  };
}

async function processFollowUpCycle() {
  const settings = await getSettings();
  if (!settings.enabled) return { processed: 0, skipped: 0, reason: 'disabled' };

  const now = new Date();
  const candidates = await MetaLead.find({
    'followUp.status': 'active',
    'followUp.nextFollowUpAt': { $lte: now },
    leadStatus: { $nin: ['closed'] },
    registrationStatus: 'not_registered'
  }).limit(100);

  let processed = 0;
  let skipped = 0;

  for (const lead of candidates) {
    await maybeSyncRegistration(lead, settings);
    await syncInvitationRedemption(lead, settings);

    if (lead.registrationStatus !== 'not_registered' || lead.followUp.status !== 'active') {
      skipped += 1;
      continue;
    }

    await processLeadFollowUp(lead, settings);
    processed += 1;
  }

  return { processed, skipped };
}

async function reconcileLeadRegistrations(limit = 200) {
  const settings = await getSettings();
  const leads = await MetaLead.find({
    registrationStatus: 'not_registered',
    leadStatus: { $nin: ['closed'] }
  }).limit(limit);

  let updated = 0;
  for (const lead of leads) {
    const before = lead.registrationStatus;
    await maybeSyncRegistration(lead, settings);
    await syncInvitationRedemption(lead, settings);
    if (lead.registrationStatus !== before || lead.invitationRedeemedAt) updated += 1;
  }

  return { scanned: leads.length, updated };
}

async function handleTwilioStatusWebhook(payload = {}, deps = {}) {
  const metaLeadModel = deps.metaLeadModel || MetaLead;
  const logEventFn = deps.logEventFn || logEvent;
  const receivedSid = payload.MessageSid || payload.SmsSid;
  const twilioStatus = (payload.MessageStatus || '').toLowerCase();
  if (!receivedSid) return { updated: false, reason: 'missing_sid' };
  const sid = normalizeTwilioSid(receivedSid);
  if (!sid) return { updated: false, reason: 'invalid_sid' };

  const lead = await metaLeadModel.findOne({ smsHistory: { $elemMatch: { messageSid: sid } } });
  if (!lead) return { updated: false, reason: 'not_found' };

  const historyItem = lead.smsHistory.find((h) => h.messageSid === sid);
  if (!historyItem) return { updated: false, reason: 'history_not_found' };

  const map = {
    queued: 'queued',
    sent: 'sent',
    delivered: 'delivered',
    failed: 'failed',
    undelivered: 'undelivered'
  };

  const normalizedStatus = map[twilioStatus] || historyItem.status;
  historyItem.status = normalizedStatus;
  historyItem.updatedAt = new Date();
  historyItem.errorCode = payload.ErrorCode || null;
  historyItem.errorMessage = payload.ErrorMessage || null;

  if (shouldPromoteLeadSmsStatus(lead.smsStatus, normalizedStatus)) {
    lead.smsStatus = normalizedStatus;
  }

  await lead.save();

  await logEventFn(lead._id, `sms_${normalizedStatus}`, 'sms', `SMS ${normalizedStatus}`, sid, {
    sid,
    twilioStatus,
    errorCode: payload.ErrorCode || null
  });

  return { updated: true, leadId: lead._id, status: normalizedStatus };
}

async function retryFailedInitialMetaLeadSmsBatch({
  targetIds = [],
  metaLeadModel = MetaLead,
  sendSmsImpl = sendSms,
  settingsProvider = getSettings,
  now = () => new Date()
} = {}) {
  const callbackUrl = getStatusCallbackUrl();
  if (!callbackUrl) {
    throw new Error('BACKEND_PUBLIC_URL is not configured — cannot build absolute StatusCallback URL. Set BACKEND_PUBLIC_URL=https://fixloapp.onrender.com in Render.');
  }

  console.log('[META_SMS] Retry batch started');
  console.log(`[META_SMS] Status callback URL valid: ${callbackUrl}`);

  const settings = await settingsProvider();
  const results = [];

  for (const leadId of targetIds) {
    let lead;
    try {
      lead = await metaLeadModel.findById(leadId);
    } catch (error) {
      console.error(`[META_SMS] Retry failed lead=${leadId} error=${error.message}`);
      results.push({
        name: '',
        leadId,
        status: 'FAILED',
        twilioMessageSid: null,
        twilioStatus: null,
        statusCallback: callbackUrl,
        errorReason: `db_lookup_failed:${error.message}`
      });
      continue;
    }

    if (!lead) {
      results.push({
        name: '',
        leadId,
        status: 'FAILED',
        twilioMessageSid: null,
        twilioStatus: null,
        statusCallback: callbackUrl,
        errorReason: 'lead_not_found'
      });
      continue;
    }

    const name = getLeadDisplayName(lead);
    const existingEntry = findInitialOutboundSmsWithSid(lead);
    if (existingEntry) {
      console.log(`[META_SMS] Existing SID found lead=${leadId} sid=${existingEntry.messageSid}`);
      results.push({
        name,
        leadId,
        status: 'ALREADY_SENT',
        twilioMessageSid: existingEntry.messageSid,
        twilioStatus: existingEntry.status || lead.smsStatus || 'queued',
        statusCallback: callbackUrl,
        errorReason: null
      });
      continue;
    }

    const retryBlockReason = getRetryBlockReason(lead);
    if (retryBlockReason) {
      console.error(`[META_SMS] Retry failed lead=${leadId} error=${retryBlockReason}`);
      results.push({
        name,
        leadId,
        status: 'FAILED',
        twilioMessageSid: null,
        twilioStatus: 'failed',
        statusCallback: callbackUrl,
        errorReason: retryBlockReason
      });
      continue;
    }

    const body = template(settings.smsTemplates?.immediate || '', buildMessageVars(lead, settings));
    if (!lead.phone) {
      console.error(`[META_SMS] Retry failed lead=${leadId} error=missing_phone`);
      results.push({
        name,
        leadId,
        status: 'FAILED',
        twilioMessageSid: null,
        twilioStatus: 'failed',
        statusCallback: callbackUrl,
        errorReason: 'missing_phone'
      });
      continue;
    }
    if (!lead.invitationCode) {
      console.error(`[META_SMS] Retry failed lead=${leadId} error=missing_invitation_code`);
      results.push({
        name,
        leadId,
        status: 'FAILED',
        twilioMessageSid: null,
        twilioStatus: 'failed',
        statusCallback: callbackUrl,
        errorReason: 'missing_invitation_code'
      });
      continue;
    }
    if (!body.trim()) {
      console.error(`[META_SMS] Retry failed lead=${leadId} error=missing_template`);
      results.push({
        name,
        leadId,
        status: 'FAILED',
        twilioMessageSid: null,
        twilioStatus: 'failed',
        statusCallback: callbackUrl,
        errorReason: 'missing_template'
      });
      continue;
    }

    try {
      console.log(`[META_SMS] Retrying initial SMS lead=${leadId}`);
      const twilioRes = await sendSmsImpl(lead.phone, body, { statusCallback: callbackUrl });
      console.log(`[META_SMS] Twilio accepted SID=${twilioRes.sid}`);

      lead.smsStatus = twilioRes.status || 'queued';
      lead.smsHistory.push({
        messageSid: twilioRes.sid,
        direction: 'outbound',
        status: twilioRes.status || 'queued',
        body,
        templateKey: 'immediate',
        sentAt: now(),
        updatedAt: now(),
        errorCode: null,
        errorMessage: null
      });
      await lead.save();

      results.push({
        name,
        leadId,
        status: 'SENT',
        twilioMessageSid: twilioRes.sid,
        twilioStatus: twilioRes.status || 'queued',
        statusCallback: callbackUrl,
        errorReason: null
      });
    } catch (error) {
      console.error(`[META_SMS] Retry failed lead=${leadId} error=${error.message}`);
      results.push({
        name,
        leadId,
        status: 'FAILED',
        twilioMessageSid: null,
        twilioStatus: 'failed',
        statusCallback: callbackUrl,
        errorReason: error.message
      });
    }
  }

  console.log('[META_SMS] Retry batch completed');
  return results;
}

async function recoverHistoricalMetaLeadsByForm({
  formId,
  targets = [],
  accessToken = '',
  pageId = '',
  metaLeadModel = MetaLead,
  fetchMetaFormLeadsImpl = fetchMetaFormLeads,
  createOrUpdateLeadFromMetaImpl = createOrUpdateLeadFromMeta,
  recoverManualMetaLeadImpl = recoverManualMetaLead
} = {}) {
  const normalizedFormId = String(formId || '').trim();
  if (!normalizedFormId) {
    throw new Error('formId is required');
  }

  const normalizedTargets = targets.map((target) => ({
    fullName: String(target.fullName || '').trim(),
    email: normalizeText(target.email),
    phone: normalizePhone(target.phone),
    trade: String(target.trade || '').trim(),
    submittedAt: target.submittedAt || null,
    note: String(target.note || '').trim()
  }));

  const formData = await fetchMetaFormLeadsImpl(normalizedFormId, { accessToken, pageId });
  const resolvedPageId = String(formData?.pageId || pageId || getDefaultPageId() || '').trim();
  const graphLeads = Array.isArray(formData?.leads) ? formData.leads : [];
  const results = [];

  for (const target of normalizedTargets) {
    const displayName = target.fullName || target.email || target.phone || 'Unknown target';
    const existing = await findExistingMetaLeadByContact({ email: target.email, phone: target.phone }, metaLeadModel);
    if (existing) {
      results.push({
        status: 'SKIPPED_DUPLICATE',
        source: 'duplicate',
        reason: `MetaLead already exists (${existing._id})`,
        matchedMetaLeadId: existing.metaLeadId || null,
        leadId: String(existing._id),
        name: `${existing.firstName || ''} ${existing.lastName || ''}`.trim() || displayName,
        inviteCodeStatus: 'unchanged',
        inviteCode: null,
        smsStatus: 'unchanged',
        twilioMessageSid: null,
        emailStatus: 'unchanged',
        emailMessageId: null,
        followUpStatus: 'unchanged',
        nextFollowUpAt: null
      });
      continue;
    }

    const matchedLead = graphLeads.find((lead) => matchesHistoricalTarget(target, lead));
    if (matchedLead) {
      if (!resolvedPageId || !isNumericMetaId(resolvedPageId)) {
        throw new Error(`Unable to resolve Meta page ID for form ${normalizedFormId}`);
      }
      const imported = await createOrUpdateLeadFromMetaImpl({
        field: 'leadgen',
        value: {
          leadgen_id: String(matchedLead.id || ''),
          page_id: resolvedPageId
        }
      });

      if (imported?.skipped) {
        results.push({
          status: isDuplicateSkipReason(imported.reason) ? 'SKIPPED_DUPLICATE' : 'SKIPPED',
          source: 'meta',
          reason: imported.reason || 'Skipped by Meta ingestion pipeline',
          matchedMetaLeadId: String(matchedLead.id || ''),
          leadId: imported.lead ? String(imported.lead._id) : null,
          name: displayName,
          inviteCodeStatus: imported.lead?.invitationCode ? 'existing' : 'unchanged',
          inviteCode: imported.lead?.invitationCode || null,
          smsStatus: imported.lead?.smsStatus || 'unchanged',
          twilioMessageSid: null,
          emailStatus: imported.lead?.emailStatus || 'unchanged',
          emailMessageId: null,
          followUpStatus: imported.lead?.followUp?.status || 'unchanged',
          nextFollowUpAt: imported.lead?.followUp?.nextFollowUpAt || null
        });
        continue;
      }

      results.push(summarizeRecoveredLead({
        lead: imported.lead,
        status: 'RECOVERED_FROM_META',
        source: 'meta',
        metaLeadId: String(matchedLead.id || '')
      }));
      continue;
    }

    if (!target.fullName || !target.email || !target.phone || !target.trade) {
      results.push({
        status: 'FAILED',
        source: 'manual',
        reason: 'Meta no longer returns this lead and manual recovery requires fullName, email, phone, and trade',
        matchedMetaLeadId: null,
        leadId: null,
        name: displayName,
        inviteCodeStatus: 'not_created',
        inviteCode: null,
        smsStatus: 'not_sent',
        twilioMessageSid: null,
        emailStatus: 'not_sent',
        emailMessageId: null,
        followUpStatus: 'not_scheduled',
        nextFollowUpAt: null
      });
      continue;
    }

    const manual = await recoverManualMetaLeadImpl({
      fullName: target.fullName,
      email: target.email,
      phone: target.phone,
      trade: target.trade,
      formId: normalizedFormId,
      submittedAt: target.submittedAt,
      source: 'historical_meta_recovery',
      note: target.note
    });

    if (manual?.skipped) {
      results.push({
        status: isDuplicateSkipReason(manual.skippedReason) ? 'SKIPPED_DUPLICATE' : 'FAILED',
        source: 'manual',
        reason: manual.skippedReason || 'Manual recovery skipped',
        matchedMetaLeadId: null,
        leadId: manual.existingId ? String(manual.existingId) : null,
        name: displayName,
        inviteCodeStatus: 'unchanged',
        inviteCode: null,
        smsStatus: 'unchanged',
        twilioMessageSid: null,
        emailStatus: 'unchanged',
        emailMessageId: null,
        followUpStatus: 'unchanged',
        nextFollowUpAt: null
      });
      continue;
    }

    results.push(summarizeRecoveredLead({
      lead: manual.lead,
      status: 'RECOVERED_MANUAL',
      source: 'manual'
    }));
  }

  return {
    formId: normalizedFormId,
    canonicalSignupLink: CANONICAL_PRO_SIGNUP_URL,
    results
  };
}

function matchLeadByPhone(phone, leads = []) {
  const normalized = normalizePhone(phone).replace(/\D/g, '');
  return leads.find((lead) => normalizePhone(lead.phone).replace(/\D/g, '') === normalized);
}

async function handleTwilioInboundWebhook(payload = {}) {
  const from = payload.From || '';
  const body = String(payload.Body || '').trim();
  const normalizedBody = body.toUpperCase();

  const leads = await MetaLead.find({
    phone: { $exists: true, $ne: '' },
    leadStatus: { $nin: ['closed'] }
  }).sort({ createdAt: -1 }).limit(200);

  const lead = matchLeadByPhone(from, leads);
  if (!lead) return { handled: false, reason: 'lead_not_found' };

  const settings = await getSettings();

  if (STOP_KEYWORDS.has(normalizedBody)) {
    lead.smsOptOut = true;
    lead.smsOptOutAt = new Date();
    lead.smsStatus = 'opted_out';
    lead.smsHistory.push({
      direction: 'inbound',
      status: 'stop_received',
      body,
      sentAt: new Date(),
      updatedAt: new Date()
    });
    await lead.save();

    await markSequenceStopped(lead, 'stop_reply');
    await logEvent(lead._id, 'stop_received', 'sms', 'STOP received', body);

    await sendSms(lead.phone, settings.smsTemplates?.unsubscribed || 'You have been unsubscribed from Fixlo SMS updates. Reply START to subscribe again.');
    return { handled: true, action: 'opt_out', leadId: lead._id };
  }

  if (START_KEYWORDS.has(normalizedBody)) {
    lead.smsOptOut = false;
    lead.smsOptInAt = new Date();
    lead.smsHistory.push({
      direction: 'inbound',
      status: 'start_received',
      body,
      sentAt: new Date(),
      updatedAt: new Date()
    });

    if (lead.registrationStatus === 'not_registered' && lead.followUp.status !== 'completed') {
      lead.followUp.status = 'active';
      if (!lead.followUp.nextFollowUpAt) {
        lead.followUp.nextFollowUpAt = new Date(Date.now() + (60 * 60 * 1000));
      }
    }

    await lead.save();
    await logEvent(lead._id, 'start_received', 'sms', 'START received', body);

    await sendSms(lead.phone, settings.smsTemplates?.resumed || 'You are subscribed again to Fixlo SMS updates. Reply STOP to unsubscribe.');
    return { handled: true, action: 'opt_in', leadId: lead._id };
  }

  lead.smsHistory.push({
    direction: 'inbound',
    status: 'received',
    body,
    sentAt: new Date(),
    updatedAt: new Date()
  });
  await lead.save();

  await logEvent(lead._id, 'reply_received', 'sms', 'SMS reply received', body);
  return { handled: true, action: 'reply_logged', leadId: lead._id };
}

async function handleSendGridEvents(events = []) {
  const entries = Array.isArray(events) ? events : [];
  let updated = 0;

  for (const event of entries) {
    const messageId = event.sg_message_id || event['smtp-id'] || event.message_id || '';
    const eventType = String(event.event || '').toLowerCase();
    const metaLeadId = event?.metaLeadId || event?.custom_args?.metaLeadId;

    let lead = null;
    if (metaLeadId && /^[a-fA-F0-9]{24}$/.test(String(metaLeadId))) {
      lead = await MetaLead.findById(metaLeadId).catch(() => null);
    }
    if (!lead && messageId) {
      lead = await MetaLead.findOne({ 'emailHistory.messageId': { $regex: `^${messageId.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}` } });
    }
    if (!lead) continue;

    const mappedStatus = {
      processed: 'processed',
      delivered: 'delivered',
      open: 'open',
      click: 'click',
      bounce: 'bounce',
      dropped: 'dropped',
      deferred: 'deferred',
      unsubscribe: 'unsubscribe'
    }[eventType] || null;

    if (!mappedStatus) continue;

    const history = lead.emailHistory.find((h) => h.messageId && messageId && h.messageId.startsWith(messageId.split('.')[0])) ||
      lead.emailHistory[lead.emailHistory.length - 1];

    if (history) {
      history.status = mappedStatus;
      history.updatedAt = new Date();
      history.reason = event.reason || history.reason || null;
      history.clickUrl = event.url || history.clickUrl || null;
    }

    if (mappedStatus === 'delivered') lead.emailStatus = 'delivered';
    if (mappedStatus === 'open') lead.emailStatus = 'opened';
    if (mappedStatus === 'click') lead.emailStatus = 'clicked';
    if (mappedStatus === 'bounce') lead.emailStatus = 'bounced';
    if (mappedStatus === 'unsubscribe') lead.emailStatus = 'unsubscribed';

    await lead.save();

    await logEvent(lead._id, `email_${mappedStatus}`, 'email', `Email ${mappedStatus}`, event.email || '', {
      messageId,
      eventType,
      url: event.url || null,
      reason: event.reason || null
    });

    updated += 1;
  }

  return { updated };
}

async function listLeads(filters = {}) {
  const page = Math.max(1, Number(filters.page || 1));
  const limit = Math.min(100, Math.max(1, Number(filters.limit || 25)));
  const query = {};

  const allowedLeadStatuses = new Set(['new', 'in_progress', 'registered', 'subscribed', 'closed']);
  const allowedRegistrationStatuses = new Set(['not_registered', 'registered', 'subscribed']);
  const allowedFollowUpStatuses = new Set(['active', 'paused', 'stopped', 'completed']);
  const allowedSources = new Set(['instagram', 'facebook', 'meta_unknown', 'manual_meta_import']);

  if (allowedLeadStatuses.has(String(filters.status))) query.leadStatus = String(filters.status);
  if (allowedRegistrationStatuses.has(String(filters.registrationStatus))) query.registrationStatus = String(filters.registrationStatus);
  if (allowedFollowUpStatuses.has(String(filters.followUpStatus))) query['followUp.status'] = String(filters.followUpStatus);
  if (allowedSources.has(String(filters.source))) query.source = String(filters.source);
  if (filters.search) {
    const search = String(filters.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { invitationCode: { $regex: search, $options: 'i' } },
      { 'campaign.campaignName': { $regex: search, $options: 'i' } },
      { 'campaign.adName': { $regex: search, $options: 'i' } }
    ];
  }

  const [items, total] = await Promise.all([
    MetaLead.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    MetaLead.countDocuments(query)
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

async function getLeadDetails(leadId) {
  const lead = await MetaLead.findById(leadId);
  if (!lead) return null;

  const timeline = await MetaLeadEvent.find({ leadId }).sort({ occurredAt: -1 }).limit(500);
  return { lead, timeline };
}

async function computeDashboardMetrics() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalMetaLeads,
    todayLeads,
    weekLeads,
    monthLeads,
    pendingFollowUps,
    completedFollowUps,
    registeredLeads,
    subscribedPros,
    invitationCodesIssued,
    invitationCodesRedeemed,
    optedOut,
    smsDelivered,
    smsTotal,
    emailOpened,
    emailClicked,
    emailDelivered,
    avgRegistration,
    avgFollowup,
    byCampaign,
    byAd,
    byTrade,
    byState
  ] = await Promise.all([
    MetaLead.countDocuments(),
    MetaLead.countDocuments({ createdAt: { $gte: startOfDay } }),
    MetaLead.countDocuments({ createdAt: { $gte: startOfWeek } }),
    MetaLead.countDocuments({ createdAt: { $gte: startOfMonth } }),
    MetaLead.countDocuments({ 'followUp.status': 'active', registrationStatus: 'not_registered' }),
    MetaLead.countDocuments({ 'followUp.status': { $in: ['completed', 'stopped'] } }),
    MetaLead.countDocuments({ registrationStatus: { $in: ['registered', 'subscribed'] } }),
    MetaLead.countDocuments({ registrationStatus: 'subscribed' }),
    MetaLead.countDocuments({ invitationCode: { $ne: '' } }),
    MetaLead.countDocuments({ invitationRedeemedAt: { $ne: null } }),
    MetaLead.countDocuments({ smsOptOut: true }),
    MetaLead.countDocuments({ smsStatus: 'delivered' }),
    MetaLead.countDocuments({ smsStatus: { $in: ['sent', 'delivered', 'failed', 'undelivered'] } }),
    MetaLead.countDocuments({ emailStatus: 'opened' }),
    MetaLead.countDocuments({ emailStatus: 'clicked' }),
    MetaLead.countDocuments({ emailStatus: { $in: ['delivered', 'opened', 'clicked'] } }),
    MetaLead.aggregate([
      { $match: { registrationStatus: { $in: ['registered', 'subscribed'] } } },
      { $project: { hours: { $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 3600000] } } },
      { $group: { _id: null, avg: { $avg: '$hours' } } }
    ]),
    MetaLead.aggregate([
      { $match: { 'followUp.lastFollowUpAt': { $ne: null } } },
      { $project: { hours: { $divide: [{ $subtract: ['$followUp.lastFollowUpAt', '$createdAt'] }, 3600000] } } },
      { $group: { _id: null, avg: { $avg: '$hours' } } }
    ]),
    MetaLead.aggregate([
      { $match: { registrationStatus: { $in: ['registered', 'subscribed'] } } },
      { $group: { _id: '$campaign.campaignName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]),
    MetaLead.aggregate([
      { $match: { registrationStatus: { $in: ['registered', 'subscribed'] } } },
      { $group: { _id: '$campaign.adName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]),
    MetaLead.aggregate([
      { $match: { registrationStatus: { $in: ['registered', 'subscribed'] } } },
      { $group: { _id: '$trade', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]),
    MetaLead.aggregate([
      { $match: { registrationStatus: { $in: ['registered', 'subscribed'] } } },
      { $group: { _id: '$state', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ])
  ]);

  const conversionRate = totalMetaLeads ? (registeredLeads / totalMetaLeads) * 100 : 0;
  const registrationToSubscription = registeredLeads ? (subscribedPros / registeredLeads) * 100 : 0;
  const smsDeliveryRate = smsTotal ? (smsDelivered / smsTotal) * 100 : 0;
  const emailOpenRate = emailDelivered ? (emailOpened / emailDelivered) * 100 : 0;
  const emailClickRate = emailDelivered ? (emailClicked / emailDelivered) * 100 : 0;
  const optOutRate = totalMetaLeads ? (optedOut / totalMetaLeads) * 100 : 0;

  return {
    totalMetaLeads,
    todayLeads,
    weekLeads,
    monthLeads,
    pendingFollowUps,
    completedFollowUps,
    registeredLeads,
    subscribedPros,
    conversionRate,
    registrationToSubscription,
    smsDeliveryRate,
    emailOpenRate,
    emailClickRate,
    invitationCodesIssued,
    invitationCodesRedeemed,
    optOutRate,
    averageRegistrationHours: Number(avgRegistration?.[0]?.avg || 0),
    averageFollowUpHours: Number(avgFollowup?.[0]?.avg || 0),
    bestPerformingCampaign: byCampaign?.[0]?._id || null,
    bestPerformingAd: byAd?.[0]?._id || null,
    bestPerformingTrade: byTrade?.[0]?._id || null,
    bestPerformingState: byState?.[0]?._id || null
  };
}

async function performManualAction(leadId, action, payload = {}) {
  const lead = await MetaLead.findById(leadId);
  if (!lead) throw new Error('Lead not found');

  const settings = await getSettings();

  if (action === 'resend_sms') {
    await sendLeadSms(lead, 'immediate', settings, true);
  } else if (action === 'resend_email') {
    await sendLeadEmail(lead, 'immediate', settings);
  } else if (action === 'pause') {
    lead.followUp.status = 'paused';
    lead.followUp.pausedAt = new Date();
    lead.followUp.pausedReason = payload.reason || 'paused_by_admin';
    await lead.save();
  } else if (action === 'resume') {
    lead.followUp.status = 'active';
    if (!lead.followUp.nextFollowUpAt) {
      lead.followUp.nextFollowUpAt = new Date(Date.now() + (60 * 60 * 1000));
    }
    await lead.save();
  } else if (action === 'mark_closed') {
    lead.leadStatus = 'closed';
    lead.followUp.status = 'stopped';
    lead.followUp.stoppedReason = payload.reason || 'closed_by_admin';
    lead.followUp.nextFollowUpAt = null;
    await lead.save();
  } else if (action === 'assign_recruiter') {
    lead.assignedRecruiter = String(payload.assignedRecruiter || '').trim();
    await lead.save();
  } else if (action === 'add_note') {
    lead.notes = String(payload.notes || '').trim();
    await lead.save();
  } else {
    throw new Error('Unsupported action');
  }

  await logEvent(lead._id, `manual_${action}`, 'admin', `Manual action: ${action}`, '', payload);
  return lead;
}

/**
 * importManualLead — One-time manual import of a historical Meta lead.
 *
 * Performs full duplicate prevention (by email, phone, existing MetaLead, existing Pro),
 * creates the MetaLead record, generates an invitation code, sends the immediate SMS
 * (only when a phone is present), sends the immediate welcome email, enrolls in the
 * existing follow-up sequence, logs timeline events, and notifies admins.
 *
 * @param {object} leadData
 * @param {string} leadData.firstName
 * @param {string} leadData.lastName
 * @param {string} [leadData.phone]  — leave empty/null when unavailable
 * @param {string} leadData.email
 * @param {string} leadData.leadUniqueId  — e.g. "MANUAL-dave-burnett-20260718"
 * @param {string} leadData.metaLeadId   — e.g. "manual-dave-burnett-20260718"
 * @returns {object} result with skipped/skippedReason or imported lead details
 */
async function importManualLead(leadData = {}) {
  const settings = await getSettings();

  const firstName = String(leadData.firstName || '').trim();
  const lastName = String(leadData.lastName || '').trim();
  const normalizedEmail = String(leadData.email || '').toLowerCase().trim();
  const normalizedPhone = leadData.phone ? normalizePhone(leadData.phone) : '';
  const metaLeadIdVal = String(leadData.metaLeadId || '').trim();
  const leadUniqueIdVal = String(leadData.leadUniqueId || '').trim();

  if (!metaLeadIdVal || !leadUniqueIdVal) {
    return { skipped: true, skippedReason: 'Missing metaLeadId or leadUniqueId' };
  }

  // ── Duplicate: existing MetaLead by ID ───────────────────────────────────
  const existingById = await MetaLead.findOne({
    $or: [{ metaLeadId: metaLeadIdVal }, { leadUniqueId: leadUniqueIdVal }]
  }).lean();
  if (existingById) {
    return {
      skipped: true,
      skippedReason: `MetaLead already exists with this ID (${existingById._id})`,
      existingId: existingById._id
    };
  }

  // ── Duplicate: existing MetaLead by email ────────────────────────────────
  if (normalizedEmail) {
    const existingByEmail = await MetaLead.findOne({ email: normalizedEmail }).lean();
    if (existingByEmail) {
      return {
        skipped: true,
        skippedReason: `MetaLead already exists with email ${normalizedEmail} (${existingByEmail._id})`,
        existingId: existingByEmail._id
      };
    }
  }

  // ── Duplicate: existing MetaLead by phone ────────────────────────────────
  if (normalizedPhone) {
    const existingByPhone = await MetaLead.findOne({ phone: normalizedPhone }).lean();
    if (existingByPhone) {
      return {
        skipped: true,
        skippedReason: `MetaLead already exists with phone ${normalizedPhone} (${existingByPhone._id})`,
        existingId: existingByPhone._id
      };
    }
  }

  // ── Duplicate: existing Pro account ─────────────────────────────────────
  const proQuery = { $or: [] };
  if (normalizedEmail) proQuery.$or.push({ email: normalizedEmail });
  if (normalizedPhone) proQuery.$or.push({ phone: normalizedPhone });
  if (proQuery.$or.length) {
    const existingPro = await Pro.findOne(proQuery).select('_id email phone').lean();
    if (existingPro) {
      return {
        skipped: true,
        skippedReason: `Pro account already exists with matching email/phone (Pro ${existingPro._id})`,
        existingProId: existingPro._id
      };
    }
  }

  // ── Create MetaLead ──────────────────────────────────────────────────────
  const now = new Date();
  const lead = await MetaLead.create({
    leadUniqueId: leadUniqueIdVal,
    metaLeadId: metaLeadIdVal,
    source: 'manual_meta_import',
    manualImport: true,
    firstName,
    lastName,
    phone: normalizedPhone,
    email: normalizedEmail,
    notes: 'Manually imported historical Meta lead (collected before webhook was connected)',
    submissionTimestamp: now,
    leadStatus: 'in_progress',
    followUp: {
      step: 0,
      status: 'active',
      lastFollowUpAt: null,
      nextFollowUpAt: getNextFollowUpAt(now, settings.followUpTimingsHours, 0)
    }
  });

  // ── Timeline: manual_lead_imported ──────────────────────────────────────
  await logEvent(
    lead._id,
    'lead_submitted',
    'admin',
    'Lead manually imported',
    'Historical Meta lead imported before webhook was connected',
    { metaLeadId: metaLeadIdVal, originalSource: 'Instagram/Facebook Lead Ad', importedBy: 'import-meta-leads script' }
  );

  // ── Invitation code ──────────────────────────────────────────────────────
  await createInviteForLead(lead, settings);

  // ── Timeline: invitation_created already logged by createInviteForLead ──

  // ── SMS ─────────────────────────────────────────────────────────────────
  let smsResult;
  if (normalizedPhone) {
    smsResult = await sendLeadSms(lead, 'immediate', settings);
  } else {
    smsResult = { success: false, reason: 'missing_phone' };
    await logEvent(
      lead._id,
      'sms_skipped',
      'sms',
      'SMS skipped — no phone number',
      'Lead has no phone number; SMS step skipped',
      { reason: 'skipped_missing_phone' }
    );
  }

  // ── Email ────────────────────────────────────────────────────────────────
  const emailResult = await sendLeadEmail(lead, 'immediate', settings);

  // ── Enrol in follow-up sequence ──────────────────────────────────────────
  lead.followUp.lastFollowUpAt = now;
  await lead.save();

  await logEvent(
    lead._id,
    'followup_started',
    'system',
    'Follow-up sequence started',
    'Immediate welcome email/SMS sent; automated reminders scheduled',
    { nextFollowUpAt: lead.followUp.nextFollowUpAt }
  );

  // ── Admin notification ───────────────────────────────────────────────────
  await notifyAdmins(
    'new_lead',
    'Manual Meta Lead Imported',
    `${firstName} ${lastName} was manually imported from a historical Meta lead ad.`,
    lead._id
  );

  return {
    skipped: false,
    lead,
    invitationCode: lead.invitationCode,
    smsResult,
    emailResult
  };
}

/**
 * recoverManualMetaLead — Recover a missing Meta lead using provided lead details.
 *
 * Idempotency is enforced with exact duplicate checks on normalized phone and
 * lowercase email. This intentionally does not require an external Meta lead ID.
 *
 * @param {object} leadData
 * @param {string} leadData.fullName
 * @param {string} leadData.email
 * @param {string} leadData.phone
 * @param {string} leadData.trade
 * @param {string} leadData.formId
 * @param {string|Date} [leadData.submittedAt]
 * @param {string} [leadData.source]
 * @param {string} [leadData.note]
 * @returns {object}
 */
async function recoverManualMetaLead(leadData = {}) {
  const settings = await getSettings();
  const now = new Date();

  const fullName = String(leadData.fullName || '').trim();
  const normalizedEmail = String(leadData.email || '').trim().toLowerCase();
  const normalizedPhone = normalizePhone(leadData.phone);
  const trade = String(leadData.trade || '').trim();
  const formId = String(leadData.formId || '').trim();
  const parsedSubmittedAt = parseDate(leadData.submittedAt);
  const submittedAt = parsedSubmittedAt || now;
  const source = String(leadData.source || 'recovered_meta_lead').trim() || 'recovered_meta_lead';
  const note = String(leadData.note || '').trim();

  if (!fullName || !normalizedEmail || !normalizedPhone || !trade || !formId) {
    return { skipped: true, skippedReason: 'Missing required lead fields (name/email/phone/trade/formId)' };
  }

  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const firstName = nameParts.shift() || '';
  const lastName = nameParts.join(' ');

  const duplicateConditions = [];
  if (normalizedPhone) duplicateConditions.push({ phone: normalizedPhone });
  if (normalizedEmail) duplicateConditions.push({ email: normalizedEmail });

  if (duplicateConditions.length) {
    const existing = await MetaLead.findOne({ $or: duplicateConditions }).select('_id email phone').lean();
    if (existing) {
      return {
        skipped: true,
        skippedReason: `MetaLead already exists for normalized email/phone (${existing._id})`,
        existingId: existing._id
      };
    }
  }

  const identityHash = crypto
    .createHash('sha1')
    .update(`${normalizedEmail}|${normalizedPhone}|${formId}`)
    .digest('hex')
    .slice(0, 24);

  const metaLeadIdVal = `recovered-${identityHash}`;
  const leadUniqueIdVal = `RECOVERED-${identityHash}`;
  const notes = [
    'Recovered Meta lead imported through manual recovery pipeline.',
    note,
    parsedSubmittedAt ? '' : 'Original submittedAt unavailable; import time used as submissionTimestamp.'
  ].filter(Boolean).join(' ');

  const lead = await MetaLead.create({
    leadUniqueId: leadUniqueIdVal,
    metaLeadId: metaLeadIdVal,
    source,
    manualImport: true,
    firstName,
    lastName,
    phone: normalizedPhone,
    email: normalizedEmail,
    trade,
    campaign: {
      formId
    },
    notes,
    submissionTimestamp: submittedAt,
    leadStatus: 'in_progress',
    followUp: {
      step: 0,
      status: 'active',
      lastFollowUpAt: null,
      nextFollowUpAt: getNextFollowUpAt(now, settings.followUpTimingsHours, 0)
    }
  });

  await logEvent(
    lead._id,
    'lead_submitted',
    'admin',
    'Lead manually recovered',
    'Recovered Meta lead imported from provided recovery payload',
    {
      formId,
      source,
      submissionTimestamp: submittedAt,
      importedBy: 'manual-meta-recovery-script'
    }
  );

  await createInviteForLead(lead, settings);

  const smsResult = await sendLeadSms(lead, 'immediate', settings);
  const emailResult = await sendLeadEmail(lead, 'immediate', settings);

  lead.followUp.lastFollowUpAt = now;
  await lead.save();

  await logEvent(
    lead._id,
    'followup_started',
    'system',
    'Follow-up sequence started',
    'Immediate welcome email/SMS sent; automated reminders scheduled',
    { nextFollowUpAt: lead.followUp.nextFollowUpAt }
  );

  await notifyAdmins(
    'new_lead',
    'Recovered Meta Lead Imported',
    `${firstName} ${lastName}`.trim() || 'Recovered lead imported from manual recovery payload.',
    lead._id
  );

  return {
    skipped: false,
    lead,
    invitationCode: lead.invitationCode,
    smsResult,
    emailResult,
    duplicateKey: {
      email: normalizedEmail,
      phone: normalizedPhone
    }
  };
}

function verifyMetaSignature(rawBody, headerSignature = '') {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) return false;
  if (!headerSignature || !headerSignature.startsWith('sha256=')) return false;

  const expected = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const received = headerSignature.slice(7);

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(received, 'utf8'));
  } catch {
    return false;
  }
}

module.exports = {
  CANONICAL_PRO_SIGNUP_URL,
  STOP_KEYWORDS,
  START_KEYWORDS,
  TWILIO_SID_REGEX,
  META_LEAD_STATUS_CALLBACK_PATH,
  template,
  getStatusCallbackUrl,
  validateTwilioSignature,
  hasValidTwilioSid,
  wasInvalidStatusCallbackFailure,
  getRetryBlockReason,
  normalizeProSignupLink,
  getSettings,
  saveSettings,
  verifyMetaSignature,
  processMetaWebhookPayload,
  processFollowUpCycle,
  reconcileLeadRegistrations,
  handleTwilioStatusWebhook,
  retryFailedInitialMetaLeadSmsBatch,
  handleTwilioInboundWebhook,
  handleSendGridEvents,
  listLeads,
  getLeadDetails,
  computeDashboardMetrics,
  performManualAction,
  importManualLead,
  recoverManualMetaLead,
  recoverHistoricalMetaLeadsByForm
};
