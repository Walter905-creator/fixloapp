'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const {
  getStatusCallbackUrl,
  validateTwilioSignature,
  handleTwilioStatusWebhook,
  retryFailedInitialMetaLeadSmsBatch
} = require('./metaLeadAutomationService');

function createLead(overrides = {}) {
  return {
    _id: overrides._id || 'lead-1',
    firstName: overrides.firstName || 'Test',
    lastName: overrides.lastName || 'Lead',
    email: overrides.email || 'test@example.com',
    phone: overrides.phone || '+12025550100',
    invitationCode: overrides.invitationCode === undefined ? 'FIXLO1234' : overrides.invitationCode,
    smsStatus: overrides.smsStatus || 'failed',
    smsHistory: overrides.smsHistory ? [...overrides.smsHistory] : [],
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
      signupLink: 'https://fixloapp.com/pros/signup',
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
      signupLink: 'https://fixloapp.com/pros/signup',
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
