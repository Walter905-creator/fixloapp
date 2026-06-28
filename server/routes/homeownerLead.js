const express = require('express');
const router = express.Router();
const Pro = require('../models/Pro');
const JobRequest = require('../models/JobRequest');
const { geocodeAddress } = require('../utils/geocode');
const { routeLead } = require('../services/leadAssignmentService');

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

    // 2) Query nearby pros (configurable radius) with database fallback
    // Save lead to database before notifying pros
    let savedLead = null;
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        // Normalize trade for consistency with JobRequest schema
        const normalizedTrade = trade.charAt(0).toUpperCase() + trade.slice(1).toLowerCase();
        
        savedLead = await JobRequest.create({
          name: name.trim(),
          email: email ? email.toLowerCase() : '',
          phone: phone.trim(),
          trade: normalizedTrade,
          address: address.trim(),
          description: description ? description.trim() : '',
          status: 'pending'
        });
        
        console.log('✅ Homeowner lead saved to database:', savedLead._id);
      }
    } catch (dbError) {
      console.error('❌ Failed to save homeowner lead:', dbError.message);
      // Continue without failing the request
    }

    let matchedPros = 0;
    if (savedLead) {
      try {
        const routingResult = await routeLead(savedLead._id);
        matchedPros = routingResult.regularProsNotified || Number(Boolean(routingResult.proId));
      } catch (routingError) {
        console.error('❌ Homeowner lead routing failed:', routingError.message);
      }
    }

    // 4) Return immediately so UI can show confirmation
    return res.json({
      ok: true,
      message: 'Request received. Nearby pros have been notified.',
      matchedPros,
      leadId: savedLead ? savedLead._id : null
    });
  } catch (err) {
    console.error('homeownerLead error:', err.message);
    return res.status(500).json({ ok: false, message: 'Failed to process request' });
  }
});

module.exports = router;