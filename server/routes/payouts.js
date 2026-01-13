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

// Import minimum payout amount from model to avoid duplication
const MIN_PAYOUT_AMOUNT = Payout.MIN_PAYOUT_AMOUNT;

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
    // Note: These values should be reviewed periodically as Stripe fees may change
    const STRIPE_PERCENTAGE_FEE = parseFloat(process.env.STRIPE_PERCENTAGE_FEE || '0.029'); // 2.9%
    const STRIPE_FIXED_FEE = parseFloat(process.env.STRIPE_FIXED_FEE_CENTS || '30'); // $0.30 in cents
    const processingFee = Math.round((requestedAmount * STRIPE_PERCENTAGE_FEE) + STRIPE_FIXED_FEE);
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
 * ADMIN: Execute approved payout via Stripe Connect
 * POST /api/payouts/admin/execute/:payoutId
 */
router.post('/admin/execute/:payoutId', adminAuth, async (req, res) => {
  try {
    const { payoutId } = req.params;
    const { adminEmail } = req.body;
    
    const payout = await Payout.findById(payoutId);
    
    if (!payout) {
      return res.status(404).json({
        ok: false,
        error: 'Payout not found'
      });
    }
    
    if (payout.status !== 'approved') {
      return res.status(400).json({
        ok: false,
        error: `Can only execute approved payouts. Current status: ${payout.status}`
      });
    }
    
    // Check for idempotency - don't execute twice
    if (payout.stripePayoutId || payout.stripeTransferId) {
      return res.status(400).json({
        ok: false,
        error: 'Payout has already been executed',
        stripePayoutId: payout.stripePayoutId,
        stripeTransferId: payout.stripeTransferId
      });
    }
    
    // Get Stripe instance
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Update status to processing
    payout.status = 'processing';
    payout.processingStartedAt = new Date();
    await payout.save();
    
    try {
      // Create transfer to Stripe Connect account
      const transfer = await stripe.transfers.create({
        amount: payout.netAmount,
        currency: payout.currency.toLowerCase(),
        destination: payout.stripeConnectAccountId,
        description: `Commission payout for ${payout.referrerEmail}`,
        metadata: {
          payoutId: payout._id.toString(),
          referrerId: payout.referrerId,
          referrerEmail: payout.referrerEmail,
          executedBy: adminEmail
        }
      });
      
      // Update payout with Stripe transfer info
      payout.stripeTransferId = transfer.id;
      payout.status = 'completed';
      payout.completedAt = new Date();
      await payout.save();
      
      // Mark commission referrals as paid
      await CommissionReferral.updateMany(
        { _id: { $in: payout.commissionReferralIds } },
        {
          $set: {
            status: 'paid',
            paidAt: new Date()
          }
        }
      );
      
      console.log(`✅ Payout executed successfully: ${payoutId}`);
      console.log(`   Transfer ID: ${transfer.id}`);
      console.log(`   Amount: $${(payout.netAmount / 100).toFixed(2)}`);
      console.log(`   Recipient: ${payout.referrerEmail}`);
      
      return res.json({
        ok: true,
        message: 'Payout executed successfully',
        payout: {
          id: payout._id,
          status: payout.status,
          stripeTransferId: payout.stripeTransferId,
          netAmount: payout.netAmount,
          completedAt: payout.completedAt
        }
      });
      
    } catch (stripeErr) {
      // Stripe error - mark payout as failed
      payout.status = 'failed';
      payout.failureReason = stripeErr.message;
      payout.failureCode = stripeErr.code;
      payout.retryCount += 1;
      await payout.save();
      
      console.error(`❌ Stripe payout failed: ${payoutId}`, stripeErr.message);
      
      return res.status(500).json({
        ok: false,
        error: 'Payout execution failed',
        stripeError: stripeErr.message,
        code: stripeErr.code
      });
    }
    
  } catch (err) {
    console.error('❌ Error executing payout:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Create Stripe Connect Express account onboarding link
 * POST /api/payouts/stripe-connect/onboard
 */
router.post('/stripe-connect/onboard', async (req, res) => {
  try {
    const { referrerEmail, refreshUrl, returnUrl } = req.body;
    
    if (!referrerEmail) {
      return res.status(400).json({
        ok: false,
        error: 'referrerEmail is required'
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
    
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    let accountId = referrer.stripeConnectAccountId;
    
    // Create Stripe Connect Express account if not exists
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: referrer.referrerEmail,
        capabilities: {
          transfers: { requested: true }
        },
        business_type: 'individual',
        metadata: {
          referrerId: referrer.referrerId,
          referrerEmail: referrer.referrerEmail,
          referralCode: referrer.referralCode
        }
      });
      
      accountId = account.id;
      
      // Save account ID to all referral records for this referrer
      await CommissionReferral.updateMany(
        { referrerId: referrer.referrerId },
        { $set: { stripeConnectAccountId: accountId } }
      );
      
      console.log(`✅ Created Stripe Connect account: ${accountId} for ${referrer.referrerEmail}`);
    }
    
    // Create account link for onboarding
    const clientUrl = process.env.CLIENT_URL || 'https://www.fixloapp.com';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl || `${clientUrl}/earn?refresh=true`,
      return_url: returnUrl || `${clientUrl}/earn?connected=true`,
      type: 'account_onboarding'
    });
    
    return res.json({
      ok: true,
      onboardingUrl: accountLink.url,
      accountId
    });
    
  } catch (err) {
    console.error('❌ Error creating Stripe Connect onboarding:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Get Stripe Connect account status
 * GET /api/payouts/stripe-connect/status/:email
 */
router.get('/stripe-connect/status/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // Find referrer
    const referrer = await CommissionReferral.findOne({ 
      referrerEmail: email.toLowerCase() 
    }).sort({ createdAt: -1 });
    
    if (!referrer || !referrer.stripeConnectAccountId) {
      return res.json({
        ok: true,
        connected: false,
        accountId: null
      });
    }
    
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const account = await stripe.accounts.retrieve(referrer.stripeConnectAccountId);
    
    return res.json({
      ok: true,
      connected: account.charges_enabled && account.payouts_enabled,
      accountId: account.id,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled
    });
    
  } catch (err) {
    console.error('❌ Error fetching Stripe Connect status:', err);
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
