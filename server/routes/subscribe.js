// server/routes/subscribe.js
const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const JobRequest = require('../models/JobRequest');
const { routeLead } = require('../services/leadAssignmentService');
const { notifyOwnerForLead } = require('../services/ownerLeadNotificationService');

const HANDYMAN_FIRST_HOUR_CENTS = 12000;
const HANDYMAN_CHECKOUT_KIND = 'handyman_first_hour';

let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
  }
} catch (e) {
  console.error("Stripe init error:", e.message);
}

function normalizeUSPhone(value = '') {
  const digits = String(value).replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

function clean(value, max = 1000) {
  return String(value || '').trim().slice(0, max);
}

/**
 * POST /api/subscribe/handyman-checkout
 * Creates a pending handyman request and a $120 Stripe Checkout session.
 * The $120 payment covers the first labor hour. Materials and later hours are separate.
 */
router.post('/handyman-checkout', async (req, res) => {
  try {
    if (!stripe) return res.status(503).json({ error: 'Stripe is not configured.' });
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Booking is temporarily unavailable. Please try again shortly.' });
    }

    const {
      fullName, email, phone, address, city, state, zipCode,
      preferredDate, preferredTime, details, smsConsent, pricingAccepted
    } = req.body || {};

    const normalizedPhone = normalizeUSPhone(phone);
    const description = clean(details, 1000);
    const normalizedEmail = clean(email, 200).toLowerCase();

    if (!clean(fullName, 100) || !normalizedEmail || !normalizedPhone || !clean(address, 200) || !clean(city, 100) || !clean(state, 2) || !clean(zipCode, 12)) {
      return res.status(400).json({ error: 'Name, email, phone, and complete service address are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (description.length < 20) {
      return res.status(400).json({ error: 'Please provide at least 20 characters describing the work.' });
    }
    if (pricingAccepted !== true) {
      return res.status(400).json({ error: 'The $120 hourly rate and materials policy must be accepted.' });
    }

    const requestId = `handyman_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const schedule = [clean(preferredDate, 20), clean(preferredTime, 40)].filter(Boolean).join(' — ');

    const job = await JobRequest.create({
      requestId,
      trade: 'general repairs',
      name: clean(fullName, 100),
      email: normalizedEmail,
      phone: normalizedPhone,
      address: clean(address, 200),
      city: clean(city, 100),
      state: clean(state, 2).toUpperCase(),
      zip: clean(zipCode, 12),
      description,
      preferredTime: schedule,
      status: 'pending',
      paymentProvider: 'stripe',
      paymentStatus: 'none',
      laborCost: 120,
      materialsCost: 0,
      totalCost: 120,
      visitFee: 0,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      pricingAcceptance: true,
      pricingAcceptanceAt: new Date(),
      smsConsent: Boolean(smsConsent),
      smsConsentAt: smsConsent ? new Date() : null
    });

    const clientUrl = process.env.CLIENT_URL || process.env.YOUR_DOMAIN || 'https://www.fixloapp.com';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: normalizedEmail,
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: HANDYMAN_FIRST_HOUR_CENTS,
          product_data: {
            name: 'Fixlo Handyman — First Labor Hour',
            description: '$120 covers the first labor hour. Additional labor is $120/hour and materials are billed separately with approval.'
          }
        },
        quantity: 1
      }],
      success_url: `${clientUrl}/request?mode=handyman&checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/request?mode=handyman&checkout=cancelled`,
      metadata: {
        kind: HANDYMAN_CHECKOUT_KIND,
        jobRequestId: String(job._id),
        requestId,
        hourlyRateCents: String(HANDYMAN_FIRST_HOUR_CENTS)
      }
    });

    job.stripeCheckoutSessionId = session.id;
    await job.save();

    return res.json({ success: true, url: session.url, sessionId: session.id, requestId });
  } catch (err) {
    console.error('Handyman checkout error:', err.message);
    return res.status(500).json({ error: 'Unable to create the secure handyman checkout.' });
  }
});

/**
 * GET /api/subscribe/handyman-checkout/verify?session_id=...
 * Verifies payment, marks the request captured, and routes it once.
 */
router.get('/handyman-checkout/verify', async (req, res) => {
  try {
    if (!stripe) return res.status(503).json({ verified: false, message: 'Stripe is not configured.' });
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ verified: false, message: 'Booking verification is temporarily unavailable.' });
    }

    const sessionId = clean(req.query.session_id, 255);
    if (!sessionId) return res.status(400).json({ verified: false, message: 'Missing payment session.' });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const verified = session.mode === 'payment'
      && session.payment_status === 'paid'
      && Number(session.amount_total) === HANDYMAN_FIRST_HOUR_CENTS
      && session.metadata?.kind === HANDYMAN_CHECKOUT_KIND;

    if (!verified) {
      return res.status(402).json({ verified: false, message: 'The $120 payment has not been completed.' });
    }

    const job = await JobRequest.findOne({ stripeCheckoutSessionId: sessionId });
    if (!job) return res.status(404).json({ verified: false, message: 'Handyman booking was not found.' });

    const newlyCaptured = job.paymentStatus !== 'captured';
    if (newlyCaptured) {
      job.paymentStatus = 'captured';
      job.paymentCapturedAt = new Date();
      job.paidAt = new Date();
      job.stripePaymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : '';
      await job.save();

      try {
        await notifyOwnerForLead(job, { stage: 'paid', amountPaidCents: HANDYMAN_FIRST_HOUR_CENTS });
      } catch (notifyError) {
        console.error('Handyman owner notification failed:', notifyError.message);
      }
      try {
        await routeLead(job._id);
      } catch (routeError) {
        console.error('Handyman routing failed:', routeError.message);
      }
    }

    return res.json({
      verified: true,
      requestId: job.requestId,
      amountPaidCents: HANDYMAN_FIRST_HOUR_CENTS,
      hourlyRateCents: HANDYMAN_FIRST_HOUR_CENTS,
      materialsAdditional: true
    });
  } catch (err) {
    console.error('Handyman checkout verification error:', err.message);
    return res.status(500).json({ verified: false, message: 'Unable to verify the payment session.' });
  }
});

/**
 * POST /api/subscribe/checkout
 * Body: { email, priceId }
 */
router.post("/checkout", async (req, res) => {
  try {
    if (!stripe) return res.status(503).json({ error: "Stripe is not configured" });

    const { email, priceId } = req.body || {};
    if (!email) return res.status(400).json({ error: "email is required" });

    const PRICE_ID = priceId || process.env.STRIPE_FIRST_MONTH_PRICE_ID || process.env.STRIPE_MONTHLY_PRICE_ID || process.env.STRIPE_PRICE_ID;
    if (!PRICE_ID) return res.status(500).json({ error: "No Stripe priceId configured" });

    const clientUrl = process.env.CLIENT_URL || "https://www.fixloapp.com";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      customer_email: email,
      success_url: `${clientUrl}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment-cancel.html`,
      metadata: { source: "pro-signup", email, ts: new Date().toISOString() }
    });

    return res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return res.status(500).json({ error: "Checkout creation failed" });
  }
});

router.post('/', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ success: false, message: 'Name and email are required' });
  console.log(`📩 New subscription: ${name} <${email}>`);
  res.json({ success: true, message: 'Subscription received successfully' });
});

module.exports = router;
