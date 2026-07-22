'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const {
  CANONICAL_PRO_SIGNUP_URL,
  getStatusCallbackUrl,
  normalizeProSignupLink,
  validateTwilioSignature,
  handleTwilioStatusWebhook,
  handleSendGridEvents,
  retryFailedInitialMetaLeadSmsBatch,
  recoverHistoricalMetaLeadsByForm,
  sendLeadSms,
  sendLeadEmail,
  initializeFollowUpForAvailableChannels,
  auditMetaLeadChannelCoverage
} = require('./metaLeadAutomationService');

function createLead(overrides = {}) {
  return {
    _id: overrides._id || 'lead-1',
    firstName: overrides.firstName || 'Test',
    lastName: overrides.lastName || 'Lead',
    email: overrides.email === undefined ? 'test@example.com' : overrides.email,
    phone: overrides.phone === undefined ? '+12025550100' : overrides.phone,
    invitationCode: overrides.invitationCode === undefined ? 'FIXLO1234' : overrides.invitationCode,
    smsStatus: overrides.smsStatus || 'failed',
    emailStatus: overrides.emailStatus || 'pending',
    smsOptOut: overrides.smsOptOut || false,
    contactability: overrides.contactability || { smsAvailable: false, emailAvailable: false },
    sms: overrides.sms || { attempted: false, messageSid: null, status: 'pending', errorCode: null, errorMessage: null, sentAt: null, deliveredAt: null },
    emailChannel: overrides.emailChannel || { attempted: false, messageId: null, status: 'pending', error: null, sentAt: null, deliveredAt: null },
    followUp: overrides.followUp || {
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
    },
    createdAt: overrides.createdAt || new Date('2026-07-22T00:00:00.000Z'),
    smsHistory: overrides.smsHistory ? [...overrides.smsHistory] : [],
    emailHistory: overrides.emailHistory ? [...overrides.emailHistory] : [],
    saveCalls: 0,
    async save() {
      this.saveCalls += 1;
      return this;
    }
  };
}

test.afterEach(() => {
  delete process.env.BACKEND_PUBLIC_URL;
  delete process.env.META_LEAD_SMS_STATUS_CALLBACK_URL;
  delete process.env.SERVER_BASE_URL;
  delete process.env.TWILIO_AUTH_TOKEN;
  delete process.env.NODE_ENV;
  mock.restoreAll();
});

test('builds the absolute callback URL from BACKEND_PUBLIC_URL', () => {
  process.env.BACKEND_PUBLIC_URL = 'https://fixloapp.onrender.com';
  assert.equal(
    getStatusCallbackUrl(),
    'https://fixloapp.onrender.com/webhook/twilio/meta-leads/status'
  );
});

test('normalizes trailing slashes in BACKEND_PUBLIC_URL', () => {
  process.env.BACKEND_PUBLIC_URL = 'https://fixloapp.onrender.com///';
  assert.equal(
    getStatusCallbackUrl(),
    'https://fixloapp.onrender.com/webhook/twilio/meta-leads/status'
  );
});

test('returns null and logs when BACKEND_PUBLIC_URL is missing', () => {
  process.env.NODE_ENV = 'production';
  const consoleError = mock.method(console, 'error', () => {});

  assert.equal(getStatusCallbackUrl(), null);
  assert.equal(consoleError.mock.calls.length, 2);
  assert.match(String(consoleError.mock.calls[0].arguments[0]), /BACKEND_PUBLIC_URL/);
});

test('accepts a valid Twilio callback signature', () => {
  process.env.TWILIO_AUTH_TOKEN = 'test_auth_token';
  const url = 'https://fixloapp.onrender.com/webhook/twilio/meta-leads/status';
  const params = { MessageSid: 'SMabc123', MessageStatus: 'delivered', From: '+12025550100' };
  const crypto = require('crypto');
  const signature = crypto
    .createHmac('sha1', process.env.TWILIO_AUTH_TOKEN)
    .update(Buffer.from(`${url}From+12025550100MessageSidSMabc123MessageStatusdelivered`, 'utf8'))
    .digest('base64');

  assert.equal(validateTwilioSignature({ signature, url, params }), true);
});

test('rejects an invalid Twilio callback signature', () => {
  process.env.TWILIO_AUTH_TOKEN = 'test_auth_token';
  const params = { MessageSid: 'SMabc123', MessageStatus: 'delivered' };

  assert.equal(
    validateTwilioSignature({
      signature: 'invalid-signature',
      url: 'https://fixloapp.onrender.com/webhook/twilio/meta-leads/status',
      params
    }),
    false
  );
});

