/**
 * Commission Referral Routes
 * 
 * API endpoints for commission-based referral system
 * Feature-flagged with REFERRALS_ENABLED environment variable
 */

const express = require('express');
const router = express.Router();
const CommissionReferrer = require('../models/CommissionReferrer');
const CommissionReferral = require('../models/CommissionReferral');
const CommissionSocialVerification = require('../models/CommissionSocialVerification');
const CommissionPayout = require('../models/CommissionPayout');
const Pro = require('../models/Pro');

// Feature flag check middleware
const checkFeatureFlag = (req, res, next) => {
  if (process.env.REFERRALS_ENABLED !== 'true') {
    return res.status(403).json({
      ok: false,
      error: 'Referral system is not enabled'
    });
  }
  next();
};

// Apply feature flag to all routes
router.use(checkFeatureFlag);

/**
 * Register as a referrer
 * POST /api/commission-referrals/register
 */
router.post('/register', async (req, res) => {
  try {
    const { email, name, phone, country, currency } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({
        ok: false,
        error: 'Email and name are required'
      });
    }
    
    // Check if email already registered
    const existing = await CommissionReferrer.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        ok: false,
        error: 'Email already registered as referrer'
      });
    }
    
    // Generate unique referral code
    const referralCode = await CommissionReferrer.generateReferralCode();
    
    // Create referrer
    const referrer = new CommissionReferrer({
      email: email.toLowerCase(),
      name,
      phone,
      country: country || 'US',
      currency: currency || 'USD',
      referralCode,
      signupIp: req.ip || req.headers['x-forwarded-for'],
      deviceFingerprint: req.body.deviceFingerprint,
      status: 'pending' // Pending until first social verification
    });
    
    referrer.referralUrl = referrer.getReferralUrl();
    await referrer.save();
    
    console.log(`✅ New referrer registered: ${email} - Code: ${referralCode}`);
    
    return res.json({
      ok: true,
      message: 'Successfully registered as referrer',
      referrer: {
        id: referrer._id,
        email: referrer.email,
        name: referrer.name,
        referralCode: referrer.referralCode,
        referralUrl: referrer.referralUrl,
        country: referrer.country,
        currency: referrer.currency
      }
    });
  } catch (err) {
    console.error('❌ Referrer registration error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Get referrer dashboard data
 * GET /api/commission-referrals/dashboard/:referrerId
 */
router.get('/dashboard/:referrerId', async (req, res) => {
  try {
    const { referrerId } = req.params;
    
    const referrer = await CommissionReferrer.findById(referrerId);
    if (!referrer) {
      return res.status(404).json({
        ok: false,
        error: 'Referrer not found'
      });
    }
    
    // Get recent referrals
    const referrals = await CommissionReferral.find({ referrerId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('proId', 'name email phone');
    
    // Get social verification status
    const socialVerification = await CommissionSocialVerification.findOne({
      referrerId,
      status: 'approved'
    });
    
    // Get pending payouts
    const pendingPayouts = await CommissionPayout.find({
      referrerId,
      status: { $in: ['pending', 'approved', 'processing'] }
    });
    
    return res.json({
      ok: true,
      referrer: {
        id: referrer._id,
        email: referrer.email,
        name: referrer.name,
        referralCode: referrer.referralCode,
        referralUrl: referrer.referralUrl,
        country: referrer.country,
        currency: referrer.currency,
        status: referrer.status,
        socialVerified: referrer.socialVerified,
        totalReferrals: referrer.totalReferrals,
        pendingReferrals: referrer.pendingReferrals,
        approvedReferrals: referrer.approvedReferrals,
        paidReferrals: referrer.paidReferrals,
        rejectedReferrals: referrer.rejectedReferrals,
        totalEarned: referrer.totalEarned,
        totalPaid: referrer.totalPaid,
        availableBalance: referrer.availableBalance,
        pendingBalance: referrer.pendingBalance
      },
      referrals: referrals.map(r => ({
        id: r._id,
        status: r.status,
        proName: r.proId ? r.proId.name : 'Pending signup',
        proEmail: r.proEmail,
        commissionAmount: r.commissionAmount,
        currency: r.currency,
        signedUpAt: r.signedUpAt,
        subscribedAt: r.subscribedAt,
        verificationDueDate: r.verificationDueDate,
        approvedAt: r.approvedAt,
        paidAt: r.paidAt,
        rejectionReason: r.rejectionReason,
        createdAt: r.createdAt
      })),
      socialVerified: !!socialVerification,
      pendingPayouts: pendingPayouts.map(p => ({
        id: p._id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        requestedAt: p.requestedAt,
        approvedAt: p.approvedAt
      }))
    });
  } catch (err) {
    console.error('❌ Dashboard error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Track referral click
 * POST /api/commission-referrals/track-click
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
    const referrer = await CommissionReferrer.findOne({ 
      referralCode: referralCode.toUpperCase(),
      status: 'active'
    });
    
    if (!referrer) {
      return res.status(404).json({
        ok: false,
        error: 'Invalid referral code'
      });
    }
    
    // Create or update referral tracking
    const referral = new CommissionReferral({
      referrerId: referrer._id,
      referralCode: referralCode.toUpperCase(),
      country: referrer.country,
      currency: referrer.currency,
      clickedAt: new Date(),
      signupIp: ip || req.ip || req.headers['x-forwarded-for'],
      deviceFingerprint: deviceFingerprint
    });
    
    await referral.save();
    
    console.log(`👆 Referral click tracked: ${referralCode} from IP ${ip}`);
    
    return res.json({
      ok: true,
      message: 'Referral click tracked',
      referralId: referral._id
    });
  } catch (err) {
    console.error('❌ Track click error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Validate referral code
 * POST /api/commission-referrals/validate
 */
router.post('/validate', async (req, res) => {
  try {
    const { referralCode, email, phone } = req.body;
    
    if (!referralCode) {
      return res.status(400).json({
        ok: false,
        error: 'Referral code is required'
      });
    }
    
    // Find the referrer
    const referrer = await CommissionReferrer.findOne({ 
      referralCode: referralCode.toUpperCase()
    });
    
    if (!referrer) {
      return res.status(404).json({
        ok: false,
        valid: false,
        error: 'Invalid referral code'
      });
    }
    
    if (referrer.status !== 'active') {
      return res.status(400).json({
        ok: false,
        valid: false,
        error: 'Referrer account is not active'
      });
    }
    
    // Check for duplicate Pro
    if (email || phone) {
      const isDuplicate = await CommissionReferral.checkDuplicatePro(email, phone);
      if (isDuplicate) {
        return res.json({
          ok: true,
          valid: false,
          error: 'This email or phone has already been referred'
        });
      }
      
      // Check if Pro already exists
      const existingPro = await Pro.findOne({
        $or: [
          { email: email },
          { phone: phone }
        ]
      });
      
      if (existingPro) {
        return res.json({
          ok: true,
          valid: false,
          error: 'This email or phone is already registered'
        });
      }
    }
    
    return res.json({
      ok: true,
      valid: true,
      referrerId: referrer._id,
      referrerName: referrer.name
    });
  } catch (err) {
    console.error('❌ Validate error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Submit social media verification
 * POST /api/commission-referrals/social-verify
 */
router.post('/social-verify', async (req, res) => {
  try {
    const { referrerId, platform, postUrl, screenshotUrl } = req.body;
    
    if (!referrerId || !platform || !postUrl) {
      return res.status(400).json({
        ok: false,
        error: 'referrerId, platform, and postUrl are required'
      });
    }
    
    const referrer = await CommissionReferrer.findById(referrerId);
    if (!referrer) {
      return res.status(404).json({
        ok: false,
        error: 'Referrer not found'
      });
    }
    
    // Create verification request
    const verification = new CommissionSocialVerification({
      referrerId,
      platform,
      postUrl,
      screenshotUrl,
      country: referrer.country
    });
    
    await verification.save();
    
    // Update referrer status to active (pending verification)
    if (referrer.status === 'pending') {
      referrer.status = 'active';
      await referrer.save();
    }
    
    console.log(`📱 Social verification submitted: ${referrerId} on ${platform}`);
    
    return res.json({
      ok: true,
      message: 'Social verification submitted for review',
      verificationId: verification._id
    });
  } catch (err) {
    console.error('❌ Social verify error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Request payout
 * POST /api/commission-referrals/request-payout
 */
router.post('/request-payout', async (req, res) => {
  try {
    const { referrerId, amount, payoutMethod } = req.body;
    
    if (!referrerId || !amount || !payoutMethod) {
      return res.status(400).json({
        ok: false,
        error: 'referrerId, amount, and payoutMethod are required'
      });
    }
    
    const referrer = await CommissionReferrer.findById(referrerId);
    if (!referrer) {
      return res.status(404).json({
        ok: false,
        error: 'Referrer not found'
      });
    }
    
    // Check social verification
    if (!referrer.socialVerified) {
      return res.status(400).json({
        ok: false,
        error: 'Social verification required before requesting payout'
      });
    }
    
    // Check available balance
    if (amount > referrer.availableBalance) {
      return res.status(400).json({
        ok: false,
        error: 'Insufficient balance'
      });
    }
    
    // Get approved referrals not yet paid
    const approvedReferrals = await CommissionReferral.find({
      referrerId,
      status: 'approved',
      payoutId: null
    }).sort({ approvedAt: 1 });
    
    // Select referrals up to requested amount
    let total = 0;
    const selectedReferrals = [];
    
    for (const referral of approvedReferrals) {
      if (total + referral.commissionAmount <= amount) {
        selectedReferrals.push(referral._id);
        total += referral.commissionAmount;
      }
      if (total >= amount) break;
    }
    
    if (total === 0) {
      return res.status(400).json({
        ok: false,
        error: 'No approved referrals available for payout'
      });
    }
    
    // Create payout request
    const payout = new CommissionPayout({
      referrerId,
      referralIds: selectedReferrals,
      amount: total,
      currency: referrer.currency,
      payoutMethod,
      country: referrer.country,
      status: 'pending'
    });
    
    // Calculate fees
    payout.calculateFees();
    await payout.save();
    
    // Update referrer pending balance
    referrer.pendingBalance += total;
    await referrer.save();
    
    console.log(`💰 Payout requested: ${referrerId} - ${referrer.currency} ${total}`);
    
    return res.json({
      ok: true,
      message: 'Payout request submitted for approval',
      payout: {
        id: payout._id,
        amount: payout.amount,
        currency: payout.currency,
        netAmount: payout.netAmount,
        fees: payout.totalFees,
        status: payout.status
      }
    });
  } catch (err) {
    console.error('❌ Payout request error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Health check
 * GET /api/commission-referrals/health
 */
router.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'commission-referrals',
    enabled: process.env.REFERRALS_ENABLED === 'true'
  });
});

module.exports = router;
