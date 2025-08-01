// server/routes/homeownerLead.js
const router = require('express').Router();
const Pro = require('../models/Pro');
const JobRequest = require('../models/JobRequest');
const twilio = require('twilio');
const client = process.env.TWILIO_ACCOUNT_SID ? 
    twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;

router.post('/', async (req, res) => {
  const { name, email, phone, address, description, service } = req.body;
  
  // Validate required fields
  if (!name || !phone || !address || !description || !service) {
    return res.status(400).json({ 
      success: false, 
      message: "All fields are required." 
    });
  }

  try {
    // Save to DB if available
    let requestDoc = null;
    if (process.env.MONGO_URI) {
      try {
        requestDoc = new JobRequest({ 
          trade: service, 
          name, 
          email, 
          phone, 
          address, 
          description 
        });
        await requestDoc.save();
        console.log(`✅ JobRequest saved to database: ${requestDoc._id}`);
      } catch (dbError) {
        console.log(`⚠️ Database save failed, continuing without database: ${dbError.message}`);
      }
    } else {
      console.log(`📝 No MONGO_URI provided - logging request instead of saving`);
    }

    // Notify professionals (SMS) if Twilio is configured
    if (client) {
      try {
        const pros = await Pro.find({ wantsNotifications: true, trade: service });
        for (let pro of pros) {
          await client.messages.create({
            from: process.env.TWILIO_PHONE,
            to: pro.phone,
            body: `🔔 New ${service} job: ${name} at ${address}. Contact: ${phone}`
          }).catch(err => console.error("SMS send failed:", err));
        }
      } catch (err) {
        console.error("❌ Error finding professionals or sending SMS:", err);
      }
    }

    console.log(`✅ New ${service} request from ${name} saved/processed.`);
    return res.json({ 
      success: true, 
      message: "Service request received!" 
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