test('stores Twilio status callback fields on the matching lead record', async () => {
  const lead = createLead({
    _id: 'lead-status',
    smsHistory: [{
      messageSid: 'SM' + 'a'.repeat(32),
      direction: 'outbound',
      templateKey: 'immediate',
      status: 'queued',
      errorCode: null,
      errorMessage: null
    }]
  });
  const events = [];

  const result = await handleTwilioStatusWebhook(
    {
      MessageSid: 'SM' + 'a'.repeat(32),
      MessageStatus: 'undelivered',
      ErrorCode: '21610',
      ErrorMessage: 'STOP recipient'
    },
    {
      metaLeadModel: {
        async findOne() {
          return lead;
        }
      },
      logEventFn: async (...args) => events.push(args)
    }
  );

  assert.equal(result.updated, true);
  assert.equal(lead.smsStatus, 'undelivered');
  assert.equal(lead.smsHistory[0].messageSid, 'SM' + 'a'.repeat(32));
  assert.equal(lead.smsHistory[0].status, 'undelivered');
  assert.equal(lead.smsHistory[0].errorCode, '21610');
  assert.equal(lead.smsHistory[0].errorMessage, 'STOP recipient');
  assert.equal(lead.saveCalls, 1);
  assert.equal(events.length, 1);
});

test('canonicalizes legacy Fixlo pro signup URLs', () => {
  assert.equal(normalizeProSignupLink('https://www.fixloapp.com/pros/signup'), CANONICAL_PRO_SIGNUP_URL);
  assert.equal(normalizeProSignupLink('https://fixloapp.com/pros/signup'), CANONICAL_PRO_SIGNUP_URL);
  assert.equal(normalizeProSignupLink('https://www.fixloapp.com/pros'), CANONICAL_PRO_SIGNUP_URL);
  assert.equal(normalizeProSignupLink(''), CANONICAL_PRO_SIGNUP_URL);
});

test('recovers historical leads from Meta first and falls back to manual recovery only when required', async () => {
  const results = await recoverHistoricalMetaLeadsByForm({
    formId: '1913273286015217',
    targets: [
      { fullName: 'Lee Martin', email: 'handsonmaintenance621@gmail.com', phone: '+18033153009', trade: 'Painter' },
      { fullName: 'Roy Villegas', email: 'xproroy13@gmail.com' },
      { fullName: 'Josh Larsen', email: 'jlarsen2@ymail.com', phone: '+19493754801', trade: 'General construction all trades' }
    ],
    metaLeadModel: {
      async findOne(query) {
        const serialized = JSON.stringify(query);
        if (serialized.includes('jlarsen2@ymail.com')) {
          return {
            _id: 'existing-josh',
            metaLeadId: 'recovered-josh',
            firstName: 'Josh',
            lastName: 'Larsen'
          };
        }
        return null;
      }
    },
    fetchMetaFormLeadsImpl: async () => ({
      pageId: '1234567890',
      leads: [
        {
          id: '777777',
          field_data: [
            { name: 'full_name', values: ['Lee Martin'] },
            { name: 'email', values: ['handsonmaintenance621@gmail.com'] },
            { name: 'phone_number', values: ['+18033153009'] }
          ]
        }
      ]
    }),
    createOrUpdateLeadFromMetaImpl: async ({ value }) => ({
      skipped: false,
      lead: {
        _id: 'meta-lee',
        firstName: 'Lee',
        lastName: 'Martin',
        invitationCode: 'FIXLO-LEE1',
        smsStatus: 'sent',
        smsHistory: [{ messageSid: 'SM' + '1'.repeat(32), status: 'sent' }],
        emailStatus: 'processed',
        emailHistory: [{ messageId: 'email-lee', status: 'processed' }],
        followUp: { status: 'active', nextFollowUpAt: '2026-07-23T00:00:00.000Z' }
      }
    }),
    recoverManualMetaLeadImpl: async (leadData) => ({
      skipped: false,
      lead: {
        _id: leadData.email === 'xproroy13@gmail.com' ? 'manual-roy' : 'manual-other',
        firstName: 'Roy',
        lastName: 'Villegas',
        invitationCode: 'FIXLO-ROY1',
        smsStatus: 'sent',
        smsHistory: [{ messageSid: 'SM' + '2'.repeat(32), status: 'sent' }],
        emailStatus: 'processed',
        emailHistory: [{ messageId: 'email-roy', status: 'processed' }],
        followUp: { status: 'active', nextFollowUpAt: '2026-07-23T01:00:00.000Z' }
      }
    })
  });

  assert.equal(results.canonicalSignupLink, CANONICAL_PRO_SIGNUP_URL);
  assert.equal(results.results[0].status, 'RECOVERED_FROM_META');
  assert.equal(results.results[0].matchedMetaLeadId, '777777');
  assert.equal(results.results[1].status, 'RECOVERED_MANUAL');
  assert.equal(results.results[1].source, 'manual');
  assert.equal(results.results[2].status, 'SKIPPED_DUPLICATE');
});

