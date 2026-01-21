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

// In-memory storage for delivery status tracking
// Structure: { messageSid: { phone, method, status, errorCode, errorMessage, timestamp } }
// ⚠️ WARNING: Same limitations as verificationCodes - use Redis in production
const deliveryStatuses = new Map();

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

// Periodic cleanup of expired verification codes and delivery statuses (runs every 5 minutes)
// This prevents memory leaks from expired codes and old delivery statuses
const cleanupInterval = setInterval(() => {
  let cleanedCodesCount = 0;
  let cleanedStatusCount = 0;
  
  // Clean up expired verification codes
  for (const [key, value] of verificationCodes.entries()) {
    if (value.expires < Date.now()) {
      verificationCodes.delete(key);
      cleanedCodesCount++;
    }
  }
  
  // Clean up old delivery statuses (older than 1 hour)
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [key, value] of deliveryStatuses.entries()) {
    if (value.timestamp < oneHourAgo) {
      deliveryStatuses.delete(key);
      cleanedStatusCount++;
    }
  }
  
  if (cleanedCodesCount > 0 || cleanedStatusCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCodesCount} expired verification code(s) and ${cleanedStatusCount} old delivery status(es)`);
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
 * Send verification code with delivery confirmation
 * POST /api/referrals/send-verification
 * 
 * ENHANCED PRODUCTION BEHAVIOR:
 * 1. Attempts WhatsApp delivery first with status callback tracking
 * 2. Returns message SID for delivery status polling
 * 3. Frontend checks delivery status before showing success
 * 4. SMS fallback is USER-INITIATED (not automatic)
 * 5. Clear failure messages with SMS retry option
 * 
 * @param {string} phone - Phone number to send verification code to
 * @param {string} method - Optional: 'whatsapp' (default) or 'sms' (user-selected fallback)
 */
router.post('/send-verification', async (req, res) => {
  try {
    const { phone, method = 'whatsapp' } = req.body;

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

    // Build status callback URL (for production delivery tracking)
    const baseUrl = process.env.API_BASE_URL || process.env.SERVER_URL || 'https://fixloapp.onrender.com';
    const statusCallbackUrl = `${baseUrl}/api/referrals/sms-status-callback`;

    // Send via requested method
    try {
      let result;
      let channelUsed;

      if (method === 'sms') {
        // User explicitly chose SMS
        console.log(`   Sending via SMS (user-selected)...`);
        result = await sendSms(normalizedPhone, messageBody, { statusCallback: statusCallbackUrl });
        channelUsed = 'sms';
        
        console.log(`✅ SMS verification code SEND accepted`);
        console.log(`   Twilio message SID: ${result.sid}`);
        console.log(`   Phone: ${maskedPhone}`);
        console.log(`   Channel: SMS`);
        
      } else {
        // Default: Try WhatsApp
        console.log(`   Sending via WhatsApp...`);
        result = await sendWhatsAppMessage(normalizedPhone, messageBody, { statusCallback: statusCallbackUrl });
        channelUsed = 'whatsapp';
        
        console.log(`✅ WhatsApp verification code SEND accepted`);
        console.log(`   Twilio message SID: ${result.sid}`);
        console.log(`   Phone: ${maskedPhone}`);
        console.log(`   Channel: WhatsApp`);
      }

      // Initialize delivery status tracking
      deliveryStatuses.set(result.sid, {
        phone: normalizedPhone,
        method: channelUsed,
        status: 'queued', // Initial status
        errorCode: null,
        errorMessage: null,
        timestamp: Date.now()
      });

      // Return success with message SID for status polling
      return res.json({
        success: true,
        channelUsed,
        messageSid: result.sid,
        message: `Verification code sent via ${channelUsed}. Waiting for delivery confirmation...`,
        // Frontend should poll /delivery-status/:messageSid to check delivery
        pollUrl: `/api/referrals/delivery-status/${result.sid}`
      });

    } catch (error) {
      // Send failed
      console.error(`❌ ${method.toUpperCase()} delivery FAILED`);
      console.error(`   Phone: ${maskedPhone}`);
      console.error(`   Error: ${error.message}`);
      console.error(`   Twilio Error Code: ${error.code || 'N/A'}`);

      // Check for configuration errors
      if (error.message && error.message.includes(CONFIGURATION_ERROR_MARKER)) {
        return res.status(503).json({
          success: false,
          channel: method,
          reason: 'SERVICE_UNAVAILABLE',
          message: 'Verification service is temporarily unavailable. Please try again later.',
          suggestion: null
        });
      }

      // WhatsApp-specific errors
      if (method === 'whatsapp') {
        // Suggest SMS as fallback
        return res.json({
          success: false,
          channel: 'whatsapp',
          reason: 'NOT_DELIVERED',
          errorCode: error.code || null,
          message: 'WhatsApp could not deliver the message.',
          suggestion: 'Try SMS instead'
        });
      }

      // SMS failed (both channels now exhausted)
      return res.status(500).json({
        success: false,
        channel: 'sms',
        reason: 'DELIVERY_FAILED',
        errorCode: error.code || null,
        message: 'Unable to send verification code. Please check your phone number and try again.'
      });
    }

  } catch (error) {
    // Final safety net
    console.error('❌ Unexpected verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Something went wrong. Please try again.'
    });
  }
});

/**
 * Verify code
 * POST /api/referrals/verify-code
 */
router.post('/verify-code', async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        ok: false,
        error: 'Phone number and verification code are required'
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
    const storedData = verificationCodes.get(normalizedPhone);

    // Check if code exists
    if (!storedData) {
      console.warn('⚠️ Verification attempt with no code sent');
      return res.status(400).json({
        ok: false,
        error: 'No verification code found. Please request a new code.'
      });
    }

    // Check if code is expired
    if (storedData.expires < Date.now()) {
      verificationCodes.delete(normalizedPhone);
      console.warn('⚠️ Verification code expired');
      return res.status(400).json({
        ok: false,
        error: 'Verification code has expired. Please request a new code.'
      });
    }

    // Verify code
    const hashedInputCode = crypto.createHash('sha256').update(code).digest('hex');
    
    if (hashedInputCode !== storedData.code) {
      console.warn('⚠️ Invalid verification code attempt');
      return res.status(400).json({
        ok: false,
        error: 'Invalid verification code. Please try again.'
      });
    }

    // Code is valid - remove it
    verificationCodes.delete(normalizedPhone);

    console.log('✅ Verification code validated successfully');

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
        return res.status(500).json({
          ok: false,
          error: 'Failed to generate unique referral code'
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
        status: 'pending'
      });

      console.log(`✅ Created new referrer: ${referralCode} for phone ${maskPhoneForLogging(normalizedPhone)}`);
    }

    // Build referral link
    const baseUrl = process.env.CLIENT_URL || 'https://www.fixloapp.com';
    const referralLink = `${baseUrl}/join?ref=${referrer.referralCode}`;

    // ========================================
    // CRITICAL: GUARANTEED SMS DELIVERY
    // ========================================
    // Send referral link via SMS (PRIMARY - GUARANTEED)
    const smsMessage = `You're verified 🎉
Share your Fixlo referral link and start earning:
${referralLink}`;

    let smsDelivered = false;
    try {
      await sendSms(normalizedPhone, smsMessage);
      smsDelivered = true;
      console.log(`✅ Referral link sent via SMS to ${maskPhoneForLogging(normalizedPhone)}`);
    } catch (smsError) {
      // Log SMS failure but DO NOT block verification success
      console.error(`⚠️ SMS delivery failed (non-blocking): ${smsError.message}`);
    }

    // ========================================
    // OPTIONAL: WHATSAPP DELIVERY (BEST-EFFORT)
    // ========================================
    // Send referral link via WhatsApp (SECONDARY - OPTIONAL)
    // This is best-effort and failure does NOT affect the response
    let whatsappDelivered = false;
    try {
      await sendWhatsAppMessage(normalizedPhone, smsMessage);
      whatsappDelivered = true;
      console.log(`✅ Referral link sent via WhatsApp to ${maskPhoneForLogging(normalizedPhone)}`);
    } catch (whatsappError) {
      // WhatsApp failure is expected and does not affect flow
      console.log(`ℹ️ WhatsApp delivery skipped: ${whatsappError.message}`);
    }

    // Return success ONLY after attempting SMS delivery
    // Note: Even if SMS fails, we return success because phone is verified
    return res.json({
      ok: true,
      verified: true,
      referralCode: referrer.referralCode,
      referralLink: referralLink,
      smsDelivered,
      whatsappDelivered
    });

  } catch (error) {
    console.error('❌ Verify code error:', error);
    return res.status(500).json({
      ok: false,
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
 * Twilio status callback endpoint
 * POST /api/referrals/sms-status-callback
 * 
 * Receives delivery status updates from Twilio for SMS and WhatsApp messages
 * Status transitions: queued → sending → sent → delivered / failed / undelivered
 */
router.post('/sms-status-callback', (req, res) => {
  try {
    const {
      MessageSid,
      MessageStatus,
      To,
      ErrorCode,
      ErrorMessage,
      From
    } = req.body;

    // Determine channel from 'From' field
    const channel = From && From.includes('whatsapp:') ? 'whatsapp' : 'sms';
    
    // Mask phone for logging
    const maskedPhone = To ? maskPhoneForLogging(To.replace('whatsapp:', '')) : '<unknown>';
    
    console.log(`📬 Twilio status callback received`);
    console.log(`   Message SID: ${MessageSid}`);
    console.log(`   Status: ${MessageStatus}`);
    console.log(`   Channel: ${channel}`);
    console.log(`   To: ${maskedPhone}`);
    
    if (ErrorCode || ErrorMessage) {
      console.error(`   Error Code: ${ErrorCode}`);
      console.error(`   Error Message: ${ErrorMessage}`);
    }

    // Update delivery status in memory
    const existingStatus = deliveryStatuses.get(MessageSid);
    deliveryStatuses.set(MessageSid, {
      phone: To ? To.replace('whatsapp:', '') : existingStatus?.phone || '',
      method: channel,
      status: MessageStatus,
      errorCode: ErrorCode || null,
      errorMessage: ErrorMessage || null,
      timestamp: Date.now()
    });

    // Acknowledge receipt to Twilio
    res.sendStatus(200);
    
  } catch (error) {
    console.error('❌ Error processing Twilio status callback:', error);
    res.sendStatus(500);
  }
});

/**
 * Check delivery status for a message
 * GET /api/referrals/delivery-status/:messageSid
 */
router.get('/delivery-status/:messageSid', (req, res) => {
  try {
    const { messageSid } = req.params;
    
    if (!messageSid) {
      return res.status(400).json({
        ok: false,
        error: 'Message SID is required'
      });
    }

    const status = deliveryStatuses.get(messageSid);
    
    if (!status) {
      return res.status(404).json({
        ok: false,
        error: 'Delivery status not found',
        messageSid
      });
    }

    // Determine if delivery was successful
    const isDelivered = status.status === 'delivered' || status.status === 'read';
    const isFailed = status.status === 'failed' || status.status === 'undelivered';
    const isPending = status.status === 'queued' || status.status === 'sending' || status.status === 'sent';

    return res.json({
      ok: true,
      messageSid,
      status: status.status,
      method: status.method,
      isDelivered,
      isFailed,
      isPending,
      errorCode: status.errorCode,
      errorMessage: status.errorMessage,
      timestamp: status.timestamp
    });

  } catch (error) {
    console.error('❌ Error checking delivery status:', error);
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