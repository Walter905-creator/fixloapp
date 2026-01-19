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

    const token = sign({ role: 'pro', id: pro._id, phone: pro.phone, isAdmin: isOwner });
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
  const isDemoMode = process.env.NODE_ENV !== 'production';
  
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    // Normalize phone number for lookup
    const normalizationResult = normalizePhoneToE164(phone);
    
    if (!normalizationResult.success) {
      console.error('❌ Password reset: Phone normalization failed');
      console.error(`   Original phone: ${normalizationResult.original}`);
      console.error(`   Error: ${normalizationResult.error}`);
      return res.status(400).json({ 
        error: 'Invalid phone number format. Please use a valid phone number.' 
      });
    }
    
    const normalizedPhone = normalizationResult.phone;
    
    console.log('🔐 Password reset requested');
    console.log(`   Original phone: ${normalizationResult.original}`);
    console.log(`   Normalized E.164: ${normalizedPhone}`);
    console.log(`   Mode: ${isDemoMode ? 'DEMO' : 'PRODUCTION'}`);
    
    const pro = await Pro.findOne({ phone: normalizedPhone });
    
    // Always return success to prevent phone enumeration
    // Even if user doesn't exist, we return success
    if (!pro) {
      console.log(`⚠️ Password reset requested for non-existent phone: ${normalizedPhone}`);
      return res.json({ 
        success: true,
        message: 'If this phone number exists, a reset message was sent.'
      });
    }

    // Generate 6-digit code for SMS (easier for users to enter)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');
    
    // Set code and expiration (15 minutes)
    pro.passwordResetToken = hashedCode;
    pro.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await pro.save();

    // Send SMS with reset code
    try {
      await sendSms(normalizedPhone, `Fixlo: Your password reset code is ${resetCode}. Valid for 15 minutes. Reply STOP to opt out.`);
      console.log('✅ Password reset SMS sent successfully');
      console.log(`   Phone: ${normalizedPhone}`);
      console.log(`   Mode: ${isDemoMode ? 'DEMO' : 'PRODUCTION'}`);
      // SECURITY: Never log the actual verification code
    } catch (smsError) {
      console.error('❌ Failed to send password reset SMS');
      console.error(`   Phone: ${normalizedPhone}`);
      console.error(`   Error: ${smsError.message}`);
      console.error(`   Mode: ${isDemoMode ? 'DEMO' : 'PRODUCTION'}`);
      
      // In development, log the code for testing (but never in production)
      if (isDemoMode) {
        console.log('📱 [DEMO MODE ONLY] Reset code:', resetCode);
      }
    }

    res.json({ 
      success: true,
      message: 'If this phone number exists, a reset message was sent.'
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset password with code or token
router.post('/reset-password', async (req, res) => {
  const { code, token, newPassword } = req.body || {};
  
  // Accept either code or token
  const resetValue = code || token;
  
  if (!resetValue || !newPassword) {
    return res.status(400).json({ error: 'Reset code and new password are required' });
  }

  // Validate password strength
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  try {
    // Hash the code/token to compare with stored hash
    const hashedValue = crypto.createHash('sha256').update(resetValue).digest('hex');
    
    // Find pro with valid code/token
    const pro = await Pro.findOne({
      passwordResetToken: hashedValue,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!pro) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear reset token
    pro.password = hashedPassword;
    pro.passwordResetToken = null;
    pro.passwordResetExpires = null;
    await pro.save();

    console.log('✅ Password reset successful for:', pro.phone);

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