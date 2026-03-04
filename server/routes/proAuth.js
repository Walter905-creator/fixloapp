const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sign } = require('../utils/jwt');
const Pro = require('../models/Pro');
const { sendSms } = require('../utils/twilio');
const { normalizePhoneToE164 } = require('../utils/phoneNormalizer');

// Admin owner email (Walter Arevalo) - should be set via environment variable
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'pro4u.improvements@gmail.com';
const OWNER_USER_ID = process.env.OWNER_USER_ID; // Optional: match by user ID as well

// Pro login endpoint - uses phone number
router.post('/login', async (req, res) => {
  const { phone, password } = req.body || {};
  if (!phone || !password) return res.status(400).json({ error: 'Phone number and password required' });

  try {
    // Normalize phone number for lookup
    const normalizationResult = normalizePhoneToE164(phone);
    
    if (!normalizationResult.success) {
      console.error('❌ Login phone normalization failed:', normalizationResult.error);
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
    
    const normalizedPhone = normalizationResult.phone;
    const pro = await Pro.findOne({ phone: normalizedPhone });
    if (!pro) return res.status(401).json({ error: 'Invalid credentials' });

    // Check if password is not set (null)
    if (!pro.password) {
      return res.status(403).json({ 
        error: 'Password not set. Please reset your password.',
        requiresPasswordReset: true
      });
    }

    const ok = await bcrypt.compare(password, pro.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // Check if this user is the owner
    const isOwner = pro.email?.toLowerCase() === OWNER_EMAIL.toLowerCase() || 
                    (OWNER_USER_ID && pro._id.toString() === OWNER_USER_ID);
    
    if (isOwner && process.env.NODE_ENV !== 'production') {
      console.log('🔐 Owner logged in - granting admin access');
    }

    const token = sign({ role: pro.role || 'pro', id: pro._id, phone: pro.phone, isAdmin: isOwner });
    res.json({ 
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
  } catch (error) {
    console.error('Pro login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Request password reset via SMS
router.post('/request-password-reset', async (req, res) => {
  const { phone } = req.body || {};
  
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    // Normalize phone number for lookup
    const normalizationResult = normalizePhoneToE164(phone);
    
    if (!normalizationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid phone number format. Please use a valid phone number.' 
      });
    }
    
    const normalizedPhone = normalizationResult.phone;
    const pro = await Pro.findOne({ phone: normalizedPhone });
    
    // Always return generic success to prevent phone enumeration
    if (!pro) {
      return res.json({ 
        success: true,
        message: 'If this phone number is registered, a reset code has been sent.'
      });
    }

    // Generate 6-digit numeric code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    // Hash code using sha256 — never store raw code
    const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');
    
    // Save hash and 10-minute expiry
    pro.passwordResetCodeHash = hashedCode;
    pro.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    await pro.save();

    // Send SMS via Twilio — wrap in try/catch, do NOT crash if SMS fails
    // SECURITY: The reset code is included in the SMS body. Never log it.
    try {
      const smsBody = `Fixlo Password Reset Code\n\nYour reset code is: ${resetCode}\n\nThis code expires in 10 minutes.\nIf you didn't request this, ignore this message.`;
      console.log("Sending reset SMS to:", normalizedPhone.slice(-4).padStart(normalizedPhone.length, '*'));
      await sendSms(normalizedPhone, smsBody);
    } catch (smsError) {
      console.error('❌ Failed to send password reset SMS:', smsError.message);
      // Per spec: do not crash on SMS failure — return success regardless
    }

    res.json({ 
      success: true,
      message: 'If this phone number is registered, a reset code has been sent.'
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset password with SMS code
router.post('/reset-password', async (req, res) => {
  const { phone, code, newPassword } = req.body || {};
  
  if (!phone || !code || !newPassword) {
    return res.status(400).json({ error: 'Phone number, reset code, and new password are required' });
  }

  // Validate password strength
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  try {
    // Normalize phone for lookup
    const normalizationResult = normalizePhoneToE164(phone);
    if (!normalizationResult.success) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
    const normalizedPhone = normalizationResult.phone;

    // Find Pro by phone
    const pro = await Pro.findOne({ phone: normalizedPhone });

    // Hash incoming code to compare against stored hash
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    // Validate: code hash matches and not expired
    if (
      !pro ||
      pro.passwordResetCodeHash !== hashedCode ||
      !pro.passwordResetExpires ||
      pro.passwordResetExpires < Date.now()
    ) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    // Hash new password with bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password and invalidate code (setting to undefined removes the fields from the document)
    pro.password = hashedPassword;
    pro.passwordResetCodeHash = undefined;
    pro.passwordResetExpires = undefined;
    await pro.save();

    res.json({ 
      success: true,
      message: 'Password reset successful. You can now log in.'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;