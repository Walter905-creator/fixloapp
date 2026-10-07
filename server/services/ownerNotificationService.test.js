const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup(env = {}, emailFails = false, smsFails = false) {
  const emails = [], texts = [];
  const context = {
    module: { exports: {} },
    process: { env: { NODE_ENV: 'production', SENDGRID_API_KEY: 'test', OWNER_EMAIL: 'owner@example.com', OWNER_PHONE_NUMBER: '+17045550100', ...env } },
    console: { log() {}, warn() {}, error() {} },
    require(name) {
      if (name === '@sendgrid/mail') return {
        setApiKey() {}, async send(message) {
          emails.push(message);
          if (emailFails) throw new Error('email failure');
          return [{ headers: { 'x-message-id': 'email-id' } }];
        }
      };
      if (name === '../utils/twilio') return { async sendSms(to, body) {
        texts.push({ to, body });
        if (smsFails) throw new Error('sms failure');
        return { sid: 'sms-id' };
      } };
      throw new Error(name);
    }
  };
  vm.runInNewContext(fs.readFileSync(__dirname + '/ownerNotificationService.js', 'utf8'), context);
  return { ...context.module.exports, emails, texts };
}

for (const event of ['homeowner_signup', 'pro_registered']) {
  test(event + ' sends both alerts to owner with safe account details', async () => {
    const s = setup();
    const result = await s.notify(event, { name: '<Walter>', email: 'customer@example.com', phone: '+17045550200', trade: 'handyman', password: 'DO_NOT_SEND', token: 'SECRET_TOKEN' });
    assert.equal(s.emails.length, 1);
    assert.equal(s.texts.length, 1);
    assert.equal(s.emails[0].to, 'owner@example.com');
    assert.equal(s.texts[0].to, '+17045550100');
    assert.ok(s.emails[0].html.includes('&lt;Walter&gt;'));
    assert.ok(s.texts[0].body.includes('customer@example.com'));
    assert.ok(!JSON.stringify([s.emails, s.texts]).includes('DO_NOT_SEND'));
    assert.ok(!JSON.stringify([s.emails, s.texts]).includes('SECRET_TOKEN'));
    assert.equal(result.success, true);
    assert.equal(result.sms.success, true);
  });
}
test('SMS runs when email is not configured', async () => {
  const s = setup({ SENDGRID_API_KEY: '' });
  const result = await s.notify('homeowner_signup');
  assert.equal(s.emails.length, 0);
  assert.equal(s.texts.length, 1);
  assert.equal(result.skipped, true);
  assert.equal(result.sms.success, true);
});
test('SMS runs after email failure; email retains one retry', async () => {
  const s = setup({}, true);
  const result = await s.notify('pro_registered');
  assert.equal(s.emails.length, 2);
  assert.equal(s.texts.length, 1);
  assert.equal(result.success, false);
  assert.equal(result.sms.success, true);
});
test('SMS failure does not stop email and does not resend SMS', async () => {
  const s = setup({}, false, true);
  const result = await s.notify('homeowner_signup');
  assert.equal(result.success, true);
  assert.equal(result.sms.success, false);
  assert.equal(s.texts.length, 1);
});
test('owner phone aliases are supported', async () => {
  for (const alias of ['FIXLO_OWNER_PHONE', 'OWNER_PHONE']) {
    const s = setup({ OWNER_PHONE_NUMBER: '', [alias]: '+17045550300' });
    await s.notify('pro_registered');
    assert.equal(s.texts[0].to, '+17045550300');
  }
});
test('missing phone skips SMS but still sends email', async () => {
  const s = setup({ OWNER_PHONE_NUMBER: '' });
  const result = await s.notify('homeowner_signup');
  assert.equal(result.success, true);
  assert.equal(result.sms.reason, 'owner_phone_not_configured');
  assert.equal(s.texts.length, 0);
});
test('non-signup events keep email-only behavior', async () => {
  const s = setup();
  const result = await s.notify('service_request');
  assert.equal(result.providerId, 'email-id');
  assert.equal(s.texts.length, 0);
});
test('development requires explicit SMS enabling', async () => {
  const s = setup({ NODE_ENV: 'development' });
  await s.notify('pro_registered');
  assert.equal(s.texts.length, 0);
  const enabled = setup({ NODE_ENV: 'development', ENABLE_OWNER_SMS_ALERTS: 'true' });
  await enabled.notify('pro_registered');
  assert.equal(enabled.texts.length, 1);
});
test('registered channels all execute despite email failure', async () => {
  const s = setup({}, true);
  const calls = [];
  s.registerChannel('broken', async () => { calls.push('broken'); throw new Error('failed'); });
  s.registerChannel('working', async () => { calls.push('working'); });
  const result = await s.notify('homeowner_signup');
  assert.deepEqual(calls, ['broken', 'working']);
  assert.equal(result.channels[0].success, false);
  assert.equal(result.channels[1].success, true);
});
