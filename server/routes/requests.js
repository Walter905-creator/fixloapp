const express = require('express');
const router = express.Router();

// Import models and utilities from existing leads route
const JobRequest = require('../models/JobRequest');
const Pro = require('../models/Pro');
const { geocodeAddress } = require('../utils/geocoding');

// Optional: Twilio SMS
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

function milesToMeters(mi) { return mi * 1609.344; }

// POST /api/requests - Create homeowner service request
router.post('/', async (req, res) => {
  try {
    console.info('📝 Service request received:', {
      serviceType: req.body?.serviceType,
      city: req.body?.city,
      state: req.body?.state,
      timestamp: new Date().toISOString()
    });

    const { serviceType, fullName, phone, city, state, smsConsent, details } = req.body || {};
    
    // Validate required fields
    if (!serviceType || !fullName || !phone || !city || !state) {
      console.info('❌ Validation failed: missing required fields');
      return res.status(400).send('Missing required fields: serviceType, fullName, phone, city, state are required');
    }

    // Validate SMS consent
    if (!smsConsent) {
      console.info('❌ Validation failed: SMS consent required');
      return res.status(400).send('SMS consent is required to submit a request');
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/[^\d]/g, '');
    if (normalizedPhone.length < 10) {
      console.info('❌ Validation failed: invalid phone number');
      return res.status(400).send('Invalid phone number - must be at least 10 digits');
    }

    // Create a request ID for tracking
    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Log the validated request
    console.info('✅ Request validated:', {
      requestId,
      serviceType,
      fullName,
      phone: normalizedPhone,
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
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        savedLead = await JobRequest.create({
          name: fullName.trim(),
          email: '', // Not required for this endpoint
          phone: normalizedPhone,
          trade: serviceType,
          address: addressToGeocode.trim(),
          description: details ? details.trim() : '',
          status: 'pending'
        });
        
        console.log('✅ Request saved to database:', savedLead._id);
      } else {
        console.warn('⚠️ Database not connected, request not saved');
      }
    } catch (dbError) {
      console.error('❌ Failed to save request to database:', dbError.message);
      // Continue without failing the request
    }

    // 3) Query nearby pros (default 30 miles) if SMS consent given
    let pros = [];
    let notificationsSent = 0;
    const radiusMiles = 30;
    const radiusMeters = milesToMeters(radiusMiles);

    if (smsConsent) {
      try {
        const mongoose = require('mongoose');
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
        const msg = `FIXLO: New ${serviceType} request near ${formatted}. ${fullName} (${normalizedPhone}). "${details || 'No description provided'}"`;
        
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

    // Return success response immediately
    return res.status(201).json({ 
      ok: true, 
      requestId,
      message: 'Request received successfully',
      data: {
        leadId: savedLead ? savedLead._id : null,
        matchedPros: pros.length,
        address: formatted,
        serviceType: serviceType,
        notificationsSent: smsConsent && twilioClient && pros.length > 0
      }
    });

  } catch (error) {
    console.error('❌ Request processing error:', error.message);
    return res.status(500).send('Server error processing request');
  }
});

module.exports = router;