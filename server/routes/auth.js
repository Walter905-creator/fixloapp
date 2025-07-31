const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Pro = require("../models/Pro");

// ✅ Admin login endpoint
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Check against environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      console.error("❌ Admin credentials not configured in environment variables");
      return res.status(500).json({ error: "Admin system not configured" });
    }

    if (email !== adminEmail) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // For simplicity, compare password directly (in production, use bcrypt)
    if (password !== adminPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { email: adminEmail, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      token,
      admin: {
        email: adminEmail,
        role: "admin"
      }
    });

  } catch (error) {
    console.error("❌ Admin login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      password, 
      trade, 
      experience, 
      location 
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password || !trade || !location) {
      return res.status(400).json({ 
        success: false,
        message: 'All required fields must be provided' 
      });
    }

    // Check if MongoDB is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ Database not connected, cannot process registration');
      return res.status(503).json({ 
        success: false,
        message: 'Service temporarily unavailable. Please try again later.' 
      });
    }

    // Check if professional already exists (with timeout handling)
    let existingPro;
    try {
      existingPro = await Pro.findOne({ 
        $or: [{ email: email.toLowerCase() }, { phone }] 
      }).timeout(5000); // 5 second timeout
    } catch (dbError) {
      console.error('❌ Database query error:', dbError.message);
      return res.status(503).json({ 
        success: false,
        message: 'Service temporarily unavailable. Please try again later.' 
      });
    }

    if (existingPro) {
      return res.status(400).json({ 
        success: false,
        message: 'A professional with this email or phone number already exists' 
      });
    }

    // Validate trade is in allowed list
    const allowedTrades = [
      'plumbing', 'electrical', 'landscaping', 'cleaning', 'junk_removal',
      'handyman', 'hvac', 'painting', 'roofing', 'flooring', 'carpentry', 'appliance_repair'
    ];
    
    const normalizedTrade = trade.toLowerCase().replace(/[^a-z]/g, '_');
    if (!allowedTrades.includes(normalizedTrade)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid trade specified' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Basic location validation and geocoding
    const coordinates = [-74.006, 40.7128]; // Default to NYC coordinates
    // TODO: Implement proper geocoding service for production

    // Create new professional with proper schema compliance
    const newPro = new Pro({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: hashedPassword,
      trade: normalizedTrade,
      experience: experience === '0-2' ? 1 : experience === '3-5' ? 4 : experience === '6-10' ? 8 : 10,
      location: {
        type: 'Point',
        coordinates: coordinates,
        address: location.trim()
      },
      dob: new Date('1990-01-01'), // Default DOB - should be collected in form
      isActive: false, // Will be activated after successful payment
      paymentStatus: 'pending'
    });

    // Save the professional with timeout
    let savedPro;
    try {
      savedPro = await newPro.save({ timeout: 10000 }); // 10 second timeout
    } catch (saveError) {
      console.error('❌ Database save error:', saveError.message);
      if (saveError.code === 11000) {
        return res.status(400).json({ 
          success: false,
          message: 'Email or phone number already exists' 
        });
      }
      return res.status(503).json({ 
        success: false,
        message: 'Service temporarily unavailable. Please try again later.' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: savedPro._id, 
        email: savedPro.email, 
        role: 'professional' 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    console.log(`✅ Professional registered successfully: ${name} (${email}) - ${normalizedTrade}`);

    // Return success with user data for Stripe checkout
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        _id: savedPro._id,
        name: savedPro.name,
        email: savedPro.email,
        trade: savedPro.trade,
        paymentStatus: savedPro.paymentStatus
      },
      token
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    
    // Handle specific error types
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return res.status(503).json({ 
        success: false,
        message: 'Service temporarily unavailable. Please try again later.' 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'Email or phone number already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration' 
    });
  }
});

module.exports = router;