test('retries a failed initial SMS and returns the accepted SID', async () => {
  process.env.BACKEND_PUBLIC_URL = 'https://fixloapp.onrender.com';
  const lead = createLead({
    _id: '6a5f4c298a89f5ec882f359c',
    firstName: 'Booker',
    lastName: 'Jones',
    smsHistory: [{
      direction: 'outbound',
      templateKey: 'immediate',
      status: 'failed',
      errorMessage: 'StatusCallback must be a valid URL'
    }]
  });

  const results = await retryFailedInitialMetaLeadSmsBatch({
    targetIds: [lead._id],
    metaLeadModel: {
      async findById(id) {
        return id === lead._id ? lead : null;
      }
    },
    settingsProvider: async () => ({
      signupLink: 'https://fixloapp.com/pros',
      supportEmail: 'support@fixloapp.com',
      supportPhone: '',
      smsTemplates: { immediate: 'Hi {{firstName}}! Use {{invitationCode}} at {{signupLink}}' }
    }),
    sendSmsImpl: async (_phone, _body, options) => {
      assert.equal(
        options.statusCallback,
        'https://fixloapp.onrender.com/webhook/twilio/meta-leads/status'
      );
      return { sid: 'SM' + 'b'.repeat(32), status: 'queued' };
    }
  });

  assert.deepEqual(results, [{
    name: 'Booker Jones',
    leadId: '6a5f4c298a89f5ec882f359c',
    status: 'SENT',
    twilioMessageSid: 'SM' + 'b'.repeat(32),
    twilioStatus: 'queued',
    statusCallback: 'https://fixloapp.onrender.com/webhook/twilio/meta-leads/status',
    errorReason: null
  }]);
  assert.equal(lead.saveCalls, 1);
  assert.equal(lead.smsHistory.at(-1).messageSid, 'SM' + 'b'.repeat(32));
});

test('skips retry when an existing valid SID is already stored', async () => {
  process.env.BACKEND_PUBLIC_URL = 'https://fixloapp.onrender.com';
  const lead = createLead({
    _id: '6a5f4c2b8a89f5ec882f35b2',
    firstName: 'Josh',
    lastName: 'Larsen',
    smsHistory: [{
      messageSid: 'SM' + 'c'.repeat(32),
      direction: 'outbound',
      templateKey: 'immediate',
      status: 'queued'
    }]
  });
  let sendCount = 0;

  const [result] = await retryFailedInitialMetaLeadSmsBatch({
    targetIds: [lead._id],
    metaLeadModel: {
      async findById() {
        return lead;
      }
    },
    settingsProvider: async () => ({ smsTemplates: { immediate: 'hello' }, signupLink: '', supportEmail: '', supportPhone: '' }),
    sendSmsImpl: async () => {
      sendCount += 1;
      return { sid: 'SM' + 'd'.repeat(32), status: 'queued' };
    }
  });

  assert.equal(sendCount, 0);
  assert.equal(result.status, 'ALREADY_SENT');
  assert.equal(result.twilioMessageSid, 'SM' + 'c'.repeat(32));
});

