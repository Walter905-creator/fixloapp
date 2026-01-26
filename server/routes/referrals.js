// server/routes/referrals.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Pro = require('../models/Pro');
const Referral = require('../models/Referral');
const { generateReferralReward } = require('../services/referralPromoCode');
const { sendReferralRewardNotification } = require('../services/referralNotification');
const { sendSms, sendWhatsAppMessage } = require('../utils/twilio');
const { normalizePhoneToE164 } = require('../utils/phoneNormalizer');

/**
 * COMPLIANCE: Referral system endpoints
 * 
 * CRITICAL RULES:
 * - Referrals only valid after PAID subscription
 * - Anti-fraud checks required
 * - No automatic discounts
 * - Rewards issued as promo codes for NEXT billing cycle
 */

// Constants for error detection
const CONFIGURATION_ERROR_MARKER = 'CONFIGURATION_INVALID';

// SMS message templates
const SMS_TEMPLATES = {
  REFERRAL_LINK: (referralLink) => `You're verified 🎉
Start earning by sharing your Fixlo referral link:
${referralLink}`
};

// Anti-fraud configuration
const ANTI_FRAUD_CONFIG = {
  MAX_REFERRALS_PER_IP_PER_DAY: process.env.MAX_REFERRALS_PER_IP || 3,
  RATE_LIMIT_WINDOW_HOURS: 24
};

// In-memory storage for verification codes (in production, use Redis)
// Structure: { phone: { code: hashedCode, expires: timestamp } }
// ⚠️ WARNING: This in-memory storage has limitations:
// 1. All codes are lost if server restarts
// 2. Does not work in multi-server deployments
// 3. Memory usage grows until cleanup runs
// RECOMMENDATION: Implement Redis with TTL for production scalability
const verificationCodes = new Map();

/**
 * Mask phone number for logging
 * @param {string} phone - E.164 formatted phone number
 * @returns {string} - Masked phone (e.g., "+1******9953")
 */
function maskPhoneForLogging(phone) {
  if (!phone || typeof phone !== 'string') {
    return '<invalid>';
  }
  // Show country code + last 4 digits, mask the rest
  return phone.replace(/(\+\d{1,3})\d+(\d{4})/, '$1******$2');
}

