const express = require('express');
const router = express.Router();


// Import models and utilities from existing leads route
const JobRequest = require('../models/JobRequest');
const Pro = require('../models/Pro');
const { geocodeAddress } = require('../utils/geocoding');

// Configuration constants
const VISIT_FEE_AMOUNT = parseInt(process.env.VISIT_FEE_AMOUNT) || 150; // in dollars
const VISIT_FEE_AMOUNT_CENTS = VISIT_FEE_AMOUNT * 100; // for Stripe (in cents)

/**
 * Validate E.164 phone format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid E.164 format
 */
function isValidE164(phone) {
  return /^\+\d{10,15}$/.test(phone);
}

// Optional: Twilio SMS
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// Initialize Stripe with validation
let stripe;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    // Enforce Live Mode in production
    if (process.env.NODE_ENV === "production" && !process.env.STRIPE_SECRET_KEY.startsWith("sk_live_")) {
      console.error("❌ SECURITY ERROR: Stripe LIVE secret key required in production");
      throw new Error("Stripe LIVE secret key required in production. Use sk_live_ keys only.");
    }
    
    // Validate test mode in non-production
    if (process.env.NODE_ENV !== "production" && !process.env.STRIPE_SECRET_KEY.startsWith("sk_test_")) {
      console.error("❌ SECURITY ERROR: Live Stripe key detected in non-production environment");
      throw new Error("Stripe live key detected in non-production environment. Use sk_test_ keys only.");
    }
    
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });
    console.log('✅ Stripe initialized in requests route:', process.env.STRIPE_SECRET_KEY.startsWith("sk_test_") ? "TEST MODE" : "LIVE MODE");
  } else {
    console.log('⚠️ STRIPE_SECRET_KEY not found in environment variables');
  }
} catch (error) {
  console.error('❌ Error initializing Stripe:', error.message);
  throw error;
}

function milesToMeters(mi) { return mi * 1609.344; }