test('prevents duplicate sends when the prior state is ambiguous', async () => {
  process.env.BACKEND_PUBLIC_URL = 'https://fixloapp.onrender.com';
  const lead = createLead({
    _id: '6a5f4c2c8a89f5ec882f35c8',
    firstName: 'John',
    lastName: 'Adams',
    smsHistory: [
      {
        direction: 'outbound',
        templateKey: 'immediate',
        status: 'failed',
        errorMessage: 'StatusCallback must be a valid URL'
      },
      {
        direction: 'outbound',
        templateKey: 'immediate',
        status: 'queued',
        errorMessage: null
      }
    ]
  });
  let sendCount = 0;

  const [result] = await retryFailedInitialMetaLeadSmsBatch({
    targetIds: [lead._id],
    metaLeadModel: {
      async findById() {
        return lead;
      }
    },
    settingsProvider: async () => ({ smsTemplates: { immediate: 'hello' }, signupLink: '', supportEmail: '', supportPhone: '' }),
    sendSmsImpl: async () => {
      sendCount += 1;
      return { sid: 'SM' + 'e'.repeat(32), status: 'queued' };
    }
  });

  assert.equal(sendCount, 0);
  assert.equal(result.status, 'FAILED');
  assert.equal(result.errorReason, 'ambiguous_existing_attempt');
});

test('continues the batch when only one provider call fails', async () => {
  process.env.BACKEND_PUBLIC_URL = 'https://fixloapp.onrender.com';
  const firstLead = createLead({
    _id: 'lead-one',
    firstName: 'Booker',
    lastName: 'Jones',
    smsHistory: [{
      direction: 'outbound',
      templateKey: 'immediate',
      status: 'failed',
      errorMessage: 'Invalid StatusCallback URL'
    }]
  });
  const secondLead = createLead({
    _id: 'lead-two',
    firstName: 'Josh',
    lastName: 'Larsen',
    phone: '+12025550101',
    smsHistory: [{
      direction: 'outbound',
      templateKey: 'immediate',
      status: 'failed',
      errorMessage: 'Invalid StatusCallback URL'
    }]
  });

  const leadMap = new Map([
    [firstLead._id, firstLead],
    [secondLead._id, secondLead]
  ]);

  const results = await retryFailedInitialMetaLeadSmsBatch({
    targetIds: [firstLead._id, secondLead._id],
    metaLeadModel: {
      async findById(id) {
        return leadMap.get(id) || null;
      }
    },
    settingsProvider: async () => ({
      signupLink: 'https://fixloapp.com/pros',
      supportEmail: 'support@fixloapp.com',
      supportPhone: '',
      smsTemplates: { immediate: 'Hi {{firstName}}! Use {{invitationCode}}' }
    }),
    sendSmsImpl: async (phone) => {
      if (phone === firstLead.phone) return { sid: 'SM' + 'f'.repeat(32), status: 'queued' };
      throw new Error('provider_down');
    }
  });

  assert.equal(results[0].status, 'SENT');
  assert.equal(results[0].twilioMessageSid, 'SM' + 'f'.repeat(32));
  assert.equal(results[1].status, 'FAILED');
  assert.equal(results[1].errorReason, 'provider_down');
});

test('sends immediate SMS and email and schedules both follow-up channels when both are available', async () => {
  const lead = createLead({
    _id: 'dual-1',
    phone: '+12025550123',
    email: 'dual@example.com',
    followUp: { step: 0, smsStep: 0, emailStep: 0, status: 'active', smsEnabled: true, emailEnabled: true, nextFollowUpAt: null, nextSmsFollowUpAt: null, nextEmailFollowUpAt: null }
  });
  const settings = {
    followUpTimingsHours: [24, 72, 168, 336],
    smsTemplates: { immediate: 'Use {{signupLink}}' },
    emailTemplates: { immediateSubject: 'Hi', immediateBody: 'Go {{signupLink}}', reminderSubject: 'R', reminderBody: 'R {{signupLink}}' },
    supportEmail: 'support@fixloapp.com'
  };

  const smsResult = await sendLeadSms(lead, 'immediate', settings, {
    stage: 'immediate',
    persist: false,
    logEventFn: async () => {},
    sendSmsImpl: async () => ({ sid: 'SM' + '1'.repeat(32), status: 'queued' })
  });
  const emailResult = await sendLeadEmail(lead, 'immediate', settings, {
    stage: 'immediate',
    persist: false,
    logEventFn: async () => {},
    ensureSendGridImpl: () => true,
    sendEmailImpl: async () => ([{ headers: { 'x-message-id': 'email-1' } }])
  });
  const init = initializeFollowUpForAvailableChannels(lead, settings, new Date('2026-07-22T00:00:00.000Z'));

  assert.equal(smsResult.success, true);
  assert.equal(emailResult.success, true);
  assert.equal(init.sequence, 'dual');
  assert.ok(lead.followUp.nextSmsFollowUpAt);
  assert.ok(lead.followUp.nextEmailFollowUpAt);
});