// Periodic cleanup of expired verification codes (runs every 5 minutes)
// This prevents memory leaks from expired codes
const cleanupInterval = setInterval(() => {
  let cleanedCodesCount = 0;
  
  // Clean up expired verification codes
  for (const [key, value] of verificationCodes.entries()) {
    if (value.expires < Date.now()) {
      verificationCodes.delete(key);
      cleanedCodesCount++;
    }
  }
  
  if (cleanedCodesCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCodesCount} expired verification code(s)`);
  }
}, 5 * 60 * 1000); // Run every 5 minutes

// Clean up interval on process exit to prevent resource leaks
process.on('SIGINT', () => {
  clearInterval(cleanupInterval);
  process.exit(0);
});
process.on('SIGTERM', () => {
  clearInterval(cleanupInterval);
  process.exit(0);
});

/**
 * Get referral information for a pro
 * GET /api/referrals/info/:proId
 */
router.get('/info/:proId', async (req, res) => {
  try {
    const { proId } = req.params;
    
    const pro = await Pro.findById(proId);
    if (!pro) {
      return res.status(404).json({
        ok: false,
        error: 'Pro not found'
      });
    }
    
    // Get referral stats
    const stats = await Referral.getReferrerStats(proId);
    
    return res.json({
      ok: true,
      referralCode: pro.referralCode,
      referralUrl: pro.referralUrl,
      stats: {
        totalReferrals: pro.totalReferrals || stats.totalReferrals,
        completedReferrals: pro.completedReferrals || stats.completedReferrals,
        freeMonthsEarned: pro.freeMonthsEarned || stats.rewardsEarned,
        pendingReferrals: stats.pendingReferrals
      }
    });
    
  } catch (err) {
    console.error('❌ Error fetching referral info:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Track referral click
 * POST /api/referrals/track-click
 */
router.post('/track-click', async (req, res) => {
  try {
    const { referralCode, ip, deviceFingerprint } = req.body;
    
    if (!referralCode) {
      return res.status(400).json({
        ok: false,
        error: 'Referral code is required'
      });
    }
    
    // Find the referrer
    const referrer = await Pro.findOne({ referralCode: referralCode.toUpperCase() });
    if (!referrer) {
      return res.status(404).json({
        ok: false,
        error: 'Invalid referral code'
      });
    }
    
    // Create or update referral tracking
    const referral = await Referral.findOneAndUpdate(
      { referralCode: referralCode.toUpperCase(), referredUserId: null },
      {
        $set: {
          referralCode: referralCode.toUpperCase(),
          referrerId: referrer._id,
          clickedAt: new Date(),
          signupIp: ip,
          deviceFingerprint: deviceFingerprint
        }
      },
      { upsert: true, new: true }
    );
    
    console.log(`👆 Referral click tracked: ${referralCode} from IP ${ip}`);
    
    return res.json({
      ok: true,
      message: 'Referral click tracked',
      referralId: referral._id
    });
    
  } catch (err) {
    console.error('❌ Error tracking referral click:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Validate referral code and check for fraud
 * POST /api/referrals/validate
 */
router.post('/validate', async (req, res) => {
  try {
    const { referralCode, phone, email, ip } = req.body;
    
    if (!referralCode) {
      return res.status(400).json({
        ok: false,
        error: 'Referral code is required'
      });
    }
    
    // Find the referrer
    const referrer = await Pro.findOne({ referralCode: referralCode.toUpperCase() });
    if (!referrer) {
      return res.status(404).json({
        ok: false,
        valid: false,
        error: 'Invalid referral code'
      });
    }
    
    // Anti-fraud checks
    const fraudChecks = {
      valid: true,
      warnings: []
    };
    
    // Check if phone/email already used for referral
    if (phone || email) {
      const isDuplicate = await Referral.checkDuplicateReferral(phone, email);
      if (isDuplicate) {
        fraudChecks.valid = false;
        fraudChecks.warnings.push('Phone or email already used for a referral');
      }
    }
    
    // Check for self-referral (same phone/email as referrer)
    if (phone === referrer.phone || email === referrer.email) {
      fraudChecks.valid = false;
      fraudChecks.warnings.push('Self-referral not allowed');
    }
    
    // Check IP-based rate limiting (same IP multiple referrals)
    if (ip) {
      const windowStart = new Date(Date.now() - ANTI_FRAUD_CONFIG.RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000);
      const recentReferralsFromIP = await Referral.countDocuments({
        signupIp: ip,
        createdAt: { $gte: windowStart }
      });
      
      if (recentReferralsFromIP >= ANTI_FRAUD_CONFIG.MAX_REFERRALS_PER_IP_PER_DAY) {
        fraudChecks.valid = false;
        fraudChecks.warnings.push('Too many referrals from this IP address');
      }
    }
    
    return res.json({
      ok: true,
      valid: fraudChecks.valid,
      referrerId: referrer._id,
      referrerName: referrer.name,
      warnings: fraudChecks.warnings
    });
    
  } catch (err) {
    console.error('❌ Error validating referral:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Complete a referral and issue reward
 * POST /api/referrals/complete
 * 
 * Called when a referred user completes paid subscription
 */
router.post('/complete', async (req, res) => {
  try {
    const { 
      referralCode, 
      referredUserId, 
      referredSubscriptionId,
      country 
    } = req.body;
    
    if (!referralCode || !referredUserId || !referredSubscriptionId) {
      return res.status(400).json({
        ok: false,
        error: 'referralCode, referredUserId, and referredSubscriptionId are required'
      });
    }
    
    // Find the referrer
    const referrer = await Pro.findOne({ referralCode: referralCode.toUpperCase() });
    if (!referrer) {
      return res.status(404).json({
        ok: false,
        error: 'Invalid referral code'
      });
    }
    
    // Find the referred user
    const referredUser = await Pro.findById(referredUserId);
    if (!referredUser) {
      return res.status(404).json({
        ok: false,
        error: 'Referred user not found'
      });
    }
    
    // Check if referral already completed
    const existingReferral = await Referral.findOne({
      referralCode: referralCode.toUpperCase(),
      referredUserId: referredUserId,
      subscriptionStatus: { $in: ['completed', 'active'] }
    });
    
    if (existingReferral) {
      return res.status(400).json({
        ok: false,
        error: 'Referral already completed'
      });
    }
    
    // Final anti-fraud checks
    const isDuplicate = await Referral.checkDuplicateReferral(
      referredUser.phone,
      referredUser.email
    );
    
    if (isDuplicate) {
      console.warn(`⚠️ Fraud detected: Duplicate referral attempt for ${referredUser.email}`);
      return res.status(400).json({
        ok: false,
        error: 'This phone/email has already been used for a referral'
      });
    }
    
    // Self-referral check
    if (referrer._id.toString() === referredUserId.toString()) {
      console.warn(`⚠️ Fraud detected: Self-referral attempt by ${referrer.email}`);
      return res.status(400).json({
        ok: false,
        error: 'Self-referral not allowed'
      });
    }
    
    // Generate referral reward (Stripe coupon + promo code)
    console.log(`🎁 Generating referral reward for referrer ${referrer._id}`);
    const reward = await generateReferralReward(
      `${referrer._id}-${referredUserId}`,
      referrer._id
    );
    
    // Create or update referral record
    const referral = await Referral.findOneAndUpdate(
      {
        referralCode: referralCode.toUpperCase(),
        referrerId: referrer._id
      },
      {
        $set: {
          referredUserId: referredUserId,
          referredSubscriptionId: referredSubscriptionId,
          referredUserPhone: referredUser.phone,
          referredUserEmail: referredUser.email,
          country: country || 'US',
          subscriptionStatus: 'completed',
          rewardStatus: 'issued',
          promoCode: reward.promoCode,
          stripeCouponId: reward.couponId,
          stripePromoCodeId: reward.promoCodeId,
          rewardIssuedAt: new Date(),
          subscribedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );
    
    // Update referrer stats
    await Pro.findByIdAndUpdate(referrer._id, {
      $inc: {
        totalReferrals: 1,
        completedReferrals: 1,
        freeMonthsEarned: 1
      }
    });
    
    // Update referred user
    await Pro.findByIdAndUpdate(referredUserId, {
      $set: {
        referredBy: referrer._id,
        referredByCode: referralCode.toUpperCase()
      }
    });
    
    // Send notification to referrer
    console.log(`📱 Sending reward notification to referrer`);
    const notificationResult = await sendReferralRewardNotification(
      referrer,
      reward.promoCode,
      country || 'US'
    );
    
    if (notificationResult.success) {
      await Referral.findByIdAndUpdate(referral._id, {
        $set: {
          notificationSent: true,
          notificationSentAt: new Date(),
          notificationType: notificationResult.notificationType,
          notificationStatus: 'sent'
        }
      });
    } else {
      console.warn(`⚠️ Failed to send notification: ${notificationResult.reason || notificationResult.error}`);
      await Referral.findByIdAndUpdate(referral._id, {
        $set: {
          notificationStatus: 'failed',
          metadata: { notificationError: notificationResult.reason || notificationResult.error }
        }
      });
    }
    
    console.log(`✅ Referral completed successfully`);
    console.log(`   Referrer: ${referrer.name} (${referrer._id})`);
    console.log(`   Referred: ${referredUser.name} (${referredUser._id})`);
    console.log(`   Promo Code: ${reward.promoCode}`);
    
    return res.json({
      ok: true,
      message: 'Referral completed and reward issued',
      promoCode: reward.promoCode,
      notificationSent: notificationResult.success,
      referralId: referral._id
    });
    
  } catch (err) {
    console.error('❌ Referral completion error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Send verification code
 * POST /api/referrals/send-verification
 * 
 * SIMPLIFIED BEHAVIOR (NO DELIVERY CONFIRMATION):
 * 1. Sends verification code via requested method (SMS or WhatsApp)
 * 2. Returns success immediately when send is accepted
 * 3. NO delivery status polling required
 * 4. Frontend proceeds to verification step immediately
 * 
 * @param {string} phone - Phone number to send verification code to
 * @param {string} method - Optional: 'sms' (default) or 'whatsapp'
 */
router.post('/send-verification', async (req, res) => {
  try {
    const { phone, method = 'sms' } = req.body;

    console.log('📱 Referral verification request received');
    console.log(`   Requested method: ${method}`);

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    // Validate method parameter
    if (method !== 'whatsapp' && method !== 'sms') {
      return res.status(400).json({
        success: false,
        error: 'Invalid method. Must be "whatsapp" or "sms"'
      });
    }

    // Normalize phone number to E.164 format
    const normalizationResult = normalizePhoneToE164(phone);

    if (!normalizationResult.success) {
      console.error('❌ Referral verification: Phone normalization failed');
      console.error(`   Original phone: <redacted>`);
      console.error(`   Error: ${normalizationResult.error}`);
      return res.status(400).json({
        success: false,
        error: `Invalid phone number format: ${normalizationResult.error}`
      });
    }

    const normalizedPhone = normalizationResult.phone;

    // Mask phone for logging (show country code + last 4 digits)
    const maskedPhone = maskPhoneForLogging(normalizedPhone);
    
    console.log(`   Original phone input: <redacted>`);
    console.log(`   Normalized phone: ${maskedPhone}`);

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    // Store verification code with 15-minute expiration
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
    verificationCodes.set(normalizedPhone, {
      code: hashedCode,
      expires: expiresAt
    });

    // Prepare message
    const messageBody = `Fixlo: Your verification code is ${code}. Valid for 15 minutes. Reply STOP to opt out.`;

    // Send via requested method
    try {
      let channelUsed;
      let twilioMessage;

      if (method === 'sms') {
        console.log(`   Sending via SMS...`);
        twilioMessage = await sendSms(normalizedPhone, messageBody);
        channelUsed = 'sms';
        
        console.log(`✅ SMS verification code sent`);
        console.log(`   Phone: ${maskedPhone}`);
        console.log(`   Channel: SMS`);
        console.log(`   Message SID: ${twilioMessage.sid}`);
        
      } else {
        console.log(`   Sending via WhatsApp...`);
        twilioMessage = await sendWhatsAppMessage(normalizedPhone, messageBody);
        channelUsed = 'whatsapp';
        
        console.log(`✅ WhatsApp verification code sent`);
        console.log(`   Phone: ${maskedPhone}`);
        console.log(`   Channel: WhatsApp`);
        console.log(`   Message SID: ${twilioMessage.sid}`);
      }

      // Return success with messageSid for optional delivery polling
      return res.json({
        success: true,
        channel: channelUsed,
        messageSid: twilioMessage.sid,
        message: `Verification code sent via ${channelUsed}. Check your ${channelUsed === 'whatsapp' ? 'WhatsApp' : 'text'} messages.`
      });

    } catch (error) {
      // Send failed
      console.error(`❌ ${method.toUpperCase()} send FAILED`);
      console.error(`   Phone: ${maskedPhone}`);
      console.error(`   Error: ${error.message}`);
      console.error(`   Twilio Error Code: ${error.code || 'N/A'}`);

      // Check for configuration errors
      if (error.message && error.message.includes(CONFIGURATION_ERROR_MARKER)) {
        return res.status(503).json({
          success: false,
          message: 'Verification service is temporarily unavailable. Please try again later.'
        });
      }

      // WhatsApp-specific errors - suggest SMS fallback
      if (method === 'whatsapp') {
        return res.json({
          success: false,
          message: 'WhatsApp could not send the message. Try SMS instead.',
          suggestion: 'Try SMS instead'
        });
      }

      // SMS failed
      return res.status(500).json({
        success: false,
        message: 'Unable to send verification code. Please check your phone number and try again.'
      });
    }

  } catch (error) {
    // Final safety net
    console.error('❌ Unexpected verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.'
    });
  }
});

/**
 * Check delivery status of a verification message
 * GET /api/referrals/delivery-status/:messageSid
 * 
 * OPTIONAL ENDPOINT for delivery confirmation
 * - Returns JSON (never HTML)
 * - Gracefully handles invalid/missing messageSid
 * - Non-blocking - frontend should not depend on this
 */
router.get('/delivery-status/:messageSid', async (req, res) => {
  try {
    const { messageSid } = req.params;

    // Validate messageSid
    if (!messageSid || messageSid === 'undefined' || messageSid === 'null') {
      return res.status(400).json({
        success: false,
        reason: 'invalid_message_sid',
        error: 'Message SID is required and must be valid'
      });
    }

    // Get Twilio client
    const getTwilioClient = () => {
      const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
        return null;
      }
      return require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    };

    const client = getTwilioClient();
    
    if (!client) {
      return res.status(503).json({
        success: false,
        reason: 'service_unavailable',
        error: 'Twilio service is not configured'
      });
    }

    // Fetch message status from Twilio
    const message = await client.messages(messageSid).fetch();

    // Map Twilio status to our format
    const status = message.status;
    const isDelivered = status === 'delivered' || status === 'sent';
    const isFailed = status === 'failed' || status === 'undelivered';
    const isPending = status === 'queued' || status === 'sending' || status === 'accepted';

    return res.json({
      ok: true,
      success: true,
      messageSid: message.sid,
      status: status,
      isDelivered: isDelivered,
      isFailed: isFailed,
      isPending: isPending,
      errorCode: message.errorCode || null,
      errorMessage: message.errorMessage || null
    });

  } catch (error) {
    console.error('❌ Delivery status check error:', error.message);
    
    // Return JSON error (never HTML)
    return res.status(500).json({
      success: false,
      reason: 'fetch_failed',
      error: error.message || 'Failed to check delivery status'
    });
  }
});

/**
 * Verify code
 * POST /api/referrals/verify-code
 * 
 * CRITICAL DECOUPLING (per requirements):
 * 1. Validates verification code
 * 2. Marks phone as verified
 * 3. Generates referralCode and referralLink
 * 4. Fires SMS send (NEVER blocks on delivery)
 * 5. Returns success with referralCode and referralLink ONLY
 * 6. NO delivery status flags in response
 */
router.post('/verify-code', async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and verification code are required'
      });
    }

    // Normalize phone number
    const normalizationResult = normalizePhoneToE164(phone);

    if (!normalizationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
    }

    const normalizedPhone = normalizationResult.phone;
    const storedData = verificationCodes.get(normalizedPhone);

    // Check if code exists
    if (!storedData) {
      console.warn('⚠️ Verification attempt with no code sent');
      return res.status(400).json({
        success: false,
        error: 'No verification code found. Please request a new code.'
      });
    }

    // Check if code is expired
    if (storedData.expires < Date.now()) {
      verificationCodes.delete(normalizedPhone);
      console.warn('⚠️ Verification code expired');
      return res.status(400).json({
        success: false,
        error: 'Verification code has expired. Please request a new code.'
      });
    }

    // Verify code
    const hashedInputCode = crypto.createHash('sha256').update(code).digest('hex');
    
    if (hashedInputCode !== storedData.code) {
      console.warn('⚠️ Invalid verification code attempt');
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code. Please try again.'
      });
    }

    // ========================================
    // VERIFICATION SUCCESS - PROCEED
    // ========================================
    // Code is valid - remove it
    verificationCodes.delete(normalizedPhone);

    console.log('✅ Verification code validated successfully');
    console.log(`   Phone: ${maskPhoneForLogging(normalizedPhone)}`);

    // Create or fetch referrer AFTER successful verification
    const CommissionReferral = require('../models/CommissionReferral');
    
    let referrer = await CommissionReferral.findOne({ 
      referrerPhone: normalizedPhone 
    }).sort({ createdAt: -1 });

    if (!referrer) {
      // Generate unique referral code
      const generateReferralCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = 'FIXLO-';
        for (let i = 0; i < 5; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      let referralCode = generateReferralCode();
      let attempts = 0;
      const maxAttempts = 10;

      // Ensure unique code
      while (attempts < maxAttempts) {
        const existing = await CommissionReferral.findOne({ referralCode });
        if (!existing) break;
        referralCode = generateReferralCode();
        attempts++;
      }

      if (attempts >= maxAttempts) {
        // Fail gracefully - still return what we have
        console.error('❌ Failed to generate unique referral code after max attempts');
        return res.status(500).json({
          success: false,
          error: 'Failed to generate unique referral code. Please try again.'
        });
      }

      // Create new referrer
      const referrerId = `referrer_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      referrer = await CommissionReferral.create({
        referrerId,
        referrerEmail: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 11)}@fixlo.temp`,
        referrerName: 'Fixlo Referrer',
        referrerPhone: normalizedPhone,
        referralCode,
        commissionRate: 0.15,
        country: 'US',
        status: 'active' // Mark as active since verified
      });

      console.log(`✅ Created new referrer: ${referralCode} for phone ${maskPhoneForLogging(normalizedPhone)}`);
    }

    // Build referral link
    const baseUrl = process.env.CLIENT_URL || 'https://www.fixloapp.com';
    const referralLink = `${baseUrl}/join?ref=${referrer.referralCode}`;

    // ========================================
    // FIRE-AND-FORGET SMS SEND (NEVER BLOCKS)
    // ========================================
    // Send referral link via SMS - BEST EFFORT, NO BLOCKING
    const smsMessage = SMS_TEMPLATES.REFERRAL_LINK(referralLink);
    
    // Fire async - don't wait for completion
    // Wrapped to prevent unhandled promise rejections
    setImmediate(() => {
      (async () => {
        try {
          await sendSms(normalizedPhone, smsMessage);
          console.log(`✅ Referral link sent via SMS to ${maskPhoneForLogging(normalizedPhone)}`);
        } catch (smsError) {
          // Log error but don't fail - user already verified
          console.error(`⚠️ SMS send failed (non-blocking): ${smsError.message}`);
          console.error(`   Phone: ${maskPhoneForLogging(normalizedPhone)}`);
          console.error(`   User can still access link via UI`);
        }
      })().catch(err => {
        // Final safety net for any uncaught errors
        console.error(`⚠️ Unexpected error in SMS send: ${err.message}`);
      });
    });

    // ========================================
    // RETURN SUCCESS IMMEDIATELY
    // ========================================
    // CRITICAL: Return success BEFORE SMS delivery completes
    // Per requirements: NO delivery status flags
    console.log(`✅ Verification complete - returning success`);
    console.log(`   Referral code: ${referrer.referralCode}`);
    console.log(`   Referral link: ${referralLink}`);
    
    return res.json({
      success: true,
      verified: true,
      referralCode: referrer.referralCode,
      referralLink: referralLink
    });

  } catch (error) {
    console.error('❌ Verify code error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * Resend referral link via SMS
 * POST /api/referrals/resend-link
 * 
 * Allows user to manually resend referral link if not received
 */
router.post('/resend-link', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    // Normalize phone number
    const normalizationResult = normalizePhoneToE164(phone);

    if (!normalizationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
    }

    const normalizedPhone = normalizationResult.phone;
    const CommissionReferral = require('../models/CommissionReferral');
    
    // Find referrer by phone
    const referrer = await CommissionReferral.findOne({ 
      referrerPhone: normalizedPhone 
    }).sort({ createdAt: -1 });

    if (!referrer) {
      return res.status(404).json({
        success: false,
        error: 'Referrer not found. Please verify your phone number first.'
      });
    }

    // Build referral link
    const baseUrl = process.env.CLIENT_URL || 'https://www.fixloapp.com';
    const referralLink = `${baseUrl}/join?ref=${referrer.referralCode}`;

    // Send referral link via SMS (fire and forget - best effort)
    const smsMessage = SMS_TEMPLATES.REFERRAL_LINK(referralLink);
    
    // Wrapped to prevent unhandled promise rejections
    setImmediate(() => {
      (async () => {
        try {
          await sendSms(normalizedPhone, smsMessage);
          console.log(`✅ Referral link resent via SMS to ${maskPhoneForLogging(normalizedPhone)}`);
        } catch (smsError) {
          console.error(`⚠️ SMS resend failed: ${smsError.message}`);
          console.error(`   Phone: ${maskPhoneForLogging(normalizedPhone)}`);
        }
      })().catch(err => {
        // Final safety net for any uncaught errors
        console.error(`⚠️ Unexpected error in SMS resend: ${err.message}`);
      });
    });

    // Return success immediately
    return res.json({
      success: true,
      message: 'Referral link is being sent to your phone.'
    });

  } catch (error) {
    console.error('❌ Resend link error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * Get referral info for verified user
 * GET /api/referrals/me
 * Query params: phone (required)
 */
router.get('/me', async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({
        ok: false,
        error: 'Phone number is required'
      });
    }

    // Normalize phone number
    const normalizationResult = normalizePhoneToE164(phone);

    if (!normalizationResult.success) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid phone number format'
      });
    }

    const normalizedPhone = normalizationResult.phone;
    const CommissionReferral = require('../models/CommissionReferral');
    
    // Find referrer by phone
    const referrer = await CommissionReferral.findOne({ 
      referrerPhone: normalizedPhone 
    }).sort({ createdAt: -1 });

    if (!referrer) {
      return res.status(404).json({
        ok: false,
        error: 'Referrer not found'
      });
    }

    // Build referral link
    const baseUrl = process.env.CLIENT_URL || 'https://www.fixloapp.com';
    const referralLink = `${baseUrl}/join?ref=${referrer.referralCode}`;

    return res.json({
      ok: true,
      referralCode: referrer.referralCode,
      referralLink: referralLink
    });

  } catch (error) {
    console.error('❌ Get referral info error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * Health check endpoint for referral service
 * GET /api/referrals/health
 */
router.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'referrals',
    message: 'Referral service is operational'
  });
});

module.exports = router;