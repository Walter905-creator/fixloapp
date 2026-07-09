/**
 * Recruiter Admin Routes
 *
 * Requires admin authentication (x-admin-key header or requireAdmin middleware).
 *
 * GET    /api/admin/recruiters                — list/search recruiters
 * GET    /api/admin/recruiters/:id            — recruiter detail
 * PATCH  /api/admin/recruiters/:id/status     — suspend / activate
 * GET    /api/admin/recruiter-referrals       — all referrals (pro sign-ups)
 * GET    /api/admin/recruiter-commissions     — all commissions
 * PATCH  /api/admin/recruiter-commissions/:id — approve/reject/cancel/hold
 * GET    /api/admin/recruiter-payouts         — all payouts
 * GET    /api/admin/recruiter-analytics       — aggregated analytics
 */

const router = require('express').Router();
const requireAdmin = require('../middleware/requireAdmin');
const RecruiterProfile = require('../models/RecruiterProfile');
const RecruiterReferral = require('../models/RecruiterReferral');
const RecruiterCommission = require('../models/RecruiterCommission');
const RecruiterPayout = require('../models/RecruiterPayout');

/**
 * Escape special regex characters to prevent NoSQL injection via $regex.
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const VALID_RECRUITER_STATUSES = ['active', 'suspended', 'pending_review'];
const VALID_REFERRAL_STATUSES = ['pending', 'active', 'paid', 'cancelled', 'fraud_review'];
const VALID_COMMISSION_STATUSES = ['pending', 'held', 'approved', 'paid', 'cancelled', 'refunded', 'fraud_review'];
const VALID_PAYOUT_STATUSES = ['pending', 'processing', 'paid', 'failed'];

// ── List / search recruiters ──────────────────────────────────────────────────
router.get('/recruiters', requireAdmin, async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};
    if (status && VALID_RECRUITER_STATUSES.includes(status)) filter.status = status;
    if (search) {
      const safeSearch = escapeRegex(String(search).slice(0, 100));
      filter.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
        { recruiterCode: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const [recruiters, total] = await Promise.all([
      RecruiterProfile.find(filter)
        .select('-password -resetToken -resetTokenExpires')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      RecruiterProfile.countDocuments(filter)
    ]);

    return res.json({ ok: true, recruiters, total });
  } catch (err) {
    console.error('❌ Admin recruiters list error:', err.message);
    return res.status(500).json({ error: 'Could not load recruiters' });
  }
});

// ── Recruiter detail ────────────────────────────────────────────────────────────
router.get('/recruiters/:id', requireAdmin, async (req, res) => {
  try {
    const recruiter = await RecruiterProfile.findById(req.params.id)
      .select('-password -resetToken -resetTokenExpires')
      .lean();
    if (!recruiter) return res.status(404).json({ error: 'Recruiter not found' });

    const [referrals, commissions, payouts] = await Promise.all([
      RecruiterReferral.find({ recruiterId: recruiter._id }).sort({ createdAt: -1 }).limit(50).lean(),
      RecruiterCommission.find({ recruiterId: recruiter._id }).sort({ createdAt: -1 }).limit(50).lean(),
      RecruiterPayout.find({ recruiterId: recruiter._id }).sort({ payoutDate: -1 }).limit(20).lean()
    ]);

    return res.json({ ok: true, recruiter, referrals, commissions, payouts });
  } catch (err) {
    console.error('❌ Admin recruiter detail error:', err.message);
    return res.status(500).json({ error: 'Could not load recruiter detail' });
  }
});

// ── Suspend / activate recruiter ────────────────────────────────────────────────
router.patch('/recruiters/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!['active', 'suspended', 'pending_review'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const recruiter = await RecruiterProfile.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, select: '-password -resetToken -resetTokenExpires' }
    );
    if (!recruiter) return res.status(404).json({ error: 'Recruiter not found' });

    return res.json({ ok: true, recruiter });
  } catch (err) {
    return res.status(500).json({ error: 'Could not update status' });
  }
});

// ── All referrals ──────────────────────────────────────────────────────────────
router.get('/recruiter-referrals', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};
    if (status && VALID_REFERRAL_STATUSES.includes(status)) filter.status = status;
    if (search) {
      const safeSearch = escapeRegex(String(search).slice(0, 100));
      filter.$or = [
        { proEmail: { $regex: safeSearch, $options: 'i' } },
        { proName: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const [referrals, total] = await Promise.all([
      RecruiterReferral.find(filter)
        .populate('recruiterId', 'name email recruiterCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      RecruiterReferral.countDocuments(filter)
    ]);

    return res.json({ ok: true, referrals, total });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load referrals' });
  }
});

// ── All commissions ────────────────────────────────────────────────────────────
router.get('/recruiter-commissions', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};
    if (status && VALID_COMMISSION_STATUSES.includes(status)) filter.status = status;

    const [commissions, total] = await Promise.all([
      RecruiterCommission.find(filter)
        .populate('recruiterId', 'name email recruiterCode')
        .populate('referralId', 'proEmail proName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      RecruiterCommission.countDocuments(filter)
    ]);

    return res.json({ ok: true, commissions, total });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load commissions' });
  }
});

// ── Update commission status (approve / reject / cancel / hold) ───────────────
router.patch('/recruiter-commissions/:id', requireAdmin, async (req, res) => {
  try {
    const { status, adminNotes, holdUntil } = req.body || {};
    const validStatuses = ['pending', 'held', 'approved', 'cancelled', 'refunded', 'fraud_review'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const update = {};
    if (status) update.status = status;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;
    if (holdUntil) update.holdUntil = new Date(holdUntil);

    const commission = await RecruiterCommission.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );
    if (!commission) return res.status(404).json({ error: 'Commission not found' });

    return res.json({ ok: true, commission });
  } catch (err) {
    return res.status(500).json({ error: 'Could not update commission' });
  }
});

// ── All payouts ────────────────────────────────────────────────────────────────
router.get('/recruiter-payouts', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};
    if (status && VALID_PAYOUT_STATUSES.includes(status)) filter.status = status;

    const [payouts, total] = await Promise.all([
      RecruiterPayout.find(filter)
        .populate('recruiterId', 'name email recruiterCode')
        .sort({ payoutDate: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      RecruiterPayout.countDocuments(filter)
    ]);

    return res.json({ ok: true, payouts, total });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load payouts' });
  }
});

// ── Analytics ──────────────────────────────────────────────────────────────────
router.get('/recruiter-analytics', requireAdmin, async (req, res) => {
  try {
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const [
      totalRecruiters,
      totalPros,
      monthlyCommAgg,
      monthlyPayoutAgg,
      avgReferralsPerRecruiter
    ] = await Promise.all([
      RecruiterProfile.countDocuments(),
      RecruiterReferral.countDocuments(),
      RecruiterCommission.aggregate([
        { $match: { createdAt: { $gte: thisMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      RecruiterPayout.aggregate([
        { $match: { payoutDate: { $gte: thisMonth }, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      RecruiterReferral.aggregate([
        { $group: { _id: '$recruiterId', count: { $sum: 1 } } },
        { $group: { _id: null, avg: { $avg: '$count' } } }
      ])
    ]);

    return res.json({
      ok: true,
      analytics: {
        totalRecruiters,
        totalPros,
        monthlyCommissions: monthlyCommAgg[0]?.total || 0,
        monthlyPayouts: monthlyPayoutAgg[0]?.total || 0,
        averageReferralsPerRecruiter: Math.round((avgReferralsPerRecruiter[0]?.avg || 0) * 10) / 10
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load analytics' });
  }
});

// ── Invite Code Request Admin Routes ──────────────────────────────────────────
const InviteCodeRequest = require('../models/InviteCodeRequest');
const InviteCode = require('../models/InviteCode');

/**
 * GET /api/admin/code-requests
 * List all recruiter code requests with optional filtering.
 */
