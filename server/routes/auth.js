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

    // Check if professional already exists
    const existingPro = await Pro.findOne({ 
      $or: [{ email }, { phone }] 
    });

    if (existingPro) {
      return res.status(400).json({ 
        success: false,
        message: 'A professional with this email or phone number already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // For now, use basic geocoding (in production, you'd use Google Maps API)
    // Set default coordinates for the location (this should be geocoded properly)
    const coordinates = [-74.006, 40.7128]; // Default to NYC coordinates

    // Create new professional
    const newPro = new Pro({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      trade,
      experience: experience || 0,
      location: {
        type: 'Point',
        coordinates: coordinates,
        address: location
      },
      dob: new Date('1990-01-01'), // Default DOB, should be collected in form
      isActive: false, // Will be activated after successful payment
      paymentStatus: 'pending'
    });

    // Save the professional
    const savedPro = await newPro.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: savedPro._id, 
        email: savedPro.email, 
        role: 'professional' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

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
    if (error.code === 11000) {
      // Duplicate key error
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
