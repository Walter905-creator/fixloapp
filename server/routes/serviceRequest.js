// server/routes/serviceRequest.js
const router = require('express').Router();
const Pro = require('../models/Pro');
const JobRequest = require('../models/JobRequest');
const { routeLead } = require('../services/leadAssignmentService');
const twilio = require('twilio');
const client = process.env.TWILIO_ACCOUNT_SID ?
    twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;

/**
 * Build a normalized address string from explicit address field or
 * from city/state/zipCode components.
 */
function buildAddress(body) {
  if (body.address && String(body.address).trim()) {
    return String(body.address).trim();
  }
  return [body.city, body.state, body.zipCode]
    .map(v => String(v || '').trim())
    .filter(Boolean)
    .join(', ');
}

router.post('/', async (req, res) => {
  // Normalize field names — accept both legacy and canonical field names
  const serviceType = String(req.body.serviceType || req.body.trade || req.body.service || '').trim();
  const name = String(req.body.name || req.body.fullName || '').trim();
  const phone = String(req.body.phone || '').trim();
  const email = String(req.body.email || '').trim();
  const description = String(req.body.description || req.body.details || '').trim();
  const address = buildAddress(req.body);
  const city = String(req.body.city || '').trim();
  const state = String(req.body.state || '').trim();
  const zipCode = String(req.body.zipCode || req.body.zip || '').trim();
  const urgency = String(req.body.urgency || 'Flexible');
  const source = String(req.body.source || 'website');

  // Validate required fields after normalization
  if (!serviceType || !name || !phone || !address || !description) {
    return res.status(400).json({
      success: false,
      message: 'Service type, name, phone, address, and description are required.'
    });
  }

  try {
    // Save to DB if available
    let requestDoc = null;
    if (process.env.MONGODB_URI) {
      try {
        requestDoc = new JobRequest({
          trade: serviceType,
          name,
          email: email || '',
          phone,
          address,
          city,
          state,
          zip: zipCode,
          description,
          urgency,
          source
        });
        await requestDoc.save();
        console.log(`✅ Service request saved to database: ${requestDoc._id}`);
      } catch (dbError) {
        console.error(`❌ Database save failed: ${dbError.message}`);
        return res.status(500).json({
          success: false,
          message: 'Unable to save your request. Please try again or contact support if the problem persists.'
        });
      }
    } else {
      console.log(`📝 No MONGODB_URI provided - logging request instead of saving`);
    }

    if (requestDoc) {
      try {
        await routeLead(requestDoc._id);
      } catch (routingError) {
        console.error('❌ Lead routing failed:', routingError.message);
      }
    } else if (client) {
      try {
        // serviceType is cast to string above; query uses exact equality (no regex)
        const pros = await Pro.find({ wantsNotifications: true, trade: serviceType });
        for (const pro of pros) {
          await client.messages.create({
            from: process.env.TWILIO_PHONE,
            to: pro.phone,
            body: `🔔 New ${serviceType} job: ${name} at ${address}. Contact: ${phone}`
          }).catch(err => console.error('SMS send failed:', err));
        }
      } catch (err) {
        console.error('❌ Error finding professionals or sending SMS:', err);
      }
    }

    console.log(`✅ New ${serviceType} request from ${name} processed successfully.`);
    return res.status(201).json({
      success: true,
      message: 'Service request received successfully!',
      requestId: requestDoc?._id?.toString()
    });

  } catch (err) {
    console.error('❌ Error handling service request:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error processing request'
    });
  }
});

module.exports = router;
