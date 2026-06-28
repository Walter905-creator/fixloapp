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

// ── List / search recruiters ──────────────────────────────────────────────────
router.get('/recruiters', requireAdmin, async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { recruiterCode: { $regex: search, $options: 'i' } }
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
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { proEmail: { $regex: search, $options: 'i' } },
        { proName: { $regex: search, $options: 'i' } }
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
    if (status) filter.status = status;

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
    if (status) filter.status = status;

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

module.exports = router;
