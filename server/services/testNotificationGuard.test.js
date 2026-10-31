const test = require('node:test');
const assert = require('node:assert/strict');
const {testNotificationConfig,assertTestRecipient} = require('./testNotificationGuard');
const config = {NODE_ENV:'test', FIXLO_TEST_NOTIFICATIONS_ENABLED:'true', STRIPE_SECRET_KEY:'sk_test_example', FIXLO_TEST_EMAIL:'example@fixlo.invalid', FIXLO_TEST_PHONE:'+15550001000'};
test('staging-only allowlist accepts intended test recipients',()=>{
  assert.equal(testNotificationConfig(config).email,'example@fixlo.invalid');
  assert.equal(assertTestRecipient({email:'example@fixlo.invalid',phone:'+15550001000'},config),true);
});
test('reject sending to any unrelated customer',()=>{
  assert.throws(()=>assertTestRecipient({email:'customer@example.com'},config),/allowlisted/);
  assert.throws(()=>assertTestRecipient({phone:'+15550009999'},config),/allowlisted/);
});
test('reject production, disabled testing, and live Stripe credentials',()=>{
  assert.throws(()=>testNotificationConfig({...config,NODE_ENV:'production'}),/production/);
  assert.throws(()=>testNotificationConfig({...config,FIXLO_TEST_NOTIFICATIONS_ENABLED:'false'}),/disabled/);
  assert.throws(()=>testNotificationConfig({...config,STRIPE_SECRET_KEY:'sk_live_example'}),/test credentials/);
});
