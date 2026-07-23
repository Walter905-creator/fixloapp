const crypto = require('crypto');
const axios = require('axios');
const sgMail = require('@sendgrid/mail');

const AdminSettings = require('../models/AdminSettings');
const InviteCode = require('../models/InviteCode');
const MetaLead = require('../models/MetaLead');
const MetaLeadEvent = require('../models/MetaLeadEvent');
const MetaWebhookEvent = require('../models/MetaWebhookEvent');
const MetaReconciliationRun = require('../models/MetaReconciliationRun');
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
const FOLLOW_UP_STAGE_KEYS = ['24h', '72h', '7d', '14d'];
const DEFAULT_META_GRAPH_API_VERSION = 'v20.0';
const ARCHIVED_META_FORM_STATUSES = new Set(['ARCHIVED', 'DELETED', 'DISABLED', 'INACTIVE']);
const ACTIVE_META_FORM_STATUSES = new Set(['ACTIVE']);

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

function getMetaGraphApiVersion() {
  const raw = String(process.env.META_GRAPH_API_VERSION || '').trim();
  return /^v\d+\.\d+$/i.test(raw) ? raw.toLowerCase() : DEFAULT_META_GRAPH_API_VERSION;
}

function getMetaGraphApiUrl(pathname = '') {
  return `https://graph.facebook.com/${getMetaGraphApiVersion()}/${pathname}`;
}

function parseConfiguredFormIds(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))];
  }

  return [...new Set(
    String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  )];
}

function getConfiguredMetaLeadFormIds(options = {}) {
  if (options.formIds !== undefined) return parseConfiguredFormIds(options.formIds);
  if (options.formId !== undefined) return parseConfiguredFormIds(options.formId);
  if (process.env.META_LEAD_FORM_IDS) return parseConfiguredFormIds(process.env.META_LEAD_FORM_IDS);
  return [];
}

function getLegacyMetaLeadFormIds() {
  return parseConfiguredFormIds(process.env.META_LEAD_FORM_ID);
}

function normalizeMetaForm(form = {}) {
  const status = String(form.status || '').trim().toUpperCase();
  const archived = ARCHIVED_META_FORM_STATUSES.has(status);
  const active = ACTIVE_META_FORM_STATUSES.has(status) || (!status && !archived);

  return {
    id: String(form.id || '').trim(),
    name: String(form.name || '').trim(),
    status,
    created_time: form.created_time || null,
    page_id: String(form.page_id || '').trim(),
    locale: form.locale || null,
    active,
    archived
  };
}

function sanitizeMetaGraphError(error) {
  return String(
    error?.response?.data?.error?.message ||
    error?.message ||
    'Meta Graph API error'
  );
}

function isMetaNotFoundError(error) {
  const code = Number(error?.response?.data?.error?.code || 0);
  const subcode = Number(error?.response?.data?.error?.error_subcode || 0);
  const message = sanitizeMetaGraphError(error);
  return code === 100 || subcode === 33 || /does not exist|unsupported get request/i.test(message);
}

