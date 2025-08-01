const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Pro = require("../models/Pro");
const mongoose = require("mongoose");

// ✅ Admin login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if (!adminEmail || !adminPassword) {
    return res.status(500).json({ error: "Admin credentials not configured" });
  }

  if (email !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

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
});

// ✅ Pro registration
router.post('/register', async (req, res) => {
  console.log("📥 Incoming registration request:", req.body);
  try {
    const { name, email, phone, password, trade, experience, location } = req.body;

    if (!name || !email || !phone || !password || !trade || !location) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable. Please try again later.'
      });
    }

    const existingPro = await Pro.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }]
    });

    if (existingPro) {
      return res.status(400).json({
        success: false,
        message: 'A professional with this email or phone already exists'
      });
    }

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

    // Parse experience field
    let parsedExperience = 0;
    if (typeof experience === 'string') {
      const match = experience.match(/\d+/);
      parsedExperience = match ? parseInt(match[0], 10) : 0;
    } else if (typeof experience === 'number') {
      parsedExperience = experience;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const coordinates = [-74.006, 40.7128]; // Default to NYC (placeholder)

    const newPro = new Pro({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: hashedPassword,
      trade: normalizedTrade,
      experience: parsedExperience,
      location: {
        type: 'Point',
        coordinates: coordinates,
        address: location.trim()
      },
      dob: new Date('1990-01-01'), // Replace with actual DOB field if available
      isActive: false,
      paymentStatus: 'pending'
    });

    // Proper MongoDB save with detailed error handling
    let savedPro;
    try {
      savedPro = await newPro.save();
    } catch (saveError) {
      console.error('❌ MongoDB save error:', saveError.stack || saveError);
      throw saveError;
    }

    const token = jwt.sign(
      {
        id: savedPro._id,
        email: savedPro.email,
        role: 'professional'
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    console.log(`✅ New Pro registered: ${savedPro.email}`);

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
    console.error('❌ Registration error:', error.stack || error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number already exists'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

module.exports = router;
