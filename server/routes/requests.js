const express = require('express');
const router = express.Router();
const JobRequest = require('../models/JobRequest');
const Pro = require('../models/Pro');

// Optional: Twilio SMS
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

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

    if (typeof smsConsent !== 'boolean') {
      console.info('❌ Validation failed: smsConsent must be boolean');
      return res.status(400).send('SMS consent is required and must be true or false');
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/[^\d]/g, '');
    if (normalizedPhone.length < 10) {
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
  }
});

module.exports = router;