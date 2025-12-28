// server/routes/referrals.js
const express = require('express');
const router = express.Router();
const Pro = require('../models/Pro');
const Referral = require('../models/Referral');
const { generateReferralReward } = require('../services/referralPromoCode');
const { sendReferralRewardNotification } = require('../services/referralNotification');

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