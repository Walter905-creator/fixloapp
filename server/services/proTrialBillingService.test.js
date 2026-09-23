const test = require('node:test');
const assert = require('node:assert/strict');
const { getTrialBillingState } = require('./proTrialBillingService');

const now = new Date('2026-09-23T14:00:00.000Z');

test('requests billing setup at the 15-day threshold', () => {
  const state = getTrialBillingState({
    freeAccessUntil: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
    inviteCodeUsed: null,
    stripeSubscriptionId: null,
    trialReminder15DaySentAt: null
  }, now);

  assert.equal(state.shouldRemind, true);
  assert.equal(state.shouldExpire, false);
  assert.equal(state.daysRemaining, 15);
});

test('does not repeat the 15-day reminder once recorded', () => {
  const state = getTrialBillingState({
    freeAccessUntil: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
    inviteCodeUsed: null,
    stripeSubscriptionId: null,
    trialReminder15DaySentAt: new Date(now.getTime() - 24 * 60 * 60 * 1000)
  }, now);

  assert.equal(state.shouldRemind, false);
});

test('does not request billing when a Stripe subscription has already been authorized', () => {
  const state = getTrialBillingState({
    freeAccessUntil: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    inviteCodeUsed: null,
    stripeSubscriptionId: 'sub_123',
    trialReminder15DaySentAt: null
  }, now);

  assert.equal(state.shouldRemind, false);
  assert.equal(state.shouldExpire, false);
});

test('expires a standard free trial with no billing authorization', () => {
  const state = getTrialBillingState({
    freeAccessUntil: new Date(now.getTime() - 1000),
    inviteCodeUsed: null,
    stripeSubscriptionId: null,
    trialExpiredAt: null
  }, now);

  assert.equal(state.shouldExpire, true);
  assert.equal(state.shouldRemind, false);
});

test('invite-code access is not treated as the standard 3-month trial', () => {
  const state = getTrialBillingState({
    freeAccessUntil: new Date(now.getTime() - 1000),
    inviteCodeUsed: 'FIXLO-ABC123',
    stripeSubscriptionId: null
  }, now);

  assert.equal(state.standardTrial, false);
  assert.equal(state.shouldExpire, false);
});
