'use strict';

// Test notifications must never reach a real customer or be sent from production.
// Configure recipients in the staging environment; do not commit personal data.
function testNotificationConfig(env = process.env) {
  if (env.NODE_ENV === 'production') throw new Error('Test notifications are disabled in production');
  if (env.FIXLO_TEST_NOTIFICATIONS_ENABLED !== 'true') throw new Error('Test notifications disabled');
  if (env.STRIPE_SECRET_KEY && !env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    throw new Error('Test notifications require Stripe test credentials');
  }
  const email = String(env.FIXLO_TEST_EMAIL || '').trim().toLowerCase();
  const phone = String(env.FIXLO_TEST_PHONE || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid test email');
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error('Invalid E.164 test phone');
  return Object.freeze({email, phone});
}

function assertTestRecipient({ email, phone }, env = process.env) {
  const allowed = testNotificationConfig(env);
  if (email && String(email).trim().toLowerCase() !== allowed.email) {
    throw new Error('Email recipient is not allowlisted for testing');
  }
  if (phone && String(phone).trim() !== allowed.phone) {
    throw new Error('SMS recipient is not allowlisted for testing');
  }
  return true;
}
module.exports = {testNotificationConfig, assertTestRecipient};