test('phone-only lead sends SMS, skips email, and schedules SMS-only follow-ups', async () => {
  const lead = {
    ...createLead({ _id: 'sms-only', phone: '+12025550124' }),
    email: '',
    emailHistory: []
  };
  const settings = {
    followUpTimingsHours: [24, 72, 168, 336],
    smsTemplates: { immediate: 'Use {{signupLink}}' },
    emailTemplates: { immediateSubject: 'Hi', immediateBody: 'Go {{signupLink}}', reminderSubject: 'R', reminderBody: 'R {{signupLink}}' },
    supportEmail: 'support@fixloapp.com'
  };
  const smsResult = await sendLeadSms(lead, 'immediate', settings, {
    stage: 'immediate',
    persist: false,
    logEventFn: async () => {},
    sendSmsImpl: async () => ({ sid: 'SM' + '2'.repeat(32), status: 'queued' })
  });
  const emailResult = await sendLeadEmail(lead, 'immediate', settings, { stage: 'immediate', persist: false, logEventFn: async () => {}, ensureSendGridImpl: () => true });
  const init = initializeFollowUpForAvailableChannels(lead, settings, new Date('2026-07-22T00:00:00.000Z'));

  assert.equal(smsResult.success, true);
  assert.equal(emailResult.success, false);
  assert.equal(emailResult.reason, 'missing_email');
  assert.equal(init.sequence, 'sms_only');
  assert.ok(lead.followUp.nextSmsFollowUpAt);
  assert.equal(lead.followUp.nextEmailFollowUpAt, null);
});

test('email-only lead sends email, skips SMS, and schedules email-only follow-ups', async () => {
  const lead = createLead({ _id: 'email-only', phone: '', email: 'emailonly@example.com' });
  const settings = {
    followUpTimingsHours: [24, 72, 168, 336],
    smsTemplates: { immediate: 'Use {{signupLink}}' },
    emailTemplates: { immediateSubject: 'Hi', immediateBody: 'Go {{signupLink}}', reminderSubject: 'R', reminderBody: 'R {{signupLink}}' },
    supportEmail: 'support@fixloapp.com'
  };
  const smsResult = await sendLeadSms(lead, 'immediate', settings, { stage: 'immediate', persist: false, logEventFn: async () => {} });
  const emailResult = await sendLeadEmail(lead, 'immediate', settings, {
    stage: 'immediate',
    persist: false,
    logEventFn: async () => {},
    ensureSendGridImpl: () => true,
    sendEmailImpl: async () => ([{ headers: { 'x-message-id': 'email-2' } }])
  });
  const init = initializeFollowUpForAvailableChannels(lead, settings, new Date('2026-07-22T00:00:00.000Z'));

  assert.equal(smsResult.success, false);
  assert.equal(smsResult.reason, 'missing_phone');
  assert.equal(emailResult.success, true);
  assert.equal(init.sequence, 'email_only');
  assert.equal(lead.followUp.nextSmsFollowUpAt, null);
  assert.ok(lead.followUp.nextEmailFollowUpAt);
});

test('records SMS failure while preserving successful email result', async () => {
  const lead = createLead({ _id: 'sms-fail-email-ok', phone: '+12025550125', email: 'ok@example.com' });
  const settings = {
    followUpTimingsHours: [24, 72, 168, 336],
    smsTemplates: { immediate: 'Use {{signupLink}}' },
    emailTemplates: { immediateSubject: 'Hi', immediateBody: 'Go {{signupLink}}', reminderSubject: 'R', reminderBody: 'R {{signupLink}}' },
    supportEmail: 'support@fixloapp.com'
  };
  const smsResult = await sendLeadSms(lead, 'immediate', settings, {
    stage: 'immediate',
    persist: false,
    logEventFn: async () => {},
    sendSmsImpl: async () => { throw new Error('sms_down'); }
  });
  const emailResult = await sendLeadEmail(lead, 'immediate', settings, {
    stage: 'immediate',
    persist: false,
    logEventFn: async () => {},
    ensureSendGridImpl: () => true,
    sendEmailImpl: async () => ([{ headers: { 'x-message-id': 'email-3' } }])
  });

  assert.equal(smsResult.success, false);
  assert.equal(lead.sms.status, 'failed');
  assert.equal(emailResult.success, true);
  assert.equal(lead.emailChannel.status, 'processed');
});

