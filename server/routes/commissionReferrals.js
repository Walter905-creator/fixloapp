// server/routes/commissionReferrals.js
const express = require('express');
const router = express.Router();
const CommissionReferral = require('../models/CommissionReferral');
const Pro = require('../models/Pro');
const Payout = require('../models/Payout');
const requireAuth = require('../middleware/requireAuth');

/**
 * COMPLIANCE: Commission Referral System
 * 
 * CRITICAL RULES:
 * - Feature flag REFERRALS_ENABLED must be true
 * - Anyone can be a referrer (no Pro account required)
 * - Commission eligible after 30 days active
 * - Minimum payout: $25 USD
 * - Stripe Connect payouts only
 * - Social media post required
 * - This is NOT employment
 */

/**
 * Health check - MUST be defined before feature flag middleware
 * GET /api/commission-referrals/health
 */
router.get('/health', (req, res) => {
  const enabled = process.env.REFERRALS_ENABLED === 'true';
  res.json({
    ok: true,
    service: 'commission-referrals',
    enabled,
    message: enabled ? 'Commission referral service is operational' : 'Commission referral service is disabled'
  });
});

// Feature flag middleware
const checkFeatureFlag = (req, res, next) => {
  const enabled = process.env.REFERRALS_ENABLED === 'true';
  if (!enabled) {
    return res.status(403).json({
      ok: false,
      error: 'Commission referral feature is not enabled'
    });
  }
  next();
};

// Apply feature flag to all routes EXCEPT /health (which is already defined above)
router.use(checkFeatureFlag);

/**
 * Get authenticated user's referral info
 * GET /api/commission-referrals/referrer/me
 * Requires authentication
 */
