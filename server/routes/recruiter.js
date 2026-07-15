/**
 * Recruiter Dashboard Routes
 *
 * All routes require recruiter JWT (role: 'recruiter').
 *
 * GET  /api/recruiter/me               — profile + stats
 * GET  /api/recruiter/referrals        — my recruited pros
 * GET  /api/recruiter/recruiters       — my level-2 recruiters
 * GET  /api/recruiter/commissions      — commission history
 * GET  /api/recruiter/payouts          — payout history
 * POST /api/recruiter/codes/generate   — generate one-time code
 * GET  /api/recruiter/codes            — list my codes
 * PATCH /api/recruiter/codes/:id/deactivate — deactivate a code
 * POST /api/recruiter/stripe-connect/onboard — start Stripe Connect
 * GET  /api/recruiter/stripe-connect/return  — return from Connect
 * PATCH /api/recruiter/settings         — update SMS preferences
 */

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const requireAuth = require('../middleware/requireAuth');
const RecruiterProfile = require('../models/RecruiterProfile');
const RecruiterReferralCode = require('../models/RecruiterReferralCode');
const RecruiterReferral = require('../models/RecruiterReferral');
const RecruiterCommission = require('../models/RecruiterCommission');
const RecruiterPayout = require('../models/RecruiterPayout');

// ── Auth guard: recruiter only ────────────────────────────────────────────────
function requireRecruiter(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'recruiter') {
      return res.status(403).json({ error: 'Recruiter access required' });
    }
    next();
  });
}

// ── Helper: get stripe instance ───────────────────────────────────────────────
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return require('stripe')(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
}

