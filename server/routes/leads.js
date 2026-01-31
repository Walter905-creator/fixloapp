const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const JobRequest = require('../models/JobRequest');
const Pro = require('../models/Pro');
const { geocodeAddress } = require('../utils/geocode');
const { sendSms, normalizeE164 } = require('../utils/twilio');
const { notifyProOfLead } = require('../utils/notifications');
const { sendHomeownerConfirmation } = require('../utils/smsSender');
const { getPriorityConfig, hasPriorityRouting, getDelayMs } = require('../config/priorityRouting');

function milesToMeters(mi) { return mi * 1609.344; }

/**
 * Validate E.164 phone format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid E.164 format
 */
function isValidE164(phone) {
  return /^\+\d{10,15}$/.test(phone);
}

// POST /api/leads - Save homeowner leads and notify professionals
router.post('/', async (req, res) => {
  try {
    console.log('📝 Lead submission received');
    
    const { 
      serviceType, 
      fullName, 
      phone, 
      email, 
      address, 
      description, 
      city, 
      state, 
      smsConsent,
      // Legacy field mappings
      name, 
      trade, 
      service
    } = req.body || {};
    
    // Handle field mapping from different client implementations
    const leadName = fullName || name;
    const leadTrade = serviceType || trade || service;
    const leadAddress = address || city || '';  // Allow empty string as fallback
    
    // Validate required fields
    if (!leadName || !phone || !leadTrade) {
      return res.status(400).json({ 
        success: false,
        message: 'Name, phone, and service type are required' 
      });
    }

    // 3️⃣ NORMALIZE PHONE TO E.164 (MANDATORY)
    // Validate phone number is in E.164 format (CRITICAL FOR TWILIO)
    if (!isValidE164(phone)) {
      console.error(`❌ Invalid phone format received: ${phone}`);
      return res.status(400).json({
        success: false,
        message: 'Phone number must be in E.164 format (+1XXXXXXXXXX)'
      });
    }

    // 2️⃣ BACKEND EMAIL SAFETY (ensure email is never undefined)
    const safeEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? email.toLowerCase()
      : `no-reply+${Date.now()}@fixloapp.com`;

    // Validate SMS consent if provided
    if (smsConsent === false) {
      return res.status(400).json({
        success: false,
        message: 'SMS consent is required to submit a service request'
      });
    }

    // 1) Geocode the homeowner address with fallback
    let lat, lng, formatted;
    const addressToGeocode = leadAddress || 'United States'; // Fallback to US if no address provided
    
    // 5️⃣ GUARD GEOCODING (DO NOT BREAK FLOW)
    let coords = null;
    try {
      if (typeof geocodeAddress === 'function') {
        const geocodeResult = await geocodeAddress(addressToGeocode);
        lat = geocodeResult.lat;
        lng = geocodeResult.lng; 
        formatted = geocodeResult.formatted;
        coords = { lat, lng };
        console.log('✅ Address geocoded:', formatted);
      }
    } catch (geocodeError) {
      console.warn('⚠️ Geocoding failed, using default coordinates:', geocodeError.message);
      // Fallback to center of US coordinates when geocoding is unavailable
      lat = 39.8283;
      lng = -98.5795;
      formatted = leadAddress || 'Location not specified'; // Use original address or default
    }

    // 2) Save lead to database
    let savedLead = null;
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        // Normalize trade for consistency
        const normalizedTrade = leadTrade.charAt(0).toUpperCase() + leadTrade.slice(1).toLowerCase();
        
        // 2️⃣ BACKEND EMAIL SAFETY (ensure email is never undefined)
        savedLead = await JobRequest.create({
          name: leadName.trim(),
          email: safeEmail, // Always has fallback
          phone: phone.trim(), // Already validated as E.164
          trade: normalizedTrade,
          address: leadAddress.trim(),
          description: description ? description.trim() : '',
          status: 'pending',
          location: { type: 'Point', coordinates: [lng, lat] },
          city: city || '',
          state: state || '',
          smsConsent: smsConsent === true // Explicit opt-in required for TCPA compliance
        });
        
        // 6️⃣ LOG CRITICAL EVENTS
        console.log('💾 Job saved:', savedLead._id);
        
        // Send homeowner confirmation SMS with idempotency protection
        try {
          const confirmationResult = await sendHomeownerConfirmation(savedLead);
          if (confirmationResult.success) {
            console.log(`✅ Homeowner confirmation SMS sent (SID: ${confirmationResult.messageId})`);
          } else {
            console.log(`⏭️ Homeowner confirmation SMS skipped: ${confirmationResult.reason}`);
          }
        } catch (confirmError) {
          // Don't fail lead submission if confirmation SMS fails
          console.error('❌ Homeowner confirmation SMS error:', confirmError.message);
        }
      } else {
        console.warn('⚠️ Database not connected, lead not saved');
      }
    } catch (dbError) {
      console.error('❌ Failed to save lead to database:', dbError.message);
      // Continue without failing the request
    }

    // 3) PRIORITY PRO ROUTING
    const priorityConfig = getPriorityConfig(city);
    
    if (priorityConfig && savedLead) {
      try {
        // Send priority SMS notification
        const priorityMessage = `Fixlo Priority Lead (${city}):
New homeowner service request received.
Service: ${leadTrade}
Location: ${leadAddress}
Reply ACCEPT to take this job first.`;
        
        // 4️⃣ FIX PRO NOTIFICATION NUMBER (already E.164 in config)
        // 6️⃣ LOG CRITICAL EVENTS
        console.log('📲 Sending SMS to:', priorityConfig.phone);
        await sendSms(priorityConfig.phone, priorityMessage);
        console.log('✅ Priority SMS sent to:', priorityConfig.phone);
        
        // Mark lead as priority notified
        if (mongoose.connection.readyState === 1) {
          await JobRequest.findByIdAndUpdate(savedLead._id, {
            priorityNotified: true,
            priorityPro: priorityConfig.name,
            priorityProPhone: priorityConfig.phone,
            priorityNotifiedAt: new Date()
          });
        }
        
        console.log(`🔔 Priority SMS sent to ${priorityConfig.name} for ${city} lead`);
      } catch (priorityError) {
        console.error('❌ Priority SMS notification failed:', priorityError.message);
        // Continue with normal flow even if priority notification fails
      }
    }

    // 4) Query nearby pros with configurable radius
    let pros = [];
    const radiusMiles = parseInt(process.env.LEAD_RADIUS_MILES) || 30;
    const radiusMeters = milesToMeters(radiusMiles);

    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        // Use MongoDB $near with geospatial index on location
        pros = await Pro.find({
          trade: leadTrade.toLowerCase().trim(),
          wantsNotifications: true,
          isActive: true,
          subscriptionStatus: { $ne: 'paused' }, // Exclude paused subscriptions
          location: {
            $near: {
              $geometry: { type: 'Point', coordinates: [lng, lat] },
              $maxDistance: radiusMeters
            }
          }
        }).limit(50); // safety cap
        
        console.log(`✅ Found ${pros.length} nearby pros for ${leadTrade} within ${radiusMiles} miles`);
      } else {
        console.warn('⚠️ Database not connected, cannot query for pros');
      }
    } catch (dbError) {
      console.error('❌ Database query failed:', dbError.message);
      // Continue with empty pros array
    }

    // 5) Notify matched professionals using new notification service
    let notified = 0;
    
    // For priority leads, delay other pro notifications to give priority pro time to respond
    if (priorityConfig && savedLead) {
      const delayMs = getDelayMs(city);
      console.log(`⏳ ${city} lead detected - scheduling delayed notification for other pros (${priorityConfig.delayMinutes} minutes)`);
      
      // Schedule delayed notification (non-blocking)
      setTimeout(async () => {
        try {
          // Check if job is still pending (not accepted by priority pro)
          if (mongoose.connection.readyState === 1) {
            const currentJob = await JobRequest.findById(savedLead._id);
            
            if (currentJob && currentJob.status === 'pending' && !currentJob.priorityAcceptedAt) {
              console.log(`⏰ Delayed notification: Notifying ${pros.length} other pros for ${city} lead ${savedLead._id}`);
              
              for (const pro of pros) {
                // Skip priority pro to avoid duplicate notifications
                if (normalizeE164(pro.phone) === normalizeE164(priorityConfig.phone)) {
                  continue;
                }
                
                try {
                  // Use new notification service with channel routing
                  await notifyProOfLead(pro, currentJob);
                  notified++;
                } catch (e) {
                  console.warn('Notification failed for', pro._id || pro.phone, e.message);
                }
              }
              console.log(`📱 Delayed notification completed for ${city} lead`);
            } else {
              console.log(`✅ Job already accepted by priority pro - skipping delayed notification`);
            }
          }
        } catch (delayedError) {
          console.error('❌ Delayed notification error:', delayedError.message);
        }
      }, delayMs);
    } else {
      // Normal immediate notification for non-priority leads using new notification service
      if (pros.length && savedLead) {
        console.log(`📢 Notifying ${pros.length} professionals using new notification service`);
        for (const pro of pros) {
          try {
            // Use new notification service with channel routing (SMS for US, WhatsApp for International)
            await notifyProOfLead(pro, savedLead);
            notified++;
          } catch (e) {
            console.warn('Notification failed for', pro._id || pro.phone, e.message);
          }
        }
        console.log(`📱 Notified ${notified}/${pros.length} professionals`);
      } else {
        console.warn('No nearby pros found or lead not saved — skipping notifications');
      }
    }

    // 6) Return success response immediately with 201 status
    return res.status(201).json({
      ok: true,
      success: true,
      message: 'Lead received and processed successfully',
      data: {
        leadId: savedLead ? savedLead._id : null,
        matchedPros: pros.length,
        notifiedCount: priorityConfig ? 0 : notified,
        notificationStatus: priorityConfig ? 'delayed' : 'immediate',
        priorityNotified: !!priorityConfig,
        address: formatted,
        serviceType: leadTrade,
        radiusMiles: radiusMiles
      }
    });

  } catch (err) {
    console.error('❌ Lead processing error:', err.message);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to process lead request',
      error: err.message 
    });
  }
});

// GET /api/leads - Retrieve leads (admin functionality)
router.get('/', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    const { status, trade, limit = 50, page = 1 } = req.query;
    
    // Build query filters
    const filters = {};
    if (status) filters.status = status;
    if (trade) filters.trade = new RegExp(trade, 'i'); // case-insensitive match

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const leads = await JobRequest.find(filters)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalCount = await JobRequest.countDocuments(filters);

    res.json({
      success: true,
      data: {
        leads,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (err) {
    console.error('❌ Error fetching leads:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch leads',
      error: err.message
    });
  }
});

// GET /api/leads/:id - Get specific lead
router.get('/:id', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    const lead = await JobRequest.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      data: lead
    });

  } catch (err) {
    console.error('❌ Error fetching lead:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch lead',
      error: err.message
    });
  }
});

// PUT /api/leads/:id - Update lead status
router.put('/:id', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    const { status } = req.body;
    const validStatuses = ['pending', 'assigned', 'completed', 'cancelled'];
    
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const updateData = {};
    if (status) updateData.status = status;

    const lead = await JobRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      message: 'Lead updated successfully',
      data: lead
    });

  } catch (err) {
    console.error('❌ Error updating lead:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update lead',
      error: err.message
    });
  }
});

module.exports = router;