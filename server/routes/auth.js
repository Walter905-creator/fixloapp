const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { sign } = require('../utils/jwt');
const Pro = require("../models/Pro");
const InviteCode = require("../models/InviteCode");
const Homeowner = require("../models/Homeowner");
const RecruiterProfile = require("../models/RecruiterProfile");
const mongoose = require("mongoose");
const { requireDatabase } = require('../config/database');
const { normalizePhoneToE164 } = require('../utils/phoneNormalizer');
const { sendPasswordResetEmail } = require('../utils/email');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@fixloapp.com';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH; // store hash, not raw
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeThisInProduction123!'; // fallback for backward compatibility
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'pro4u.improvements@gmail.com'; // Owner with admin access

// Initialize Stripe once at module level
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  } catch (error) {
    console.error('⚠️ Failed to initialize Stripe:', error);
  }
}

// ✅ Admin login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // Check if email matches admin or owner email
  const isAdminEmail = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isOwnerEmail = email.toLowerCase() === OWNER_EMAIL.toLowerCase();
  
  if (!isAdminEmail && !isOwnerEmail) {
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

  const token = sign({ role: 'admin', email: email.toLowerCase(), isAdmin: true });
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔐 Admin login successful: ${email}`);
  }
  
  res.json({
    success: true,
    token,
    admin: {
      email: email.toLowerCase(),
      role: "admin",
      isAdmin: true
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
    if (user.stripeSubscriptionId && stripe) {
      try {
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

// ── Homeowner Login ───────────────────────────────────────────────────────────
router.post('/login/homeowner', requireDatabase, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const homeowner = await Homeowner.findOne({ email: email.toLowerCase().trim() });
    if (!homeowner) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, homeowner.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = sign({ role: 'homeowner', id: homeowner._id, email: homeowner.email });
    return res.json({
      token,
      homeowner: {
        id: homeowner._id,
        name: homeowner.name,
        email: homeowner.email,
        phone: homeowner.phone
      }
    });
  } catch (err) {
    console.error('Homeowner login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── Pro Login (unified endpoint) ──────────────────────────────────────────────
router.post('/login/pro', requireDatabase, async (req, res) => {
  const { phone, password } = req.body || {};
  if (!phone || !password) {
    return res.status(400).json({ error: 'Phone number and password are required' });
  }
  try {
    const normResult = normalizePhoneToE164(phone);
    if (!normResult.success) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
    const pro = await Pro.findOne({ phone: normResult.phone });
    if (!pro) return res.status(401).json({ error: 'Invalid credentials' });
    if (!pro.password) {
      return res.status(403).json({ error: 'Password not set. Please reset your password.', requiresPasswordReset: true });
    }
    const ok = await bcrypt.compare(password, pro.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const OWNER_EMAIL = process.env.OWNER_EMAIL || 'pro4u.improvements@gmail.com';
    const ownerPhoneNorm = process.env.OWNER_PHONE ? (normalizePhoneToE164(process.env.OWNER_PHONE).phone || null) : null;
    const isOwner = pro.email?.toLowerCase() === OWNER_EMAIL.toLowerCase() ||
                    (ownerPhoneNorm && normResult.phone === ownerPhoneNorm);
    const token = sign({ role: pro.role || 'pro', id: pro._id, phone: pro.phone, isAdmin: isOwner });
    return res.json({
      token,
      pro: {
        id: pro._id,
        name: pro.name,
        trade: pro.trade,
        email: pro.email,
        phone: pro.phone,
        isAdmin: isOwner
      }
    });
  } catch (err) {
    console.error('Pro login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── Recruiter Login (unified endpoint) ────────────────────────────────────────
router.post('/login/recruiter', requireDatabase, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const recruiter = await RecruiterProfile.findOne({ email: email.toLowerCase().trim() });
    if (!recruiter) return res.status(401).json({ error: 'Invalid credentials' });
    if (recruiter.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended. Contact support.' });
    }
    const ok = await bcrypt.compare(password, recruiter.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = sign({ role: 'recruiter', id: recruiter._id, email: recruiter.email });
    return res.json({
      token,
      recruiter: {
        id: recruiter._id,
        name: recruiter.name,
        email: recruiter.email,
        recruiterCode: recruiter.recruiterCode,
        recruiterLink: recruiter.recruiterLink,
        proReferralLink: recruiter.proReferralLink || recruiter.recruiterLink,
        recruiterReferralLink: recruiter.recruiterReferralLink || recruiter.recruiterRecruiterLink
      }
    });
  } catch (err) {
    console.error('Recruiter login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── Homeowner Signup ──────────────────────────────────────────────────────────
router.post('/signup/homeowner', requireDatabase, async (req, res) => {
  const { name, email, phone, password, confirmPassword, smsOptIn } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const existing = await Homeowner.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }
    const hashed = await bcrypt.hash(password, 12);
    const homeowner = await Homeowner.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : undefined,
      password: hashed,
      smsOptIn: !!smsOptIn,
      smsOptInDate: smsOptIn ? new Date() : null
    });
    const token = sign({ role: 'homeowner', id: homeowner._id, email: homeowner.email });
    return res.status(201).json({
      token,
      homeowner: {
        id: homeowner._id,
        name: homeowner.name,
        email: homeowner.email,
        phone: homeowner.phone
      }
    });
  } catch (err) {
    console.error('Homeowner signup error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }
    return res.status(500).json({ error: 'Server error during signup' });
  }
});

// ── Pro Signup (direct account creation) ─────────────────────────────────────
router.post('/signup/pro', requireDatabase, async (req, res) => {
  const { name, email, phone, trade, location, password, confirmPassword, smsOptIn, inviteCode } = req.body || {};
  if (!name || !email || !phone || !trade || !location || !password) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Validate invite code before creating the account
  let inviteDoc = null;
  if (inviteCode && inviteCode.trim()) {
    const normalizedCode = inviteCode.trim().toUpperCase();
    inviteDoc = await InviteCode.findOne({ code: normalizedCode });
    if (
      !inviteDoc ||
      inviteDoc.revoked ||
      inviteDoc.disabled ||
      inviteDoc.redeemed ||
      (inviteDoc.usesAllowed > 0 && inviteDoc.usesRemaining <= 0) ||
      (inviteDoc.expiresAt && inviteDoc.expiresAt < new Date())
    ) {
      return res.status(400).json({ error: 'This invitation code is invalid, expired, or already used.' });
    }
  }

  try {
    const normResult = normalizePhoneToE164(phone);
    if (!normResult.success) {
      return res.status(400).json({ error: 'Invalid phone number format. Please use a valid US phone number.' });
    }
    const existing = await Pro.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { phone: normResult.phone }]
    });
    if (existing) {
      return res.status(409).json({ error: 'An account with that email or phone already exists' });
    }
    const allowedTrades = [
      'plumbing', 'electrical', 'landscaping', 'cleaning', 'junk_removal',
      'handyman', 'hvac', 'painting', 'roofing', 'flooring', 'carpentry', 'appliance_repair'
    ];
    const normalizedTrade = trade.toLowerCase().replace(/[^a-z]/g, '_');
    if (!allowedTrades.includes(normalizedTrade)) {
      return res.status(400).json({ error: 'Invalid trade specified' });
    }
    const hashed = await bcrypt.hash(password, 12);

    // Every new contractor gets a 30-day free trial automatically.
    // If a valid invite code is provided, its duration replaces the default 30 days.
    const freeAccessUntil = inviteDoc
      ? InviteCode.calcFreeAccessUntil(inviteDoc.membershipDuration || '12months')
      : InviteCode.calcFreeAccessUntil('30days');

    const pro = await Pro.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: normResult.phone,
      trade: normalizedTrade,
      location: { type: 'Point', coordinates: [-74.006, 40.7128], address: location.trim() },
      password: hashed,
      smsConsent: !!smsOptIn,
      isActive: true,              // all new contractors start active on free trial
      paymentStatus: 'active',
      subscriptionActive: true,
      subscriptionStatus: inviteDoc ? 'invite_redeemed' : 'active',
      freeAccessUntil,
      inviteCodeUsed: inviteDoc ? inviteDoc.code : null
    });

    // Atomically mark the invite code as used — handle multi-use codes
    if (inviteDoc) {
      const newRemaining = inviteDoc.usesAllowed === 0 ? 0 : Math.max(0, inviteDoc.usesRemaining - 1);
      const nowFullyUsed = inviteDoc.usesAllowed > 0 && newRemaining === 0;
      await InviteCode.findOneAndUpdate(
        { _id: inviteDoc._id },
        {
          $set: {
            usesRemaining: newRemaining,
            redeemed: nowFullyUsed,
            redeemedAt: nowFullyUsed ? new Date() : inviteDoc.redeemedAt,
            redeemedBy: nowFullyUsed ? String(pro._id) : inviteDoc.redeemedBy,
            redeemedByUserId: nowFullyUsed ? pro._id : inviteDoc.redeemedByUserId
          },
          $push: {
            redeemedByList: {
              proId: pro._id,
              proName: pro.name,
              proEmail: pro.email,
              proPhone: pro.phone,
              redeemedAt: new Date()
            }
          }
        }
      );
    }

    const token = sign({ role: 'pro', id: pro._id, phone: pro.phone });
    return res.status(201).json({
      token,
      pro: {
        id: pro._id,
        name: pro.name,
        email: pro.email,
        trade: pro.trade,
        phone: pro.phone,
        paymentStatus: pro.paymentStatus,
        freeTrialActive: true,
        freeAccessUntil: pro.freeAccessUntil,
        inviteCodeAccepted: !!inviteDoc,
        requiresSubscription: false
      }
    });
  } catch (err) {
    console.error('Pro signup error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'An account with that email or phone already exists' });
    }
    return res.status(500).json({ error: 'Server error during signup' });
  }
});

// ── Recruiter Signup (unified endpoint) ───────────────────────────────────────
router.post('/signup/recruiter', requireDatabase, async (req, res) => {
  const { name, email, phone, password, confirmPassword, smsOptIn } = req.body || {};
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'Name, email, phone, and password are required' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const existing = await RecruiterProfile.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }
    const phoneResult = normalizePhoneToE164(phone);
    if (!phoneResult.success) {
      return res.status(400).json({ error: 'A valid US phone number is required' });
    }
    const hashed = await bcrypt.hash(password, 12);
    const recruiterCode = await RecruiterProfile.generateUniqueCode();
    const baseUrl = process.env.FRONTEND_URL || 'https://www.fixloapp.com';
    const proReferralLink = `${baseUrl}/pros/signup?ref=${encodeURIComponent(recruiterCode)}`;
    const recruiterReferralLink = `${baseUrl}/recruiter/signup?ref=${encodeURIComponent(recruiterCode)}`;
    const recruiter = await RecruiterProfile.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phoneNumber: phoneResult.phone,
      password: hashed,
      smsOptIn: !!smsOptIn,
      smsOptInDate: smsOptIn ? new Date() : null,
      recruiterCode,
      recruiterLink: proReferralLink,
      recruiterRecruiterLink: recruiterReferralLink,
      proReferralLink,
      recruiterReferralLink,
      signupIp: req.ip || ''
    });
    const token = sign({ role: 'recruiter', id: recruiter._id, email: recruiter.email });
    return res.status(201).json({
      token,
      recruiter: {
        id: recruiter._id,
        name: recruiter.name,
        email: recruiter.email,
        recruiterCode: recruiter.recruiterCode,
        recruiterLink: recruiter.recruiterLink,
        proReferralLink: recruiter.proReferralLink,
        recruiterReferralLink: recruiter.recruiterReferralLink
      }
    });
  } catch (err) {
    console.error('Recruiter signup error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }
    return res.status(500).json({ error: 'Server error during signup' });
  }
});

// ── Forgot Password (unified, safe) ──────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  // Step 1: Request received
  console.log('[forgot-password] Step 1: Request received at POST /api/auth/forgot-password');

  // Step 2: Extract email
  const { email } = req.body || {};
  console.log('[forgot-password] Step 2: Email received:', email || '(none)');

  if (!email) {
    console.log('[forgot-password] EARLY RETURN: No email provided in request body');
    return res.status(400).json({ error: 'Email is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Step 3: Database connectivity check
    if (mongoose.connection.readyState !== 1) {
      console.error('[forgot-password] EARLY RETURN: MongoDB not connected (readyState=%d)', mongoose.connection.readyState);
      return res.status(503).json({ error: 'Service temporarily unavailable. Please try again.' });
    }

    // Step 4: User lookup
    console.log('[forgot-password] Step 3: Looking up user with email:', normalizedEmail);
    const [homeownerResult, recruiterResult] = await Promise.allSettled([
      Homeowner.findOne({ email: normalizedEmail }),
      RecruiterProfile.findOne({ email: normalizedEmail })
    ]);

    const homeowner = homeownerResult.status === 'fulfilled' ? homeownerResult.value : null;
    const recruiter = recruiterResult.status === 'fulfilled' ? recruiterResult.value : null;

    if (homeownerResult.status === 'rejected') {
      console.error('[forgot-password] Homeowner lookup error:', homeownerResult.reason);
    }
    if (recruiterResult.status === 'rejected') {
      console.error('[forgot-password] RecruiterProfile lookup error:', recruiterResult.reason);
    }

    // Step 5: Found / not found
    const user = homeowner || recruiter;
    if (!user) {
      // Do not reveal whether the account exists (anti-enumeration)
      console.log('[forgot-password] Step 4: No account found for email (not revealing to client):', normalizedEmail);
      return res.json({
        success: true,
        message: 'If this account exists, password reset instructions will be sent.'
      });
    }
    console.log('[forgot-password] Step 4: User found — type:', homeowner ? 'Homeowner' : 'RecruiterProfile', '| id:', user._id);

    // Step 6: Generate reset token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    console.log('[forgot-password] Step 5: Reset token generated (not logged for security)');

    // Persist token hash to the correct model
    if (homeowner) {
      homeowner.passwordResetTokenHash = tokenHash;
      homeowner.passwordResetExpires = tokenExpires;
      await homeowner.save();
    } else {
      recruiter.resetToken = rawToken; // RecruiterProfile stores raw token (existing schema)
      recruiter.resetTokenExpires = tokenExpires;
      await recruiter.save();
    }
    console.log('[forgot-password] Step 5b: Reset token saved to database for user:', user._id);

    // Step 7: Build email payload (handled inside sendPasswordResetEmail)
    console.log('[forgot-password] Step 6: Email payload being constructed for:', normalizedEmail);

    // Step 8: Call SendGrid
    console.log('[forgot-password] Step 7: Calling sendPasswordResetEmail() via SendGrid for:', normalizedEmail);
    try {
      await sendPasswordResetEmail(normalizedEmail, rawToken);
      console.log('[forgot-password] Step 8: SendGrid accepted the email for:', normalizedEmail);
    } catch (emailErr) {
      // Step 9: SendGrid error — log full error and fail loudly
      console.error('[forgot-password] Step 9: SendGrid send() threw an exception:');
      console.error('[forgot-password]   message:', emailErr.message);
      if (emailErr.response) {
        console.error('[forgot-password]   status:', emailErr.response.status);
        console.error('[forgot-password]   body:', JSON.stringify(emailErr.response.body));
      }
      console.error('[forgot-password]   full error:', emailErr);
      // Rollback token so it cannot be exploited even though the email failed
      if (homeowner) {
        homeowner.passwordResetTokenHash = undefined;
        homeowner.passwordResetExpires = undefined;
        await homeowner.save();
      } else {
        recruiter.resetToken = null;
        recruiter.resetTokenExpires = null;
        await recruiter.save();
      }
      return res.status(502).json({ error: 'Failed to send reset email. Please try again later.' });
    }

    return res.json({
      success: true,
      message: 'If this account exists, password reset instructions will be sent.'
    });

  } catch (err) {
    console.error('[forgot-password] Step 9: Unhandled exception in forgot-password controller:');
    console.error('[forgot-password]   message:', err.message);
    console.error('[forgot-password]   stack:', err.stack);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
});

module.exports = router;