function isMetaPermissionError(error) {
  const code = Number(error?.response?.data?.error?.code || 0);
  const message = sanitizeMetaGraphError(error);
  return code === 10 || code === 200 || /missing permissions|permission|access token|not visible/i.test(message);
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
    signupLink: CANONICAL_PRO_SIGNUP_URL,
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
  merged.signupLink = CANONICAL_PRO_SIGNUP_URL;
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
  merged.signupLink = CANONICAL_PRO_SIGNUP_URL;

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
    signupLink: CANONICAL_PRO_SIGNUP_URL,
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

async function sendLeadSms(lead, templateKey, settings, options = {}) {
  const stage = options.stage || templateKey;
  const force = Boolean(options.force);
  const persist = options.persist !== false;
  const sendSmsImpl = options.sendSmsImpl || sendSms;
  const logEventFn = options.logEventFn || logEvent;

  if (!isSmsChannelAvailable(lead, { force })) {
    console.log(`[META_SMS] Follow-up skipped: reason=${lead.smsOptOut && !force ? 'opted_out' : 'channel_unavailable'} lead=${lead._id}`);
    return { success: false, reason: lead.smsOptOut && !force ? 'opted_out' : 'missing_phone' };
  }

  const idempotencyKey = buildMessageIdempotencyKey(lead, 'sms', stage);
  const existing = findSmsEntryForStage(lead, stage);
  if (existing) {
    const sid = normalizeTwilioSid(existing.messageSid);
    if (sid || existing.status === 'queued' || existing.status === 'sent' || existing.status === 'delivered') {
      console.log(`[META_SMS] Follow-up skipped: reason=duplicate_attempt lead=${lead._id} stage=${stage}`);
      return { success: true, skipped: true, reason: 'duplicate_attempt', sid: sid || null };
    }
  }

  const vars = buildMessageVars(lead, settings);
  const body = template(settings.smsTemplates?.[templateKey] || '', vars);
  if (!body.trim()) return { success: false, reason: 'missing_template' };

  const callbackUrl = getStatusCallbackUrl();
  const smsOptions = {};
  if (callbackUrl) smsOptions.statusCallback = callbackUrl;

  console.log(`[META_SMS] Initial send started lead=${lead._id} stage=${stage}`);
  try {
    const twilioRes = await sendSmsImpl(lead.phone, body, smsOptions);
    const normalizedStatus = twilioRes.status || 'sent';
    lead.smsStatus = normalizedStatus;
    lead.sms = {
      ...(lead.sms || {}),
      attempted: true,
      messageSid: twilioRes.sid || null,
      status: normalizedStatus,
      errorCode: null,
      errorMessage: null,
      sentAt: new Date(),
      deliveredAt: normalizedStatus === 'delivered' ? new Date() : (lead.sms?.deliveredAt || null)
    };
    lead.smsHistory.push({
      messageSid: twilioRes.sid,
      direction: 'outbound',
      status: normalizedStatus,
      body,
      templateKey,
      followUpStage: stage,
      idempotencyKey,
      sentAt: new Date(),
      updatedAt: new Date()
    });
    if (persist) await lead.save();

    console.log(`[META_SMS] Initial send accepted lead=${lead._id} sid=${twilioRes.sid || ''}`);
    await logEventFn(lead._id, 'sms_sent', 'sms', 'SMS sent', `Template ${templateKey}`, {
      sid: twilioRes.sid,
      status: normalizedStatus,
      templateKey,
      followUpStage: stage,
      idempotencyKey
    });
    return { success: true, sid: twilioRes.sid || null, status: normalizedStatus };
  } catch (error) {
    lead.smsStatus = 'failed';
    lead.sms = {
      ...(lead.sms || {}),
      attempted: true,
      messageSid: null,
      status: 'failed',
      errorCode: error.code ? String(error.code) : null,
      errorMessage: error.message,
      sentAt: new Date(),
      deliveredAt: null
    };
    lead.smsHistory.push({
      direction: 'outbound',
      status: 'failed',
      body,
      templateKey,
      followUpStage: stage,
      idempotencyKey,
      sentAt: new Date(),
      updatedAt: new Date(),
      errorCode: error.code ? String(error.code) : null,
      errorMessage: error.message
    });
    if (persist) await lead.save();

    console.log(`[META_SMS] Initial send failed lead=${lead._id} stage=${stage} reason=${error.message}`);
    await logEventFn(lead._id, 'sms_failed', 'sms', 'SMS failed', error.message, {
      templateKey,
      followUpStage: stage,
      idempotencyKey,
      errorCode: error.code || null
    });
    return { success: false, error: error.message, reason: 'provider_error' };
  }
}

async function sendLeadEmail(lead, templateKey, settings, options = {}) {
  const stage = options.stage || templateKey;
  const force = Boolean(options.force);
  const persist = options.persist !== false;
  const sendEmailImpl = options.sendEmailImpl || ((msg) => sgMail.send(msg));
  const ensureSendGridImpl = options.ensureSendGridImpl || ensureSendGrid;
  const logEventFn = options.logEventFn || logEvent;

  if (!isEmailChannelAvailable(lead, { force })) {
    console.log(`[META_EMAIL] Follow-up skipped: reason=${hasReachableEmail(lead) ? 'unsubscribed' : 'channel_unavailable'} lead=${lead._id}`);
    return { success: false, reason: hasReachableEmail(lead) ? 'unsubscribed' : 'missing_email' };
  }
  if (!ensureSendGridImpl()) return { success: false, reason: 'sendgrid_not_configured' };

  const idempotencyKey = buildMessageIdempotencyKey(lead, 'email', stage);
  const existing = findEmailEntryForStage(lead, stage);
  if (existing) {
    const hasMessageId = Boolean(String(existing.messageId || '').trim());
    if (hasMessageId || ['processed', 'delivered', 'open', 'click'].includes(existing.status)) {
      console.log(`[META_EMAIL] Follow-up skipped: reason=duplicate_attempt lead=${lead._id} stage=${stage}`);
      return { success: true, skipped: true, reason: 'duplicate_attempt', messageId: existing.messageId || null };
    }
  }

  const vars = buildMessageVars(lead, settings);
  const subjectTemplate = templateKey === 'immediate' ? settings.emailTemplates?.immediateSubject : settings.emailTemplates?.reminderSubject;
  const bodyTemplate = templateKey === 'immediate' ? settings.emailTemplates?.immediateBody : settings.emailTemplates?.reminderBody;
  const subject = template(subjectTemplate || '', vars);
  const html = template(bodyTemplate || '', vars);
  if (!subject || !html) return { success: false, reason: 'missing_template' };

  console.log(`[META_EMAIL] Initial send started lead=${lead._id} stage=${stage}`);
  try {
    const msg = {
      to: lead.email,
      from: process.env.SENDGRID_FROM_EMAIL || 'notifications@fixloapp.com',
      replyTo: settings.supportEmail,
      subject,
      html,
      customArgs: {
        metaLeadId: String(lead._id),
        templateKey,
        followUpStage: stage,
        idempotencyKey
      }
    };
    const [response] = await sendEmailImpl(msg);
    const messageId = response?.headers?.['x-message-id'] || null;

    lead.emailStatus = 'processed';
    lead.emailChannel = {
      ...(lead.emailChannel || {}),
      attempted: true,
      messageId,
      status: 'processed',
      error: null,
      sentAt: new Date(),
      deliveredAt: lead.emailChannel?.deliveredAt || null
    };
    lead.emailHistory.push({
      messageId,
      status: 'processed',
      subject,
      templateKey,
      followUpStage: stage,
      idempotencyKey,
      sentAt: new Date(),
      updatedAt: new Date()
    });
    if (persist) await lead.save();

    console.log(`[META_EMAIL] Initial send accepted lead=${lead._id} messageId=${messageId || ''}`);
    await logEventFn(lead._id, 'email_sent', 'email', 'Email sent', `Template ${templateKey}`, {
      messageId,
      templateKey,
      followUpStage: stage,
      idempotencyKey
    });
    return { success: true, messageId };
  } catch (error) {
    lead.emailStatus = 'pending';
    lead.emailChannel = {
      ...(lead.emailChannel || {}),
      attempted: true,
      messageId: null,
      status: 'failed',
      error: error.message,
      sentAt: new Date(),
      deliveredAt: null
    };
    lead.emailHistory.push({
      messageId: null,
      status: 'dropped',
      subject,
      templateKey,
      followUpStage: stage,
      idempotencyKey,
      sentAt: new Date(),
      updatedAt: new Date(),
      reason: error.message
    });
    if (persist) await lead.save();

    console.log(`[META_EMAIL] Initial send failed lead=${lead._id} stage=${stage} reason=${error.message}`);
    await logEventFn(lead._id, 'email_failed', 'email', 'Email failed', error.message, {
      templateKey,
      followUpStage: stage,
      idempotencyKey
    });
    return { success: false, error: error.message, reason: 'provider_error' };
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

function hasReachablePhone(lead = {}) {
  return Boolean(normalizePhone(lead.phone));
}

function hasReachableEmail(lead = {}) {
  return Boolean(String(lead.email || '').trim());
}

function isSmsChannelAvailable(lead = {}, { force = false } = {}) {
  if (!hasReachablePhone(lead)) return false;
  if (lead.smsOptOut && !force) return false;
  return true;
}

function isEmailChannelAvailable(lead = {}, { force = false } = {}) {
  if (!hasReachableEmail(lead)) return false;
  if (!force && String(lead.emailStatus || '').toLowerCase() === 'unsubscribed') return false;
  return true;
}

function getFollowUpStage(step) {
  const index = Number(step);
  if (!Number.isInteger(index) || index < 0 || index >= FOLLOW_UP_STAGE_KEYS.length) return null;
  return FOLLOW_UP_STAGE_KEYS[index];
}

function buildMessageIdempotencyKey(lead, channel, stage) {
  return `${String(lead?._id || '')}:${channel}:${stage}`;
}

function hasSmsAttemptForStage(lead = {}, stage = '') {
  return (lead.smsHistory || []).some((item) => item.direction === 'outbound'
    && (item.followUpStage === stage || item.templateKey === stage));
}

function hasEmailAttemptForStage(lead = {}, stage = '') {
  return (lead.emailHistory || []).some((item) => item.followUpStage === stage || item.templateKey === stage);
}

function findSmsEntryForStage(lead = {}, stage = '') {
  return (lead.smsHistory || []).slice().reverse().find((item) => item.direction === 'outbound'
    && (item.followUpStage === stage || item.templateKey === stage)) || null;
}

function findEmailEntryForStage(lead = {}, stage = '') {
  return (lead.emailHistory || []).slice().reverse().find((item) => item.followUpStage === stage || item.templateKey === stage) || null;
}

function syncLegacyFollowUpPointers(lead = {}) {
  const smsNext = lead?.followUp?.nextSmsFollowUpAt || null;
  const emailNext = lead?.followUp?.nextEmailFollowUpAt || null;
  const candidates = [smsNext, emailNext].filter(Boolean).map((value) => new Date(value));
  if (!candidates.length) {
    lead.followUp.nextFollowUpAt = null;
    return;
  }
  candidates.sort((a, b) => a.getTime() - b.getTime());
  lead.followUp.nextFollowUpAt = candidates[0];
}

function setChannelAvailabilityFlags(lead = {}, { force = false } = {}) {
  const smsAvailable = isSmsChannelAvailable(lead, { force });
  const emailAvailable = isEmailChannelAvailable(lead, { force });
  lead.contactability = {
    ...(lead.contactability || {}),
    smsAvailable,
    emailAvailable
  };
  lead.followUp.smsEnabled = smsAvailable;
  lead.followUp.emailEnabled = emailAvailable;
  if (!smsAvailable) lead.followUp.nextSmsFollowUpAt = null;
  if (!emailAvailable) lead.followUp.nextEmailFollowUpAt = null;
  syncLegacyFollowUpPointers(lead);
  return { smsAvailable, emailAvailable };
}

function setInitialChannelFollowUpSchedule(lead, settings, now = new Date()) {
  if (lead.followUp.smsEnabled) {
    lead.followUp.smsStep = 0;
    lead.followUp.nextSmsFollowUpAt = getNextFollowUpAt(now, settings.followUpTimingsHours, 0);
  } else {
    lead.followUp.smsStep = Number(lead.followUp.smsStep || 0);
    lead.followUp.nextSmsFollowUpAt = null;
  }
  if (lead.followUp.emailEnabled) {
    lead.followUp.emailStep = 0;
    lead.followUp.nextEmailFollowUpAt = getNextFollowUpAt(now, settings.followUpTimingsHours, 0);
  } else {
    lead.followUp.emailStep = Number(lead.followUp.emailStep || 0);
    lead.followUp.nextEmailFollowUpAt = null;
  }
  syncLegacyFollowUpPointers(lead);
}

function recalculateFollowUpLifecycle(lead = {}) {
  const smsActive = Boolean(lead.followUp.smsEnabled && lead.followUp.nextSmsFollowUpAt);
  const emailActive = Boolean(lead.followUp.emailEnabled && lead.followUp.nextEmailFollowUpAt);
  if (!smsActive && !emailActive) {
    lead.followUp.status = 'completed';
    lead.leadStatus = 'closed';
  } else if (lead.followUp.status === 'completed') {
    lead.followUp.status = 'active';
  }
  syncLegacyFollowUpPointers(lead);
}

function initializeFollowUpForAvailableChannels(lead, settings, now = new Date()) {
  const availability = setChannelAvailabilityFlags(lead);
  if (!availability.smsAvailable && !availability.emailAvailable) {
    lead.followUp.status = 'stopped';
    lead.followUp.stoppedReason = 'no_reachable_channels';
    lead.leadStatus = 'closed';
    lead.followUp.lastFollowUpAt = null;
    syncLegacyFollowUpPointers(lead);
    return { availability, sequence: 'none' };
  }

  lead.followUp.status = lead.followUp.status === 'paused' ? 'paused' : 'active';
  setInitialChannelFollowUpSchedule(lead, settings, lead.createdAt || now);
  lead.followUp.lastFollowUpAt = now;

  if (availability.smsAvailable && availability.emailAvailable) return { availability, sequence: 'dual' };
  if (availability.smsAvailable) return { availability, sequence: 'sms_only' };
  return { availability, sequence: 'email_only' };
}

async function markSequenceStopped(lead, reason) {
  lead.followUp.status = 'stopped';
  lead.followUp.stoppedReason = reason;
  lead.followUp.smsEnabled = false;
  lead.followUp.emailEnabled = false;
  lead.followUp.nextSmsFollowUpAt = null;
  lead.followUp.nextEmailFollowUpAt = null;
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
  setChannelAvailabilityFlags(lead);
  const fallbackStep = Number(lead.followUp.step || 0);
  if (lead.followUp.smsEnabled && !lead.followUp.nextSmsFollowUpAt) {
    const smsStep = Number.isFinite(Number(lead.followUp.smsStep)) ? Number(lead.followUp.smsStep) : fallbackStep;
    lead.followUp.smsStep = Math.max(0, smsStep);
    lead.followUp.nextSmsFollowUpAt = getNextFollowUpAt(lead.createdAt, settings.followUpTimingsHours, lead.followUp.smsStep);
  }
  if (lead.followUp.emailEnabled && !lead.followUp.nextEmailFollowUpAt) {
    const emailStep = Number.isFinite(Number(lead.followUp.emailStep)) ? Number(lead.followUp.emailStep) : fallbackStep;
    lead.followUp.emailStep = Math.max(0, emailStep);
    lead.followUp.nextEmailFollowUpAt = getNextFollowUpAt(lead.createdAt, settings.followUpTimingsHours, lead.followUp.emailStep);
  }
  syncLegacyFollowUpPointers(lead);

  const now = new Date();
  let smsRun = null;
  let emailRun = null;

  if (lead.followUp.smsEnabled && lead.followUp.nextSmsFollowUpAt && lead.followUp.nextSmsFollowUpAt <= now) {
    const smsStep = Number(lead.followUp.smsStep || 0);
    const smsStage = getFollowUpStage(smsStep);
    if (smsStage) {
      const smsTemplate = reminderTemplateByStep(smsStep);
      smsRun = await sendLeadSms(lead, smsTemplate, settings, { stage: smsStage, persist: false });
      lead.followUp.lastSmsFollowUpAt = now;
      if (smsRun.success || smsRun.skipped) {
        lead.followUp.smsStep = smsStep + 1;
      }
      lead.followUp.nextSmsFollowUpAt = getNextFollowUpAt(lead.createdAt, settings.followUpTimingsHours, lead.followUp.smsStep);
      if (!lead.followUp.nextSmsFollowUpAt) lead.followUp.smsEnabled = false;
      console.log(`[META_SMS] Follow-up scheduled lead=${lead._id} stage=${smsStage} next=${lead.followUp.nextSmsFollowUpAt || 'none'}`);
    } else {
      lead.followUp.smsEnabled = false;
      lead.followUp.nextSmsFollowUpAt = null;
      console.log(`[META_SMS] Follow-up skipped: reason=no_more_stages lead=${lead._id}`);
    }
  }

  if (lead.followUp.emailEnabled && lead.followUp.nextEmailFollowUpAt && lead.followUp.nextEmailFollowUpAt <= now) {
    const emailStep = Number(lead.followUp.emailStep || 0);
    const emailStage = getFollowUpStage(emailStep);
    if (emailStage) {
      emailRun = await sendLeadEmail(lead, 'reminder', settings, { stage: emailStage, persist: false });
      lead.followUp.lastEmailFollowUpAt = now;
      if (emailRun.success || emailRun.skipped) {
        lead.followUp.emailStep = emailStep + 1;
      }
      lead.followUp.nextEmailFollowUpAt = getNextFollowUpAt(lead.createdAt, settings.followUpTimingsHours, lead.followUp.emailStep);
      if (!lead.followUp.nextEmailFollowUpAt) lead.followUp.emailEnabled = false;
      console.log(`[META_EMAIL] Follow-up scheduled lead=${lead._id} stage=${emailStage} next=${lead.followUp.nextEmailFollowUpAt || 'none'}`);
    } else {
      lead.followUp.emailEnabled = false;
      lead.followUp.nextEmailFollowUpAt = null;
      console.log(`[META_EMAIL] Follow-up skipped: reason=no_more_stages lead=${lead._id}`);
    }
  }

  lead.followUp.lastFollowUpAt = now;
  lead.followUp.step = Math.max(Number(lead.followUp.smsStep || 0), Number(lead.followUp.emailStep || 0));
  recalculateFollowUpLifecycle(lead);
  await lead.save();

  await logEvent(lead._id, 'followup_sent', 'system', 'Automated follow-up sent', `Step ${lead.followUp.step}`, {
    sms: smsRun,
    email: emailRun,
    nextSmsFollowUpAt: lead.followUp.nextSmsFollowUpAt,
    nextEmailFollowUpAt: lead.followUp.nextEmailFollowUpAt,
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

  // formId has already been validated as a purely numeric Meta ID by isNumericMetaId();
  // encodeURIComponent is applied here so that no user-controlled string reaches the URL path.
  const safeFormId = encodeURIComponent(String(formId));
  const { data: form } = await axiosInstance.get(getMetaGraphApiUrl(safeFormId), {
    params: {
      access_token: token,
      fields: 'id,name,status,created_time,page_id,locale'
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

    const { data } = await axiosInstance.get(getMetaGraphApiUrl(`${safeFormId}/leads`), {
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

async function fetchMetaLeadForm(formId, deps = {}) {
  const axiosInstance = deps.axiosInstance || axios;
  const token = deps.accessToken || getAnyMetaAccessToken();

  if (!isNumericMetaId(String(formId || ''))) {
    throw new Error('Invalid Meta form ID');
  }
  if (!token) {
    throw new Error('Missing Meta page access token');
  }

  const safeFormId = encodeURIComponent(String(formId));
  const { data } = await axiosInstance.get(getMetaGraphApiUrl(safeFormId), {
    params: {
      access_token: token,
      fields: 'id,name,status,created_time,page_id,locale'
    },
    timeout: 15000
  });

  return normalizeMetaForm(data || {});
}

async function fetchMetaPageLeadForms(pageId, deps = {}) {
  const axiosInstance = deps.axiosInstance || axios;
  const token = deps.accessToken || getPageToken(pageId) || getAnyMetaAccessToken();
  const pageSize = Number(deps.pageSize || 100);

  if (!isNumericMetaId(String(pageId || ''))) {
    throw new Error('Invalid Meta page ID');
  }
  if (!token) {
    throw new Error('Missing Meta page access token');
  }

  const safePageId = encodeURIComponent(String(pageId));
  const forms = [];
  let after = null;

  do {
    const params = {
      access_token: token,
      fields: 'id,name,status,created_time,page_id,locale',
      limit: pageSize
    };
    if (after) params.after = after;

    const { data } = await axiosInstance.get(getMetaGraphApiUrl(`${safePageId}/leadgen_forms`), {
      params,
      timeout: 15000
    });

    const batch = Array.isArray(data?.data) ? data.data.map((form) => normalizeMetaForm({
      ...form,
      page_id: form?.page_id || pageId
    })) : [];
    forms.push(...batch);
    after = data?.paging?.cursors?.after || null;
  } while (after);

  return forms;
}

async function classifyConfiguredMetaForm(formId, deps = {}) {
  const normalizedFormId = String(formId || '').trim();
  const normalizedPageId = String(deps.pageId || getDefaultPageId() || '').trim();
  const discoveredForms = Array.isArray(deps.discoveredForms) ? deps.discoveredForms : [];
  const fromPage = discoveredForms.find((form) => form.id === normalizedFormId);

  if (fromPage) {
    return {
      classification: fromPage.active ? 'FORM_FOUND_ACTIVE' : 'FORM_FOUND_ARCHIVED',
      form: fromPage,
      foundOnPage: true
    };
  }

  try {
    const form = await (deps.fetchMetaLeadFormImpl || fetchMetaLeadForm)(normalizedFormId, deps);
    if (form.page_id && normalizedPageId && form.page_id !== normalizedPageId) {
      return {
        classification: 'FORM_BELONGS_TO_DIFFERENT_PAGE',
        form,
        foundOnPage: false
      };
    }

    return {
      classification: form.active ? 'FORM_FOUND_ACTIVE' : 'FORM_FOUND_ARCHIVED',
      form,
      foundOnPage: false
    };
  } catch (error) {
    const sanitizedError = sanitizeMetaGraphError(error);
    return {
      classification: isMetaPermissionError(error)
        ? 'FORM_NOT_VISIBLE_TO_TOKEN'
        : (isMetaNotFoundError(error) ? 'FORM_NOT_FOUND' : 'FORM_NOT_FOUND'),
      form: null,
      foundOnPage: false,
      error: sanitizedError
    };
  }
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
  const followUpScheduled = lead?.followUp?.status === 'active';
  const nextFollowUpDate = lead?.followUp?.nextFollowUpAt || null;
  return {
    status,
    recoveryMethod: source,
    source,
    reason,
    matchedMetaLeadId: metaLeadId,
    leadId: lead ? String(lead._id) : null,
    mongoDocumentId: lead ? String(lead._id) : null,
    name: lead ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim() : '',
    inviteCodeStatus: lead?.invitationCode ? 'created' : 'missing',
    inviteCode: lead?.invitationCode || null,
    smsStatus: lastSms?.status || lead?.smsStatus || 'not_sent',
    twilioMessageSid: lastSms?.messageSid || null,
    emailStatus: lastEmail?.status || lead?.emailStatus || 'not_sent',
    emailMessageId: lastEmail?.messageId || null,
    sendGridMessageId: lastEmail?.messageId || null,
    followUpStatus: lead?.followUp?.status || 'inactive',
    followUpScheduled,
    smsFollowUpsEnabled: Boolean(lead?.followUp?.smsEnabled),
    emailFollowUpsEnabled: Boolean(lead?.followUp?.emailEnabled),
    nextFollowUpAt: nextFollowUpDate,
    nextFollowUpDate,
    nextSmsFollowUpAt: lead?.followUp?.nextSmsFollowUpAt || null,
    nextEmailFollowUpAt: lead?.followUp?.nextEmailFollowUpAt || null,
    signupLink: CANONICAL_PRO_SIGNUP_URL
  };
}

async function fetchMetaLeadData(metaLeadId, pageId) {
  if (!isNumericMetaId(metaLeadId) || !isNumericMetaId(pageId)) {
    throw new Error('Invalid Meta identifiers');
  }

  const token = getPageToken(pageId);
  if (!token) throw new Error('Missing Meta page access token');

  const { data } = await axios.get(getMetaGraphApiUrl(metaLeadId), {
    params: {
      access_token: token,
      fields: 'id,created_time,field_data,form_id,ad_id,campaign_id,adgroup_id,is_organic,platform'
    },
    timeout: 15000
  });

  const [form, campaign, adSet, ad] = await Promise.all([
    data.form_id ? axios.get(getMetaGraphApiUrl(data.form_id), {
      params: { access_token: token, fields: 'id,name' }, timeout: 15000
    }).then((r) => r.data).catch(() => null) : null,
    data.campaign_id ? axios.get(getMetaGraphApiUrl(data.campaign_id), {
      params: { access_token: token, fields: 'id,name' }, timeout: 15000
    }).then((r) => r.data).catch(() => null) : null,
    data.adgroup_id ? axios.get(getMetaGraphApiUrl(data.adgroup_id), {
      params: { access_token: token, fields: 'id,name' }, timeout: 15000
    }).then((r) => r.data).catch(() => null) : null,
    data.ad_id ? axios.get(getMetaGraphApiUrl(data.ad_id), {
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

  const missingFields = [];
  if (!phone) missingFields.push('phone');
  if (!email) missingFields.push('email');
  if (!trade) missingFields.push('trade');
  const profileIncomplete = missingFields.length > 0;

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
    profileIncomplete,
    missingFields,
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
      smsStep: 0,
      emailStep: 0,
      status: 'active',
      smsEnabled: true,
      emailEnabled: true,
      lastFollowUpAt: null,
      nextFollowUpAt: null,
      nextSmsFollowUpAt: null,
      nextEmailFollowUpAt: null
    }
  });

  await logEvent(lead._id, 'lead_submitted', 'meta', 'Lead submitted from Meta', `Meta lead ${metaLeadId}`, {
    pageId,
    campaignId: enriched.data?.campaign_id,
    formId: enriched.data?.form_id
  });

  await createInviteForLead(lead, settings);
  const availability = setChannelAvailabilityFlags(lead);
  if (availability.smsAvailable) console.log(`[META_SMS] Channel available lead=${lead._id}`);
  else console.log(`[META_SMS] Channel unavailable lead=${lead._id}`);
  if (availability.emailAvailable) console.log(`[META_EMAIL] Channel available lead=${lead._id}`);
  else console.log(`[META_EMAIL] Channel unavailable lead=${lead._id}`);

  const smsResult = availability.smsAvailable
    ? await sendLeadSms(lead, 'immediate', settings, { stage: 'immediate', persist: false })
    : { success: false, reason: 'missing_phone' };
  const emailResult = availability.emailAvailable
    ? await sendLeadEmail(lead, 'immediate', settings, { stage: 'immediate', persist: false })
    : { success: false, reason: 'missing_email' };

  const followUpInit = initializeFollowUpForAvailableChannels(lead, settings, new Date());
  if (followUpInit.sequence === 'dual') console.log(`[META_FOLLOWUP] Dual-channel sequence scheduled lead=${lead._id}`);
  else if (followUpInit.sequence === 'sms_only') console.log(`[META_FOLLOWUP] SMS-only sequence scheduled lead=${lead._id}`);
  else if (followUpInit.sequence === 'email_only') console.log(`[META_FOLLOWUP] Email-only sequence scheduled lead=${lead._id}`);
  else console.log(`[META_FOLLOWUP] No reachable channels lead=${lead._id}`);

  await lead.save();

  await logEvent(lead._id, 'followup_started', 'system', 'Follow-up sequence started', 'Immediate outreach completed', {
    smsResult,
    emailResult,
    nextFollowUpAt: lead.followUp.nextFollowUpAt,
    nextSmsFollowUpAt: lead.followUp.nextSmsFollowUpAt,
    nextEmailFollowUpAt: lead.followUp.nextEmailFollowUpAt
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
    leadStatus: { $nin: ['closed'] },
    registrationStatus: 'not_registered',
    $or: [
      { 'followUp.nextSmsFollowUpAt': { $lte: now } },
      { 'followUp.nextEmailFollowUpAt': { $lte: now } },
      { 'followUp.nextFollowUpAt': { $lte: now } }
    ]
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
  lead.sms = {
    ...(lead.sms || {}),
    attempted: true,
    messageSid: sid,
    status: normalizedStatus,
    errorCode: payload.ErrorCode || null,
    errorMessage: payload.ErrorMessage || null,
    sentAt: lead.sms?.sentAt || historyItem.sentAt || null,
    deliveredAt: normalizedStatus === 'delivered' ? new Date() : (lead.sms?.deliveredAt || null)
  };
  if (String(payload.ErrorCode || '') === '21610' || normalizedStatus === 'opted_out') {
    lead.smsOptOut = true;
    lead.followUp.smsEnabled = false;
    lead.followUp.nextSmsFollowUpAt = null;
    syncLegacyFollowUpPointers(lead);
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

  let formData = null;
  let graphLookupError = '';
  try {
    formData = await fetchMetaFormLeadsImpl(normalizedFormId, { accessToken, pageId });
  } catch (error) {
    graphLookupError = String(error?.response?.data?.error?.message || error?.message || 'Meta Graph lookup failed');
  }

  const resolvedPageId = String(formData?.pageId || pageId || getDefaultPageId() || '').trim();
  const graphLeads = Array.isArray(formData?.leads) ? formData.leads : [];
  const results = [];

  for (const target of normalizedTargets) {
    const displayName = target.fullName || target.email || target.phone || 'Unknown target';
    const existing = await findExistingMetaLeadByContact({ email: target.email, phone: target.phone }, metaLeadModel);
    if (existing) {
      results.push({
        status: 'SKIPPED_DUPLICATE',
        recoveryMethod: 'duplicate',
        source: 'duplicate',
        reason: `MetaLead already exists (${existing._id})`,
        matchedMetaLeadId: existing.metaLeadId || null,
        leadId: String(existing._id),
        mongoDocumentId: String(existing._id),
        name: `${existing.firstName || ''} ${existing.lastName || ''}`.trim() || displayName,
        inviteCodeStatus: 'unchanged',
        inviteCode: null,
        smsStatus: 'unchanged',
        twilioMessageSid: null,
        emailStatus: 'unchanged',
        emailMessageId: null,
        sendGridMessageId: null,
        followUpStatus: 'unchanged',
        followUpScheduled: false,
        nextFollowUpAt: null,
        nextFollowUpDate: null,
        signupLink: CANONICAL_PRO_SIGNUP_URL
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
          recoveryMethod: 'meta',
          source: 'meta',
          reason: imported.reason || 'Skipped by Meta ingestion pipeline',
          matchedMetaLeadId: String(matchedLead.id || ''),
          leadId: imported.lead ? String(imported.lead._id) : null,
          mongoDocumentId: imported.lead ? String(imported.lead._id) : null,
          name: displayName,
          inviteCodeStatus: imported.lead?.invitationCode ? 'existing' : 'unchanged',
          inviteCode: imported.lead?.invitationCode || null,
          smsStatus: imported.lead?.smsStatus || 'unchanged',
          twilioMessageSid: null,
          emailStatus: imported.lead?.emailStatus || 'unchanged',
          emailMessageId: null,
          sendGridMessageId: null,
          followUpStatus: imported.lead?.followUp?.status || 'unchanged',
          followUpScheduled: imported.lead?.followUp?.status === 'active',
          nextFollowUpAt: imported.lead?.followUp?.nextFollowUpAt || null,
          nextFollowUpDate: imported.lead?.followUp?.nextFollowUpAt || null,
          signupLink: CANONICAL_PRO_SIGNUP_URL
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

    // Manual recovery now allows partial leads: a trade can be missing, but at
    // least one contact channel must exist so outreach can still proceed.
    if (!target.fullName || (!target.email && !target.phone)) {
      const reasonParts = [];
      if (graphLookupError) reasonParts.push(`Meta lookup unavailable: ${graphLookupError}`);
      reasonParts.push('manual recovery requires fullName and at least one contact channel (email or phone)');
      results.push({
        status: 'FAILED',
        recoveryMethod: 'manual',
        source: 'manual',
        reason: reasonParts.join('; '),
        matchedMetaLeadId: null,
        leadId: null,
        mongoDocumentId: null,
        name: displayName,
        inviteCodeStatus: 'not_created',
        inviteCode: null,
        smsStatus: 'not_sent',
        twilioMessageSid: null,
        emailStatus: 'not_sent',
        emailMessageId: null,
        sendGridMessageId: null,
        followUpStatus: 'not_scheduled',
        followUpScheduled: false,
        nextFollowUpAt: null,
        nextFollowUpDate: null,
        signupLink: CANONICAL_PRO_SIGNUP_URL
      });
      continue;
    }

    const manual = await recoverManualMetaLeadImpl({
      fullName: target.fullName,
      email: target.email,
      phone: target.phone,
      trade: target.trade || undefined,
      formId: normalizedFormId,
      submittedAt: target.submittedAt,
      source: 'recovered_meta_lead',
      note: target.note
    });

    if (manual?.skipped) {
      results.push({
        status: isDuplicateSkipReason(manual.skippedReason) ? 'SKIPPED_DUPLICATE' : 'FAILED',
        recoveryMethod: 'manual',
        source: 'manual',
        reason: manual.skippedReason || 'Manual recovery skipped',
        matchedMetaLeadId: null,
        leadId: manual.existingId ? String(manual.existingId) : null,
        mongoDocumentId: manual.existingId ? String(manual.existingId) : null,
        name: displayName,
        inviteCodeStatus: 'unchanged',
        inviteCode: null,
        smsStatus: 'unchanged',
        twilioMessageSid: null,
        emailStatus: 'unchanged',
        emailMessageId: null,
        sendGridMessageId: null,
        followUpStatus: 'unchanged',
        followUpScheduled: false,
        nextFollowUpAt: null,
        nextFollowUpDate: null,
        signupLink: CANONICAL_PRO_SIGNUP_URL
      });
      continue;
    }

    results.push(summarizeRecoveredLead({
      lead: manual.lead,
      status: 'RECOVERED_MANUAL',
      source: graphLookupError ? 'manual_after_meta_lookup_failure' : 'manual'
    }));
  }

  return {
    formId: normalizedFormId,
    canonicalSignupLink: CANONICAL_PRO_SIGNUP_URL,
    graphLookupError: graphLookupError || null,
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
    lead.followUp.smsEnabled = false;
    lead.followUp.nextSmsFollowUpAt = null;
    syncLegacyFollowUpPointers(lead);
    recalculateFollowUpLifecycle(lead);
    lead.smsHistory.push({
      direction: 'inbound',
      status: 'stop_received',
      body,
      sentAt: new Date(),
      updatedAt: new Date()
    });
    await lead.save();

    await logEvent(lead._id, 'stop_received', 'sms', 'STOP received', body);

    await sendSms(lead.phone, settings.smsTemplates?.unsubscribed || 'You have been unsubscribed from Fixlo SMS updates. Reply START to subscribe again.');
    return { handled: true, action: 'opt_out', leadId: lead._id };
  }

  if (START_KEYWORDS.has(normalizedBody)) {
    lead.smsOptOut = false;
    lead.smsOptInAt = new Date();
    lead.followUp.smsEnabled = hasReachablePhone(lead);
    if (lead.registrationStatus === 'not_registered' && lead.followUp.smsEnabled) {
      if (!Number.isFinite(Number(lead.followUp.smsStep))) lead.followUp.smsStep = Number(lead.followUp.step || 0);
      if (!lead.followUp.nextSmsFollowUpAt) {
        lead.followUp.nextSmsFollowUpAt = new Date(Date.now() + (60 * 60 * 1000));
      }
      if (lead.followUp.status === 'completed') lead.followUp.status = 'active';
    }
    syncLegacyFollowUpPointers(lead);
    lead.smsHistory.push({
      direction: 'inbound',
      status: 'start_received',
      body,
      sentAt: new Date(),
      updatedAt: new Date()
    });

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
    lead.emailChannel = {
      ...(lead.emailChannel || {}),
      attempted: true,
      messageId: history?.messageId || lead.emailChannel?.messageId || null,
      status: mappedStatus,
      error: event.reason || lead.emailChannel?.error || null,
      sentAt: lead.emailChannel?.sentAt || history?.sentAt || null,
      deliveredAt: mappedStatus === 'delivered' ? new Date() : (lead.emailChannel?.deliveredAt || null)
    };
    if (mappedStatus === 'unsubscribe') {
      lead.followUp.emailEnabled = false;
      lead.followUp.nextEmailFollowUpAt = null;
      syncLegacyFollowUpPointers(lead);
      recalculateFollowUpLifecycle(lead);
    }

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
  const allowedSources = new Set(['instagram', 'facebook', 'meta_unknown', 'manual_meta_import', 'recovered_meta_lead']);

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

async function auditMetaLeadChannelCoverage(limit = 500) {
  const leads = await MetaLead.find({}).sort({ createdAt: -1 }).limit(Math.max(1, Math.min(2000, Number(limit) || 500)));
  const rows = leads.map((lead) => {
    const smsStage = findSmsEntryForStage(lead, 'immediate') || (lead.smsHistory || []).filter((item) => item.direction === 'outbound').slice(-1)[0] || null;
    const emailStage = findEmailEntryForStage(lead, 'immediate') || (lead.emailHistory || []).slice(-1)[0] || null;
    const phoneAvailable = isSmsChannelAvailable(lead, { force: true });
    const emailAvailable = isEmailChannelAvailable(lead, { force: true });
    return {
      leadId: String(lead._id),
      name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.email || lead.phone || 'Unknown',
      phoneAvailable,
      emailAvailable,
      initialSmsStatus: smsStage?.status || lead.smsStatus || 'not_sent',
      twilioSid: smsStage?.messageSid || lead.sms?.messageSid || null,
      initialEmailStatus: emailStage?.status || lead.emailStatus || 'not_sent',
      sendGridMessageId: emailStage?.messageId || lead.emailChannel?.messageId || null,
      smsFollowUpsEnabled: Boolean(lead.followUp?.smsEnabled),
      emailFollowUpsEnabled: Boolean(lead.followUp?.emailEnabled),
      nextSmsFollowUpAt: lead.followUp?.nextSmsFollowUpAt || null,
      nextEmailFollowUpAt: lead.followUp?.nextEmailFollowUpAt || null,
      signupUrl: CANONICAL_PRO_SIGNUP_URL
    };
  });
  return {
    generatedAt: new Date().toISOString(),
    canonicalSignupUrl: CANONICAL_PRO_SIGNUP_URL,
    rows
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
    await sendLeadSms(lead, 'immediate', settings, { force: true, stage: 'immediate' });
  } else if (action === 'resend_email') {
    await sendLeadEmail(lead, 'immediate', settings, { force: true, stage: 'immediate' });
  } else if (action === 'pause') {
    lead.followUp.status = 'paused';
    lead.followUp.pausedAt = new Date();
    lead.followUp.pausedReason = payload.reason || 'paused_by_admin';
    await lead.save();
  } else if (action === 'resume') {
    lead.followUp.status = 'active';
    setChannelAvailabilityFlags(lead);
    if (lead.followUp.smsEnabled && !lead.followUp.nextSmsFollowUpAt) lead.followUp.nextSmsFollowUpAt = new Date(Date.now() + (60 * 60 * 1000));
    if (lead.followUp.emailEnabled && !lead.followUp.nextEmailFollowUpAt) lead.followUp.nextEmailFollowUpAt = new Date(Date.now() + (60 * 60 * 1000));
    syncLegacyFollowUpPointers(lead);
    await lead.save();
  } else if (action === 'mark_closed') {
    lead.leadStatus = 'closed';
    lead.followUp.status = 'stopped';
    lead.followUp.stoppedReason = payload.reason || 'closed_by_admin';
    lead.followUp.smsEnabled = false;
    lead.followUp.emailEnabled = false;
    lead.followUp.nextSmsFollowUpAt = null;
    lead.followUp.nextEmailFollowUpAt = null;
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
      smsStep: 0,
      emailStep: 0,
      status: 'active',
      smsEnabled: true,
      emailEnabled: true,
      lastFollowUpAt: null,
      nextFollowUpAt: null,
      nextSmsFollowUpAt: null,
      nextEmailFollowUpAt: null
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

  const availability = setChannelAvailabilityFlags(lead);
  if (availability.smsAvailable) console.log(`[META_SMS] Channel available lead=${lead._id}`);
  else console.log(`[META_SMS] Channel unavailable lead=${lead._id}`);
  if (availability.emailAvailable) console.log(`[META_EMAIL] Channel available lead=${lead._id}`);
  else console.log(`[META_EMAIL] Channel unavailable lead=${lead._id}`);

  const smsResult = availability.smsAvailable
    ? await sendLeadSms(lead, 'immediate', settings, { stage: 'immediate', persist: false })
    : { success: false, reason: 'missing_phone' };
  const emailResult = availability.emailAvailable
    ? await sendLeadEmail(lead, 'immediate', settings, { stage: 'immediate', persist: false })
    : { success: false, reason: 'missing_email' };

  const followUpInit = initializeFollowUpForAvailableChannels(lead, settings, now);
  if (followUpInit.sequence === 'dual') console.log(`[META_FOLLOWUP] Dual-channel sequence scheduled lead=${lead._id}`);
  else if (followUpInit.sequence === 'sms_only') console.log(`[META_FOLLOWUP] SMS-only sequence scheduled lead=${lead._id}`);
  else if (followUpInit.sequence === 'email_only') console.log(`[META_FOLLOWUP] Email-only sequence scheduled lead=${lead._id}`);
  else console.log(`[META_FOLLOWUP] No reachable channels lead=${lead._id}`);

  await lead.save();

  await logEvent(
    lead._id,
    'followup_started',
    'system',
    'Follow-up sequence started',
    'Immediate outreach completed',
    {
      nextFollowUpAt: lead.followUp.nextFollowUpAt,
      nextSmsFollowUpAt: lead.followUp.nextSmsFollowUpAt,
      nextEmailFollowUpAt: lead.followUp.nextEmailFollowUpAt
    }
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
 * recoverPartialMetaLead — Recover a historical Meta lead that has incomplete contact
 * information (e.g. email-only or phone+trade-only). Unlike recoverManualMetaLead, this
 * function does not require both email and phone and gracefully handles single-channel
 * leads — it only sends via the available channel and schedules follow-ups accordingly.
 *
 * Idempotency:
 * - Checks for an existing MetaLead by normalised email or phone before creating.
 * - If a lead already exists, completes any missing workflow steps without duplication.
 * - Does not resend a message that has already been attempted (any history entry present).
 * - Does not create a second invite code.
 * - Does not schedule a duplicate follow-up sequence.
 *
 * @param {object} leadData
 * @param {string}  leadData.fullName   - Required.
 * @param {string} [leadData.email]     - Optional. Normalised to lowercase.
 * @param {string} [leadData.phone]     - Optional. Normalised to E.164.
 * @param {string} [leadData.trade]     - Optional.
 * @param {string}  leadData.formId     - Required.
 * @param {string|Date} [leadData.submittedAt]
 * @param {string} [leadData.source]
 * @param {string} [leadData.note]
 * @returns {object} { status, lead, profileIncomplete, missingFields, emailAvailable,
 *                     smsAvailable, smsResult, emailResult, followUpChannels }
 */
async function recoverPartialMetaLead(leadData = {}) {
  const settings = await getSettings();
  const now = new Date();

  const fullName = String(leadData.fullName || '').trim();
  const normalizedEmail = String(leadData.email || '').trim().toLowerCase();
  const normalizedPhone = normalizePhone(leadData.phone) || '';
  const trade = String(leadData.trade || '').trim();
  const formId = String(leadData.formId || '').trim();
  const parsedSubmittedAt = parseDate(leadData.submittedAt);
  const submittedAt = parsedSubmittedAt || now;
  const source = String(leadData.source || 'recovered_meta_lead').trim() || 'recovered_meta_lead';
  const note = String(leadData.note || '').trim();

  if (!fullName) {
    return { skipped: true, skippedReason: 'fullName is required' };
  }
  if (!formId) {
    return { skipped: true, skippedReason: 'formId is required' };
  }
  if (!normalizedEmail && !normalizedPhone) {
    return { skipped: true, skippedReason: 'At least one contact channel (email or phone) is required' };
  }

  const emailAvailable = !!normalizedEmail;
  const smsAvailable = !!normalizedPhone;

  const missingFields = [];
  if (!normalizedPhone) missingFields.push('phone');
  if (!trade) missingFields.push('trade');
  if (!normalizedEmail) missingFields.push('email');
  const profileIncomplete = missingFields.length > 0;

  const followUpChannels = [...(smsAvailable ? ['sms'] : []), ...(emailAvailable ? ['email'] : [])];

  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const firstName = nameParts.shift() || '';
  const lastName = nameParts.join(' ');

  // Idempotency: look for an existing MetaLead by available contact info.
  const duplicateConditions = buildDuplicateConditions({ email: normalizedEmail, phone: normalizedPhone });
  const existing = duplicateConditions.length
    ? await MetaLead.findOne({ $or: duplicateConditions })
    : null;

  if (existing) {
    setChannelAvailabilityFlags(existing);
    const hasInvite = !!existing.invitationCode;
    const smsSent = hasSmsAttemptForStage(existing, 'immediate');
    const emailSent = hasEmailAttemptForStage(existing, 'immediate');
    const followUpActive = existing.followUp?.status === 'active';

    const smsComplete = !smsAvailable || smsSent;
    const emailComplete = !emailAvailable || emailSent;

    if (hasInvite && smsComplete && emailComplete && followUpActive) {
      syncLegacyFollowUpPointers(existing);
      await existing.save();
      const lastSmsEntry = existing.smsHistory.filter((h) => h.direction === 'outbound').slice(-1)[0];
      const lastEmailEntry = existing.emailHistory.slice(-1)[0];
      return {
        status: 'ALREADY_COMPLETE',
        lead: existing,
        profileIncomplete,
        missingFields,
        emailAvailable,
        smsAvailable,
        smsResult: smsSent
          ? { success: true, sid: lastSmsEntry?.messageSid || null, skipped: true }
          : { success: false, reason: 'not_available' },
        emailResult: emailSent
          ? { success: true, messageId: lastEmailEntry?.messageId || null, skipped: true }
          : { success: false, reason: 'not_available' },
        followUpChannels
      };
    }

    // Complete only the missing workflow steps.
    if (!hasInvite) {
      await createInviteForLead(existing, settings);
      console.log(`[META_INVITE] Invite code created: ${existing.invitationCode}`);
    }

    let smsResult = { success: false, reason: 'not_available' };
    let emailResult = { success: false, reason: 'not_available' };

    if (smsAvailable && !smsSent) {
      smsResult = await sendLeadSms(existing, 'immediate', settings, { stage: 'immediate', persist: false });
      if (smsResult.success) console.log(`[META_SMS] Initial SMS sent SID=${smsResult.sid}`);
    } else if (smsAvailable) {
      const lastSmsEntry = existing.smsHistory.filter((h) => h.direction === 'outbound').slice(-1)[0];
      smsResult = { success: true, sid: lastSmsEntry?.messageSid || null, skipped: true };
    }

    if (emailAvailable && !emailSent) {
      emailResult = await sendLeadEmail(existing, 'immediate', settings, { stage: 'immediate', persist: false });
      if (emailResult.success) console.log(`[META_EMAIL] Initial email sent messageId=${emailResult.messageId}`);
    } else if (emailAvailable) {
      const lastEmailEntry = existing.emailHistory.slice(-1)[0];
      emailResult = { success: true, messageId: lastEmailEntry?.messageId || null, skipped: true };
    }

    if (!smsAvailable && !emailAvailable) {
      existing.followUp.status = 'stopped';
      existing.followUp.stoppedReason = 'no_reachable_channels';
      existing.leadStatus = 'closed';
      console.log(`[META_FOLLOWUP] No reachable channels lead=${existing._id}`);
    } else if (!followUpActive) {
      existing.followUp.status = 'active';
      setInitialChannelFollowUpSchedule(existing, settings, existing.createdAt || now);
      if (smsAvailable && emailAvailable) console.log(`[META_FOLLOWUP] Dual-channel sequence scheduled lead=${existing._id}`);
      else if (smsAvailable) console.log(`[META_FOLLOWUP] SMS-only sequence scheduled lead=${existing._id}`);
      else console.log(`[META_FOLLOWUP] Email-only sequence scheduled lead=${existing._id}`);
    } else {
      syncLegacyFollowUpPointers(existing);
    }
    await existing.save();

    return {
      status: 'COMPLETED_EXISTING',
      lead: existing,
      profileIncomplete,
      missingFields,
      emailAvailable,
      smsAvailable,
      smsResult,
      emailResult,
      followUpChannels
    };
  }

  // No existing lead — create a new one.
  const identityHash = crypto
    .createHash('sha1')
    .update(`${normalizedEmail}|${normalizedPhone}|${formId}`)
    .digest('hex')
    .slice(0, 24);

  // metaLeadId uses a lowercase prefix; leadUniqueId uses uppercase — mirrors recoverManualMetaLead.
  const metaLeadIdVal = `recovered-partial-${identityHash}`;
  const leadUniqueIdVal = `RECOVERED-PARTIAL-${identityHash}`;

  const noteParts = [
    'Recovered partial Meta lead imported through manual recovery pipeline.',
    profileIncomplete ? `Profile incomplete: missing ${missingFields.join(', ')}.` : '',
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
    campaign: { formId },
    notes: noteParts,
    submissionTimestamp: submittedAt,
    leadStatus: 'in_progress',
    followUp: {
      step: 0,
      smsStep: 0,
      emailStep: 0,
      status: 'active',
      smsEnabled: true,
      emailEnabled: true,
      lastFollowUpAt: null,
      nextFollowUpAt: null,
      nextSmsFollowUpAt: null,
      nextEmailFollowUpAt: null
    }
  });

  console.log(`[META_DATABASE] Lead inserted: ${lead._id}`);

  await logEvent(
    lead._id,
    'lead_submitted',
    'admin',
    'Partial lead manually recovered',
    'Recovered partial Meta lead imported from recovery payload',
    {
      formId,
      source,
      submissionTimestamp: submittedAt,
      importedBy: 'manual-meta-recovery-script',
      missingFields,
      profileIncomplete
    }
  );

  await createInviteForLead(lead, settings);
  console.log(`[META_INVITE] Invite code created: ${lead.invitationCode}`);

  let smsResult = { success: false, reason: 'not_available' };
  let emailResult = { success: false, reason: 'not_available' };

  const availability = setChannelAvailabilityFlags(lead);
  if (availability.smsAvailable) console.log(`[META_SMS] Channel available lead=${lead._id}`);
  else console.log(`[META_SMS] Channel unavailable lead=${lead._id}`);
  if (availability.emailAvailable) console.log(`[META_EMAIL] Channel available lead=${lead._id}`);
  else console.log(`[META_EMAIL] Channel unavailable lead=${lead._id}`);

  if (smsAvailable) {
    smsResult = await sendLeadSms(lead, 'immediate', settings, { stage: 'immediate', persist: false });
    if (smsResult.success) console.log(`[META_SMS] Initial SMS sent SID=${smsResult.sid}`);
  }
  if (emailAvailable) {
    emailResult = await sendLeadEmail(lead, 'immediate', settings, { stage: 'immediate', persist: false });
    if (emailResult.success) console.log(`[META_EMAIL] Initial email sent messageId=${emailResult.messageId}`);
  }

  const followUpInit = initializeFollowUpForAvailableChannels(lead, settings, now);
  if (followUpInit.sequence === 'dual') console.log(`[META_FOLLOWUP] Dual-channel sequence scheduled lead=${lead._id}`);
  else if (followUpInit.sequence === 'sms_only') console.log(`[META_FOLLOWUP] SMS-only sequence scheduled lead=${lead._id}`);
  else if (followUpInit.sequence === 'email_only') console.log(`[META_FOLLOWUP] Email-only sequence scheduled lead=${lead._id}`);
  else console.log(`[META_FOLLOWUP] No reachable channels lead=${lead._id}`);
  await lead.save();

  await logEvent(
    lead._id,
    'followup_started',
    'system',
    'Follow-up sequence started',
    `Channel-specific follow-up scheduled (channels: ${followUpChannels.join(', ')})`,
    {
      nextFollowUpAt: lead.followUp.nextFollowUpAt,
      nextSmsFollowUpAt: lead.followUp.nextSmsFollowUpAt,
      nextEmailFollowUpAt: lead.followUp.nextEmailFollowUpAt,
      smsAvailable,
      emailAvailable
    }
  );

  await notifyAdmins(
    'new_lead',
    'Recovered Partial Meta Lead Imported',
    `${firstName} ${lastName}`.trim() || 'Partial Meta lead recovered',
    lead._id
  );

  return {
    status: 'CREATED',
    lead,
    profileIncomplete,
    missingFields,
    emailAvailable,
    smsAvailable,
    smsResult,
    emailResult,
    invitationCode: lead.invitationCode,
    followUpChannels
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

  if (!fullName || !formId || (!normalizedEmail && !normalizedPhone)) {
    return { skipped: true, skippedReason: 'Missing required lead fields (name/formId and at least one contact channel)' };
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
      smsStep: 0,
      emailStep: 0,
      status: 'active',
      smsEnabled: true,
      emailEnabled: true,
      lastFollowUpAt: null,
      nextFollowUpAt: null,
      nextSmsFollowUpAt: null,
      nextEmailFollowUpAt: null
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

  const availability = setChannelAvailabilityFlags(lead);
  if (availability.smsAvailable) console.log(`[META_SMS] Channel available lead=${lead._id}`);
  else console.log(`[META_SMS] Channel unavailable lead=${lead._id}`);
  if (availability.emailAvailable) console.log(`[META_EMAIL] Channel available lead=${lead._id}`);
  else console.log(`[META_EMAIL] Channel unavailable lead=${lead._id}`);

  const smsResult = availability.smsAvailable
    ? await sendLeadSms(lead, 'immediate', settings, { stage: 'immediate', persist: false })
    : { success: false, reason: 'missing_phone' };
  const emailResult = availability.emailAvailable
    ? await sendLeadEmail(lead, 'immediate', settings, { stage: 'immediate', persist: false })
    : { success: false, reason: 'missing_email' };

  const followUpInit = initializeFollowUpForAvailableChannels(lead, settings, now);
  if (followUpInit.sequence === 'dual') console.log(`[META_FOLLOWUP] Dual-channel sequence scheduled lead=${lead._id}`);
  else if (followUpInit.sequence === 'sms_only') console.log(`[META_FOLLOWUP] SMS-only sequence scheduled lead=${lead._id}`);
  else if (followUpInit.sequence === 'email_only') console.log(`[META_FOLLOWUP] Email-only sequence scheduled lead=${lead._id}`);
  else console.log(`[META_FOLLOWUP] No reachable channels lead=${lead._id}`);
  await lead.save();

  await logEvent(
    lead._id,
    'followup_started',
    'system',
    'Follow-up sequence started',
    'Immediate welcome email/SMS sent; automated reminders scheduled',
    {
      nextFollowUpAt: lead.followUp.nextFollowUpAt,
      nextSmsFollowUpAt: lead.followUp.nextSmsFollowUpAt,
      nextEmailFollowUpAt: lead.followUp.nextEmailFollowUpAt
    }
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

// ── Durable webhook event helpers ────────────────────────────────────────────

/**
 * Persist a raw Meta webhook payload to MongoDB BEFORE processing so a server
 * restart cannot lose the event.
 */
async function saveWebhookEvent(rawPayload, signature = '') {
  try {
    const event = await MetaWebhookEvent.create({
      status: 'pending',
      rawPayload,
      signature: String(signature || '').slice(0, 512)
    });
    return event;
  } catch (err) {
    // Non-fatal — log and continue so the webhook still processes.
    console.error(`[META_WEBHOOK_EVENT] Failed to persist raw event: ${err.message}`);
    return null;
  }
}

async function markWebhookEventProcessing(eventId) {
  if (!eventId) return;
  await MetaWebhookEvent.findByIdAndUpdate(eventId, { status: 'processing' });
}

async function markWebhookEventProcessed(eventId, result = null) {
  if (!eventId) return;
  await MetaWebhookEvent.findByIdAndUpdate(eventId, {
    status: 'processed',
    processedAt: new Date(),
    processingResult: result
  });
}

async function markWebhookEventFailed(eventId, errorMessage = '') {
  if (!eventId) return;
  const event = await MetaWebhookEvent.findById(eventId);
  if (!event) return;
  const retryCount = (event.retryCount || 0) + 1;
  const nextRetryAt = new Date(Date.now() + Math.min(Math.pow(2, retryCount) * 60000, MAX_RETRY_DELAY_MS));
  await MetaWebhookEvent.findByIdAndUpdate(eventId, {
    status: 'failed',
    lastError: String(errorMessage || '').slice(0, 2000),
    retryCount,
    nextRetryAt
  });
}

/**
 * Re-process webhook events that failed or were left in 'pending'/'processing'
 * state (e.g. after a server restart).  Called by the scheduled job.
 */
async function retryUnprocessedWebhookEvents() {
  const cutoff = new Date(Date.now() - WEBHOOK_RETRY_CUTOFF_MS);
  const events = await MetaWebhookEvent.find({
    status: { $in: ['pending', 'processing', 'failed'] },
    $or: [
      { nextRetryAt: null },
      { nextRetryAt: { $lte: new Date() } }
    ],
    createdAt: { $lte: cutoff }
  }).limit(20);

  let retried = 0;
  for (const event of events) {
    if (!event.rawPayload) continue;
    try {
      await markWebhookEventProcessing(event._id);
      const result = await processMetaWebhookPayload(event.rawPayload);
      await markWebhookEventProcessed(event._id, result);
      retried += 1;
    } catch (err) {
      await markWebhookEventFailed(event._id, err.message);
    }
  }
  return { retried };
}

// ── Lead completeness classification ────────────────────────────────────────

/**
 * Return the stored `missingFields` array for a lead document when it is
 * non-empty, otherwise fall back to the provided `fallback` array (e.g. the
 * freshly-computed list derived from raw Meta field data).
 *
 * @param {object} lead     - MetaLead document (or plain object).
 * @param {string[]} fallback - Fallback array if the document has none.
 * @returns {string[]}
 */
function resolveMissingFields(lead, fallback = []) {
  return Array.isArray(lead.missingFields) && lead.missingFields.length > 0
    ? lead.missingFields
    : fallback;
}

/**
 * Determine whether an existing MetaLead has completed all applicable workflow
 * steps.  Returns 'ALREADY_COMPLETE', 'EXISTING_INCOMPLETE', or 'UNREACHABLE'.
 */
function classifyLeadCompleteness(lead) {
  const hasPhone = !!lead.phone;
  const hasEmail = !!lead.email;

  if (!hasPhone && !hasEmail) return 'UNREACHABLE';

  const hasInvite = !!lead.invitationCode;
  const hasInitialSms = hasPhone ? hasSmsAttemptForStage(lead, 'immediate') : true;
  const hasInitialEmail = hasEmail ? hasEmailAttemptForStage(lead, 'immediate') : true;

  // A lead with at least one reachable channel and active follow-up is considered
  // complete when: invite issued, immediate outreach sent, follow-up scheduled.
  const followUpOk = lead.followUp?.status === 'active' ||
    lead.followUp?.status === 'completed' ||
    lead.followUp?.status === 'stopped'; // stopped = opted out — also "complete"

  if (hasInvite && hasInitialSms && hasInitialEmail && followUpOk) return 'ALREADY_COMPLETE';
  return 'EXISTING_INCOMPLETE';
}

/**
 * Idempotently complete all missing workflow steps for an existing MetaLead.
 * - Issues an invite code if missing.
 * - Sends initial SMS if phone available and not yet sent.
 * - Sends initial email if email available and not yet sent.
 * - Activates follow-up sequence if not yet active.
 * Never re-sends a message that was already attempted for the 'immediate' stage.
 */
async function completeExistingLead(lead, settings) {
  const hasPhone = !!lead.phone;
  const hasEmail = !!lead.email;

  // Invite code
  if (!lead.invitationCode) {
    await createInviteForLead(lead, settings);
    console.log(`[META_RECONCILE] Invite code created for lead=${lead._id}`);
  }

  setChannelAvailabilityFlags(lead);

  let smsResult = { success: false, reason: 'not_available' };
  let emailResult = { success: false, reason: 'not_available' };

  // Initial SMS
  if (hasPhone && !hasSmsAttemptForStage(lead, 'immediate') && !lead.smsOptOut) {
    smsResult = await sendLeadSms(lead, 'immediate', settings, { stage: 'immediate', persist: false });
    if (smsResult.success) console.log(`[META_RECONCILE] Initial SMS sent SID=${smsResult.sid} lead=${lead._id}`);
    else console.warn(`[META_RECONCILE] Initial SMS failed reason=${smsResult.reason} lead=${lead._id}`);
  } else if (hasPhone) {
    const entry = findSmsEntryForStage(lead, 'immediate');
    smsResult = { success: true, sid: entry?.messageSid || null, skipped: true };
  }

  // Initial email
  if (hasEmail && !hasEmailAttemptForStage(lead, 'immediate')) {
    emailResult = await sendLeadEmail(lead, 'immediate', settings, { stage: 'immediate', persist: false });
    if (emailResult.success) console.log(`[META_RECONCILE] Initial email sent messageId=${emailResult.messageId} lead=${lead._id}`);
    else console.warn(`[META_RECONCILE] Initial email failed reason=${emailResult.reason} lead=${lead._id}`);
  } else if (hasEmail) {
    const entry = findEmailEntryForStage(lead, 'immediate');
    emailResult = { success: true, messageId: entry?.messageId || null, skipped: true };
  }

  // Follow-up sequence
  if (lead.followUp?.status !== 'active' && lead.followUp?.status !== 'stopped') {
    initializeFollowUpForAvailableChannels(lead, settings, lead.createdAt || new Date());
    console.log(`[META_RECONCILE] Follow-up sequence activated lead=${lead._id}`);
  } else {
    syncLegacyFollowUpPointers(lead);
  }

  await lead.save();

  await logEvent(lead._id, 'lead_completed', 'system', 'Missing workflow steps completed by reconciliation', '', {
    smsResult: { success: smsResult.success, skipped: !!smsResult.skipped },
    emailResult: { success: emailResult.success, skipped: !!emailResult.skipped }
  });

  return { smsResult, emailResult };
}

// ── Full Meta ↔ Fixlo production reconciliation ──────────────────────────────

/** In-memory lock prevents concurrent runs on the same server instance. */
let _fullReconciliationRunning = false;
const _loggedStaleConfiguredForms = new Set();

const FULL_RECONCILIATION_FORM_ID =
  process.env.META_LEAD_FORM_ID || '';

/** Maximum number of individual lead results stored in a MetaReconciliationRun document. */
const MAX_STORED_RESULTS = 200;
/** Milliseconds per day — used for date-range calculations. */
const MS_PER_DAY = 24 * 60 * 60 * 1000;
/** Maximum backoff delay for webhook event retries (ms). */
const MAX_RETRY_DELAY_MS = 10 * 60000; // 10 minutes
/** Age cutoff — only retry webhook events older than this (ms). */
const WEBHOOK_RETRY_CUTOFF_MS = 5 * 60000; // 5 minutes
/** Leads sitting without any outreach for longer than this threshold are flagged as stale (ms). */
const STALE_LEAD_THRESHOLD_MS = 2 * 60000; // 2 minutes

function buildReconciliationSummary({
  formId = '',
  formName = '',
  pageId = '',
  triggeredBy = 'scheduled',
  startedAt = new Date()
} = {}) {
  return {
    runId: null,
    formId: String(formId || '').trim(),
    formName: String(formName || '').trim(),
    pageId: String(pageId || '').trim(),
    triggeredBy,
    startedAt,
    completedAt: null,
    graphError: null,
    lastError: null,
    totalFromMeta: 0,
    totalConsidered: 0,
    latestLeadTimestamp: null,
    alreadyComplete: 0,
    existingIncomplete: 0,
    newlyRecovered: 0,
    duplicatesSkipped: 0,
    unreachable: 0,
    failed: 0,
    results: []
  };
}

function logStaleConfiguredFormOnce(formId, classification, message) {
  const key = `${formId}:${classification}`;
  if (_loggedStaleConfiguredForms.has(key)) return;
  _loggedStaleConfiguredForms.add(key);
  console.warn(`[META_FORMS] Stale configured form ignored: ${formId} classification=${classification} reason=${message}`);
}

function clearStaleConfiguredFormLog(formId) {
  const prefix = `${formId}:`;
  for (const key of _loggedStaleConfiguredForms) {
    if (key.startsWith(prefix)) _loggedStaleConfiguredForms.delete(key);
  }
}

async function performSingleMetaFormReconciliation({
  form,
  accessToken = '',
  pageId = '',
  triggeredBy = 'scheduled',
  daysBack = 30,
  fetchMetaFormLeadsImpl = fetchMetaFormLeads,
  createOrUpdateLeadFromMetaImpl = createOrUpdateLeadFromMeta
} = {}) {
  const normalizedForm = normalizeMetaForm(form || {});
  if (!normalizedForm.id) throw new Error('form.id is required');

  let run;
  try {
    run = await MetaReconciliationRun.create({
      formId: normalizedForm.id,
      formName: normalizedForm.name,
      pageId: normalizedForm.page_id || String(pageId || '').trim(),
      triggeredBy,
      status: 'running',
      startedAt: new Date()
    });
  } catch (err) {
    console.error(`[META_RECONCILE] Failed to create run record: ${err.message}`);
  }

  const summary = buildReconciliationSummary({
    formId: normalizedForm.id,
    formName: normalizedForm.name,
    pageId: normalizedForm.page_id || pageId,
    triggeredBy,
    startedAt: run?.startedAt || new Date()
  });
  summary.runId = run ? String(run._id) : null;

  try {
    const settings = await getSettings();

    let metaLeads = [];
    let resolvedPageId = summary.pageId || getDefaultPageId();
    try {
      const formData = await fetchMetaFormLeadsImpl(normalizedForm.id, { accessToken, pageId: summary.pageId || pageId });
      metaLeads = formData.leads || [];
      resolvedPageId = formData.pageId || resolvedPageId;
      summary.formName = formData.form?.name || summary.formName;
      summary.pageId = String(resolvedPageId || summary.pageId || '');
      console.log(`[META_RECONCILE] Leads returned for form ${normalizedForm.id}: ${metaLeads.length}`);
    } catch (err) {
      summary.graphError = sanitizeMetaGraphError(err);
      console.error(`[META_RECONCILE] Graph API error: ${summary.graphError}`);
      await notifyAdmins(
        'webhook_failure',
        'Meta Graph API Error — Reconciliation',
        `Reconciliation for form ${normalizedForm.id} failed to fetch leads from Meta: ${summary.graphError}`,
        null
      );
    }

    summary.totalFromMeta = metaLeads.length;
    summary.latestLeadTimestamp = metaLeads.reduce((latest, lead) => {
      const candidate = parseDate(lead?.created_time);
      if (!candidate) return latest;
      return !latest || candidate > latest ? candidate : latest;
    }, null);

    const sinceDate = daysBack > 0 ? new Date(Date.now() - daysBack * MS_PER_DAY) : null;
    if (sinceDate) {
      metaLeads = metaLeads.filter((lead) => {
        const ts = parseDate(lead.created_time);
        return !ts || ts >= sinceDate;
      });
      console.log(`[META_RECONCILE] ${metaLeads.length} leads within last ${daysBack} days (of ${summary.totalFromMeta} total)`);
    }
    summary.totalConsidered = metaLeads.length;

    for (const metaLead of metaLeads) {
      const metaLeadId = String(metaLead.id || '');
      if (!metaLeadId) continue;

      const submittedAt = parseDate(metaLead.created_time) || null;
      const fields = mapFieldData(metaLead.field_data || []);
      const email = pickField(fields, ['email', 'email_address']).trim().toLowerCase();
      const rawPhone = pickField(fields, ['phone_number', 'phone', 'mobile_phone']);
      const phone = normalizePhone(rawPhone);
      const trade = pickField(fields, ['trade', 'service', 'service_type']);
      const firstName = pickField(fields, ['first_name', 'firstname', 'full_name']);
      const lastName = pickField(fields, ['last_name', 'lastname']);
      const name = `${firstName} ${lastName}`.trim() || email || phone || metaLeadId;

      const leadMissingFields = [];
      if (!phone) leadMissingFields.push('phone');
      if (!email) leadMissingFields.push('email');
      if (!trade) leadMissingFields.push('trade');
      const leadProfileIncomplete = leadMissingFields.length > 0;

      const leadResult = {
        metaLeadId,
        leadId: null,
        name,
        classification: 'FAILED',
        recoveryMethod: null,
        inviteCode: null,
        phoneAvailable: !!phone,
        emailAvailable: !!email,
        twilioSid: null,
        twilioStatus: null,
        sendGridMessageId: null,
        sendGridStatus: null,
        smsFollowUpsEnabled: false,
        emailFollowUpsEnabled: false,
        nextFollowUpAt: null,
        nextSmsFollowUpAt: null,
        nextEmailFollowUpAt: null,
        signupUrl: CANONICAL_PRO_SIGNUP_URL,
        reason: null,
        submittedAt,
        profileIncomplete: leadProfileIncomplete,
        missingFields: leadMissingFields
      };

      try {
        let existingLead = await MetaLead.findOne({ metaLeadId });

        if (!existingLead && (email || phone)) {
          const conditions = buildDuplicateConditions({ email, phone });
          if (conditions.length) existingLead = await MetaLead.findOne({ $or: conditions });
        }

        if (existingLead) {
          const existingFormId = String(existingLead.campaign?.formId || '').trim();
          const existingFormName = String(existingLead.campaign?.formName || '').trim();
          const shouldUpdateCampaignForm = existingFormId !== normalizedForm.id ||
            ((summary.formName || normalizedForm.name) && existingFormName !== String(summary.formName || normalizedForm.name));
          if (shouldUpdateCampaignForm) {
            existingLead.campaign = {
              ...(existingLead.campaign?.toObject ? existingLead.campaign.toObject() : existingLead.campaign),
              formId: normalizedForm.id,
              formName: String(summary.formName || normalizedForm.name || existingFormName)
            };
          }

          leadResult.leadId = String(existingLead._id);
          leadResult.inviteCode = existingLead.invitationCode || null;
          leadResult.profileIncomplete = existingLead.profileIncomplete ?? leadProfileIncomplete;
          leadResult.missingFields = resolveMissingFields(existingLead, leadMissingFields);

          const completeness = classifyLeadCompleteness(existingLead);

          if (completeness === 'UNREACHABLE') {
            leadResult.classification = 'UNREACHABLE';
            leadResult.reason = 'No phone or email available';
            if (shouldUpdateCampaignForm) await existingLead.save();
            summary.unreachable += 1;
          } else if (completeness === 'ALREADY_COMPLETE') {
            leadResult.classification = 'ALREADY_COMPLETE';
            leadResult.smsFollowUpsEnabled = !!existingLead.followUp?.smsEnabled;
            leadResult.emailFollowUpsEnabled = !!existingLead.followUp?.emailEnabled;
            leadResult.nextFollowUpAt = existingLead.followUp?.nextFollowUpAt || null;
            leadResult.nextSmsFollowUpAt = existingLead.followUp?.nextSmsFollowUpAt || null;
            leadResult.nextEmailFollowUpAt = existingLead.followUp?.nextEmailFollowUpAt || null;
            if (shouldUpdateCampaignForm) await existingLead.save();
            summary.alreadyComplete += 1;
          } else {
            const { smsResult, emailResult } = await completeExistingLead(existingLead, settings);

            leadResult.classification = 'EXISTING_INCOMPLETE';
            leadResult.recoveryMethod = 'complete_existing';
            leadResult.inviteCode = existingLead.invitationCode || null;
            leadResult.twilioSid = smsResult?.sid || null;
            leadResult.twilioStatus = smsResult?.success ? (smsResult.skipped ? 'already_sent' : 'sent') : (smsResult?.reason || 'failed');
            leadResult.sendGridMessageId = emailResult?.messageId || null;
            leadResult.sendGridStatus = emailResult?.success ? (emailResult.skipped ? 'already_sent' : 'sent') : (emailResult?.reason || 'failed');
            leadResult.smsFollowUpsEnabled = !!existingLead.followUp?.smsEnabled;
            leadResult.emailFollowUpsEnabled = !!existingLead.followUp?.emailEnabled;
            leadResult.nextFollowUpAt = existingLead.followUp?.nextFollowUpAt || null;
            leadResult.nextSmsFollowUpAt = existingLead.followUp?.nextSmsFollowUpAt || null;
            leadResult.nextEmailFollowUpAt = existingLead.followUp?.nextEmailFollowUpAt || null;
            summary.existingIncomplete += 1;
          }

          const lastSms = Array.isArray(existingLead.smsHistory) && existingLead.smsHistory.length
            ? existingLead.smsHistory.filter((h) => h.direction === 'outbound').slice(-1)[0]
            : null;
          const lastEmail = Array.isArray(existingLead.emailHistory) && existingLead.emailHistory.length
            ? existingLead.emailHistory.slice(-1)[0]
            : null;
          if (!leadResult.twilioSid && lastSms?.messageSid) leadResult.twilioSid = lastSms.messageSid;
          if (!leadResult.twilioStatus && lastSms?.status) leadResult.twilioStatus = lastSms.status;
          if (!leadResult.sendGridMessageId && lastEmail?.messageId) leadResult.sendGridMessageId = lastEmail.messageId;
          if (!leadResult.sendGridStatus && lastEmail?.status) leadResult.sendGridStatus = lastEmail.status;
        } else if (!resolvedPageId || !isNumericMetaId(String(resolvedPageId))) {
          leadResult.classification = 'FAILED';
          leadResult.reason = 'Cannot resolve Meta page ID — lead cannot be auto-imported';
          summary.failed += 1;
        } else {
          const imported = await createOrUpdateLeadFromMetaImpl({
            field: 'leadgen',
            value: {
              leadgen_id: metaLeadId,
              page_id: String(resolvedPageId)
            }
          });

          if (imported?.skipped) {
            const isDup = isDuplicateSkipReason(imported.reason);
            leadResult.classification = isDup ? 'SKIPPED_DUPLICATE' : 'FAILED';
            leadResult.reason = imported.reason;
            leadResult.leadId = imported.lead ? String(imported.lead._id) : null;
            if (isDup) summary.duplicatesSkipped += 1;
            else summary.failed += 1;
          } else {
            const newLead = imported.lead;
            leadResult.classification = 'MISSING_FROM_FIXLO';
            leadResult.recoveryMethod = 'META_GRAPH';
            leadResult.leadId = String(newLead._id);
            leadResult.inviteCode = newLead.invitationCode || null;
            leadResult.profileIncomplete = newLead.profileIncomplete ?? leadProfileIncomplete;
            leadResult.missingFields = resolveMissingFields(newLead, leadMissingFields);

            const lastSms = Array.isArray(newLead.smsHistory) && newLead.smsHistory.length
              ? newLead.smsHistory.filter((h) => h.direction === 'outbound').slice(-1)[0]
              : null;
            const lastEmail = Array.isArray(newLead.emailHistory) && newLead.emailHistory.length
              ? newLead.emailHistory.slice(-1)[0]
              : null;
            leadResult.twilioSid = lastSms?.messageSid || null;
            leadResult.twilioStatus = lastSms?.status || null;
            leadResult.sendGridMessageId = lastEmail?.messageId || null;
            leadResult.sendGridStatus = lastEmail?.status || null;
            leadResult.smsFollowUpsEnabled = !!newLead.followUp?.smsEnabled;
            leadResult.emailFollowUpsEnabled = !!newLead.followUp?.emailEnabled;
            leadResult.nextFollowUpAt = newLead.followUp?.nextFollowUpAt || null;
            leadResult.nextSmsFollowUpAt = newLead.followUp?.nextSmsFollowUpAt || null;
            leadResult.nextEmailFollowUpAt = newLead.followUp?.nextEmailFollowUpAt || null;
            summary.newlyRecovered += 1;
          }
        }
      } catch (leadErr) {
        leadResult.classification = 'FAILED';
        leadResult.reason = String(leadErr.message || 'Unknown error');
        summary.failed += 1;
        console.error(`[META_RECONCILE] Error processing lead ${metaLeadId}: ${leadErr.message}`);
      }

      summary.results.push(leadResult);
    }

    summary.completedAt = new Date();

    if (run) {
      const updateFields = {
        formName: summary.formName,
        pageId: summary.pageId,
        status: 'completed',
        completedAt: summary.completedAt,
        graphError: summary.graphError || null,
        totalFromMeta: summary.totalFromMeta,
        totalConsidered: summary.totalConsidered,
        latestLeadTimestamp: summary.latestLeadTimestamp,
        alreadyComplete: summary.alreadyComplete,
        existingIncomplete: summary.existingIncomplete,
        newlyRecovered: summary.newlyRecovered,
        duplicatesSkipped: summary.duplicatesSkipped,
        unreachable: summary.unreachable,
        failed: summary.failed,
        results: summary.results.slice(0, MAX_STORED_RESULTS)
      };
      await MetaReconciliationRun.findByIdAndUpdate(run._id, updateFields);
    }

    if (summary.newlyRecovered > 0 || summary.existingIncomplete > 0) {
      await notifyAdmins(
        'reconciliation_recovered',
        'Meta Lead Reconciliation — Leads Recovered',
        `Reconciliation for form ${summary.formId}: recovered ${summary.newlyRecovered} new, completed ${summary.existingIncomplete} existing. Total from Meta: ${summary.totalFromMeta}.`,
        null
      );
    }

    return summary;
  } catch (err) {
    summary.lastError = err.message;
    summary.completedAt = new Date();
    if (run) {
      await MetaReconciliationRun.findByIdAndUpdate(run._id, {
        formName: summary.formName,
        pageId: summary.pageId,
        status: 'failed',
        completedAt: summary.completedAt,
        lastError: err.message
      });
    }
    throw err;
  }
}

async function resolveMetaReconciliationForms({
  pageId = '',
  accessToken = '',
  formId,
  formIds,
  discoverPageFormsImpl = fetchMetaPageLeadForms,
  classifyConfiguredMetaFormImpl = classifyConfiguredMetaForm
} = {}) {
  const resolvedPageId = String(pageId || getDefaultPageId() || '').trim();
  if (!resolvedPageId) {
    throw new Error('META_PAGE_ID is required to discover Meta lead forms');
  }

  console.log('[META_FORMS] Discovery started');
  console.log(`[META_FORMS] Page ID: ${resolvedPageId}`);

  const discoveredForms = await discoverPageFormsImpl(resolvedPageId, { accessToken, pageId: resolvedPageId });
  const activeForms = discoveredForms.filter((candidate) => candidate.active);
  const archivedForms = discoveredForms.filter((candidate) => candidate.archived);
  console.log(`[META_FORMS] Forms discovered: ${discoveredForms.length}`);
  console.log(`[META_FORMS] Active forms: ${activeForms.length}`);
  console.log(`[META_FORMS] Archived forms: ${archivedForms.length}`);

  const configuredIds = getConfiguredMetaLeadFormIds({ formId, formIds });
  const legacyConfiguredIds = configuredIds.length === 0 ? getLegacyMetaLeadFormIds() : [];
  const staleConfiguredForms = [];
  const selectedForms = [];

  if (configuredIds.length > 0) {
    for (const configuredId of configuredIds) {
      const classification = await classifyConfiguredMetaFormImpl(configuredId, {
        accessToken,
        pageId: resolvedPageId,
        discoveredForms
      });

      if (classification.classification === 'FORM_FOUND_ACTIVE' && classification.form) {
        selectedForms.push(classification.form);
        clearStaleConfiguredFormLog(configuredId);
        continue;
      }

      const reason = classification.error || classification.form?.status || 'stale_or_inaccessible';
      staleConfiguredForms.push({
        formId: configuredId,
        classification: classification.classification,
        reason
      });
      logStaleConfiguredFormOnce(configuredId, classification.classification, reason);
    }
  } else {
    selectedForms.push(...activeForms);
    for (const configuredId of legacyConfiguredIds) {
      const classification = await classifyConfiguredMetaFormImpl(configuredId, {
        accessToken,
        pageId: resolvedPageId,
        discoveredForms
      });
      if (classification.classification === 'FORM_FOUND_ACTIVE') {
        clearStaleConfiguredFormLog(configuredId);
        continue;
      }
      const reason = classification.error || classification.form?.status || 'stale_or_inaccessible';
      staleConfiguredForms.push({
        formId: configuredId,
        classification: classification.classification,
        reason
      });
      logStaleConfiguredFormOnce(configuredId, classification.classification, reason);
    }
  }

  return {
    pageId: resolvedPageId,
    discoveredForms,
    activeForms,
    archivedForms,
    legacyConfiguredIds,
    selectedForms: [...new Map(selectedForms.map((item) => [item.id, item])).values()],
    staleConfiguredForms
  };
}

/**
 * Discover/validate the page's active Meta lead forms, fetch every available
 * lead across valid forms, compare against MongoDB, and import/complete leads
 * without letting one stale form block the full run.
 */
async function performFullMetaReconciliation({
  formId,
  formIds,
  accessToken = '',
  pageId = '',
  triggeredBy = 'scheduled',
  daysBack = 30,
  discoverPageFormsImpl = fetchMetaPageLeadForms,
  classifyConfiguredMetaFormImpl = classifyConfiguredMetaForm,
  performSingleMetaFormReconciliationImpl = performSingleMetaFormReconciliation
} = {}) {
  if (_fullReconciliationRunning) {
    console.log('[META_RECONCILE] Another reconciliation is already running — skipping');
    return { skipped: true, reason: 'already_running' };
  }
  _fullReconciliationRunning = true;

  try {
    const resolved = await resolveMetaReconciliationForms({
      pageId,
      accessToken,
      formId,
      formIds,
      discoverPageFormsImpl,
      classifyConfiguredMetaFormImpl
    });

    const summaries = [];
    let totalLeadsAcrossForms = 0;

    for (const form of resolved.selectedForms) {
      console.log(`[META_RECONCILE] Processing form id=${form.id} name=${form.name || ''}`);
      try {
        const summary = await performSingleMetaFormReconciliationImpl({
          form,
          accessToken,
          pageId: resolved.pageId,
          triggeredBy,
          daysBack
        });
        totalLeadsAcrossForms += summary.totalFromMeta || 0;
        summaries.push(summary);
      } catch (error) {
        const failedSummary = buildReconciliationSummary({
          formId: form.id,
          formName: form.name,
          pageId: resolved.pageId,
          triggeredBy
        });
        failedSummary.completedAt = new Date();
        failedSummary.lastError = error.message;
        failedSummary.failed = 1;
        summaries.push(failedSummary);
        console.error(`[META_RECONCILE] Form failed id=${form.id} error=${error.message}`);
      }
    }

    const aggregate = {
      pageId: resolved.pageId,
      configuredFormIds: getConfiguredMetaLeadFormIds({ formId, formIds }),
      discoveredForms: resolved.discoveredForms,
      activeForms: resolved.activeForms,
      archivedForms: resolved.archivedForms,
      staleConfiguredForms: resolved.staleConfiguredForms,
      processedForms: summaries,
      totals: summaries.reduce((acc, summary) => {
        acc.totalFromMeta += summary.totalFromMeta || 0;
        acc.totalConsidered += summary.totalConsidered || 0;
        acc.alreadyComplete += summary.alreadyComplete || 0;
        acc.existingIncomplete += summary.existingIncomplete || 0;
        acc.newlyRecovered += summary.newlyRecovered || 0;
        acc.duplicatesSkipped += summary.duplicatesSkipped || 0;
        acc.unreachable += summary.unreachable || 0;
        acc.failed += summary.failed || 0;
        return acc;
      }, {
        totalFromMeta: 0,
        totalConsidered: 0,
        alreadyComplete: 0,
        existingIncomplete: 0,
        newlyRecovered: 0,
        duplicatesSkipped: 0,
        unreachable: 0,
        failed: 0
      })
    };

    console.log(`[META_RECONCILE] Total leads across forms: ${totalLeadsAcrossForms}`);
    console.log('[META_RECONCILE] Run completed');

    return aggregate;
  } finally {
    _fullReconciliationRunning = false;
  }
}

/**
 * Return the most recent MetaReconciliationRun for the given form, plus the
 * next scheduled run time (15-minute boundary).
 */
async function getLastReconciliationRun(formId = '') {
  const normalizedFormId = String(formId || FULL_RECONCILIATION_FORM_ID || '').trim();
  const query = normalizedFormId ? { formId: normalizedFormId } : {};
  const last = await MetaReconciliationRun.findOne(query)
    .sort({ startedAt: -1 })
    .lean();

  const now = new Date();
  const nextBoundary = new Date(Math.ceil(now.getTime() / (15 * 60000)) * (15 * 60000));

  return {
    formId: normalizedFormId,
    lastRun: last || null,
    nextScheduledAt: nextBoundary
  };
}

// ── Stale-lead alerting ───────────────────────────────────────────────────────

/**
 * Alert admins if any leads have been sitting in 'new' or 'in_progress' status
 * for more than 2 minutes without having had any outreach attempted.
 */
async function alertStaleLeads() {
  const twoMinutesAgo = new Date(Date.now() - STALE_LEAD_THRESHOLD_MS);
  const staleLeads = await MetaLead.find({
    leadStatus: { $in: ['new', 'in_progress'] },
    createdAt: { $lte: twoMinutesAgo },
    $and: [
      { $or: [{ 'contactability.smsAvailable': false }, { 'sms.attempted': false }] },
      { $or: [{ 'contactability.emailAvailable': false }, { 'emailChannel.attempted': false }] }
    ],
    smsStatus: 'pending',
    emailStatus: 'pending'
  }).limit(20).lean();

  if (!staleLeads.length) return { alerted: 0 };

  for (const lead of staleLeads) {
    const hasPhone = !!lead.phone;
    const hasEmail = !!lead.email;
    if (!hasPhone && !hasEmail) continue; // truly unreachable — skip alerting

    const name = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.email || lead.phone || String(lead._id);
    await notifyAdmins(
      'stale_lead',
      'Meta Lead — Outreach Not Sent',
      `Lead "${name}" (id=${lead._id}) has been in the system for >2 min with no outreach attempted.`,
      lead._id
    );
  }

  return { alerted: staleLeads.length };
}

module.exports = {
  CANONICAL_PRO_SIGNUP_URL,
  STOP_KEYWORDS,
  START_KEYWORDS,
  TWILIO_SID_REGEX,
  META_LEAD_STATUS_CALLBACK_PATH,
  FULL_RECONCILIATION_FORM_ID,
  getMetaGraphApiVersion,
  getConfiguredMetaLeadFormIds,
  template,
  getStatusCallbackUrl,
  validateTwilioSignature,
  hasValidTwilioSid,
  wasInvalidStatusCallbackFailure,
  getRetryBlockReason,
  sendLeadSms,
  sendLeadEmail,
  initializeFollowUpForAvailableChannels,
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
  auditMetaLeadChannelCoverage,
  getLeadDetails,
  computeDashboardMetrics,
  performManualAction,
  importManualLead,
  recoverManualMetaLead,
  recoverPartialMetaLead,
  recoverHistoricalMetaLeadsByForm,
  fetchMetaLeadForm,
  fetchMetaPageLeadForms,
  classifyConfiguredMetaForm,
  resolveMetaReconciliationForms,
  // Durable webhook event helpers
  saveWebhookEvent,
  markWebhookEventProcessed,
  markWebhookEventFailed,
  retryUnprocessedWebhookEvents,
  // Full Meta reconciliation
  classifyLeadCompleteness,
  completeExistingLead,
  performSingleMetaFormReconciliation,
  performFullMetaReconciliation,
  getLastReconciliationRun,
  // Alerting
  alertStaleLeads,
  notifyAdmins
};
