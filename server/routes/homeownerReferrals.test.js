const { test, before, after, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = 'homeowner-referral-test-secret';
const Homeowner = require('../models/Homeowner');
const referrals = require('../services/homeownerReferralService');
const database = require('../config/database');
const originalDatabaseMiddleware = database.requireDatabase;
database.requireDatabase = (req, res, next) => next();
const router = require('./homeownerReferrals');
database.requireDatabase = originalDatabaseMiddleware;
let server;
let base;
const account = { _id: 'user1', phone: '+17045551234', invitationCode: 'FIXLO10' };
before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/referrals', router);
  await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}/referrals`;
});
after(async () => { await new Promise(resolve => server.close(resolve)); });
afterEach(() => require('node:test').mock.restoreAll());
function request(path, body, role = 'homeowner') {
  return fetch(base + path, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt.sign({ id: account._id, role }, process.env.JWT_SECRET)}` },
    body: body ? JSON.stringify(body) : undefined
  });
}

test('public campaign validation returns no customer information', async () => {
  const response = await fetch(base + '/invitation/FIXLO10');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { valid: true, discountPercent: 10 });
});

test('invitation dashboard requires authentication and the homeowner role', async () => {
  assert.equal((await fetch(base)).status, 401);
  assert.equal((await request('/', undefined, 'pro')).status, 403);
});

test('verification SMS requires explicit verification consent', async t => {
  t.mock.method(Homeowner, 'findById', async () => account);
  assert.equal((await request('/phone/send', {})).status, 400);
});

test('missing SMS configuration fails without claiming a text was sent', async t => {
  t.mock.method(Homeowner, 'findById', async () => account);
  const saved = process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_ACCOUNT_SID;
  try {
    const response = await request('/phone/send', { verificationConsent: true });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).sent, undefined);
  } finally { if (saved !== undefined) process.env.TWILIO_ACCOUNT_SID = saved; }
});

test('invalid or expired OTP does not verify the phone or grant a benefit', async t => {
  t.mock.method(Homeowner, 'findById', async () => account);
  t.mock.method(Homeowner, 'findOneAndUpdate', (query, update) => {
    assert.equal(query.phoneCodeAttempts.$lt, 5);
    assert.ok(query.phoneCodeExpires.$gt instanceof Date);
    assert.equal(update.$inc.phoneCodeAttempts, 1);
    return { select: async () => null };
  });
  const grant = t.mock.method(referrals, 'grantDiscount');
  assert.equal((await request('/phone/verify', { code: '111111' })).status, 400);
  assert.equal(grant.mock.callCount(), 0);
});

test('successful OTP is bound to account and phone, consumed, and grants the benefit', async t => {
  t.mock.method(Homeowner, 'findById', async () => account);
  const hash = crypto.createHmac('sha256', process.env.JWT_SECRET).update(`${account._id}:${account.phone}:123456`).digest('hex');
  let updates = 0;
  t.mock.method(Homeowner, 'findOneAndUpdate', (query, update) => {
    updates++;
    if (updates === 1) return { select: async () => ({ ...account, phoneCodeHash: hash }) };
    assert.equal(query.phoneCodeHash, hash);
    assert.equal(query.phoneCodePhone, account.phone);
    assert.equal(update.$set.verifiedPhone, account.phone);
    assert.equal(update.$unset.phoneCodeHash, 1);
    return Promise.resolve({ ...account, verifiedPhone: account.phone });
  });
  const grant = t.mock.method(referrals, 'grantDiscount', async () => ({}));
  t.mock.method(referrals, 'referralStatus', async () => ({ status: 'available', discountPercent: 10 }));
  const response = await request('/phone/verify', { code: '123456' });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, 'available');
  assert.equal(grant.mock.callCount(), 1);
});

test('a reused OTP cannot grant a second benefit', async t => {
  t.mock.method(Homeowner, 'findById', async () => account);
  t.mock.method(Homeowner, 'findOneAndUpdate', () => ({ select: async () => null }));
  const grant = t.mock.method(referrals, 'grantDiscount');
  assert.equal((await request('/phone/verify', { code: '123456' })).status, 400);
  assert.equal(grant.mock.callCount(), 0);
});
