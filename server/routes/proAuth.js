const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sign } = require('../utils/jwt');
const Pro = require('../models/Pro');
const { requireDatabase } = require('../config/database');
const { sendSms } = require('../utils/twilio');
const { normalizePhoneToE164 } = require('../utils/phoneNormalizer');
const { notify: ownerNotify } = require('../services/ownerNotificationService');

// Admin owner identifiers (all supported env aliases)
const OWNER_EMAIL_FALLBACK = 'pro4u.improvements@gmail.com';

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const normalizeDigits = (value) => String(value || '').replace(/\D/g, '');

const getNormalizedOwnerConfig = () => {
  const ownerEmails = [
    process.env.OWNER_EMAIL || OWNER_EMAIL_FALLBACK,
    process.env.FIXLO_OWNER_EMAIL
  ].map(normalizeEmail).filter(Boolean);

  const ownerPhones = [
    process.env.OWNER_PHONE,
    process.env.FIXLO_OWNER_PHONE
  ]
    .map((raw) => {
      if (!raw) return null;
      const normalized = normalizePhoneToE164(raw);
      return normalized.success ? normalized.phone : null;
    })
    .filter(Boolean);

  const ownerPhoneDigits = ownerPhones.map(normalizeDigits).filter(Boolean);
  const ownerIds = [
    process.env.OWNER_USER_ID,
    process.env.FIXLO_OWNER_PRO_ID
  ].map((id) => String(id || '').trim()).filter(Boolean);

  return { ownerEmails, ownerPhones, ownerPhoneDigits, ownerIds };
};

const isOwnerPro = (pro) => {
  if (!pro) return false;
  const { ownerEmails, ownerPhones, ownerPhoneDigits, ownerIds } = getNormalizedOwnerConfig();
  const proId = String(pro._id || '').trim();
  const proEmail = normalizeEmail(pro.email);
  const proPhoneNorm = normalizePhoneToE164(pro.phone || '').phone || null;
  const proPhoneDigits = normalizeDigits(pro.phone);

  return (
    (proId && ownerIds.includes(proId)) ||
    (proEmail && ownerEmails.includes(proEmail)) ||
    (proPhoneNorm && ownerPhones.includes(proPhoneNorm)) ||
    (proPhoneDigits && ownerPhoneDigits.includes(proPhoneDigits))
  );
};

const findProByPhoneIdentifier = async (identifier) => {
  const normalizationResult = normalizePhoneToE164(identifier);
  if (!normalizationResult.success) return null;

  const normalizedPhone = normalizationResult.phone;
  let pro = await Pro.findOne({ phone: normalizedPhone });
  if (pro) return pro;

  // Legacy fallback for old records with non-E.164 formatting in database
  const inputDigits = normalizeDigits(identifier);
  if (!inputDigits) return null;
  const acceptableDigits = new Set([inputDigits]);
  if (inputDigits.length === 10) acceptableDigits.add(`1${inputDigits}`);
  if (inputDigits.length === 11 && inputDigits.startsWith('1')) acceptableDigits.add(inputDigits.slice(1));

  const suffix = inputDigits.slice(-7);
  const candidates = await Pro.find({
    phone: { $regex: `${suffix}$` }
  }).limit(25);

  return candidates.find((candidate) => {
    const candidateDigits = normalizeDigits(candidate.phone);
    return acceptableDigits.has(candidateDigits);
  }) || null;
};

router.use(requireDatabase);

// Pro login endpoint - supports email or phone identifier
router.post('/login', async (req, res) => {
  const body = req.body || {};
  const identifierRaw = body.identifier ?? body.email ?? body.phone;
  const password = body.password;
  const identifier = String(identifierRaw || '').trim();
  if (!identifier || !password) return res.status(400).json({ error: 'Identifier and password are required' });

  try {
    let pro = null;

    if (identifier.includes('@')) {
      const email = normalizeEmail(identifier);
      pro = await Pro.findOne({ email });
    } else {
      pro = await findProByPhoneIdentifier(identifier);
    }

    if (!pro) return res.status(401).json({ error: 'Invalid credentials' });

    if (!pro.password) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, pro.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const isOwner = isOwnerPro(pro);
    if (!isOwner && pro.isActive === false) {
      return res.status(403).json({ error: 'Account is disabled' });
    }

    const effectiveRole = isOwner ? 'admin' : (pro.role || 'pro');

    if (isOwner && process.env.NODE_ENV !== 'production') {
      console.log('🔐 Owner logged in - granting admin access');
    }

    const token = sign({ role: effectiveRole, id: pro._id, phone: pro.phone, isAdmin: isOwner });
    res.json({ 
      token, 
      pro: { 
        id: pro._id, 
        name: pro.name, 
        trade: pro.trade,
        email: pro.email,
        phone: pro.phone,
        role: effectiveRole,
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

    // Fire-and-forget owner notification (no reset code — security)
    ownerNotify('password_reset', {
      userType:   'Pro',
      identifier: `...${normalizedPhone.slice(-4)}`,
      timestamp:  new Date().toISOString()
    }).catch(() => {});

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