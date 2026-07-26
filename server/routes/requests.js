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

const REQUEST_TYPE_HOMEOWNER_SERVICE_REQUEST_FEE = 'homeowner_service_request_fee';

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

function buildPendingCheckoutFormData(payload = {}) {
  return {
    serviceType: String(payload.serviceType || payload.trade || payload.service || '').trim(),
    fullName: String(payload.fullName || payload.name || '').trim(),
    phone: String(payload.phone || '').trim(),
    email: String(payload.email || '').trim(),
    address: String(payload.address || '').trim(),
    city: String(payload.city || '').trim(),
    state: String(payload.state || '').trim(),
    zipCode: String(payload.zipCode || payload.zip || '').trim(),
    details: String(payload.details || payload.description || '').trim(),
    urgency: String(payload.urgency || '').trim(),
    smsConsent: Boolean(payload.smsConsent)
  };
}

function buildClientUrl() {
  return process.env.CLIENT_URL || 'https://fixloapp.com';
}

function normalizeSessionId(sessionId) {
  return String(sessionId || '').trim();
}

function isValidCharlotteCheckoutSession(checkoutSession) {
  const paid = checkoutSession?.payment_status === 'paid';
  const requestType = checkoutSession?.metadata?.requestType;
  const correctAmount = Number(checkoutSession?.amount_total || 0) === CHARLOTTE_ESTIMATE_FEE_AMOUNT_CENTS;
  const correctCurrency = String(checkoutSession?.currency || '').toLowerCase() === 'usd';
  return paid
    && requestType === REQUEST_TYPE_HOMEOWNER_SERVICE_REQUEST_FEE
    && correctAmount
    && correctCurrency;
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

// ---------- POST /api/requests ----------

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

const createCharlotteCheckoutSession = async (req, res) => {
  try {
    const {
      address,
      city,
      state,
      zipCode,
      coordinates
    } = req.body || {};

    console.log('[create-checkout] Received payload:', {
      address: address || '(empty)',
      city: city || '(empty)',
      state: state || '(empty)',
      zip: zipCode || '(empty)',
      coordinates: coordinates || null
    });

    const eligibility = await evaluateCharlotteEstimateFeeEligibility({
      address,
      city,
      state,
      zip: zipCode,
      coordinates
    });

    console.log('[create-checkout] Eligibility result:', eligibility);

    const requiresEstimateFee = eligibility.eligible && CHARLOTTE_ESTIMATE_FEE_ENABLED;
    if (!requiresEstimateFee) {
      console.warn('[create-checkout] Rejected — eligible:', eligibility.eligible,
        '| CHARLOTTE_ESTIMATE_FEE_ENABLED:', CHARLOTTE_ESTIMATE_FEE_ENABLED,
        '| reason:', eligibility.reason,
        '| distanceMiles:', eligibility.distanceMiles ?? 'n/a');
      return res.status(400).json({
        ok: false,
        error: 'This request is not in the Charlotte service area, so the $75 Service Request Fee checkout is not required.'
      });
    }

    if (!stripe) {
      return res.status(503).json({
        ok: false,
        error: 'Service Request Fee payments are temporarily unavailable'
      });
    }

    const clientUrl = buildClientUrl();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: CHARLOTTE_ESTIMATE_FEE_AMOUNT_CENTS,
            product_data: {
              name: 'Service Request Fee'
            }
          },
          quantity: 1
        }
      ],
      success_url: `${clientUrl}/request?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/request?payment=cancelled`,
      metadata: {
        requestType: REQUEST_TYPE_HOMEOWNER_SERVICE_REQUEST_FEE,
        city: String(city || ''),
        state: String(state || ''),
        zipCode: String(zipCode || '')
      }
    });

    if (mongoose.connection.readyState === 1) {
      const formData = buildPendingCheckoutFormData(req.body);
      await PendingCheckout.findOneAndUpdate(
        { stripeCheckoutSessionId: session.id },
        {
          $set: {
            stripeCheckoutSessionId: session.id,
            formData,
            consumed: false,
            createdAt: new Date()
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    return res.status(200).json({
      ok: true,
      data: {
        checkoutUrl: session.url,
        sessionId: session.id,
        estimateFeeAmountCents: CHARLOTTE_ESTIMATE_FEE_AMOUNT_CENTS
      }
    });
  } catch (error) {
    console.error('❌ Checkout session creation error:', error.message);
    return res.status(500).json({ ok: false, error: 'Unable to create checkout session' });
  }
};

router.post('/checkout-session', createCharlotteCheckoutSession);
router.post('/create-checkout', createCharlotteCheckoutSession);

router.get('/verify-checkout/:sessionId', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        ok: false,
        error: 'Service Request Fee payments are temporarily unavailable'
      });
    }

    const sessionId = normalizeSessionId(req.params.sessionId);
    if (!sessionId) {
      return res.status(400).json({
        ok: false,
        error: 'Missing checkout session id'
      });
    }

    let checkoutSession;
    try {
      checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (error) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid payment session'
      });
    }

    const paymentStatus = String(checkoutSession?.payment_status || '');
    const paid = isValidCharlotteCheckoutSession(checkoutSession);
    let pendingCheckout = null;

    if (mongoose.connection.readyState === 1) {
      pendingCheckout = await PendingCheckout.findOne({ stripeCheckoutSessionId: sessionId }).lean();
    }

    if (!pendingCheckout) {
      return res.status(400).json({
        ok: false,
        error: 'Payment session not found for request draft.'
      });
    }

    if (pendingCheckout?.consumed) {
      return res.status(409).json({
        ok: false,
        error: 'This payment session has already been used for a submitted request.'
      });
    }

    if (!paid) {
      return res.status(402).json({
        ok: false,
        requiresPayment: true,
        error: 'Payment has not been completed for this session.'
      });
    }

    return res.json({
      ok: true,
      data: {
        sessionId,
        paid,
        paymentStatus,
        amountTotal: Number(checkoutSession?.amount_total || 0),
        currency: String(checkoutSession?.currency || '').toLowerCase(),
        consumed: Boolean(pendingCheckout?.consumed),
        formData: pendingCheckout?.formData || null
      }
    });
  } catch (error) {
    console.error('❌ Verify checkout session error:', error.message);
    return res.status(500).json({ ok: false, error: 'Unable to verify checkout session' });
  }
});

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
      stripeCheckoutSessionId,
      smsConsent,
      details
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

    // 5️⃣ GUARD GEOCODING (DO NOT BREAK FLOW)
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
    const serviceRequestFeeDollars = Number((CHARLOTTE_ESTIMATE_FEE_AMOUNT_CENTS / 100).toFixed(0));

    let verifiedCheckoutSessionId = '';
    if (requiresEstimateFee) {
      if (!stripe) {
        return res.status(503).json({
          ok: false,
          error: 'Service Request Fee payments are temporarily unavailable'
        });
      }

      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          ok: false,
          error: 'Database unavailable for payment verification. Please try again in a moment.'
        });
      }

      const sessionId = normalizeSessionId(stripeCheckoutSessionId);
      if (!sessionId) {
        return res.status(402).json({
          ok: false,
          requiresPayment: true,
          error: `A verified $${serviceRequestFeeDollars} Service Request Fee payment is required before submission.`
        });
      }

      const existingPaidLead = await JobRequest.findOne({
        stripeCheckoutSessionId: sessionId,
        paymentStatus: 'captured'
      }).select('_id');
      if (existingPaidLead) {
        return res.status(409).json({
          ok: false,
          error: 'This payment session has already been used for a submitted request. Please submit a new request or contact support if this seems incorrect.'
        });
      }

      const pendingCheckoutDoc = await PendingCheckout.findOne({
        stripeCheckoutSessionId: sessionId
      });
      if (!pendingCheckoutDoc) {
        return res.status(400).json({
          ok: false,
          error: 'Payment session was not started from Fixlo request flow. Please restart checkout from the request form.'
        });
      }

      if (pendingCheckoutDoc.consumed) {
        return res.status(409).json({
          ok: false,
          error: 'This payment session has already been used for a submitted request. Please submit a new request or contact support if this seems incorrect.'
        });
      }

      let checkoutSession;
      try {
        checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
      } catch (sessionError) {
        return res.status(400).json({
          ok: false,
          error: 'Invalid payment session. Please complete payment again.'
        });
      }

      const paid = isValidCharlotteCheckoutSession(checkoutSession);
      if (!paid) {
        return res.status(402).json({
          ok: false,
          requiresPayment: true,
          error: `Payment verification failed. Please complete the $${serviceRequestFeeDollars} Service Request Fee to continue.`
        });
      }

      verifiedCheckoutSessionId = sessionId;
    }

    // ---------- Save Job ----------

    let savedLead = null;

    if (mongoose.connection.readyState === 1) {
      if (isDev) console.log(`[REQUESTS] ► DB save    | Saving JobRequest to database`);
      // Log new service request for debugging
      console.log('New Fixlo service request:', { service: rawService, city, phone: normalizedPhone });

      // Save job (phone-first, no email required)
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
        stripeCheckoutSessionId: verifiedCheckoutSessionId || undefined,
        paymentStatus: requiresEstimateFee ? 'captured' : 'none',
        paymentCapturedAt: requiresEstimateFee ? new Date() : undefined,
        ownerSmsStatus: 'pending',
        ownerEmailStatus: 'pending'
      };

      savedLead = await JobRequest.create(jobData);

      if (requiresEstimateFee && verifiedCheckoutSessionId) {
        await PendingCheckout.updateOne(
          { stripeCheckoutSessionId: verifiedCheckoutSessionId, consumed: false },
          { $set: { consumed: true } }
        );
      }

      // 6️⃣ LOG CRITICAL EVENTS
      console.log('💾 Job saved:', requestId, '| ID:', savedLead._id);
      if (isDev) console.log(`[REQUESTS] ✓ DB save    | JobRequest _id=${savedLead._id}`);

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

      // Owner admin notification for all successfully-created requests
      if (!savedLead.estimateFeeRequired && isUSPhoneNumber(phone)) {
        await notifyOwnerForLead(savedLead, {
          stage: 'standard',
          amountPaidCents: 0
        });
      } else if (savedLead.estimateFeeRequired && isUSPhoneNumber(phone)) {
        await notifyOwnerForLead(savedLead, {
          stage: 'paid',
          amountPaidCents: savedLead.estimateFeeAmountCents || 0
        });
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

    if (isDev) console.log(`[REQUESTS] ◄ Response   | 201 ok=true requestId=${requestId}`);
    return res.status(201).json({
      ok: true,
      success: true,
      requestId,
      message: savedLead?.estimateFeeRequired
        ? 'Your request has been received and will be routed after payment confirmation.'
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
