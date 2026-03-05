const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Models & utils
const JobRequest = require('../models/JobRequest');
const Pro = require('../models/Pro');
const { geocodeAddress } = require('../utils/geocoding');
const { sendOwnerNotification, sendHomeownerConfirmation, sendProLeadAlert } = require('../utils/smsSender');
const { getPriorityConfig } = require('../config/priorityRouting');

// Constants
const VISIT_FEE_AMOUNT = parseInt(process.env.VISIT_FEE_AMOUNT || '150', 10);
const VISIT_FEE_AMOUNT_CENTS = VISIT_FEE_AMOUNT * 100;

// ---------- Helpers ----------

function milesToMeters(mi) {
  return mi * 1609.344;
}

function isValidE164(phone) {
  return /^\+\d{10,15}$/.test(phone);
}

function normalizeUSPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
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

router.post('/', async (req, res) => {
  try {
    const {
      serviceType,
      fullName,
      phone,
      city,
      state,
      smsConsent,
      details,
      paymentProvider = 'stripe',
      applePayToken
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
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields'
      });
    }

    const normalizedPhone = normalizeUSPhone(phone);
    if (!normalizedPhone || !isValidE164(normalizedPhone)) {
      return res.status(400).json({
        ok: false,
        error: 'Phone number must be in E.164 format (+1XXXXXXXXXX)'
      });
    }

    if (typeof smsConsent !== 'boolean') {
      return res.status(400).json({
        ok: false,
        error: 'smsConsent must be true or false'
      });
    }

    const requestId =
      'req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);

    // ---------- Geocoding ----------

    let lat = 39.8283;
    let lng = -98.5795;
    let formattedAddress = `${city}, ${state}`;

    // 5️⃣ GUARD GEOCODING (DO NOT BREAK FLOW)
    let coords = null;
    try {
      if (typeof geocodeAddress === 'function') {
        const geo = await geocodeAddress(formattedAddress);
        lat = geo.lat;
        lng = geo.lng;
        formattedAddress = geo.formatted;
        coords = { lat, lng };
      }
    } catch (e) {
      console.warn('⚠️ Geocoding failed, using default coordinates:', e.message);
    }

    // ---------- Save Job ----------

    let savedLead = null;

    if (mongoose.connection.readyState === 1) {
      // Log new service request for debugging
      console.log('New Fixlo service request:', { service: rawService, city, phone: normalizedPhone });

      // Save job (phone-first, no email required)
      const jobData = {
        requestId,
        name: fullName.trim(),
        phone: normalizedPhone,
        trade: rawService,
        address: formattedAddress,
        city: city.trim(),
        state: state.trim(),
        description: details?.trim() || 'No additional details provided',
        preferredTime: req.body.preferredTime?.trim() || '',
        status: 'pending',
        smsConsent,
        smsConsentAt: smsConsent ? new Date() : null,
        source: 'website',
        paymentProvider
      };

      savedLead = await JobRequest.create(jobData);

      // 6️⃣ LOG CRITICAL EVENTS
      console.log('💾 Job saved:', requestId, '| ID:', savedLead._id);

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

      // Send owner notification for Charlotte leads
      const priorityConfig = getPriorityConfig(city);
      if (priorityConfig) {
        try {
          console.log(`📢 Sending owner notification for ${city} lead`);
          const ownerResult = await sendOwnerNotification(priorityConfig.phone, savedLead);
          if (ownerResult.success) {
            console.log(`✅ Owner notification sent successfully (SID: ${ownerResult.messageId})`);
          } else {
            console.log(`⚠️ Owner notification skipped: ${ownerResult.reason || ownerResult.error}`);
          }
        } catch (ownerErr) {
          // Don't fail lead processing if owner notification fails
          console.error('❌ Owner notification error:', ownerErr.message);
        }
      }
    }

    // ---------- Notify Pros ----------

    let pros = [];
    const radiusMeters = milesToMeters(
      parseInt(process.env.LEAD_RADIUS_MILES || '30', 10)
    );

    if (smsConsent && mongoose.connection.readyState === 1) {
      pros = await Pro.find({
        trade: rawService,
        wantsNotifications: true,
        isActive: true,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: radiusMeters
          }
        }
      }).limit(50);

      if (pros.length) {
        // Send via sendProLeadAlert for proper consent checking, idempotency,
        // compliance logging, and language detection — works for ALL US cities.
        (async () => {
          for (const pro of pros) {
            try {
              await sendProLeadAlert(pro, savedLead);
            } catch (err) {
              console.error('❌ Pro lead alert failed for', pro._id, ':', err.message);
            }
          }
        })();
      }
    }

    // ---------- Stripe Authorization ----------

    let clientSecret = null;
    let stripeCustomerId = null;

    if (paymentProvider === 'stripe' && stripe && savedLead) {
      const customer = await stripe.customers.create({
        name: fullName,
        phone: normalizedPhone,
        metadata: { requestId }
      });

      stripeCustomerId = customer.id;

      const intent = await stripe.paymentIntents.create({
        amount: VISIT_FEE_AMOUNT_CENTS,
        currency: 'usd',
        customer: customer.id,
        capture_method: 'manual',
        payment_method_types: ['card'],
        metadata: {
          requestId,
          serviceType,
          city,
          state
        }
      });

      clientSecret = intent.client_secret;

      savedLead.stripeCustomerId = customer.id;
      savedLead.stripePaymentIntentId = intent.id;
      await savedLead.save();
    }

    // ---------- Apple Pay ----------

    if (paymentProvider === 'apple_pay' && applePayToken && savedLead) {
      savedLead.visitFeeAuthorized = true;
      savedLead.applePayToken = applePayToken;
      await savedLead.save();
    }

    // ---------- Response ----------

    return res.status(201).json({
      ok: true,
      success: true,
      requestId,
      clientSecret,
      message: 'Request submitted successfully',
      data: {
        leadId: savedLead?._id || null,
        matchedPros: pros.length
      }
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        ok: false,
        error: err.message
      });
    }
    console.error('❌ Request error:', err.message);
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
