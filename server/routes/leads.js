const express = require('express');
const router = express.Router();
const JobRequest = require('../models/JobRequest');
const Pro = require('../models/Pro');
const { geocodeAddress } = require('../utils/geocode');

// Optional: Twilio SMS
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

function milesToMeters(mi) { return mi * 1609.344; }

// POST /api/leads - Save homeowner leads and notify professionals
router.post('/', async (req, res) => {
  try {
    console.log('📝 Lead submission received');
    
    const { 
      name, fullName, 
      email, 
      phone, 
      trade, service, 
      address, city,
      description,
      source,
      photoUrl
    } = req.body || {};
    
    // Handle field mapping from different client implementations
    const leadName = name || fullName;
    const leadTrade = trade || service;
    const leadAddress = address || city || '';  // Allow empty string as fallback
    
    // Validate required fields - address can be empty (geocoding will handle fallback)
    if (!leadName || !phone || !leadTrade) {
      return res.status(400).json({ 
        success: false,
        message: 'Name, phone, and trade/service are required' 
      });
    }

    // 1) Geocode the homeowner address with fallback
    let lat, lng, formatted;
    const addressToGeocode = leadAddress || 'United States'; // Fallback to US if no address provided
    
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
      formatted = leadAddress || 'Location not specified'; // Use original address or default
    }

    // 2) Save lead to database
    let savedLead = null;
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        // Normalize trade for consistency
        const normalizedTrade = leadTrade.charAt(0).toUpperCase() + leadTrade.slice(1).toLowerCase();
        
        savedLead = await JobRequest.create({
          name: leadName.trim(),
          email: email ? email.toLowerCase() : '',
          phone: phone.trim(),
          trade: normalizedTrade,
          address: leadAddress.trim(),
          description: description ? description.trim() : '',
          status: 'pending'
        });
        
        console.log('✅ Lead saved to database:', savedLead._id);
      } else {
        console.warn('⚠️ Database not connected, lead not saved');
      }
    } catch (dbError) {
      console.error('❌ Failed to save lead to database:', dbError.message);
      // Continue without failing the request
    }

    // 3) Query nearby pros (default 30 miles) with database fallback
    let pros = [];
    const radiusMiles = 30;
    const radiusMeters = milesToMeters(radiusMiles);

    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        // Use MongoDB $near with geospatial index on location
        pros = await Pro.find({
          trade: leadTrade.toLowerCase().trim(),
          wantsNotifications: true,
          isActive: true,
          location: {
            $near: {
              $geometry: { type: 'Point', coordinates: [lng, lat] },
              $maxDistance: radiusMeters
            }
          }
        }).limit(50); // safety cap
        
        console.log(`✅ Found ${pros.length} nearby pros for ${leadTrade}`);
      } else {
        console.warn('⚠️ Database not connected, cannot query for pros');
      }
    } catch (dbError) {
      console.error('❌ Database query failed:', dbError.message);
      // Continue with empty pros array
    }

    // 4) Fire-and-forget notify (SMS/email) – do not block response
    (async () => {
      if (twilioClient && pros.length && process.env.TWILIO_PHONE) {
        const msg = `FIXLO: New ${leadTrade} request near ${formatted}. ${leadName} (${phone}). "${description || 'No description provided'}"`;
        
        for (const pro of pros) {
          try {
            await twilioClient.messages.create({
              to: pro.phone,
              from: process.env.TWILIO_PHONE, // must be a valid Twilio number you own
              body: msg
            });
            console.log(`✅ SMS sent to pro: ${pro.phone}`);
          } catch (err) {
            console.error(`❌ Twilio SMS error to ${pro.phone}:`, err.message);
          }
        }
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
    })().catch(console.error);

    // 5) Return success response immediately
    return res.json({
      success: true,
      message: 'Lead received and processed successfully',
      data: {
        leadId: savedLead ? savedLead._id : null,
        matchedPros: pros.length,
        address: formatted,
        trade: leadTrade,
        notificationsSent: twilioClient && pros.length > 0
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