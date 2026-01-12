// server/routes/payouts.js
const express = require('express');
const router = express.Router();
const Payout = require('../models/Payout');
const CommissionReferral = require('../models/CommissionReferral');
const adminAuth = require('../middleware/adminAuth');

/**
 * COMPLIANCE: Payout System for Commission Referrals
 * 
 * CRITICAL RULES:
 * - Minimum payout: $25 USD (or local currency equivalent)
 * - Feature flag REFERRALS_ENABLED must be true
 * - Stripe Connect payouts only
 * - Social media post required
 * - Admin approval required
 * - Processing fees deducted from payout
 */

const MIN_PAYOUT_AMOUNT = 25; // $25 USD

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

// Apply feature flag to all routes
router.use(checkFeatureFlag);

/**
 * Request a payout
 * POST /api/payouts/request
 */
router.post('/request', async (req, res) => {
  try {
    const { 
      referrerEmail, 
      requestedAmount, // In cents
      socialMediaPostUrl,
      stripeConnectAccountId 
    } = req.body;
    
    if (!referrerEmail || !requestedAmount || !stripeConnectAccountId) {
      return res.status(400).json({
        ok: false,
        error: 'referrerEmail, requestedAmount, and stripeConnectAccountId are required'
      });
    }
    
    // Validate minimum payout amount
    const validation = Payout.validateMinimumAmount(requestedAmount);
    if (!validation.valid) {
      return res.status(400).json({
        ok: false,
        error: validation.message,
        minimumAmount: validation.minimumAmount
      });
    }
    
    // Verify social media post is provided
    if (!socialMediaPostUrl || socialMediaPostUrl.trim() === '') {
      return res.status(400).json({
        ok: false,
        error: 'At least one public social media post is required before payouts are unlocked'
      });
    }
    
    // Find referrer
    const referrer = await CommissionReferral.findOne({ 
      referrerEmail: referrerEmail.toLowerCase() 
    }).sort({ createdAt: -1 });
    
    if (!referrer) {
      return res.status(404).json({
        ok: false,
        error: 'Referrer not found'
      });
    }
    
    // Get available balance
    const stats = await CommissionReferral.getReferrerStats(referrer.referrerId);
    
    if (stats.availableBalance < requestedAmount) {
      return res.status(400).json({
        ok: false,
        error: `Insufficient balance. Available: $${(stats.availableBalance / 100).toFixed(2)}, Requested: $${(requestedAmount / 100).toFixed(2)}`
      });
    }
    
    // Get eligible referrals for this payout
    const eligibleReferrals = await CommissionReferral.find({
      referrerId: referrer.referrerId,
      status: 'eligible',
      payoutId: { $exists: false }
    });
    
    if (eligibleReferrals.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'No eligible referrals for payout'
      });
    }
    
    // Calculate processing fee (Stripe Connect fee: ~2.9% + $0.30)
    const processingFee = Math.round((requestedAmount * 0.029) + 30);
    const netAmount = requestedAmount - processingFee;
    
    // Create payout request
    const payout = await Payout.create({
      referrerId: referrer.referrerId,
      referrerEmail: referrer.referrerEmail,
      referrerName: referrer.referrerName,
      requestedAmount,
      currency: 'USD',
      processingFee,
      netAmount,
      commissionReferralIds: eligibleReferrals.map(r => r._id),
      stripeConnectAccountId,
      socialMediaVerified: true, // Will be manually verified by admin
      socialMediaPostUrl,
      status: 'pending'
    });
    
    // Link referrals to this payout
    await CommissionReferral.updateMany(
      { _id: { $in: eligibleReferrals.map(r => r._id) } },
      { $set: { payoutId: payout._id } }
    );
    
    console.log(`✅ Payout requested: ${referrerEmail}`);
    console.log(`   Amount: $${(requestedAmount / 100).toFixed(2)}`);
    console.log(`   Processing Fee: $${(processingFee / 100).toFixed(2)}`);
    console.log(`   Net: $${(netAmount / 100).toFixed(2)}`);
    
    return res.json({
      ok: true,
      message: 'Payout request submitted for admin approval',
      payout: {
        id: payout._id,
        requestedAmount: payout.requestedAmount,
        processingFee: payout.processingFee,
        netAmount: payout.netAmount,
        status: payout.status,
        requestedAt: payout.requestedAt
      }
    });
    
  } catch (err) {
    console.error('❌ Error requesting payout:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Get payout status
 * GET /api/payouts/status/:email
 */
router.get('/status/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const payouts = await Payout.find({
      referrerEmail: email.toLowerCase()
    }).sort({ createdAt: -1 }).limit(10);
    
    return res.json({
      ok: true,
      payouts: payouts.map(p => ({
        id: p._id,
        requestedAmount: p.requestedAmount,
        netAmount: p.netAmount,
        status: p.status,
        requestedAt: p.requestedAt,
        completedAt: p.completedAt,
        failureReason: p.failureReason
      }))
    });
    
  } catch (err) {
    console.error('❌ Error fetching payout status:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * ADMIN: Get all pending payouts
 * GET /api/payouts/admin/pending
 */
router.get('/admin/pending', adminAuth, async (req, res) => {
  try {
    const pendingPayouts = await Payout.find({
      status: 'pending'
    }).sort({ createdAt: -1 });
    
    return res.json({
      ok: true,
      payouts: pendingPayouts
    });
    
  } catch (err) {
    console.error('❌ Error fetching pending payouts:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * ADMIN: Approve payout
 * POST /api/payouts/admin/approve/:payoutId
 */
router.post('/admin/approve/:payoutId', adminAuth, async (req, res) => {
  try {
    const { payoutId } = req.params;
    const { adminEmail, notes } = req.body;
    
    const payout = await Payout.findById(payoutId);
    
    if (!payout) {
      return res.status(404).json({
        ok: false,
        error: 'Payout not found'
      });
    }
    
    if (payout.status !== 'pending') {
      return res.status(400).json({
        ok: false,
        error: `Cannot approve payout with status: ${payout.status}`
      });
    }
    
    // Validate minimum amount again
    const validation = Payout.validateMinimumAmount(payout.requestedAmount);
    if (!validation.valid) {
      return res.status(400).json({
        ok: false,
        error: validation.message
      });
    }
    
    // Update payout status
    payout.status = 'approved';
    payout.approvedBy = adminEmail;
    payout.approvedAt = new Date();
    payout.approvalNotes = notes;
    await payout.save();
    
    console.log(`✅ Payout approved by ${adminEmail}: ${payoutId}`);
    
    return res.json({
      ok: true,
      message: 'Payout approved',
      payout
    });
    
  } catch (err) {
    console.error('❌ Error approving payout:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * ADMIN: Reject payout
 * POST /api/payouts/admin/reject/:payoutId
 */
router.post('/admin/reject/:payoutId', adminAuth, async (req, res) => {
  try {
    const { payoutId } = req.params;
    const { adminEmail, reason } = req.body;
    
    const payout = await Payout.findById(payoutId);
    
    if (!payout) {
      return res.status(404).json({
        ok: false,
        error: 'Payout not found'
      });
    }
    
    if (payout.status !== 'pending') {
      return res.status(400).json({
        ok: false,
        error: `Cannot reject payout with status: ${payout.status}`
      });
    }
    
    // Update payout status
    payout.status = 'cancelled';
    payout.cancelledBy = adminEmail;
    payout.cancelledAt = new Date();
    payout.cancellationReason = reason;
    await payout.save();
    
    // Release commission referrals back to available
    await CommissionReferral.updateMany(
      { payoutId: payout._id },
      { $unset: { payoutId: 1 } }
    );
    
    console.log(`❌ Payout rejected by ${adminEmail}: ${payoutId}`);
    
    return res.json({
      ok: true,
      message: 'Payout rejected',
      payout
    });
    
  } catch (err) {
    console.error('❌ Error rejecting payout:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Health check
 * GET /api/payouts/health
 */
router.get('/health', (req, res) => {
  const enabled = process.env.REFERRALS_ENABLED === 'true';
  res.json({
    ok: true,
    service: 'payouts',
    enabled,
    minPayoutAmount: MIN_PAYOUT_AMOUNT,
    message: enabled ? 'Payout service is operational' : 'Payout service is disabled'
  });
});

module.exports = router;
