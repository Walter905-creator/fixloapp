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

// Anti-fraud configuration
const ANTI_FRAUD_CONFIG = {
  MAX_REFERRALS_PER_IP_PER_DAY: process.env.MAX_REFERRALS_PER_IP || 3,
  RATE_LIMIT_WINDOW_HOURS: 24
};

// In-memory storage for verification codes (in production, use Redis)
// Structure: { phone: { code: hashedCode, expires: timestamp } }
const verificationCodes = new Map();

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
 * Send verification code via SMS/WhatsApp
 * POST /api/referrals/send-verification
 */
router.post('/send-verification', async (req, res) => {
  try {
    const { phone, method = 'sms' } = req.body;

    console.log('📱 Referral SMS request received');
    console.log(`   Method: ${method}`);

    if (!phone) {
      return res.status(400).json({
        ok: false,
        error: 'Phone number is required'
      });
    }

    // Normalize phone number to E.164 format
    const normalizationResult = normalizePhoneToE164(phone);

    if (!normalizationResult.success) {
      console.error('❌ Referral verification: Phone normalization failed');
      console.error(`   Original phone: <redacted>`);
      console.error(`   Error: ${normalizationResult.error}`);
      return res.status(400).json({
        ok: false,
        error: `Invalid phone number format: ${normalizationResult.error}`
      });
    }

    const normalizedPhone = normalizationResult.phone;

    // Mask phone for logging (show country code + last 4 digits)
    const maskedPhone = normalizedPhone.replace(/(\+\d{1,3})\d+(\d{4})/, '$1******$2');
    
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

    // Clean up expired codes periodically
    for (const [key, value] of verificationCodes.entries()) {
      if (value.expires < Date.now()) {
        verificationCodes.delete(key);
      }
    }

    // Prepare SMS message
    const message = `Fixlo: Your verification code is ${code}. Valid for 15 minutes. Reply STOP to opt out.`;

    // Send via SMS or WhatsApp
    try {
      console.log(`   Sending SMS via Twilio...`);
      
      let result;
      if (method === 'whatsapp') {
        result = await sendWhatsAppMessage(normalizedPhone, message);
      } else {
        result = await sendSms(normalizedPhone, message);
      }

      if (result.disabled) {
        console.error('❌ SMS delivery failed: Twilio service is disabled');
        return res.status(500).json({
          ok: false,
          error: 'SMS delivery failed. Service is temporarily unavailable.'
        });
      }

      console.log(`✅ Verification code sent successfully`);
      console.log(`   Twilio message SID: ${result.sid}`);
      console.log(`   Phone: ${maskedPhone}`);

      return res.json({
        ok: true,
        message: 'Verification code sent'
      });

    } catch (smsError) {
      console.error('❌ SMS delivery failed');
      console.error(`   Phone: ${maskedPhone}`);
      console.error(`   Error: ${smsError.message}`);

      return res.status(500).json({
        ok: false,
        error: 'SMS delivery failed. Please try again or contact support.'
      });
    }

  } catch (error) {
    console.error('❌ Send verification error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Server error'
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
    return res.json({
      ok: true,
      message: 'Verification successful'
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