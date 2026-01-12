/**
 * Commission Referral Admin Routes
 * 
 * Admin endpoints for managing commission-based referrals
 * Requires admin authentication
 */

const express = require('express');
const router = express.Router();
const CommissionReferrer = require('../models/CommissionReferrer');
const CommissionReferral = require('../models/CommissionReferral');
const CommissionSocialVerification = require('../models/CommissionSocialVerification');
const CommissionPayout = require('../models/CommissionPayout');
const { verifyPendingReferrals } = require('../services/commissionVerification');

// Feature flag check
const checkFeatureFlag = (req, res, next) => {
  if (process.env.REFERRALS_ENABLED !== 'true') {
    return res.status(403).json({
      ok: false,
      error: 'Referral system is not enabled'
    });
  }
  next();
};

router.use(checkFeatureFlag);

/**
 * Get all referrers (with pagination)
 * GET /api/admin/commission-referrals/referrers
 */
router.get('/referrers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status;
    
    const query = status ? { status } : {};
    
    const referrers = await CommissionReferrer.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    const total = await CommissionReferrer.countDocuments(query);
    
    return res.json({
      ok: true,
      referrers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('❌ Admin referrers error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Get all referrals (with pagination and filters)
 * GET /api/admin/commission-referrals/referrals
 */
router.get('/referrals', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status;
    const referrerId = req.query.referrerId;
    
    const query = {};
    if (status) query.status = status;
    if (referrerId) query.referrerId = referrerId;
    
    const referrals = await CommissionReferral.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('referrerId', 'email name referralCode')
      .populate('proId', 'name email phone');
    
    const total = await CommissionReferral.countDocuments(query);
    
    return res.json({
      ok: true,
      referrals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('❌ Admin referrals error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Approve or reject referral manually
 * POST /api/admin/commission-referrals/referral/:id/review
 */
router.post('/referral/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason, adminEmail } = req.body; // action: 'approve' or 'reject'
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        ok: false,
        error: 'Action must be "approve" or "reject"'
      });
    }
    
    const referral = await CommissionReferral.findById(id);
    if (!referral) {
      return res.status(404).json({
        ok: false,
        error: 'Referral not found'
      });
    }
    
    if (action === 'approve') {
      // Calculate commission
      referral.calculateCommission();
      
      referral.status = 'approved';
      referral.approvedAt = new Date();
      referral.approvedBy = adminEmail || 'admin';
      referral.verifiedAt = new Date();
    } else {
      referral.status = 'rejected';
      referral.rejectionReason = 'admin_decision';
      referral.rejectionDetails = reason || 'Rejected by admin';
      referral.rejectedAt = new Date();
    }
    
    await referral.save();
    
    // Update referrer stats
    const CommissionReferrer = require('../models/CommissionReferrer');
    const referrer = await CommissionReferrer.findById(referral.referrerId);
    if (referrer) {
      await referrer.updateStats();
    }
    
    console.log(`✅ Referral ${action}d by admin: ${id}`);
    
    return res.json({
      ok: true,
      message: `Referral ${action}d successfully`,
      referral
    });
  } catch (err) {
    console.error('❌ Admin review error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Get pending social verifications
 * GET /api/admin/commission-referrals/social-verifications
 */
router.get('/social-verifications', async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    
    const verifications = await CommissionSocialVerification.find({ status })
      .sort({ createdAt: -1 })
      .populate('referrerId', 'email name referralCode');
    
    return res.json({
      ok: true,
      verifications
    });
  } catch (err) {
    console.error('❌ Social verifications error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Approve or reject social verification
 * POST /api/admin/commission-referrals/social-verification/:id/review
 */
router.post('/social-verification/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason, adminEmail } = req.body; // action: 'approve' or 'reject'
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        ok: false,
        error: 'Action must be "approve" or "reject"'
      });
    }
    
    const verification = await CommissionSocialVerification.findById(id);
    if (!verification) {
      return res.status(404).json({
        ok: false,
        error: 'Verification not found'
      });
    }
    
    verification.status = action === 'approve' ? 'approved' : 'rejected';
    verification.verifiedAt = new Date();
    verification.verifiedBy = adminEmail || 'admin';
    
    if (action === 'reject') {
      verification.rejectionReason = reason || 'Rejected by admin';
    }
    
    await verification.save();
    
    // If approved, update referrer
    if (action === 'approve') {
      const referrer = await CommissionReferrer.findById(verification.referrerId);
      if (referrer && !referrer.socialVerified) {
        referrer.socialVerified = true;
        referrer.socialVerifiedAt = new Date();
        await referrer.save();
      }
    }
    
    console.log(`✅ Social verification ${action}d: ${id}`);
    
    return res.json({
      ok: true,
      message: `Social verification ${action}d successfully`,
      verification
    });
  } catch (err) {
    console.error('❌ Social verification review error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Get payout queue
 * GET /api/admin/commission-referrals/payouts
 */
router.get('/payouts', async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    
    const payouts = await CommissionPayout.find({ status })
      .sort({ requestedAt: -1 })
      .populate('referrerId', 'email name referralCode country currency');
    
    return res.json({
      ok: true,
      payouts
    });
  } catch (err) {
    console.error('❌ Payouts error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Approve or reject payout
 * POST /api/admin/commission-referrals/payout/:id/review
 */
router.post('/payout/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason, adminEmail } = req.body; // action: 'approve' or 'reject'
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        ok: false,
        error: 'Action must be "approve" or "reject"'
      });
    }
    
    const payout = await CommissionPayout.findById(id);
    if (!payout) {
      return res.status(404).json({
        ok: false,
        error: 'Payout not found'
      });
    }
    
    if (action === 'approve') {
      payout.status = 'approved';
      payout.approvedAt = new Date();
      payout.approvedBy = adminEmail || 'admin';
      
      // Note: Actual payout processing (Stripe/PayPal) should be done separately
      // This just approves it for processing
      
    } else {
      payout.status = 'cancelled';
      payout.cancelledAt = new Date();
      payout.cancellationReason = reason || 'Cancelled by admin';
      
      // Restore referrer's pending balance
      const referrer = await CommissionReferrer.findById(payout.referrerId);
      if (referrer) {
        referrer.pendingBalance -= payout.amount;
        await referrer.save();
      }
    }
    
    await payout.save();
    
    console.log(`✅ Payout ${action}d: ${id}`);
    
    return res.json({
      ok: true,
      message: `Payout ${action}d successfully`,
      payout
    });
  } catch (err) {
    console.error('❌ Payout review error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Export referrals to CSV
 * GET /api/admin/commission-referrals/export
 */
router.get('/export', async (req, res) => {
  try {
    const status = req.query.status;
    const query = status ? { status } : {};
    
    const referrals = await CommissionReferral.find(query)
      .populate('referrerId', 'email name referralCode')
      .populate('proId', 'name email phone')
      .sort({ createdAt: -1 });
    
    // Generate CSV
    const headers = [
      'Referral ID',
      'Referrer Email',
      'Referrer Code',
      'Pro Name',
      'Pro Email',
      'Pro Phone',
      'Status',
      'Commission Amount',
      'Currency',
      'Signed Up',
      'Subscribed',
      'Verification Due',
      'Approved',
      'Paid',
      'Created'
    ].join(',');
    
    const rows = referrals.map(r => [
      r._id,
      r.referrerId ? r.referrerId.email : '',
      r.referralCode,
      r.proId ? r.proId.name : '',
      r.proEmail || '',
      r.proPhone || '',
      r.status,
      r.commissionAmount || 0,
      r.currency,
      r.signedUpAt ? r.signedUpAt.toISOString() : '',
      r.subscribedAt ? r.subscribedAt.toISOString() : '',
      r.verificationDueDate ? r.verificationDueDate.toISOString() : '',
      r.approvedAt ? r.approvedAt.toISOString() : '',
      r.paidAt ? r.paidAt.toISOString() : '',
      r.createdAt.toISOString()
    ].join(','));
    
    const csv = [headers, ...rows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=commission-referrals.csv');
    res.send(csv);
  } catch (err) {
    console.error('❌ Export error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Run manual verification (admin trigger)
 * POST /api/admin/commission-referrals/verify-now
 */
router.post('/verify-now', async (req, res) => {
  try {
    console.log('🚀 Admin triggered manual verification');
    const result = await verifyPendingReferrals();
    
    return res.json({
      ok: true,
      message: 'Verification complete',
      result
    });
  } catch (err) {
    console.error('❌ Manual verification error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * Get dashboard stats
 * GET /api/admin/commission-referrals/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const totalReferrers = await CommissionReferrer.countDocuments();
    const activeReferrers = await CommissionReferrer.countDocuments({ status: 'active' });
    const totalReferrals = await CommissionReferral.countDocuments();
    const pendingReferrals = await CommissionReferral.countDocuments({ status: 'pending' });
    const approvedReferrals = await CommissionReferral.countDocuments({ status: 'approved' });
    const paidReferrals = await CommissionReferral.countDocuments({ status: 'paid' });
    const rejectedReferrals = await CommissionReferral.countDocuments({ status: 'rejected' });
    const flaggedReferrals = await CommissionReferral.countDocuments({ status: 'flagged' });
    
    const pendingSocialVerifications = await CommissionSocialVerification.countDocuments({ status: 'pending' });
    const pendingPayouts = await CommissionPayout.countDocuments({ status: 'pending' });
    
    // Total commissions
    const commissionStats = await CommissionReferral.aggregate([
      { $match: { status: { $in: ['approved', 'paid'] } } },
      { 
        $group: { 
          _id: '$currency',
          totalApproved: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, '$commissionAmount', 0]
            }
          },
          totalPaid: {
            $sum: {
              $cond: [{ $eq: ['$status', 'paid'] }, '$commissionAmount', 0]
            }
          }
        } 
      }
    ]);
    
    return res.json({
      ok: true,
      stats: {
        referrers: {
          total: totalReferrers,
          active: activeReferrers
        },
        referrals: {
          total: totalReferrals,
          pending: pendingReferrals,
          approved: approvedReferrals,
          paid: paidReferrals,
          rejected: rejectedReferrals,
          flagged: flaggedReferrals
        },
        pending: {
          socialVerifications: pendingSocialVerifications,
          payouts: pendingPayouts
        },
        commissions: commissionStats
      }
    });
  } catch (err) {
    console.error('❌ Stats error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

module.exports = router;
