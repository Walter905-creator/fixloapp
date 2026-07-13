/**
 * Recruiter Authentication Routes
 *
 * POST /api/recruiter-auth/signup
 * POST /api/recruiter-auth/login
 * POST /api/recruiter-auth/request-password-reset
 * POST /api/recruiter-auth/reset-password
 */

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sign } = require('../utils/jwt');
const RecruiterProfile = require('../models/RecruiterProfile');
const RecruiterReferralCode = require('../models/RecruiterReferralCode');
const { requireDatabase } = require('../config/database');
const { normalizePhoneToE164 } = require('../utils/phoneNormalizer');
const { sendSms } = require('../utils/twilio');
const { sendOwnerAlert } = require('../utils/sendOwnerAlert');
const { notify: ownerNotify } = require('../services/ownerNotificationService');

router.use(requireDatabase);

// ── Signup ───────────────────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { name, email, phoneNumber, password, refCode, smsOptIn } = req.body || {};

    if (!name || !email || !phoneNumber || !password) {
      return res.status(400).json({ error: 'Name, email, phone number, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await RecruiterProfile.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }

    // Resolve parent recruiter from ref code
    let parentRecruiterId = null;
    if (refCode) {
      const normalizedRefCode = refCode.trim().toUpperCase();
      let parent = await RecruiterProfile.findOne({
        recruiterCode: normalizedRefCode
      });

      if (!parent) {
        const oneTimeCode = await RecruiterReferralCode.findOne({
          code: normalizedRefCode,
          type: 'recruiter',
          isActive: true,
          isUsed: false,
          $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
        });
        if (oneTimeCode) {
          parent = await RecruiterProfile.findById(oneTimeCode.recruiterId);
          if (parent) {
            oneTimeCode.isUsed = true;
            oneTimeCode.usedBy = email.toLowerCase().trim();
            oneTimeCode.usedDate = new Date();
            await oneTimeCode.save();
          }
        }
      }

      if (parent) {
        parentRecruiterId = parent._id;
      }
    }

    // Normalize and validate phone (required, US)
    const phoneResult = normalizePhoneToE164(phoneNumber);
    if (!phoneResult.success) {
      return res.status(400).json({ error: 'A valid US phone number is required for SMS notifications' });
    }
    const normalizedPhone = phoneResult.phone;

    const hashed = await bcrypt.hash(password, 12);
    const recruiterCode = await RecruiterProfile.generateUniqueCode();
    const baseUrl = process.env.FRONTEND_URL || 'https://www.fixloapp.com';
    const encodedCode = encodeURIComponent(recruiterCode);
    const proReferralLink = `${baseUrl}/pros/signup?ref=${encodedCode}`;
    const recruiterReferralLink = `${baseUrl}/recruiter/signup?ref=${encodedCode}`;

    const recruiter = await RecruiterProfile.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phoneNumber: normalizedPhone,
      smsOptIn: !!smsOptIn,
      smsOptInDate: smsOptIn ? new Date() : null,
      password: hashed,
      recruiterCode,
      recruiterLink: proReferralLink,
      recruiterRecruiterLink: recruiterReferralLink,
      proReferralLink,
      recruiterReferralLink,
      parentRecruiterId,
      signupIp: req.ip || ''
    });

    const token = sign({ role: 'recruiter', id: recruiter._id, email: recruiter.email });

    // Fire-and-forget owner SMS alert — must not block signup or throw
    sendOwnerAlert(
      'recruiter_signup',
      {
        name: recruiter.name,
        phone: recruiter.phone || 'N/A',
        source: refCode ? `ref:${refCode.trim().toUpperCase()}` : 'direct'
      },
      `recruiter_signup:${recruiter._id}`
    ).catch((err) => console.warn('[OwnerAlert] Unexpected error:', err.message));

    // Fire-and-forget owner email notification
    ownerNotify('recruiter_registered', {
      name:         recruiter.name,
      email:        recruiter.email,
      phone:        recruiter.phoneNumber || 'N/A',
      referralCode: recruiter.recruiterCode || 'N/A',
      signupDate:   new Date().toISOString()
    }).catch(() => {});

    return res.status(201).json({
      token,
      recruiter: {
        id: recruiter._id,
        name: recruiter.name,
        email: recruiter.email,
        recruiterCode: recruiter.recruiterCode,
        recruiterLink: recruiter.recruiterLink,
        recruiterRecruiterLink: recruiter.recruiterRecruiterLink,
        proReferralLink: recruiter.proReferralLink || recruiter.recruiterLink,
        recruiterReferralLink: recruiter.recruiterReferralLink || recruiter.recruiterRecruiterLink
      }
    });
  } catch (err) {
    console.error('❌ Recruiter signup error:', err.message);
    return res.status(500).json({ error: 'Signup failed. Please try again.' });
  }
});

