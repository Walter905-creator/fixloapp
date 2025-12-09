const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { sign } = require('../utils/jwt');
const Pro = require("../models/Pro");
const mongoose = require("mongoose");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@fixloapp.com';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH; // store hash, not raw
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeThisInProduction123!'; // fallback for backward compatibility

// ✅ Admin login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if (email !== ADMIN_EMAIL) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Check hashed password first, fallback to plain password for backward compatibility
  let isValidPassword = false;
  
  if (ADMIN_PASSWORD_HASH) {
    try {
      isValidPassword = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    } catch (error) {
      console.error("Password hash comparison error:", error);
    }
  }
  
  // Fallback to plain password if hash not available or comparison failed
  if (!isValidPassword && ADMIN_PASSWORD && password === ADMIN_PASSWORD) {
    isValidPassword = true;
  }

  if (!isValidPassword) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = sign({ role: 'admin', email: ADMIN_EMAIL });
  
  res.json({
    success: true,
    token,
    admin: {
      email: ADMIN_EMAIL,
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

/**
 * Refresh authentication token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'fallback-secret');
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Generate new access token
    const newToken = sign({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    });

    res.json({
      token: newToken,
      expiresIn: 604800, // 7 days in seconds
    });

  } catch (error) {
    console.error('❌ Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

/**
 * Delete user account (Apple App Store requirement)
 * DELETE /api/auth/account/:userId
 */
router.delete('/account/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { confirmEmail } = req.body;

    console.log(`🗑️ Account deletion request for user: ${userId}`);

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }

    // Verify user exists
    const user = await Pro.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Optional: Verify email confirmation for additional security
    if (confirmEmail && user.email !== confirmEmail.toLowerCase()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email confirmation does not match' 
      });
    }

    // Log the deletion for audit purposes
    console.log(`🗑️ Deleting account for: ${user.email}`);
    console.log(`📋 Account details: Name: ${user.name}, Trade: ${user.trade}, Joined: ${user.joinedDate}`);

    // Cancel Stripe subscription if exists
    if (user.stripeSubscriptionId) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        await stripe.subscriptions.cancel(user.stripeSubscriptionId);
        console.log(`✅ Cancelled Stripe subscription: ${user.stripeSubscriptionId}`);
      } catch (stripeError) {
        console.error('⚠️ Failed to cancel Stripe subscription:', stripeError);
        // Continue with deletion even if Stripe cancellation fails
      }
    }

    // Delete related data
    try {
      // Delete job requests associated with this pro
      const JobRequest = require('../models/JobRequest');
      const deletedRequests = await JobRequest.deleteMany({ proId: userId });
      console.log(`🗑️ Deleted ${deletedRequests.deletedCount} job requests`);

      // Delete reviews
      const Review = require('../models/Review');
      const deletedReviews = await Review.deleteMany({ proId: userId });
      console.log(`🗑️ Deleted ${deletedReviews.deletedCount} reviews`);

      // Delete share events
      const ShareEvent = require('../models/ShareEvent');
      const deletedShares = await ShareEvent.deleteMany({ proId: userId });
      console.log(`🗑️ Deleted ${deletedShares.deletedCount} share events`);
    } catch (relatedDataError) {
      console.error('⚠️ Error deleting related data:', relatedDataError);
      // Continue with user deletion even if related data deletion fails
    }

    // Delete the user account
    await Pro.findByIdAndDelete(userId);
    
    console.log(`✅ Successfully deleted account: ${user.email}`);

    res.json({ 
      success: true, 
      message: 'Account successfully deleted. We\'re sorry to see you go!' 
    });

  } catch (error) {
    console.error('❌ Account deletion error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete account. Please try again or contact support.' 
    });
  }
});

module.exports = router;