// ── Profile + stats ──────────────────────────────────────────────────────────
router.get('/me', requireRecruiter, async (req, res) => {
  try {
    const recruiter = await RecruiterProfile.findById(req.user.id).select('-password -resetToken -resetTokenExpires');
    if (!recruiter) return res.status(404).json({ error: 'Recruiter not found' });

    // Fresh stats from DB
    const [totalReferrals, activeReferrals, recruiterCount, pendingAgg, heldAgg, approvedAgg, paidAgg, lifetimeAgg] = await Promise.all([
      RecruiterReferral.countDocuments({ recruiterId: recruiter._id }),
      RecruiterReferral.countDocuments({ recruiterId: recruiter._id, status: 'active' }),
      RecruiterProfile.countDocuments({ parentRecruiterId: recruiter._id }),
      RecruiterCommission.aggregate([
        { $match: { recruiterId: recruiter._id, status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      RecruiterCommission.aggregate([
        { $match: { recruiterId: recruiter._id, status: 'held' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      RecruiterCommission.aggregate([
        { $match: { recruiterId: recruiter._id, status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      RecruiterCommission.aggregate([
        { $match: { recruiterId: recruiter._id, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      RecruiterCommission.aggregate([
        { $match: { recruiterId: recruiter._id, status: { $in: ['pending', 'held', 'approved', 'paid'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    return res.json({
      ok: true,
      recruiter: {
        id: recruiter._id,
        name: recruiter.name,
        email: recruiter.email,
        phoneNumber: recruiter.phoneNumber,
        profilePhotoUrl: recruiter.profilePhotoUrl || '',
        city: recruiter.city || '',
        state: recruiter.state || '',
        recruiterCode: recruiter.recruiterCode,
        recruiterLink: recruiter.recruiterLink,
        recruiterRecruiterLink: recruiter.recruiterRecruiterLink,
        proReferralLink: recruiter.proReferralLink || recruiter.recruiterLink,
        recruiterReferralLink: recruiter.recruiterReferralLink || recruiter.recruiterRecruiterLink,
        stripeConnectAccountId: recruiter.stripeConnectAccountId,
        stripeConnectOnboarded: recruiter.stripeConnectOnboarded,
        payoutStatus: recruiter.payoutStatus,
        smsNotifications: recruiter.smsNotifications,
        notificationSettings: recruiter.notificationSettings || {},
        language: recruiter.language || 'en-US',
        timeZone: recruiter.timeZone || 'UTC',
        smsOptIn: recruiter.smsOptIn,
        smsOptInDate: recruiter.smsOptInDate,
        status: recruiter.status,
        createdAt: recruiter.createdAt
      },
      stats: {
        totalReferrals,
        activeReferrals,
        recruitersReferred: recruiterCount,
        pendingCommissions: pendingAgg[0]?.total || 0,
        heldCommissions: heldAgg[0]?.total || 0,
        approvedCommissions: approvedAgg[0]?.total || 0,
        paidCommissions: paidAgg[0]?.total || 0,
        lifetimeCommissions: lifetimeAgg[0]?.total || 0
      }
    });
  } catch (err) {
    console.error('❌ Recruiter /me error:', err.message);
    return res.status(500).json({ error: 'Could not load profile' });
  }
});

// ── Recruited pros ─────────────────────────────────────────────────────────────
router.get('/referrals', requireRecruiter, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [referrals, total] = await Promise.all([
      RecruiterReferral.find({ recruiterId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      RecruiterReferral.countDocuments({ recruiterId: req.user.id })
    ]);

    // Enrich with commission data
    const enriched = await Promise.all(referrals.map(async (r) => {
      const commission = await RecruiterCommission.findOne({
        referralId: r._id,
        recruiterId: req.user.id,
        level: 1
      }).lean();
      return { ...r, commission };
    }));

    return res.json({ ok: true, referrals: enriched, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('❌ Recruiter referrals error:', err.message);
    return res.status(500).json({ error: 'Could not load referrals' });
  }
});

// ── Level-2 recruiters ─────────────────────────────────────────────────────────
router.get('/recruiters', requireRecruiter, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [recruiters, total] = await Promise.all([
      RecruiterProfile.find({ parentRecruiterId: req.user.id })
        .select('-password -resetToken -resetTokenExpires')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      RecruiterProfile.countDocuments({ parentRecruiterId: req.user.id })
    ]);

    // Enrich with referral counts and level-2 earnings
    const enriched = await Promise.all(recruiters.map(async (r) => {
      const [prosCount, earningsAgg] = await Promise.all([
        RecruiterReferral.countDocuments({ recruiterId: r._id }),
        RecruiterCommission.aggregate([
          { $match: { recruiterId: req.user.id, status: { $in: ['held', 'approved', 'paid'] } } },
          // Only level-2 commissions sourced from this recruiter's referrals
          {
            $lookup: {
              from: 'recruiterreferrals',
              localField: 'referralId',
              foreignField: '_id',
              as: 'referral'
            }
          },
          { $unwind: '$referral' },
          { $match: { 'referral.recruiterId': r._id, level: 2 } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);
      return {
        ...r,
        prosRecruited: prosCount,
        earningsGenerated: earningsAgg[0]?.total || 0
      };
    }));

    return res.json({ ok: true, recruiters: enriched, total });
  } catch (err) {
    console.error('❌ Recruiter recruiters error:', err.message);
    return res.status(500).json({ error: 'Could not load recruiters' });
  }
});

// ── Commissions ────────────────────────────────────────────────────────────────
const VALID_COMMISSION_STATUSES = ['pending', 'held', 'approved', 'paid', 'cancelled', 'refunded', 'fraud_review'];

router.get('/commissions', requireRecruiter, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { recruiterId: req.user.id };
    if (status && VALID_COMMISSION_STATUSES.includes(status)) filter.status = status;

    const [commissions, total] = await Promise.all([
      RecruiterCommission.find(filter)
        .populate('referralId', 'proEmail proName proTrade signupDate')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      RecruiterCommission.countDocuments(filter)
    ]);

    return res.json({ ok: true, commissions, total });
  } catch (err) {
    console.error('❌ Recruiter commissions error:', err.message);
    return res.status(500).json({ error: 'Could not load commissions' });
  }
});

// ── Payouts ─────────────────────────────────────────────────────────────────────
router.get('/payouts', requireRecruiter, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [payouts, total] = await Promise.all([
      RecruiterPayout.find({ recruiterId: req.user.id })
        .sort({ payoutDate: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      RecruiterPayout.countDocuments({ recruiterId: req.user.id })
    ]);

    return res.json({ ok: true, payouts, total });
  } catch (err) {
    console.error('❌ Recruiter payouts error:', err.message);
    return res.status(500).json({ error: 'Could not load payouts' });
  }
});

// ── Generate one-time code ──────────────────────────────────────────────────────
router.post('/codes/generate', requireRecruiter, async (req, res) => {
  try {
    const { type = 'pro', expiresInDays } = req.body || {};

    const code = await RecruiterReferralCode.generateCode(type);
    const expiresAt = expiresInDays
      ? new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000)
      : null;

    const record = await RecruiterReferralCode.create({
      code,
      recruiterId: req.user.id,
      type,
      expiresAt
    });

    return res.status(201).json({ ok: true, code: record });
  } catch (err) {
    console.error('❌ Code generate error:', err.message);
    return res.status(500).json({ error: 'Could not generate code' });
  }
});

// ── List codes ──────────────────────────────────────────────────────────────────
router.get('/codes', requireRecruiter, async (req, res) => {
  try {
    const codes = await RecruiterReferralCode.find({ recruiterId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return res.json({ ok: true, codes });
  } catch (err) {
    return res.status(500).json({ error: 'Could not load codes' });
  }
});

// ── Deactivate code ─────────────────────────────────────────────────────────────
router.patch('/codes/:id/deactivate', requireRecruiter, async (req, res) => {
  try {
    const code = await RecruiterReferralCode.findOne({
      _id: req.params.id,
      recruiterId: req.user.id
    });
    if (!code) return res.status(404).json({ error: 'Code not found' });

    code.isActive = false;
    await code.save();
    return res.json({ ok: true, code });
  } catch (err) {
    return res.status(500).json({ error: 'Could not deactivate code' });
  }
});

// ── Validate referral code (public) ────────────────────────────────────────────
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { type } = req.query;
    const upperCode = code.trim().toUpperCase();

    // First, check if it matches a permanent recruiter code
    let recruiter = await RecruiterProfile.findOne({ recruiterCode: upperCode, status: 'active' });
    if (recruiter) {
      return res.json({
        ok: true,
        valid: true,
        recruiterName: recruiter.name,
        recruiterId: recruiter._id,
        type: 'permanent'
      });
    }

    // Then check one-time codes
    const oneTimeCode = await RecruiterReferralCode.findOne({
      code: upperCode,
      ...(type === 'recruiter' || type === 'pro' ? { type } : {}),
      isActive: true,
      isUsed: false,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
    });
    if (oneTimeCode) {
      recruiter = await RecruiterProfile.findById(oneTimeCode.recruiterId);
      if (recruiter && recruiter.status === 'active') {
        return res.json({
          ok: true,
          valid: true,
          recruiterName: recruiter.name,
          recruiterId: recruiter._id,
          type: 'one_time'
        });
      }
    }

    return res.json({ ok: true, valid: false });
  } catch (err) {
    return res.status(500).json({ error: 'Could not validate code' });
  }
});

// ── Stripe Connect onboarding ───────────────────────────────────────────────────
router.post('/stripe-connect/onboard', requireRecruiter, async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });

    const recruiter = await RecruiterProfile.findById(req.user.id);
    if (!recruiter) return res.status(404).json({ error: 'Recruiter not found' });

    let accountId = recruiter.stripeConnectAccountId;

    // Create Express account if not exists
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: recruiter.email,
        metadata: { recruiterId: recruiter._id.toString() }
      });
      accountId = account.id;
      recruiter.stripeConnectAccountId = accountId;
      await recruiter.save();
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://fixloapp.com';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/recruiter/settings?connect_refresh=1`,
      return_url: `${baseUrl}/recruiter/settings?connect_return=1`,
      type: 'account_onboarding'
    });

    return res.json({ ok: true, url: accountLink.url });
  } catch (err) {
    console.error('❌ Stripe Connect onboard error:', err.message);
    return res.status(500).json({ error: 'Could not start Stripe Connect onboarding' });
  }
});

// ── Stripe Connect return handler ──────────────────────────────────────────────
router.post('/stripe-connect/verify', requireRecruiter, async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });

    const recruiter = await RecruiterProfile.findById(req.user.id);
    if (!recruiter || !recruiter.stripeConnectAccountId) {
      return res.status(400).json({ error: 'No Stripe account found' });
    }

    const account = await stripe.accounts.retrieve(recruiter.stripeConnectAccountId);
    const onboarded = account.details_submitted && !account.requirements?.currently_due?.length;

    recruiter.stripeConnectOnboarded = onboarded;
    recruiter.payoutStatus = onboarded ? 'active' : 'pending';
    await recruiter.save();

    return res.json({ ok: true, onboarded, payoutStatus: recruiter.payoutStatus });
  } catch (err) {
    console.error('❌ Stripe Connect verify error:', err.message);
    return res.status(500).json({ error: 'Could not verify Stripe Connect status' });
  }
});

// ── SMS Preferences ─────────────────────────────────────────────────────────────
router.patch('/settings', requireRecruiter, async (req, res) => {
  try {
    const {
      smsNotifications,
      phone,
      phoneNumber,
      smsOptIn,
      profilePhotoUrl,
      city,
      state,
      notificationSettings,
      language,
      timeZone,
      currentPassword,
      newPassword
    } = req.body || {};

    const update = {};
    if (smsNotifications !== undefined) update.smsNotifications = smsNotifications;
    if (notificationSettings !== undefined) {
      const keys = ['emailNotifications', 'smsNotifications', 'commissionAlerts', 'weeklySummaryEmails', 'referralAlerts'];
      const unknownKeys = Object.keys(notificationSettings).filter((key) => !keys.includes(key));
      if (unknownKeys.length) {
        return res.status(400).json({ error: `Unknown notification setting: ${unknownKeys[0]}` });
      }
      const normalizedSettings = {};
      for (const key of keys) {
        if (notificationSettings[key] !== undefined) {
          if (typeof notificationSettings[key] !== 'boolean') {
            return res.status(400).json({ error: `Invalid value for ${key}` });
          }
          normalizedSettings[key] = notificationSettings[key];
        }
      }
      if (Object.keys(normalizedSettings).length) {
        update.notificationSettings = normalizedSettings;
      }
    }
    if (profilePhotoUrl !== undefined) update.profilePhotoUrl = String(profilePhotoUrl || '').trim().slice(0, 500);
    if (city !== undefined) update.city = String(city || '').trim().slice(0, 120);
    if (state !== undefined) update.state = String(state || '').trim().slice(0, 120);
    if (language !== undefined) update.language = String(language || 'en-US').trim().slice(0, 40);
    if (timeZone !== undefined) update.timeZone = String(timeZone || 'UTC').trim().slice(0, 80);

    if ((currentPassword && !newPassword) || (!currentPassword && newPassword)) {
      return res.status(400).json({ error: 'Both current and new password are required' });
    }
    if (newPassword) {
      if (String(newPassword).length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }
      const recruiterForPassword = await RecruiterProfile.findById(req.user.id).select('password').lean();
      if (!recruiterForPassword) return res.status(404).json({ error: 'Recruiter not found' });
      const ok = await bcrypt.compare(String(currentPassword), recruiterForPassword.password);
      if (!ok) return res.status(400).json({ error: 'Current password is incorrect' });
      update.password = await bcrypt.hash(String(newPassword), 12);
    }

    if (smsOptIn !== undefined) {
      update.smsOptIn = !!smsOptIn;
      if (smsOptIn) {
        // Only record opt-in date the first time they consent
        const existing = await RecruiterProfile.findById(req.user.id).select('smsOptInDate').lean();
        if (!existing?.smsOptInDate) update.smsOptInDate = new Date();
      }
    }
    const newPhone = phoneNumber !== undefined ? phoneNumber : phone;
    if (newPhone !== undefined) {
      const { normalizePhoneToE164 } = require('../utils/phoneNormalizer');
      const result = normalizePhoneToE164(newPhone);
      if (result.success) update.phoneNumber = result.phone;
      else return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const recruiter = await RecruiterProfile.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true, select: '-password -resetToken -resetTokenExpires' }
    );

    return res.json({ ok: true, recruiter });
  } catch (err) {
    console.error('❌ Recruiter settings error:', err.message);
    return res.status(500).json({ error: 'Could not update settings' });
  }
});

// ── Invite Code Requests (recruiters cannot generate codes; they can request) ──

const InviteCodeRequest = require('../models/InviteCodeRequest');

/**
 * POST /api/recruiter/code-requests
 * Submit a request for admin to generate a promotional invitation code.
 * Recruiters CANNOT generate codes themselves — only admins can.
 */
router.post('/code-requests', requireRecruiter, async (req, res) => {
  try {
    const {
      reason,
      requestedDuration = '12months',
      targetName,
      targetEmail,
      targetPhone,
      targetState,
      targetTrade
    } = req.body || {};

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'A reason is required for the code request.' });
    }

    const validDurations = ['30days', '90days', '6months', '12months', 'unlimited'];
    if (!validDurations.includes(requestedDuration)) {
      return res.status(400).json({ error: 'Invalid requested membership duration.' });
    }

    const recruiter = await RecruiterProfile.findById(req.user.id).select('name email').lean();
    if (!recruiter) return res.status(404).json({ error: 'Recruiter profile not found' });

    const codeRequest = await InviteCodeRequest.create({
      requestedBy: req.user.id,
      requesterName: recruiter.name,
      requesterEmail: recruiter.email,
      reason: reason.trim().slice(0, 1000),
      requestedDuration,
      targetName: targetName?.trim(),
      targetEmail: targetEmail?.toLowerCase().trim(),
      targetPhone: targetPhone?.trim(),
      targetState: targetState?.trim(),
      targetTrade: targetTrade?.trim()
    });

    return res.status(201).json({ ok: true, request: codeRequest });
  } catch (err) {
    console.error('❌ recruiter/code-requests POST error:', err.message);
    return res.status(500).json({ error: 'Could not submit code request' });
  }
});

/**
 * GET /api/recruiter/code-requests
 * List this recruiter's own code requests.
 */
router.get('/code-requests', requireRecruiter, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));

    const [requests, total] = await Promise.all([
      InviteCodeRequest.find({ requestedBy: req.user.id })
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      InviteCodeRequest.countDocuments({ requestedBy: req.user.id })
    ]);

    return res.json({ ok: true, requests, total });
  } catch (err) {
    console.error('❌ recruiter/code-requests GET error:', err.message);
    return res.status(500).json({ error: 'Could not load code requests' });
  }
});

module.exports = router;