// ── Login ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const recruiter = await RecruiterProfile.findOne({ email: email.toLowerCase() });
    if (!recruiter) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (recruiter.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended. Contact support.' });
    }

    const ok = await bcrypt.compare(password, recruiter.password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = sign({ role: 'recruiter', id: recruiter._id, email: recruiter.email });

    return res.json({
      token,
      recruiter: {
        id: recruiter._id,
        name: recruiter.name,
        email: recruiter.email,
        recruiterCode: recruiter.recruiterCode,
        recruiterLink: recruiter.recruiterLink,
        recruiterRecruiterLink: recruiter.recruiterRecruiterLink,
        proReferralLink: recruiter.proReferralLink || recruiter.recruiterLink,
        recruiterReferralLink: recruiter.recruiterReferralLink || recruiter.recruiterRecruiterLink,
        stripeConnectOnboarded: recruiter.stripeConnectOnboarded,
        payoutStatus: recruiter.payoutStatus
      }
    });
  } catch (err) {
    console.error('❌ Recruiter login error:', err.message);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ── Request password reset ────────────────────────────────────────────────────
router.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const recruiter = await RecruiterProfile.findOne({ email: email.toLowerCase() });
    // Always return 200 to prevent email enumeration
    if (!recruiter) return res.json({ ok: true, message: 'If that email exists, a reset link was sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    recruiter.resetToken = token;
    recruiter.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await recruiter.save();

    const baseUrl = process.env.FRONTEND_URL || 'https://fixloapp.com';
    const resetUrl = `${baseUrl}/recruiter/reset-password?token=${token}`;

    if (recruiter.phoneNumber) {
      try {
        await sendSms(
          recruiter.phoneNumber,
          `Fixlo: Your password reset link: ${resetUrl} (expires in 1 hour). Reply STOP to opt out.`
        );
      } catch (smsErr) {
        console.warn('⚠️ Could not send password reset SMS:', smsErr.message);
      }
    }

    console.log(`🔑 Password reset requested for recruiter ${recruiter.email}`);
    // Fire-and-forget owner notification (no token included — security)
    ownerNotify('password_reset', {
      userType:   'Recruiter',
      identifier: recruiter.email,
      timestamp:  new Date().toISOString()
    }).catch(() => {});
    return res.json({ ok: true, message: 'If that email exists, a reset link was sent.' });
  } catch (err) {
    console.error('❌ Recruiter password reset request error:', err.message);
    return res.status(500).json({ error: 'Could not process password reset request.' });
  }
});

// ── Reset password ─────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Validate token is a 64-character hex string to prevent NoSQL injection
    if (!/^[0-9a-f]{64}$/.test(token)) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const recruiter = await RecruiterProfile.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: new Date() }
    });

    if (!recruiter) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    recruiter.password = await bcrypt.hash(password, 12);
    recruiter.resetToken = null;
    recruiter.resetTokenExpires = null;
    await recruiter.save();

    return res.json({ ok: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('❌ Recruiter password reset error:', err.message);
    return res.status(500).json({ error: 'Could not reset password.' });
  }
});

module.exports = router;
