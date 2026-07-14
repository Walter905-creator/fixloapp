const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Models & utils
const JobRequest = require('../models/JobRequest');
const Pro = require('../models/Pro');
const { geocodeAddress } = require('../utils/geocoding');
const { isUSPhoneNumber } = require('../utils/twilio');
const { sendOwnerNotification, sendHomeownerConfirmation, sendProLeadAlert } = require('../utils/smsSender');
const { routeLead } = require('../services/leadAssignmentService');
const { getPriorityConfig, getOwnerPhone } = require('../config/priorityRouting');
const { HOMEOWNER_REQUEST_PRICE_CENTS } = require('../config/pricing');
const { notify: ownerNotify } = require('../services/ownerNotificationService');

// Homeowner quote requests are free — no upfront charge
const HOMEOWNER_REQUEST_AMOUNT_CENTS = HOMEOWNER_REQUEST_PRICE_CENTS; // 0

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
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) console.log(`[REQUESTS] ► Incoming  | POST /api/requests`);

  try {
    const {
      serviceType,
      fullName,
      phone,
      city,
      state,
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
      if (isDev) console.log(`[REQUESTS] ► DB save    | Saving JobRequest to database`);
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
        source: 'website'
      };

      savedLead = await JobRequest.create(jobData);

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

      // Send owner notification for any USA lead
      if (isUSPhoneNumber(phone)) {
        try {
          console.log(`📢 Sending owner notification for USA lead`);
          const ownerResult = await sendOwnerNotification(getOwnerPhone(), savedLead);
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

      // Fire-and-forget owner email notification for service request
      ownerNotify('service_request', {
        service:       rawService,
        homeownerName: savedLead.name,
        email:         savedLead.email || 'N/A',
        phone:         savedLead.phone,
        city:          savedLead.city || city?.trim() || 'N/A',
        state:         savedLead.state || state?.trim() || 'N/A',
        requestedDate: savedLead.createdAt?.toISOString() || new Date().toISOString(),
        leadId:        String(savedLead._id)
      }).catch(() => {});
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
    // Homeowner quote requests are completely free — no payment required

    if (isDev) console.log(`[REQUESTS] ◄ Response   | 201 ok=true requestId=${requestId}`);
    return res.status(201).json({
      ok: true,
      success: true,
      requestId,
      message: 'Your free quote request has been submitted successfully. A professional will contact you soon.',
      data: {
        leadId: savedLead?._id || null
      }
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      if (process.env.NODE_ENV !== 'production') console.log(`[REQUESTS] ✗ Response   | 400 ValidationError: ${err.message}`);
      return res.status(400).json({
        ok: false,
        error: err.message
      });
    }
    console.error('❌ Request error:', err.message);
    if (process.env.NODE_ENV !== 'production') console.log(`[REQUESTS] ✗ Response   | 500 internal error`);
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
