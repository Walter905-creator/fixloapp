const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Models & utils
const JobRequest = require('../models/JobRequest');
const PendingCheckout = require('../models/PendingCheckout');
const { geocodeAddress } = require('../utils/geocoding');
const { isUSPhoneNumber } = require('../utils/twilio');
const { sendHomeownerConfirmation } = require('../utils/smsSender');
const { routeLead } = require('../services/leadAssignmentService');
const { notifyOwnerForLead } = require('../services/ownerLeadNotificationService');
const {
  CHARLOTTE_ESTIMATE_FEE_ENABLED,
  CHARLOTTE_ESTIMATE_FEE_AMOUNT_CENTS,
  evaluateCharlotteEstimateFeeEligibility
} = require('../config/charlotteEstimateFee');

// ---------- Constants ----------

// Stripe Checkout Session IDs are prefixed 'cs_' followed by ~200 alphanumeric chars.
// 300 chars provides a generous upper bound while guarding against excessively large inputs.
const MAX_STRIPE_SESSION_ID_LENGTH = 300;
const PAYMENT_STATUS_CAPTURED = 'captured';

// ---------- Helpers ----------

function isValidE164(phone) {
  return /^\+\d{10,15}$/.test(phone);
}

function normalizeUSPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

function buildAddressString({ address, city, state, zipCode }) {
  return [address, city, state, zipCode, 'USA']
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(', ');
}

// ---------- Stripe ----------

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  if (
    process.env.NODE_ENV === 'production' &&
    !process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')
  ) {
    throw new Error('Stripe LIVE key required in production');
  }

  if (
    process.env.NODE_ENV !== 'production' &&
    !process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')
  ) {
    throw new Error('Stripe TEST key required in non-production');
  }

  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
  });

  console.log(
    '✅ Stripe initialized:',
    process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')
      ? 'TEST MODE'
      : 'LIVE MODE'
  );
}

// ---------- Charlotte payment fee endpoints ----------

router.post('/estimate-fee', async (req, res) => {
  try {
    const { address, city, state, zipCode } = req.body || {};
    const eligibility = await evaluateCharlotteEstimateFeeEligibility({
      address,
      city,
      state,
      zip: zipCode
    });

    return res.json({
      ok: true,
      eligible: eligibility.eligible,
      amountCents: eligibility.amountCents || 0,
      amountDollars: Number(((eligibility.amountCents || 0) / 100).toFixed(2)),
      feeLabel: eligibility.eligible ? 'Estimate Fee' : null
    });
  } catch (error) {
    console.error('❌ Estimate fee eligibility error:', error.message);
    return res.status(500).json({ ok: false, error: 'Unable to determine estimate fee eligibility' });
  }
});

/**
 * POST /api/requests/create-checkout
 *
 * Creates a Stripe Checkout session for the $75 Charlotte Service Request Fee
 * WITHOUT writing a JobRequest to the database first.  The homeowner's form
 * data is saved in a temporary PendingCheckout document that expires in 2 h.
 *
 * On success the frontend redirects the browser to the returned checkoutUrl.
 * After Stripe redirects back to /request?payment=success&session_id=…, the
 * frontend calls POST /api/requests (below) with the session_id, which verifies
 * the payment and creates the real JobRequest.
 */