router.get('/code-requests', requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

    const filter = {};
    // Use explicit lookup map to prevent NoSQL injection via user-controlled status value
    const STATUS_MAP = { pending: 'pending', approved: 'approved', rejected: 'rejected' };
    const safeStatus = STATUS_MAP[status];
    if (safeStatus) filter.status = safeStatus;

    const [requests, total] = await Promise.all([
      InviteCodeRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      InviteCodeRequest.countDocuments(filter)
    ]);

    const [counts] = await InviteCodeRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).then((agg) => {
      const summary = { pending: 0, approved: 0, rejected: 0, total: 0 };
      agg.forEach(({ _id, count }) => { summary[_id] = count; summary.total += count; });
      return [summary];
    });

    return res.json({ ok: true, requests, total, summary: counts });
  } catch (err) {
    console.error('❌ admin/code-requests GET error:', err.message);
    return res.status(500).json({ error: 'Could not load code requests' });
  }
});

/**
 * PATCH /api/admin/code-requests/:id
 * Approve or reject a recruiter code request.
 * When approving, optionally generate a code immediately.
 */
router.patch('/code-requests/:id', requireAdmin, async (req, res) => {
  try {
    const { action, adminNotes = '', generateCode = false } = req.body || {};

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be "approve" or "reject"' });
    }

    const codeRequest = await InviteCodeRequest.findById(req.params.id);
    if (!codeRequest) return res.status(404).json({ error: 'Code request not found' });
    if (codeRequest.status !== 'pending') {
      return res.status(400).json({ error: `Request is already ${codeRequest.status}` });
    }

    codeRequest.status = action === 'approve' ? 'approved' : 'rejected';
    codeRequest.adminNotes = adminNotes.trim().slice(0, 500);
    codeRequest.reviewedBy = req.user?.email || 'admin';
    codeRequest.reviewedAt = new Date();

    let generatedInvite = null;

    // When approving + generateCode flag, create the code immediately
    if (action === 'approve' && generateCode) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const random = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      let newCode = null;
      for (let i = 0; i < 10; i++) {
        const candidate = `FIXLO-${random(6)}`;
        const exists = await InviteCode.findOne({ code: candidate }).lean();
        if (!exists) { newCode = candidate; break; }
      }
      if (!newCode) return res.status(500).json({ error: 'Failed to generate a unique code' });

      generatedInvite = await InviteCode.create({
        code: newCode,
        assignedName: codeRequest.targetName,
        assignedEmail: codeRequest.targetEmail,
        assignedPhone: codeRequest.targetPhone,
        assignedState: codeRequest.targetState,
        assignedTrade: codeRequest.targetTrade,
        membershipDuration: codeRequest.requestedDuration || '12months',
        usesAllowed: 1,
        usesRemaining: 1,
        notes: `Requested by recruiter: ${codeRequest.requesterEmail}. Reason: ${codeRequest.reason}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdByEmail: req.user?.email || 'admin',
        codeRequestId: codeRequest._id
      });

      codeRequest.generatedCodeId = generatedInvite._id;
      codeRequest.generatedCode = newCode;
    }

    await codeRequest.save();

    return res.json({
      ok: true,
      request: codeRequest,
      generatedInvite: generatedInvite || null
    });
  } catch (err) {
    console.error('❌ admin/code-requests PATCH error:', err.message);
    return res.status(500).json({ error: 'Could not update code request' });
  }
});

module.exports = router;
