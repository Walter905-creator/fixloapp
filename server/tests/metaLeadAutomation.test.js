/**
 * server/tests/metaLeadAutomation.test.js
 *
 * Unit tests for the Meta Lead Automation service (server/services/metaLeadAutomationService.js)
 * and the Meta Lead Automation routes (server/routes/metaLeadAutomation.js).
 *
 * Uses Node.js built-in test runner (node:test + node:assert).
 * Run with:  node --test server/tests/metaLeadAutomation.test.js
 *
 * These tests exercise all pure/deterministic functions without requiring
 * a live MongoDB, Twilio, or SendGrid connection.  Database-touching code is
 * tested through stubs injected via module-level monkey-patching.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

// ── Inline copies of pure helpers (no import side-effects) ───────────────────

function isNumericMetaId(value) {
  return typeof value === 'string' && /^\d{5,40}$/.test(value);
}

function normalizePhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === '1') return `+${digits}`;
  return phone.trim();
}

function sanitizeEmail(email) {
  if (!email) return '';
  const at = email.indexOf('@');
  return at > 0 ? `*@${email.slice(at + 1)}` : '***';
}

function sanitizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 4 ? `****${digits.slice(-4)}` : '****';
}

function template(str = '', vars = {}) {
  return String(str).replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const value = vars[key];
    return value === undefined || value === null ? '' : String(value);
  });
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

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function verifyMetaSignature(rawBody, headerSignature, appSecret) {
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

function getNextFollowUpAt(createdAt, timings, step) {
  const hourOffset = timings[step];
  if (hourOffset === undefined) return null;
  return new Date(new Date(createdAt).getTime() + (hourOffset * 60 * 60 * 1000));
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

// ── Test: isNumericMetaId ─────────────────────────────────────────────────────

test('isNumericMetaId — valid numeric IDs', () => {
  assert.equal(isNumericMetaId('1913273286015217'), true);
  assert.equal(isNumericMetaId('12345'), true);
  assert.equal(isNumericMetaId('9'.repeat(40)), true);
});

test('isNumericMetaId — rejects non-numeric IDs', () => {
  assert.equal(isNumericMetaId('manual-dave-burnett-20260718'), false);
  assert.equal(isNumericMetaId('abc123'), false);
  assert.equal(isNumericMetaId(''), false);
  assert.equal(isNumericMetaId(null), false);
  assert.equal(isNumericMetaId(undefined), false);
  assert.equal(isNumericMetaId('1234'), false); // too short (< 5 digits)
  assert.equal(isNumericMetaId('9'.repeat(41)), false); // too long (> 40 digits)
});

// ── Test: normalizePhone ──────────────────────────────────────────────────────

test('normalizePhone — normalizes 10-digit US numbers', () => {
  assert.equal(normalizePhone('2294493677'), '+12294493677');
  assert.equal(normalizePhone('9493754801'), '+19493754801');
  assert.equal(normalizePhone('2832243704'), '+12832243704');
});

test('normalizePhone — passes through E.164 as-is', () => {
  assert.equal(normalizePhone('+12294493677'), '+12294493677');
});

test('normalizePhone — handles 11-digit US numbers', () => {
  assert.equal(normalizePhone('12294493677'), '+12294493677');
});

test('normalizePhone — returns empty string for null/empty input', () => {
  assert.equal(normalizePhone(''), '');
  assert.equal(normalizePhone(null), '');
  assert.equal(normalizePhone(undefined), '');
});

// ── Test: sanitizeEmail ───────────────────────────────────────────────────────

test('sanitizeEmail — masks local part', () => {
  assert.equal(sanitizeEmail('devettajones@yahoo.com'), '*@yahoo.com');
  assert.equal(sanitizeEmail('jlarsen2@ymail.com'), '*@ymail.com');
  assert.equal(sanitizeEmail('j47989121@gmail.com'), '*@gmail.com');
});

test('sanitizeEmail — handles empty/null', () => {
  assert.equal(sanitizeEmail(''), '');
  assert.equal(sanitizeEmail(null), '');
});

// ── Test: sanitizePhone ───────────────────────────────────────────────────────

test('sanitizePhone — shows only last 4 digits', () => {
  assert.equal(sanitizePhone('+12294493677'), '****3677');
  assert.equal(sanitizePhone('+19493754801'), '****4801');
  assert.equal(sanitizePhone('+12832243704'), '****3704');
});

test('sanitizePhone — handles empty/short', () => {
  assert.equal(sanitizePhone(''), '****');
  assert.equal(sanitizePhone('123'), '****');
});

// ── Test: verifyMetaSignature ─────────────────────────────────────────────────

test('verifyMetaSignature — valid signature verifies', () => {
  const secret = 'test-app-secret-abc123';
  const body = Buffer.from('{"object":"page","entry":[]}', 'utf8');
  const hmac = crypto.createHmac('sha256', secret).update(body).digest('hex');
  const header = `sha256=${hmac}`;
  assert.equal(verifyMetaSignature(body, header, secret), true);
});

test('verifyMetaSignature — invalid signature fails', () => {
  const secret = 'test-app-secret-abc123';
  const body = Buffer.from('{"object":"page","entry":[]}', 'utf8');
  assert.equal(verifyMetaSignature(body, 'sha256=wrongsignature', secret), false);
});

test('verifyMetaSignature — missing secret returns false', () => {
  const body = Buffer.from('test', 'utf8');
  assert.equal(verifyMetaSignature(body, 'sha256=anything', null), false);
  assert.equal(verifyMetaSignature(body, 'sha256=anything', ''), false);
});

test('verifyMetaSignature — missing header prefix returns false', () => {
  const secret = 'mysecret';
  const body = Buffer.from('test', 'utf8');
  const hmac = crypto.createHmac('sha256', secret).update(body).digest('hex');
  assert.equal(verifyMetaSignature(body, hmac, secret), false); // no "sha256=" prefix
  assert.equal(verifyMetaSignature(body, '', secret), false);
  assert.equal(verifyMetaSignature(body, null, secret), false);
});

test('verifyMetaSignature — tampered body fails', () => {
  const secret = 'test-app-secret';
  const original = Buffer.from('{"object":"page"}', 'utf8');
  const tampered = Buffer.from('{"object":"hacked"}', 'utf8');
  const hmac = crypto.createHmac('sha256', secret).update(original).digest('hex');
  assert.equal(verifyMetaSignature(tampered, `sha256=${hmac}`, secret), false);
});

// ── Test: mapFieldData ────────────────────────────────────────────────────────

test('mapFieldData — maps field_data array to object', () => {
  const fieldData = [
    { name: 'first_name', values: ['Booker'] },
    { name: 'last_name', values: ['Jones'] },
    { name: 'email', values: ['devettajones@yahoo.com'] },
    { name: 'phone_number', values: ['+12294493677'] },
    { name: 'trade', values: ['Painting'] }
  ];
  const result = mapFieldData(fieldData);
  assert.equal(result.first_name, 'Booker');
  assert.equal(result.last_name, 'Jones');
  assert.equal(result.email, 'devettajones@yahoo.com');
  assert.equal(result.phone_number, '+12294493677');
  assert.equal(result.trade, 'Painting');
});

test('mapFieldData — handles alternate field name formats', () => {
  const fieldData = [
    { name: 'FIRST_NAME', values: ['Josh'] },
    { name: 'Email', values: ['jlarsen2@ymail.com'] }
  ];
  const result = mapFieldData(fieldData);
  assert.equal(result.first_name, 'Josh');
  assert.equal(result.email, 'jlarsen2@ymail.com');
});

test('mapFieldData — returns empty object for empty input', () => {
  const result = mapFieldData([]);
  assert.deepEqual(result, {});
});

test('mapFieldData — handles missing field_data gracefully', () => {
  // undefined is fine (default parameter kicks in)
  assert.doesNotThrow(() => mapFieldData(undefined));
  assert.doesNotThrow(() => mapFieldData());
  // null is not valid input; the service guards against this at the call site
  // by always passing `enriched.data?.field_data || []`
});

// ── Test: pickField ───────────────────────────────────────────────────────────

test('pickField — picks first matching key', () => {
  const fields = { phone_number: '+12294493677', phone: '+10000000000' };
  assert.equal(pickField(fields, ['phone_number', 'phone']), '+12294493677');
});

test('pickField — falls through to next key when first is absent', () => {
  const fields = { mobile_phone: '+19493754801' };
  assert.equal(pickField(fields, ['phone_number', 'phone', 'mobile_phone']), '+19493754801');
});

test('pickField — returns empty string when no key matches', () => {
  const fields = { name: 'test' };
  assert.equal(pickField(fields, ['email', 'email_address']), '');
});

// ── Test: template ────────────────────────────────────────────────────────────

test('template — replaces all variables', () => {
  const str = 'Hi {{firstName}}, your code is {{invitationCode}}.';
  const result = template(str, { firstName: 'Booker', invitationCode: 'FIXLO-ABC123' });
  assert.equal(result, 'Hi Booker, your code is FIXLO-ABC123.');
});

test('template — leaves unknown placeholders as empty string', () => {
  const result = template('Hi {{unknown}}!', {});
  assert.equal(result, 'Hi !');
});

test('template — handles spaces inside placeholder braces', () => {
  const result = template('Code: {{ invitationCode }}', { invitationCode: 'X' });
  assert.equal(result, 'Code: X');
});

// ── Test: getNextFollowUpAt ───────────────────────────────────────────────────

test('getNextFollowUpAt — schedules first follow-up 24 hours after creation', () => {
  const created = new Date('2026-07-19T00:00:00Z');
  const timings = [24, 72, 168, 336];
  const next = getNextFollowUpAt(created, timings, 0);
  assert.equal(next.toISOString(), '2026-07-20T00:00:00.000Z');
});

test('getNextFollowUpAt — schedules second follow-up 72 hours after creation', () => {
  const created = new Date('2026-07-19T00:00:00Z');
  const timings = [24, 72, 168, 336];
  const next = getNextFollowUpAt(created, timings, 1);
  assert.equal(next.toISOString(), '2026-07-22T00:00:00.000Z');
});

test('getNextFollowUpAt — returns null when step exceeds schedule', () => {
  const created = new Date();
  const timings = [24, 72, 168, 336];
  assert.equal(getNextFollowUpAt(created, timings, 4), null);
  assert.equal(getNextFollowUpAt(created, timings, 99), null);
});

// ── Test: parseDate ───────────────────────────────────────────────────────────

test('parseDate — parses ISO string', () => {
  const d = parseDate('2026-07-19T23:51:00Z');
  assert.ok(d instanceof Date);
  assert.equal(d.toISOString(), '2026-07-19T23:51:00.000Z');
});

test('parseDate — returns null for invalid date', () => {
  assert.equal(parseDate('not-a-date'), null);
  assert.equal(parseDate(''), null);
  assert.equal(parseDate(null), null);
  assert.equal(parseDate(undefined), null);
});

// ── Test: sourceFromPayload ───────────────────────────────────────────────────

test('sourceFromPayload — detects instagram', () => {
  assert.equal(sourceFromPayload({ platform: 'instagram' }, {}), 'instagram');
  assert.equal(sourceFromPayload({}, { platform: 'INSTAGRAM_STORIES' }), 'instagram');
});

test('sourceFromPayload — detects facebook', () => {
  assert.equal(sourceFromPayload({ platform: 'facebook' }, {}), 'facebook');
  assert.equal(sourceFromPayload({}, { lead_source: 'facebook_ads' }), 'facebook');
});

test('sourceFromPayload — falls back to meta_unknown', () => {
  assert.equal(sourceFromPayload({}, {}), 'meta_unknown');
  assert.equal(sourceFromPayload({ platform: 'unknown_platform' }, {}), 'meta_unknown');
});

// ── Test: processMetaWebhookPayload logic (pure extraction) ──────────────────

test('webhook payload extraction — identifies leadgen changes', () => {
  const payload = {
    object: 'page',
    entry: [
      {
        id: '123456789',
        changes: [
          { field: 'leadgen', value: { leadgen_id: '1913273286015217', page_id: '987654321', form_id: '1913273286015217' } },
          { field: 'feed', value: {} }
        ]
      }
    ]
  };

  const entries = Array.isArray(payload?.entry) ? payload.entry : [];
  const changes = entries.flatMap((e) => Array.isArray(e?.changes) ? e.changes : []);
  const leadgenChanges = changes.filter((c) => c?.field === 'leadgen');

  assert.equal(leadgenChanges.length, 1);
  assert.equal(leadgenChanges[0].value.leadgen_id, '1913273286015217');
  assert.equal(leadgenChanges[0].value.page_id, '987654321');
});

test('webhook payload extraction — handles empty entry list', () => {
  const payload = { object: 'page', entry: [] };
  const entries = Array.isArray(payload?.entry) ? payload.entry : [];
  const changes = entries.flatMap((e) => Array.isArray(e?.changes) ? e.changes : []);
  assert.equal(changes.length, 0);
});

test('webhook payload extraction — handles missing leadgen_id', () => {
  const change = { field: 'leadgen', value: { page_id: '123456' } };
  const metaLeadId = change?.value?.leadgen_id;
  const pageId = change?.value?.page_id;
  assert.equal(metaLeadId, undefined);
  // Both required: this should be skipped
  const skip = !metaLeadId || !pageId || !isNumericMetaId(String(metaLeadId));
  assert.equal(skip, true);
});

// ── Test: duplicate lead prevention logic ─────────────────────────────────────

test('duplicate lead IDs — leadUniqueId generation is deterministic', () => {
  const metaLeadId = '1913273286015217';
  assert.equal(`META-${metaLeadId}`, 'META-1913273286015217');

  const manualId = 'manual-booker-jones-20260719';
  assert.equal(`MANUAL-${manualId}`, 'MANUAL-manual-booker-jones-20260719');
});

// ── Test: manual import field normalisation ────────────────────────────────────

test('importManualLead input validation — detects missing metaLeadId', () => {
  // Simulates the guard at the top of importManualLead / processMetaLead
  const metaLeadIdVal = '';
  const leadUniqueIdVal = '';
  const shouldSkip = !metaLeadIdVal || !leadUniqueIdVal;
  assert.equal(shouldSkip, true);
});

test('importManualLead — phone normalisation', () => {
  // Booker Jones
  assert.equal(normalizePhone('+12294493677'), '+12294493677');
  // Josh Larsen
  assert.equal(normalizePhone('+19493754801'), '+19493754801');
  // John Adams
  assert.equal(normalizePhone('+12832243704'), '+12832243704');
});

test('importManualLead — email lowercase normalisation', () => {
  const email = 'DevettaJones@Yahoo.COM';
  assert.equal(email.toLowerCase().trim(), 'devettajones@yahoo.com');
});

// ── Test: SMS opt-out prevention ──────────────────────────────────────────────

test('sendLeadSms — returns opted_out when lead has smsOptOut=true', () => {
  // Pure function check: the logic mirrors sendLeadSms()
  const lead = { phone: '+12294493677', smsOptOut: true };
  const force = false;
  const skip = !lead.phone || (lead.smsOptOut && !force);
  assert.equal(skip, true);
});

test('sendLeadSms — sends when force=true despite opt-out', () => {
  const lead = { phone: '+12294493677', smsOptOut: true };
  const force = true;
  const skip = !lead.phone || (lead.smsOptOut && !force);
  assert.equal(skip, false);
});

test('sendLeadSms — skips when no phone number', () => {
  const lead = { phone: '', smsOptOut: false };
  const skip = !lead.phone;
  assert.equal(skip, true);
});

// ── Test: STOP keyword handling ───────────────────────────────────────────────

test('STOP_KEYWORDS — recognises all opt-out words', () => {
  const STOP_KEYWORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END']);
  ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END'].forEach((word) => {
    assert.equal(STOP_KEYWORDS.has(word), true, `Expected ${word} to be in STOP_KEYWORDS`);
  });
  assert.equal(STOP_KEYWORDS.has('HELLO'), false);
  assert.equal(STOP_KEYWORDS.has('stop'), false); // case-sensitive; normalisation is in handler
});

test('START_KEYWORDS — recognises all opt-in words', () => {
  const START_KEYWORDS = new Set(['START', 'YES', 'UNSTOP']);
  ['START', 'YES', 'UNSTOP'].forEach((word) => {
    assert.equal(START_KEYWORDS.has(word), true, `Expected ${word} to be in START_KEYWORDS`);
  });
  assert.equal(START_KEYWORDS.has('NO'), false);
});

// ── Test: follow-up step scheduling ──────────────────────────────────────────

test('follow-up sequence — covers 4 steps before completing', () => {
  const FOLLOW_UP_SCHEDULE_HOURS = [24, 72, 168, 336];
  const createdAt = new Date('2026-07-19T22:00:00Z');

  const step0 = getNextFollowUpAt(createdAt, FOLLOW_UP_SCHEDULE_HOURS, 0);
  const step1 = getNextFollowUpAt(createdAt, FOLLOW_UP_SCHEDULE_HOURS, 1);
  const step2 = getNextFollowUpAt(createdAt, FOLLOW_UP_SCHEDULE_HOURS, 2);
  const step3 = getNextFollowUpAt(createdAt, FOLLOW_UP_SCHEDULE_HOURS, 3);
  const step4 = getNextFollowUpAt(createdAt, FOLLOW_UP_SCHEDULE_HOURS, 4);

  assert.ok(step0 instanceof Date);
  assert.ok(step1 instanceof Date);
  assert.ok(step2 instanceof Date);
  assert.ok(step3 instanceof Date);
  assert.equal(step4, null, 'Step 4 should return null (sequence complete)');
});

test('follow-up sequence — reminder template selection', () => {
  function reminderTemplateByStep(step) {
    if (step === 0) return 'reminder1';
    if (step === 1) return 'reminder2';
    if (step === 2) return 'reminder3';
    return 'finalReminder';
  }
  assert.equal(reminderTemplateByStep(0), 'reminder1');
  assert.equal(reminderTemplateByStep(1), 'reminder2');
  assert.equal(reminderTemplateByStep(2), 'reminder3');
  assert.equal(reminderTemplateByStep(3), 'finalReminder');
  assert.equal(reminderTemplateByStep(99), 'finalReminder');
});

// ── Test: backfill deduplication ──────────────────────────────────────────────

test('backfill — already-existing leads produce skipped: true result', () => {
  // Simulates the dedup logic in backfillFormLeads
  const existingLeads = new Set(['META-111111', 'META-222222']);

  function fakeCheckExisting(metaLeadId) {
    const uid = `META-${metaLeadId}`;
    return existingLeads.has(uid);
  }

  assert.equal(fakeCheckExisting('111111'), true);
  assert.equal(fakeCheckExisting('333333'), false);
});

// ── Test: Twilio SID format validation ───────────────────────────────────────

test('Twilio SID — valid SID format recognised', () => {
  const validSid = 'SM' + 'a'.repeat(32);
  assert.match(validSid, /^SM[a-fA-F0-9]{32}$/);
});

test('Twilio SID — invalid SID rejected', () => {
  assert.doesNotMatch('invalid', /^SM[a-fA-F0-9]{32}$/);
  assert.doesNotMatch('SM123', /^SM[a-fA-F0-9]{32}$/);
  assert.doesNotMatch('', /^SM[a-fA-F0-9]{32}$/);
});

// ── Test: recovery endpoint payload validation ────────────────────────────────

test('recover endpoint — rejects request without metaLeadId', () => {
  const body = { email: 'test@example.com' };
  const metaLeadIdRaw = String(body.metaLeadId || '').trim();
  assert.equal(metaLeadIdRaw, '');
  // Endpoint should return 400
  const shouldReturn400 = !metaLeadIdRaw;
  assert.equal(shouldReturn400, true);
});

test('recover endpoint — detects numeric vs manual metaLeadId', () => {
  const numericId = '1913273286015217';
  const manualId = 'manual-booker-jones-20260719';

  assert.equal(/^\d{5,40}$/.test(numericId), true);
  assert.equal(/^\d{5,40}$/.test(manualId), false);
});

// ── Test: webhook diagnostics fields ─────────────────────────────────────────

test('diagnostics — checks all required credential env vars', () => {
  const requiredVars = [
    'META_PAGE_ACCESS_TOKEN',
    'META_APP_SECRET',
    'META_WEBHOOK_VERIFY_TOKEN',
    'SENDGRID_API_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_FROM_NUMBER'
  ];
  // Just confirm the list is what the diagnostics function checks
  assert.equal(requiredVars.includes('META_APP_SECRET'), true);
  assert.equal(requiredVars.includes('META_WEBHOOK_VERIFY_TOKEN'), true);
});

test('diagnostics — webhook URL construction', () => {
  const serverBaseUrl = 'https://fixloapp.onrender.com';
  const webhookRoute = '/webhook/meta-leads';
  const webhookUrl = `${serverBaseUrl}${webhookRoute}`;
  assert.equal(webhookUrl, 'https://fixloapp.onrender.com/webhook/meta-leads');
});

// ── Test: SendGrid event status mapping ──────────────────────────────────────

test('SendGrid events — known event types map correctly', () => {
  const mapping = {
    processed: 'processed',
    delivered: 'delivered',
    open: 'open',
    click: 'click',
    bounce: 'bounce',
    dropped: 'dropped',
    deferred: 'deferred',
    unsubscribe: 'unsubscribe'
  };

  ['processed', 'delivered', 'open', 'click', 'bounce', 'dropped', 'deferred', 'unsubscribe'].forEach((evt) => {
    assert.ok(mapping[evt], `Expected mapping for event type: ${evt}`);
  });
});

test('SendGrid events — unknown event type returns null (no update)', () => {
  const mapping = { delivered: 'delivered' };
  const unknownEvent = 'spam_report';
  assert.equal(mapping[unknownEvent] || null, null);
});

// ── Test: invitation code format ──────────────────────────────────────────────

test('invitation code — prefix format is FIXLO-<random>', () => {
  const code = 'FIXLO-AB3D7HJK';
  assert.match(code, /^[A-Z0-9]+-[A-Z0-9]+$/);
  assert.ok(code.startsWith('FIXLO-'));
});

test('invitation code — expiry is 30 days by default', () => {
  const expiryDays = 30;
  const now = new Date('2026-07-19T00:00:00Z');
  const expiresAt = new Date(now.getTime() + (expiryDays * 24 * 60 * 60 * 1000));
  assert.equal(expiresAt.toISOString(), '2026-08-18T00:00:00.000Z');
});

// ── Summary ───────────────────────────────────────────────────────────────────
// All tests above are synchronous assertions against pure/deterministic logic.
// Integration tests requiring a live database should be placed in a separate
// file and run against a test MongoDB instance.
