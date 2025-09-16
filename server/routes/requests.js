const express = require('express');
const router = express.Router();


// Import models and utilities from existing leads route
const JobRequest = require('../models/JobRequest');
const Pro = require('../models/Pro');
const { geocodeAddress } = require('../utils/geocoding');

const JobRequest = require('../models/JobRequest');
const Pro = require('../models/Pro');
 main

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

// POST /api/requests - Standardized homeowner service request endpoint
router.post('/', async (req, res) => {
  try {
    console.info('📝 Service request received:', {
      serviceType: req.body.serviceType,
      city: req.body.city,
      state: req.body.state,
 main
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

      console.info('❌ Validation failed: Missing required fields');
      return res.status(400).send('Missing required fields: serviceType, fullName, phone, city, and state are required');
    }

    if (typeof smsConsent !== 'boolean') {
      console.info('❌ Validation failed: smsConsent must be boolean');
      return res.status(400).send('SMS consent is required and must be true or false');
 main
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

      console.info('❌ Validation failed: Invalid phone number');
      return res.status(400).send('Invalid phone number - must be at least 10 digits');
    }

    // Create a request ID
    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

    // Save to database if available
    let savedRequest = null;
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        savedRequest = await JobRequest.create({
          name: fullName.trim(),
          phone: normalizedPhone,
          trade: serviceType.charAt(0).toUpperCase() + serviceType.slice(1).toLowerCase(),
          address: `${city.trim()}, ${state.trim()}`,
          description: details ? details.trim() : '',
          status: 'pending',
          smsConsent: smsConsent,
          source: 'website',
          requestId: requestId
        });
        
        console.info('✅ Request saved to database:', savedRequest._id);
      } else {
        console.warn('⚠️ Database not connected, proceeding without persistence');
      }
    } catch (dbError) {
      console.error('❌ Database save failed:', dbError.message);
      // Continue without failing the request
    }

    // Notify professionals via SMS only if smsConsent is true
    let notifiedCount = 0;
    if (smsConsent && twilioClient && process.env.TWILIO_PHONE) {
      try {
        // Find matching professionals within 30 miles (simplified - using city/state match for now)
        const matchingPros = await Pro.find({
          wantsNotifications: true,
          trade: { $regex: new RegExp(serviceType, 'i') },
          // Simplified location matching - in production, use proper geo-queries
          $or: [
            { city: { $regex: new RegExp(city, 'i') } },
            { address: { $regex: new RegExp(city, 'i') } }
          ]
        }).limit(10); // Limit to 10 pros to avoid spam

        console.info(`🔍 Found ${matchingPros.length} matching professionals`);

        // Send SMS to each matching professional
        const smsPromises = matchingPros.map(async (pro) => {
          try {
            const message = `🔔 New ${serviceType} request in ${city}, ${state}. Contact: ${fullName} (${phone})${details ? `. Details: ${details.substring(0, 100)}${details.length > 100 ? '...' : ''}` : ''}. Reply STOP to opt out.`;
            
            await twilioClient.messages.create({
              to: pro.phone,
              from: process.env.TWILIO_PHONE,
              body: message
            });
            
            console.info(`✅ SMS sent to pro: ${pro.phone}`);
            return { success: true, phone: pro.phone };
          } catch (smsError) {
            console.error(`❌ SMS failed to ${pro.phone}:`, smsError.message);
            return { success: false, phone: pro.phone, error: smsError.message };
          }
        });

        const smsResults = await Promise.allSettled(smsPromises);
        notifiedCount = smsResults.filter(result => 
          result.status === 'fulfilled' && result.value.success
        ).length;

        console.info(`📱 SMS notification summary: ${notifiedCount}/${matchingPros.length} successful`);
        
      } catch (proError) {
        console.error('❌ Professional notification error:', proError.message);
        // Don't fail the request due to notification errors
      }
    } else {
      if (!smsConsent) {
        console.info('📵 SMS notifications skipped: User did not consent');
      } else if (!twilioClient) {
        console.warn('⚠️ Twilio not configured - SMS notifications disabled');
      } else if (!process.env.TWILIO_PHONE) {
        console.warn('⚠️ TWILIO_PHONE not configured - SMS notifications disabled');
      }
    }

    // Always return success regardless of SMS outcomes
    console.info('✅ Service request processed successfully:', {
      requestId: requestId,
      notifiedPros: notifiedCount,
      smsConsent: smsConsent
    });

    return res.status(201).json({ 
      ok: true, 
      requestId: requestId,
      notified: notifiedCount
    });

  } catch (error) {
    console.error('❌ Service request processing error:', error.message);
    return res.status(500).send('Server error processing your request. Please try again.');
 main
  }
});

module.exports = router;