test('records email failure while preserving successful SMS result', async () => {
  const lead = createLead({ _id: 'email-fail-sms-ok', phone: '+12025550126', email: 'bad@example.com' });
  const settings = {
    followUpTimingsHours: [24, 72, 168, 336],
    smsTemplates: { immediate: 'Use {{signupLink}}' },
    emailTemplates: { immediateSubject: 'Hi', immediateBody: 'Go {{signupLink}}', reminderSubject: 'R', reminderBody: 'R {{signupLink}}' },
    supportEmail: 'support@fixloapp.com'
  };
  const smsResult = await sendLeadSms(lead, 'immediate', settings, {
    stage: 'immediate',
    persist: false,
    logEventFn: async () => {},
    sendSmsImpl: async () => ({ sid: 'SM' + '3'.repeat(32), status: 'queued' })
  });
  const emailResult = await sendLeadEmail(lead, 'immediate', settings, {
    stage: 'immediate',
    persist: false,
    logEventFn: async () => {},
    ensureSendGridImpl: () => true,
    sendEmailImpl: async () => { throw new Error('email_down'); }
  });

  assert.equal(smsResult.success, true);
  assert.equal(lead.sms.status, 'queued');
  assert.equal(emailResult.success, false);
  assert.equal(lead.emailChannel.status, 'failed');
});

test('prevents duplicate sends per channel stage', async () => {
  const lead = createLead({
    _id: 'dup-stage',
    phone: '+12025550127',
    email: 'dup@example.com',
    smsHistory: [{ direction: 'outbound', followUpStage: 'immediate', templateKey: 'immediate', status: 'queued', messageSid: 'SM' + '4'.repeat(32) }],
    emailHistory: [{ followUpStage: 'immediate', templateKey: 'immediate', status: 'processed', messageId: 'email-dup' }]
  });
  const settings = {
    followUpTimingsHours: [24, 72, 168, 336],
    smsTemplates: { immediate: 'Use {{signupLink}}' },
    emailTemplates: { immediateSubject: 'Hi', immediateBody: 'Go {{signupLink}}', reminderSubject: 'R', reminderBody: 'R {{signupLink}}' },
    supportEmail: 'support@fixloapp.com'
  };
  let smsCalls = 0;
  let emailCalls = 0;
  const smsResult = await sendLeadSms(lead, 'immediate', settings, {
    stage: 'immediate',
    persist: false,
    logEventFn: async () => {},
    sendSmsImpl: async () => { smsCalls += 1; return { sid: 'SM' + '5'.repeat(32), status: 'queued' }; }
  });
  const emailResult = await sendLeadEmail(lead, 'immediate', settings, {
    stage: 'immediate',
    persist: false,
    logEventFn: async () => {},
    ensureSendGridImpl: () => true,
    sendEmailImpl: async () => { emailCalls += 1; return [{ headers: { 'x-message-id': 'email-dup-2' } }]; }
  });

  assert.equal(smsResult.skipped, true);
  assert.equal(emailResult.skipped, true);
  assert.equal(smsCalls, 0);
  assert.equal(emailCalls, 0);
});

test('keeps SMS follow-ups enabled when email unsubscribes', async () => {
  const lead = createLead({
    _id: '64b0c0a1f5a8d7b3c1e2f901',
    phone: '+12025550128',
    email: 'sub@example.com',
    followUp: { step: 0, smsStep: 0, emailStep: 0, status: 'active', smsEnabled: true, emailEnabled: true, nextFollowUpAt: null, nextSmsFollowUpAt: new Date('2026-07-23T00:00:00.000Z'), nextEmailFollowUpAt: new Date('2026-07-23T00:00:00.000Z') },
    emailHistory: [{ messageId: 'email-u-1', status: 'processed' }]
  });
  const model = require('../models/MetaLead');
  const eventModel = require('../models/MetaLeadEvent');
  const findByIdMock = mock.method(model, 'findById', async () => lead);
  const findOneMock = mock.method(model, 'findOne', async () => null);
  const eventMock = mock.method(eventModel, 'create', async () => ({}));
  await handleSendGridEvents([{ event: 'unsubscribe', sg_message_id: 'email-u-1', custom_args: { metaLeadId: lead._id } }]);
  findByIdMock.mock.restore();
  findOneMock.mock.restore();
  eventMock.mock.restore();
  assert.equal(lead.followUp.smsEnabled, true);
  assert.equal(lead.followUp.emailEnabled, false);
});

