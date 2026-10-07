const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const mongoose = require('mongoose');
const Job = require('../models/JobRequest');
const Pro = require('../models/Pro');
const Invoice = require('../models/Invoice');
const referral = require('../services/homeownerReferralService');
const email = require('../services/emailService');

for (const paymentStatus of ['succeeded', 'processing']) {
  test(`completion charges the discounted amount and respects Stripe status ${paymentStatus}`, async t => {
    const job = {
      _id: 'job1', clockInTime: new Date(), hourlyRate: 1000,
      phone: '+17045551234', name: 'Customer', email: 'customer@example.com',
      address: '1 Main St', trade: 'General Repairs', materials: [],
      stripeCustomerId: 'cus_test', stripePaymentMethodId: 'pm_test', paymentAuthConsent: true,
      save: async () => {}
    };
    let stripeAmount;
    let invoiceData;
    const stripeId = require.resolve('stripe');
    require('stripe');
    const originalStripe = require.cache[stripeId].exports;
    const authId = require.resolve('../middleware/auth');
    require('../middleware/auth');
    const originalAuth = require.cache[authId].exports;
    const originalKey = process.env.STRIPE_SECRET_KEY;
    const ownReadyState = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
    Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, get: () => 1 });
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
    require.cache[stripeId].exports = () => ({ paymentIntents: { create: async (args, options) => {
      stripeAmount = args.amount;
      assert.equal(options.idempotencyKey, 'homeowner-completion-job1');
      return { id: 'pi_test', status: paymentStatus };
    } } });
    require.cache[authId].exports = (req, res, next) => { req.proId = 'pro1'; next(); };
    t.mock.method(Job, 'findOne', async () => job);
    t.mock.method(Pro, 'findByIdAndUpdate', async () => ({}));
    t.mock.method(Invoice, 'create', async data => { invoiceData = data; return { ...data, invoiceNumber: 'INV-test' }; });
    t.mock.method(email, 'sendInvoiceEmail', async () => ({}));
    t.mock.method(referral, 'reserveJobDiscount', async () => ({ grossTotal: 1000, discountAmount: 100, total: 900 }));
    const consume = t.mock.method(referral, 'completeJobDiscount', async () => {});
    delete require.cache[require.resolve('./contractor')];
    const app = express(); app.use(express.json()); app.use(require('./contractor'));
    let server;
    try {
      await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
      const response = await fetch(`http://127.0.0.1:${server.address().port}/jobs/job1/clock-out`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      assert.equal(response.status, 200);
      const result = await response.json();
      assert.equal(stripeAmount, 90000);
      assert.equal(invoiceData.total, 900);
      assert.equal(invoiceData.subtotal, 1000);
      assert.equal(invoiceData.discountAmount, 100);
      assert.equal(result.paymentSucceeded, paymentStatus === 'succeeded');
      assert.equal(result.amountChargedAtCompletion, paymentStatus === 'succeeded' ? 900 : 0);
      assert.equal(invoiceData.status, paymentStatus === 'succeeded' ? 'paid' : 'sent');
      assert.equal(consume.mock.callCount(), paymentStatus === 'succeeded' ? 1 : 0);
    } finally {
      if (server) await new Promise(resolve => server.close(resolve));
      require.cache[stripeId].exports = originalStripe;
      require.cache[authId].exports = originalAuth;
      if (originalKey === undefined) delete process.env.STRIPE_SECRET_KEY;
      else process.env.STRIPE_SECRET_KEY = originalKey;
      if (ownReadyState) Object.defineProperty(mongoose.connection, 'readyState', ownReadyState);
      else delete mongoose.connection.readyState;
    }
  });
}