// POST /api/requests - Standardized homeowner service request endpoint
router.post('/', async (req, res) => {
  try {
    console.info('📝 Service request received:', {
      serviceType: req.body.serviceType,
      city: req.body.city,
      state: req.body.state,
      timestamp: new Date().toISOString()
    });

    const { serviceType, fullName, phone, city, state, smsConsent, details } = req.body || {};
    
    // Validate required fields
    if (!serviceType || !fullName || !phone || !city || !state) {
      console.info('❌ Validation failed: Missing required fields');
      return res.status(400).send('Missing required fields: serviceType, fullName, phone, city, and state are required');
    }

    // Validate phone number is in E.164 format (CRITICAL FOR TWILIO)
    if (!isValidE164(phone)) {
      console.error(`❌ Invalid phone format received: ${phone}`);
      return res.status(400).json({
        success: false,
        message: 'Phone number must be in E.164 format (+1XXXXXXXXXX)'
      });
    }

    // Validate SMS consent
    if (typeof smsConsent !== 'boolean') {
      console.info('❌ Validation failed: smsConsent must be boolean');
      return res.status(400).send('SMS consent is required and must be true or false');
    }

    // Create a request ID
    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Log the validated request
    console.info('✅ Request validated:', {
      requestId,
      serviceType,
      fullName,
      phone: phone,
      city,
      state,
      smsConsent,
      details: details ? details.substring(0, 50) + '...' : 'none'
    });

    // 1) Geocode the homeowner address with fallback
    let lat, lng, formatted;
    const addressToGeocode = `${city}, ${state}`;
    
    try {
      const geocodeResult = await geocodeAddress(addressToGeocode);
      lat = geocodeResult.lat;
      lng = geocodeResult.lng; 
      formatted = geocodeResult.formatted;
      console.log('✅ Address geocoded:', formatted);
    } catch (geocodeError) {
      console.warn('⚠️ Geocoding failed, using default coordinates:', geocodeError.message);
      // Fallback to center of US coordinates when geocoding is unavailable
      lat = 39.8283;
      lng = -98.5795;
      formatted = addressToGeocode;
    }

    // 2) Save lead to database
    let savedLead = null;
    try {
      
      if (mongoose.connection.readyState === 1) {
        savedLead = await JobRequest.create({
          name: fullName.trim(),
          email: '', // Not required for this endpoint
          phone: phone,
          trade: serviceType,
          address: addressToGeocode.trim(),
          city: city.trim(),
          state: state.trim(),
          description: details ? details.trim() : '',
          status: 'pending',
          smsConsent: smsConsent,
          smsConsentAt: smsConsent ? new Date() : null,
          source: 'website',
          requestId: requestId
        });
        
        console.log('✅ Request saved to database:', savedLead._id);
        
        // Send SMS confirmation to customer
        if (smsConsent && savedLead) {
          try {
            const smsService = require('../services/smsService');
            await smsService.notifyRequestSubmitted(savedLead);
          } catch (smsError) {
            console.error('⚠️ SMS notification failed:', smsError.message);
          }
        }
      } else {
        console.warn('⚠️ Database not connected, proceeding without persistence');
      }
    } catch (dbError) {
      console.error('❌ Database save failed:', dbError.message);
      // Continue without failing the request
    }

    // 3) Query nearby pros (configurable radius) if SMS consent given
    let pros = [];
    let notificationsSent = 0;
    const radiusMiles = parseInt(process.env.LEAD_RADIUS_MILES) || 30;
    const radiusMeters = milesToMeters(radiusMiles);

    if (smsConsent) {
      try {
        
        if (mongoose.connection.readyState === 1) {
          // Use MongoDB $near with geospatial index on location
          pros = await Pro.find({
            trade: serviceType.toLowerCase().trim(),
            wantsNotifications: true,
            isActive: true,
            location: {
              $near: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: radiusMeters
              }
            }
          }).limit(50); // safety cap
          
          console.log(`✅ Found ${pros.length} nearby pros for ${serviceType}`);
        } else {
          console.warn('⚠️ Database not connected, cannot query for pros');
        }
      } catch (dbError) {
        console.error('❌ Database query failed:', dbError.message);
        // Continue with empty pros array
      }

      // 4) Send SMS notifications to matched pros (fire-and-forget)
      if (twilioClient && pros.length && process.env.TWILIO_PHONE) {
        const msg = `FIXLO: New ${serviceType} request near ${formatted}. ${fullName} (${phone}). "${details || 'No description provided'}"`;
        
        // Use async IIFE to not block response
        (async () => {
          for (const pro of pros) {
            try {
              await twilioClient.messages.create({
                to: pro.phone,
                from: process.env.TWILIO_PHONE,
                body: msg
              });
              console.log(`✅ SMS sent to pro: ${pro.phone}`);
              notificationsSent++;
            } catch (err) {
              console.error(`❌ Twilio SMS error to ${pro.phone}:`, err.message);
            }
          }
          console.info(`📱 SMS notifications completed: ${notificationsSent}/${pros.length} sent`);
        })().catch(console.error);
      } else {
        if (!twilioClient) {
          console.log('⚠️ Twilio not configured - SMS notifications disabled');
        }
        if (!pros.length) {
          console.log('⚠️ No nearby pros found for notifications');
        }
        if (!process.env.TWILIO_PHONE) {
          console.log('⚠️ TWILIO_PHONE not configured - SMS notifications disabled');
        }
      }
    } else {
      console.info('📵 SMS consent not given - skipping professional notifications');
    }

    // 5) Create Stripe PaymentIntent for payment authorization (linked to request)
    let clientSecret = null;
    let stripeCustomerId = null;
    
    if (stripe) {
      try {
        // Email is required for Stripe - use from request body
        const email = req.body.email;
        
        // Validate email exists before creating Stripe customer
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          console.warn('⚠️ Valid email required for Stripe payment authorization - skipping');
        } else {
          const customers = await stripe.customers.list({
            email: email,
            limit: 1
          });

          let customer;
          if (customers.data.length > 0) {
            customer = customers.data[0];
            console.log(`♻️ Using existing Stripe customer: ${customer.id}`);
          } else {
            customer = await stripe.customers.create({
              email: email,
              name: fullName,
              phone: phone,
              metadata: {
                source: 'fixlo-service-request',
                requestId: requestId
              }
            });
            console.log(`✅ Created new Stripe customer: ${customer.id}`);
          }
          
          stripeCustomerId = customer.id;

          // Create PaymentIntent with configurable authorization amount (will NOT be charged immediately)
          const paymentIntent = await stripe.paymentIntents.create({
            amount: VISIT_FEE_AMOUNT_CENTS, // Configurable amount in cents (authorization only)
            currency: 'usd',
            customer: customer.id,
            payment_method_types: ['card'],
            capture_method: 'manual', // Authorization only - must be captured manually later
            metadata: {
              requestId: requestId,
              serviceType: serviceType,
              customerName: fullName,
                customerPhone: phone,
              city: city,
              state: state,
              type: 'service-visit-authorization',
              source: 'fixlo-service-request',
              timestamp: new Date().toISOString()
            },
            description: `Fixlo Service Visit Authorization - ${serviceType} in ${city}, ${state}`
          });

          clientSecret = paymentIntent.client_secret;
          
          // Update saved lead with Stripe info
          if (savedLead) {
            savedLead.stripeCustomerId = stripeCustomerId;
            savedLead.stripePaymentIntentId = paymentIntent.id;
            await savedLead.save();
          }
          
          console.log(`✅ PaymentIntent created: ${paymentIntent.id} for request ${requestId}`);
        }
      } catch (stripeError) {
        console.error('❌ Stripe PaymentIntent creation failed:', stripeError.message);
        // Don't fail the request if Stripe fails - request is already created
        // Just log and continue without clientSecret
      }
    } else {
      console.warn('⚠️ Stripe not configured - skipping payment authorization');
    }

    // Return success response with requestId and clientSecret
    return res.status(201).json({ 
      ok: true, 
      requestId,
      clientSecret, // May be null if Stripe not configured or failed
      message: 'Request received successfully',
      data: {
        leadId: savedLead ? savedLead._id : null,
        matchedPros: pros.length,
        address: formatted,
        serviceType: serviceType,
        notificationsSent: smsConsent && twilioClient && pros.length > 0,
        stripeCustomerId: stripeCustomerId
      }
    });

  } catch (error) {
    console.error('❌ Request processing error:', error.message);
    return res.status(500).send('Server error processing request');
  }
});

module.exports = router;