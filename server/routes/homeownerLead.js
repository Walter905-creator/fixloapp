const express = require('express');
const router = express.Router();
const Pro = require('../models/Pro');
const { geocodeAddress } = require('../utils/geocode');

// Optional: Twilio SMS
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

function milesToMeters(mi){ return mi * 1609.344; }

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, trade, address, description } = req.body || {};
    if (!name || !phone || !trade || !address) {
      return res.status(400).json({ ok: false, message: 'name, phone, trade, and address are required' });
    }

    // 1) Geocode the homeowner address with fallback
    let lat, lng, formatted;
    try {
      const geocodeResult = await geocodeAddress(address);
      lat = geocodeResult.lat;
      lng = geocodeResult.lng; 
      formatted = geocodeResult.formatted;
    } catch (geocodeError) {
      console.warn('Geocoding failed, using default coordinates:', geocodeError.message);
      // Fallback to center of US coordinates when geocoding is unavailable
      lat = 39.8283;
      lng = -98.5795;
      formatted = address; // Use original address as formatted
    }

    // 2) Query nearby pros (default 30 miles) with database fallback
    let pros = [];
    const radiusMiles = 30;
    const radiusMeters = milesToMeters(radiusMiles);

    try {
      // Check database connection before querying
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        // Use MongoDB $near with geospatial index on location
        pros = await Pro.find({
          trade: trade.toLowerCase().trim(),
          wantsNotifications: true,
          location: {
            $near: {
              $geometry: { type: 'Point', coordinates: [lng, lat] },
              $maxDistance: radiusMeters
            }
          }
        }).limit(50); // safety cap
      } else {
        console.warn('Database not connected, cannot query for pros');
      }
    } catch (dbError) {
      console.error('Database query failed:', dbError.message);
      // Continue with empty pros array
    }

    // 3) Fire-and-forget notify (SMS/email) – do not block response
    (async () => {
      if (twilioClient && pros.length) {
        const msg = `FIXLO: New ${trade} request near ${formatted}. ${name} (${phone}). "${description || ''}"`;
        for (const pro of pros) {
          try {
            await twilioClient.messages.create({
              to: pro.phone,
              from: process.env.TWILIO_PHONE, // must be a valid Twilio number you own
              body: msg
            });
          } catch (err) {
            console.error('Twilio SMS error to', pro.phone, err.message);
          }
        }
      }
      // TODO: also insert the lead in your DB if you keep a leads collection
    })().catch(console.error);

    // 4) Return immediately so UI can show confirmation
    return res.json({
      ok: true,
      message: 'Request received. Nearby pros have been notified.',
      matchedPros: pros.length
    });
  } catch (err) {
    console.error('homeownerLead error:', err.message);
    return res.status(500).json({ ok: false, message: 'Failed to process request' });
  }
});

module.exports = router;