router.post('/create-checkout', async (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';
  try {
    const {
      serviceType,
      fullName,
      phone,
      email,
      address,
      city,
      state,
      zipCode,
      smsConsent,
      details,
      urgency
    } = req.body || {};

    if (!serviceType || !fullName || !phone || !address || !city || !state) {
      return res.status(400).json({ ok: false, error: 'Missing required fields for checkout' });
    }

    const normalizedPhone = normalizeUSPhone(String(phone));
    if (!normalizedPhone || !isValidE164(normalizedPhone)) {
      return res.status(400).json({ ok: false, error: 'Invalid phone number' });
    }

    // Verify the address is actually in Charlotte (within 30 miles)
    const eligibility = await evaluateCharlotteEstimateFeeEligibility({
      address, city, state, zip: zipCode
    });

    if (!eligibility.eligible || !CHARLOTTE_ESTIMATE_FEE_ENABLED) {
      return res.status(400).json({
        ok: false,
        error: 'This address is not in the Charlotte service area. No payment required.'
      });
    }

    if (!stripe) {
      return res.status(503).json({ ok: false, error: 'Payment system temporarily unavailable' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ ok: false, error: 'Database unavailable' });
    }

    const clientUrl = process.env.CLIENT_URL || 'https://fixloapp.com';
    const successUrl = `${clientUrl}/request?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl  = `${clientUrl}/request?payment=cancelled`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: CHARLOTTE_ESTIMATE_FEE_AMOUNT_CENTS,
            product_data: {
              name: '$75 Service Request Fee',
              description:
                'Includes a professional project estimate and matching with a qualified local professional who will contact you within 24 hours. One-time fee. No hidden charges.'
            }
          },
          quantity: 1
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        requestType: 'homeowner_service_request_fee',
        // No leadId yet — the JobRequest is created AFTER payment is verified
        createdAt: new Date().toISOString()
      }
    });

    // Persist form data temporarily (TTL 2 h)
    await PendingCheckout.create({
      stripeCheckoutSessionId: session.id,
      formData: {
        serviceType: String(serviceType).trim(),
        fullName:    String(fullName).trim(),
        phone:       normalizedPhone,
        email:       email ? String(email).trim().toLowerCase() : undefined,
        address:     String(address).trim(),
        city:        String(city).trim(),
        state:       String(state).trim(),
        zipCode:     String(zipCode || '').trim(),
        details:     String(details || '').trim(),
        urgency:     String(urgency || 'Flexible').trim(),
        smsConsent:  Boolean(smsConsent)
      }
    });

    if (isDev) console.log(`[REQUESTS] ✓ create-checkout | session=${session.id} phone=${normalizedPhone}`);

    return res.json({
      ok: true,
      checkoutUrl: session.url,
      sessionId: session.id
    });
  } catch (err) {
    console.error('❌ create-checkout error:', err.message);
    return res.status(500).json({ ok: false, error: 'Unable to create checkout session' });
  }
});

/**
 * GET /api/requests/verify-checkout/:sessionId
 *
 * Verifies that a Stripe Checkout session has been paid.
 * Returns { ok, paid } — does NOT accept or reject the request itself.
 */
router.get('/verify-checkout/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId || typeof sessionId !== 'string' || sessionId.length > MAX_STRIPE_SESSION_ID_LENGTH) {
      return res.status(400).json({ ok: false, error: 'Invalid session ID' });
    }

    if (!stripe) {
      return res.status(503).json({ ok: false, error: 'Payment system temporarily unavailable' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === 'paid';

    return res.json({ ok: true, paid, paymentStatus: session.payment_status });
  } catch (err) {
    console.error('❌ verify-checkout error:', err.message);
    return res.status(500).json({ ok: false, error: 'Unable to verify checkout session' });
  }
});

// ---------- POST /api/requests ----------

router.post('/', async (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) console.log(`[REQUESTS] ► Incoming  | POST /api/requests`);

  try {
    const {
      serviceType,
      fullName,
      phone,
      email,
      address,
      city,
      state,
      zipCode,
      smsConsent,
      details,
      // Optional: provided when returning from Stripe Checkout
      stripeCheckoutSessionId
    } = req.body || {};

    // Normalize service field — accept trade, service, or serviceType
    const rawService = (req.body.trade || req.body.service || serviceType || '')
      .toLowerCase()
      .trim();

    // ---------- Debug logging ----------
    console.log('Incoming trade:', rawService);
    console.log('Description length:', req.body.description?.length ?? req.body.details?.length);

    // ---------- Validation ----------

    if (!rawService || !fullName || !phone || !city || !state) {
      if (isDev) console.log(`[REQUESTS] ✗ Validation | missing required fields`);
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields'
      });
    }

    const normalizedPhone = normalizeUSPhone(phone);
    if (!normalizedPhone || !isValidE164(normalizedPhone)) {
      if (isDev) console.log(`[REQUESTS] ✗ Validation | invalid phone: ${phone}`);
      return res.status(400).json({
        ok: false,
        error: 'Phone number must be in E.164 format (+1XXXXXXXXXX)'
      });
    }

    if (typeof smsConsent !== 'boolean') {
      if (isDev) console.log(`[REQUESTS] ✗ Validation | smsConsent must be boolean, got: ${typeof smsConsent}`);
      return res.status(400).json({
        ok: false,
        error: 'smsConsent must be true or false'
      });
    }

    if (isDev) console.log(`[REQUESTS] ✓ Validation | service=${rawService} city=${city} state=${state}`);

    const requestId =
      'req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);

    // ---------- Geocoding ----------

    let lat = 39.8283;
    let lng = -98.5795;
    const geocodeSource = buildAddressString({ address, city, state, zipCode }) || `${city}, ${state}`;
    let formattedAddress = geocodeSource;

    let coords = null;
    try {
      if (typeof geocodeAddress === 'function') {
        const geo = await geocodeAddress(geocodeSource);
        lat = geo.lat;
        lng = geo.lng;
        formattedAddress = geo.formatted;
        coords = { lat, lng };
      }
    } catch (e) {
      console.warn('⚠️ Geocoding failed, using default coordinates:', e.message);
    }

    const eligibility = await evaluateCharlotteEstimateFeeEligibility({
      address,
      city,
      state,
      zip: zipCode,
      coordinates: coords
    });
    const requiresEstimateFee = eligibility.eligible && CHARLOTTE_ESTIMATE_FEE_ENABLED;

    // ---------- Charlotte payment gate ----------
    // Charlotte requests MUST include a verified Stripe Checkout session.
    // We verify the session directly via the Stripe API — we do NOT trust
    // query parameters or frontend-supplied payment state.

    let verifiedSessionId = null;

    if (requiresEstimateFee) {
      if (!stripeCheckoutSessionId || typeof stripeCheckoutSessionId !== 'string') {
        if (isDev) console.log(`[REQUESTS] ✗ Payment    | Charlotte request missing stripeCheckoutSessionId`);
        return res.status(402).json({
          ok: false,
          requiresPayment: true,
          error:
            'A $75 Service Request Fee is required for Charlotte-area requests. ' +
            'Please complete checkout before submitting.'
        });
      }

      if (!stripe) {
        return res.status(503).json({ ok: false, error: 'Payment system temporarily unavailable' });
      }

      // Verify session with Stripe — do not trust the frontend
      let stripeSession;
      try {
        stripeSession = await stripe.checkout.sessions.retrieve(stripeCheckoutSessionId);
      } catch (stripeErr) {
        console.error('❌ Stripe session retrieval error:', stripeErr.message);
        return res.status(402).json({
          ok: false,
          requiresPayment: true,
          error: 'Unable to verify payment. Please try again.'
        });
      }

      if (stripeSession.payment_status !== 'paid') {
        if (isDev) console.log(`[REQUESTS] ✗ Payment    | session ${stripeCheckoutSessionId} status=${stripeSession.payment_status}`);
        return res.status(402).json({
          ok: false,
          requiresPayment: true,
          error: 'Payment has not been completed. Please complete checkout first.'
        });
      }

      // Guard against session reuse — check PendingCheckout consumed flag
      if (mongoose.connection.readyState === 1) {
        const pending = await PendingCheckout.findOne({ stripeCheckoutSessionId });

        if (pending && pending.consumed) {
          if (isDev) console.log(`[REQUESTS] ✗ Payment    | session ${stripeCheckoutSessionId} already consumed`);
          return res.status(409).json({
            ok: false,
            error: 'This payment session has already been used. Please start a new request.'
          });
        }

        // Also check if a JobRequest with this session ID already exists (double-submission guard)
        const existing = await JobRequest.findOne({ stripeCheckoutSessionId });
        if (existing) {
          if (isDev) console.log(`[REQUESTS] ✗ Payment    | duplicate JobRequest for session ${stripeCheckoutSessionId}`);
          return res.status(409).json({
            ok: false,
            error: 'A request with this payment session already exists.',
            requestId: existing.requestId
          });
        }
      }

      verifiedSessionId = stripeCheckoutSessionId;
      if (isDev) console.log(`[REQUESTS] ✓ Payment    | session ${verifiedSessionId} verified paid`);
    }

    // ---------- Save Job ----------

    let savedLead = null;

    if (mongoose.connection.readyState === 1) {
      if (isDev) console.log(`[REQUESTS] ► DB save    | Saving JobRequest to database`);
      console.log('New Fixlo service request:', { service: rawService, city, phone: normalizedPhone });

      const jobData = {
        requestId,
        name: fullName.trim(),
        email: email?.trim().toLowerCase() || undefined,
        phone: normalizedPhone,
        trade: rawService,
        address: address?.trim() || formattedAddress,
        city: city.trim(),
        state: state.trim(),
        zip: String(zipCode || '').trim(),
        description: details?.trim() || 'No additional details provided',
        preferredTime: req.body.preferredTime?.trim() || '',
        status: 'pending',
        smsConsent,
        smsConsentAt: smsConsent ? new Date() : null,
        source: 'website',
        estimateFeeEligible: eligibility.eligible,
        estimateFeeRequired: requiresEstimateFee,
        estimateFeeAmountCents: requiresEstimateFee ? CHARLOTTE_ESTIMATE_FEE_AMOUNT_CENTS : 0,
        estimateFeeCurrency: 'usd',
        ownerSmsStatus: 'pending',
        ownerEmailStatus: 'pending',
        // Record the verified Stripe session if payment was required
        ...(verifiedSessionId && {
          stripeCheckoutSessionId: verifiedSessionId,
          paymentStatus: PAYMENT_STATUS_CAPTURED,
          paymentCapturedAt: new Date()
        })
      };

      savedLead = await JobRequest.create(jobData);

      console.log('💾 Job saved:', requestId, '| ID:', savedLead._id);
      if (isDev) console.log(`[REQUESTS] ✓ DB save    | JobRequest _id=${savedLead._id}`);

      // Mark the PendingCheckout as consumed to prevent reuse
      if (verifiedSessionId) {
        try {
          await PendingCheckout.updateOne(
            { stripeCheckoutSessionId: verifiedSessionId },
            { $set: { consumed: true } }
          );
        } catch (consumeErr) {
          // Non-fatal — idempotency is also protected by the JobRequest unique check
          console.warn('⚠️ Failed to mark PendingCheckout as consumed:', consumeErr.message);
        }
      }

      // Send homeowner confirmation SMS
      if (smsConsent) {
        try {
          const hwResult = await sendHomeownerConfirmation(savedLead);
          if (hwResult.success) {
            console.log(`✅ Homeowner confirmation SMS sent (SID: ${hwResult.messageId})`);
          } else {
            console.log(`⚠️ Homeowner confirmation SMS skipped: ${hwResult.reason || hwResult.error}`);
          }
        } catch (hwErr) {
          console.error('❌ Homeowner confirmation SMS error:', hwErr.message);
        }
      }

      // Owner admin notification
      if (isUSPhoneNumber(phone)) {
        try {
          await notifyOwnerForLead(savedLead, {
            stage: requiresEstimateFee ? 'paid' : 'standard',
            amountPaidCents: requiresEstimateFee ? CHARLOTTE_ESTIMATE_FEE_AMOUNT_CENTS : 0
          });
        } catch (notifyErr) {
          console.error('❌ Owner notification error:', notifyErr.message);
        }
      }
    } else {
      if (isDev) console.log(`[REQUESTS] ⚠ DB save    | MongoDB not connected (readyState=${mongoose.connection.readyState}), skipping save`);
    }

    // ---------- Notify Pros ----------

    if (savedLead) {
      try {
        await routeLead(savedLead._id);
      } catch (routingError) {
        console.error('❌ Requests lead routing failed:', routingError.message);
      }
    }

    // ---------- Response ----------

    if (isDev) console.log(`[REQUESTS] ◄ Response   | 201 ok=true requestId=${requestId}`);
    return res.status(201).json({
      ok: true,
      success: true,
      requestId,
      message: requiresEstimateFee
        ? 'Your service request has been submitted successfully. A verified professional will contact you within 24 hours.'
        : 'Your free quote request has been submitted successfully. A professional will contact you soon.',
      data: {
        leadId: savedLead?._id || null
      }
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      if (isDev) console.log(`[REQUESTS] ✗ Response   | 400 ValidationError: ${err.message}`);
      return res.status(400).json({
        ok: false,
        error: err.message
      });
    }
    console.error('❌ Request error:', err.message);
    if (isDev) console.log(`[REQUESTS] ✗ Response   | 500 internal error`);
    return res.status(500).json({
      ok: false,
      error: 'Server error processing request'
    });
  }
});

// ---------- Apple Pay Attach Endpoint ----------

router.post('/:requestId/apple-pay', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { applePayToken, applePayTransactionId } = req.body;

    if (!applePayToken) {
      return res.status(400).json({ ok: false, error: 'Missing Apple Pay token' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ ok: false, error: 'Database unavailable' });
    }

    const job = await JobRequest.findOne({ requestId });
    if (!job) {
      return res.status(404).json({ ok: false, error: 'Request not found' });
    }

    job.paymentProvider = 'apple_pay';
    job.applePayToken = applePayToken;
    job.applePayTransactionId = applePayTransactionId;
    job.visitFeeAuthorized = true;

    await job.save();

    return res.json({
      ok: true,
      message: 'Apple Pay authorization attached',
      requestId
    });
  } catch (err) {
    console.error('❌ Apple Pay attach error:', err.message);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

module.exports = router;