router.get('/referrer/me', requireAuth, async (req, res) => {
  try {
    // Get user email from JWT token
    const userEmail = req.user?.email;
    
    if (!userEmail) {
      return res.status(400).json({
        ok: false,
        error: 'Email not found in token'
      });
    }
    
    // Find referrer by email
    let referrer = await CommissionReferral.findOne({ 
      referrerEmail: userEmail.toLowerCase() 
    }).sort({ createdAt: -1 });
    
    if (!referrer) {
      // User doesn't have a referral account yet - auto-create one
      const generateCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = 'FIXLO-REF-';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };
      
      let referralCode = generateCode();
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        const existing = await CommissionReferral.findOne({ referralCode });
        if (!existing) break;
        referralCode = generateCode();
        attempts++;
      }
      
      if (attempts >= maxAttempts) {
        return res.status(500).json({
          ok: false,
          error: 'Failed to generate unique referral code'
        });
      }
      
      // Create new referrer
      const referrerId = `referrer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const userName = req.user?.name || 'Fixlo User';
      
      // Default to US if no country in user data
      const country = req.user?.country || 'US';
      const commissionRate = country === 'US' ? 0.20 : 0.15;
      
      referrer = await CommissionReferral.create({
        referrerId,
        referrerEmail: userEmail.toLowerCase(),
        referrerName: userName,
        referralCode,
        commissionRate,
        country,
        status: 'pending'
      });
      
      console.log(`✅ Auto-created referral account for authenticated user: ${userEmail} (${referralCode})`);
    }
    
    // Return referrer info
    return res.json({
      ok: true,
      referralCode: referrer.referralCode,
      referralUrl: `${process.env.CLIENT_URL || 'https://www.fixloapp.com'}/join?commission_ref=${referrer.referralCode}`
    });
    
  } catch (err) {
    console.error('❌ Error fetching authenticated user referral info:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Create a referrer account / Get referrer info
 * POST /api/commission-referrals/register
 */
router.post('/register', async (req, res) => {
  try {
    const { email, name, phone, country = 'US' } = req.body;
    
    if (!email) {
      return res.status(400).json({
        ok: false,
        error: 'Email is required'
      });
    }
    
    // Check if referrer already exists
    let referrer = await CommissionReferral.findOne({ 
      referrerEmail: email.toLowerCase() 
    }).sort({ createdAt: -1 });
    
    if (referrer) {
      // Return existing referrer info
      const stats = await CommissionReferral.getReferrerStats(referrer.referrerId);
      
      return res.json({
        ok: true,
        referrer: {
          referrerId: referrer.referrerId,
          referralCode: referrer.referralCode,
          referralUrl: `${process.env.CLIENT_URL || 'https://www.fixloapp.com'}/join?commission_ref=${referrer.referralCode}`,
          email: referrer.referrerEmail,
          name: referrer.referrerName
        },
        stats
      });
    }
    
    // Generate unique referral code
    const generateCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = 'EARN-';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };
    
    let referralCode = generateCode();
    let attempts = 0;
    const maxAttempts = 10;
    
    // Simple collision detection with database queries
    // Note: For high-scale scenarios, consider using database-level unique constraints
    // with try/catch or pre-generating a pool of codes for better performance
    while (attempts < maxAttempts) {
      const existing = await CommissionReferral.findOne({ referralCode });
      if (!existing) break;
      referralCode = generateCode();
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      return res.status(500).json({
        ok: false,
        error: 'Failed to generate unique referral code'
      });
    }
    
    // Create new referrer
    const referrerId = `referrer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine commission rate based on country
    const commissionRate = country === 'US' ? 0.20 : 0.15; // 20% US, 15% other
    
    const newReferrer = await CommissionReferral.create({
      referrerId,
      referrerEmail: email.toLowerCase(),
      referrerName: name,
      referrerPhone: phone,
      referralCode,
      commissionRate,
      country,
      status: 'pending'
    });
    
    const stats = await CommissionReferral.getReferrerStats(referrerId);
    
    console.log(`✅ New commission referrer registered: ${email} (${referralCode})`);
    
    return res.json({
      ok: true,
      referrer: {
        referrerId: newReferrer.referrerId,
        referralCode: newReferrer.referralCode,
        referralUrl: `${process.env.CLIENT_URL || 'https://www.fixloapp.com'}/join?commission_ref=${newReferrer.referralCode}`,
        email: newReferrer.referrerEmail,
        name: newReferrer.referrerName,
        commissionRate: newReferrer.commissionRate
      },
      stats
    });
    
  } catch (err) {
    console.error('❌ Error registering commission referrer:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Get referrer dashboard data
 * GET /api/commission-referrals/dashboard/:email
 */
router.get('/dashboard/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // Find referrer's referrals
    const referrer = await CommissionReferral.findOne({ 
      referrerEmail: email.toLowerCase() 
    }).sort({ createdAt: -1 });
    
    if (!referrer) {
      return res.status(404).json({
        ok: false,
        error: 'Referrer not found'
      });
    }
    
    // Get stats
    const stats = await CommissionReferral.getReferrerStats(referrer.referrerId);
    
    // Get all referrals
    const referrals = await CommissionReferral.find({
      referrerId: referrer.referrerId
    }).sort({ createdAt: -1 }).limit(50);
    
    // Get payout history
    const payouts = await Payout.find({
      referrerId: referrer.referrerId
    }).sort({ createdAt: -1 }).limit(20);
    
    return res.json({
      ok: true,
      referrer: {
        referrerId: referrer.referrerId,
        referralCode: referrer.referralCode,
        referralUrl: `${process.env.CLIENT_URL || 'https://www.fixloapp.com'}/join?commission_ref=${referrer.referralCode}`,
        email: referrer.referrerEmail,
        name: referrer.referrerName,
        commissionRate: referrer.commissionRate,
        stripeConnectAccountId: referrer.stripeConnectAccountId
      },
      stats,
      referrals: referrals.map(r => ({
        id: r._id,
        referredProEmail: r.referredProEmail,
        status: r.status,
        commissionAmount: r.commissionAmount,
        is30DaysComplete: r.is30DaysComplete,
        eligibleDate: r.eligibleDate,
        createdAt: r.createdAt
      })),
      payouts: payouts.map(p => ({
        id: p._id,
        requestedAmount: p.requestedAmount,
        netAmount: p.netAmount,
        status: p.status,
        requestedAt: p.requestedAt,
        completedAt: p.completedAt
      }))
    });
    
  } catch (err) {
    console.error('❌ Error fetching referrer dashboard:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Track referral when Pro signs up with commission code
 * POST /api/commission-referrals/track
 */
router.post('/track', async (req, res) => {
  try {
    const { 
      referralCode, 
      proId, 
      proEmail, 
      subscriptionId, 
      subscriptionAmount,
      country = 'US'
    } = req.body;
    
    if (!referralCode || !proId || !subscriptionId) {
      return res.status(400).json({
        ok: false,
        error: 'referralCode, proId, and subscriptionId are required'
      });
    }
    
    // Find the referrer
    const referrer = await CommissionReferral.findOne({ 
      referralCode: referralCode.toUpperCase() 
    });
    
    if (!referrer) {
      return res.status(404).json({
        ok: false,
        error: 'Invalid referral code'
      });
    }
    
    // Check for duplicate
    const isDuplicate = await CommissionReferral.checkDuplicateReferral(proEmail);
    if (isDuplicate) {
      console.warn(`⚠️ Duplicate commission referral attempt: ${proEmail}`);
      return res.status(400).json({
        ok: false,
        error: 'This email has already been referred'
      });
    }
    
    // Calculate commission using precise rounding for financial calculations
    // Ensures no precision loss in commission amounts
    const commissionAmount = Math.round(subscriptionAmount * referrer.commissionRate * 100) / 100;
    
    // Calculate 30-day mark date
    const thirtyDayMarkDate = new Date();
    thirtyDayMarkDate.setDate(thirtyDayMarkDate.getDate() + 30);
    
    // Create referral tracking record
    const newReferral = await CommissionReferral.create({
      referrerId: referrer.referrerId,
      referrerEmail: referrer.referrerEmail,
      referrerName: referrer.referrerName,
      referralCode: referralCode.toUpperCase(),
      referredProId: proId,
      referredProEmail: proEmail,
      referredSubscriptionId: subscriptionId,
      subscriptionStartDate: new Date(),
      thirtyDayMarkDate,
      is30DaysComplete: false,
      commissionRate: referrer.commissionRate,
      monthlySubscriptionAmount: subscriptionAmount,
      commissionAmount,
      currency: 'USD',
      country,
      status: 'active'
    });
    
    console.log(`✅ Commission referral tracked: ${referralCode} -> ${proEmail}`);
    console.log(`   Commission: $${(commissionAmount / 100).toFixed(2)} (${referrer.commissionRate * 100}%)`);
    console.log(`   Eligible on: ${thirtyDayMarkDate.toDateString()}`);
    
    return res.json({
      ok: true,
      message: 'Commission referral tracked',
      referralId: newReferral._id,
      commissionAmount,
      eligibleDate: thirtyDayMarkDate
    });
    
  } catch (err) {
    console.error('❌ Error tracking commission referral:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

module.exports = router;