test('stops only SMS follow-ups on SMS opt-out webhook while keeping email follow-ups active', async () => {
  const lead = createLead({
    _id: 'optout-only-sms',
    phone: '+12025550131',
    email: 'stop@example.com',
    smsHistory: [{ messageSid: 'SM' + '9'.repeat(32), direction: 'outbound', templateKey: 'immediate', status: 'queued' }],
    followUp: {
      step: 0,
      smsStep: 0,
      emailStep: 0,
      status: 'active',
      smsEnabled: true,
      emailEnabled: true,
      nextFollowUpAt: null,
      nextSmsFollowUpAt: new Date('2026-07-23T00:00:00.000Z'),
      nextEmailFollowUpAt: new Date('2026-07-23T00:00:00.000Z')
    }
  });
  await handleTwilioStatusWebhook(
    {
      MessageSid: 'SM' + '9'.repeat(32),
      MessageStatus: 'undelivered',
      ErrorCode: '21610',
      ErrorMessage: 'STOP recipient'
    },
    {
      metaLeadModel: { async findOne() { return lead; } },
      logEventFn: async () => {}
    }
  );
  assert.equal(lead.followUp.smsEnabled, false);
  assert.equal(lead.followUp.emailEnabled, true);
});

test('uses canonical pro signup URL in SMS and email content', async () => {
  const lead = createLead({ _id: 'canonical', phone: '+12025550129', email: 'canonical@example.com' });
  const settings = {
    followUpTimingsHours: [24, 72, 168, 336],
    signupLink: 'https://example.com/not-allowed',
    smsTemplates: { immediate: 'Join: {{signupLink}}' },
    emailTemplates: { immediateSubject: 'Hi', immediateBody: '<a href="{{signupLink}}">Join</a>', reminderSubject: 'R', reminderBody: 'R {{signupLink}}' },
    supportEmail: 'support@fixloapp.com'
  };
  let smsBody = '';
  let emailHtml = '';
  await sendLeadSms(lead, 'immediate', settings, {
    stage: 'immediate',
    persist: false,
    logEventFn: async () => {},
    sendSmsImpl: async (_phone, body) => { smsBody = body; return { sid: 'SM' + '6'.repeat(32), status: 'queued' }; }
  });
  await sendLeadEmail(lead, 'immediate', settings, {
    stage: 'immediate',
    persist: false,
    logEventFn: async () => {},
    ensureSendGridImpl: () => true,
    sendEmailImpl: async (msg) => { emailHtml = msg.html; return [{ headers: { 'x-message-id': 'email-6' } }]; }
  });
  assert.match(smsBody, /https:\/\/fixloapp\.com\/pros/);
  assert.match(emailHtml, /https:\/\/fixloapp\.com\/pros/);
  assert.doesNotMatch(smsBody, /example\.com\/not-allowed/);
});

test('audits existing leads with per-channel follow-up fields', async () => {
  const rows = [
    createLead({
      _id: 'audit-1',
      firstName: 'Both',
      phone: '+12025550130',
      email: 'both@example.com',
      smsHistory: [{ direction: 'outbound', followUpStage: 'immediate', status: 'sent', messageSid: 'SM' + '7'.repeat(32) }],
      emailHistory: [{ followUpStage: 'immediate', status: 'processed', messageId: 'email-7' }],
      followUp: { step: 0, smsStep: 0, emailStep: 0, status: 'active', smsEnabled: true, emailEnabled: true, nextFollowUpAt: null, nextSmsFollowUpAt: new Date('2026-07-23T00:00:00.000Z'), nextEmailFollowUpAt: new Date('2026-07-23T00:00:00.000Z') }
    })
  ];
  const mockMethod = mock.method(require('../models/MetaLead'), 'find', () => ({
    sort() { return this; },
    limit() { return rows; }
  }));
  const report = await auditMetaLeadChannelCoverage(10);
  mockMethod.mock.restore();
  assert.equal(report.rows.length, 1);
  assert.equal(report.rows[0].smsFollowUpsEnabled, true);
  assert.equal(report.rows[0].emailFollowUpsEnabled, true);
  assert.equal(report.rows[0].signupUrl, CANONICAL_PRO_SIGNUP_URL);
});
