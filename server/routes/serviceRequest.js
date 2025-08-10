// server/routes/serviceRequest.js
const router = require('express').Router();
const Pro = require('../models/Pro');
const JobRequest = require('../models/JobRequest');
const twilio = require('twilio');
const client = process.env.TWILIO_ACCOUNT_SID ? 
    twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;

router.post('/', async (req, res) => {
  const { serviceType, name, phone, email, address, description, urgency } = req.body;
  
  // Validate required fields
  if (!serviceType || !name || !phone || !address || !description) {
    return res.status(400).json({ 
      success: false, 
      message: "Service type, name, phone, address, and description are required." 
    });
  }

  try {
    // Save to DB if available
    let requestDoc = null;
    if (process.env.MONGO_URI) {
      try {
        requestDoc = new JobRequest({ 
          trade: serviceType, // Map serviceType to trade
          name, 
          email: email || '', // Email is optional
          phone, 
          address, 
          description,
          urgency: urgency || 'medium'
        });
        await requestDoc.save();
        console.log(`✅ Service request saved to database: ${requestDoc._id}`);
      } catch (dbError) {
        console.log(`⚠️ Database save failed, continuing without database: ${dbError.message}`);
      }
    } else {
      console.log(`📝 No MONGO_URI provided - logging request instead of saving`);
    }

    // Notify professionals (SMS) if Twilio is configured
    if (client) {
      try {
        const pros = await Pro.find({ wantsNotifications: true, trade: serviceType });
        for (let pro of pros) {
          await client.messages.create({
            from: process.env.TWILIO_PHONE,
            to: pro.phone,
            body: `🔔 New ${serviceType} job: ${name} at ${address}. Contact: ${phone}`
          }).catch(err => console.error("SMS send failed:", err));
        }
      } catch (err) {
        console.error("❌ Error finding professionals or sending SMS:", err);
      }
    }

    console.log(`✅ New ${serviceType} request from ${name} processed successfully.`);
    return res.json({ 
      success: true, 
      message: "Service request received successfully!" 
    });

  } catch (err) {
    console.error("❌ Error handling service request:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error processing request" 
    });
  }
});

module.exports = router;