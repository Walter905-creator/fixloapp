/**
 * Invite Codes API Routes — v2 (Full Invitation Code Management System)
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin routes (requireAuth + requireAdmin):
 *   POST   /api/invite-codes/create          — generate one code
 *   POST   /api/invite-codes/bulk-create     — generate multiple codes
 *   GET    /api/invite-codes                 — list all codes (search/filter/sort)
 *   POST   /api/invite-codes/disable         — temporarily disable a code
 *   POST   /api/invite-codes/enable          — re-enable a disabled code
 *   POST   /api/invite-codes/revoke          — permanently revoke a code
 *   POST   /api/invite-codes/duplicate       — duplicate code settings → new code
 *   DELETE /api/invite-codes/:id             — delete an unused code
 *   GET    /api/invite-codes/export          — export codes as CSV
 *   GET    /api/invite-codes/stats           — summary statistics
 *   GET    /api/invite-codes/:id/history     — redemption history for one code
 *
 * Public / signup routes (rate-limited, no admin required):
 *   POST   /api/invite-codes/validate        — check if a code is valid
 *   POST   /api/invite-codes/redeem          — redeem a code (requires pro auth)
 * ─────────────────────────────────────────────────────────────────────────────
 */
const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const InviteCode = require('../models/InviteCode');
const Pro = require('../models/Pro');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const { requireDatabase } = require('../config/database');

router.use(requireDatabase);

// ── Rate limiter: stricter for public validate endpoint (anti-brute-force) ────
const validateRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  keyGenerator: (req) => req.ip,
  message: { ok: false, error: 'Too many validation attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a unique code with retry logic */
async function generateUniqueCode(prefix = 'FIXLO', maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = InviteCode.generateCode(prefix);
    const exists = await InviteCode.findOne({ code: candidate }).lean();
    if (!exists) return candidate;
  }
  throw new Error('Failed to generate a unique invite code after multiple attempts');
}

/** Default code expiration: 30 days from now */
function defaultExpiresAt(from = new Date()) {
  return new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);
}

/** Try to notify admin via SMS on important events */
async function notifyAdmin(message) {
  const adminPhone = process.env.ADMIN_PHONE || process.env.OWNER_PHONE;
  if (!adminPhone) return;
  try {
    const { sendSms } = require('../utils/twilio');
    await sendSms(adminPhone, `[Fixlo Invite] ${message}`);
  } catch (err) {
    console.warn('⚠️ Admin invite notification failed:', err.message);
  }
}

/** Build a structured audit note and log to console */
function auditLog(action, code, actorEmail, details = {}) {
  console.log(JSON.stringify({
    audit: 'invite_code',
    action,
    code,
    actor: actorEmail,
    ts: new Date().toISOString(),
    ...details
  }));
}

// ── POST /api/invite-codes/create ────────────────────────────────────────────
router.post('/create', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      assignedName,
      assignedEmail,
      assignedPhone,
      assignedState,
      assignedTrade,
      membershipDuration = '12months',
      planType = 'one-year-free',
      usesAllowed = 1,
      expiresAt,
      notes = ''
    } = req.body || {};

    const validDurations = ['30days', '90days', '6months', '12months', 'unlimited'];
    if (!validDurations.includes(membershipDuration)) {
      return res.status(400).json({ ok: false, error: 'Invalid membershipDuration' });
    }

    const usesAllowedNum = Math.max(0, parseInt(usesAllowed) || 1);
    const code = await generateUniqueCode();

    const invite = await InviteCode.create({
      code,
      assignedName,
      assignedEmail,
      assignedPhone,
      assignedState,
      assignedTrade,
      membershipDuration,
      planType,
      usesAllowed: usesAllowedNum,
      usesRemaining: usesAllowedNum, // 0 means unlimited
      notes,
      expiresAt: expiresAt ? new Date(expiresAt) : defaultExpiresAt(),
      createdBy: req.user?.id || null,
      createdByEmail: req.user?.email || null
    });

    auditLog('created', code, req.user?.email);
    return res.status(201).json({ ok: true, invite });
  } catch (err) {
    console.error('❌ invite-codes/create error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── POST /api/invite-codes/bulk-create ───────────────────────────────────────
router.post('/bulk-create', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      count = 1,
      assignedState,
      assignedTrade,
      membershipDuration = '12months',
      planType = 'one-year-free',
      usesAllowed = 1,
      expiresAt,
      notes = ''
    } = req.body || {};

    const validDurations = ['30days', '90days', '6months', '12months', 'unlimited'];
    if (!validDurations.includes(membershipDuration)) {
      return res.status(400).json({ ok: false, error: 'Invalid membershipDuration' });
    }

    const qty = Math.min(Math.max(parseInt(count) || 1, 1), 100);
    const usesAllowedNum = Math.max(0, parseInt(usesAllowed) || 1);
    const expDate = expiresAt ? new Date(expiresAt) : defaultExpiresAt();

    const created = [];
    for (let i = 0; i < qty; i++) {
      const code = await generateUniqueCode();
      const invite = await InviteCode.create({
        code,
        assignedState,
        assignedTrade,
        membershipDuration,
        planType,
        usesAllowed: usesAllowedNum,
        usesRemaining: usesAllowedNum,
        notes,
        expiresAt: expDate,
        createdBy: req.user?.id || null,
        createdByEmail: req.user?.email || null
      });
      created.push(invite);
      auditLog('created', code, req.user?.email);
    }

    return res.status(201).json({ ok: true, count: created.length, invites: created });
  } catch (err) {
    console.error('❌ invite-codes/bulk-create error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET /api/invite-codes ─────────────────────────────────────────────────────
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      search = '',
      status,
      membershipDuration,
      page = 1,
      limit = 50,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50));

    const query = {};

    if (search) {
      const escaped = search.replace(/[\\.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escaped, 'i');
      query.$or = [
        { code: re },
        { assignedName: re },
        { assignedEmail: re },
        { assignedPhone: re },
        { notes: re }
      ];
    }

    if (membershipDuration && ['30days', '90days', '6months', '12months', 'unlimited'].includes(membershipDuration)) {
      query.membershipDuration = membershipDuration;
    }

    const sortField = ['createdAt', 'code', 'expiresAt'].includes(sort) ? sort : 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;

    const invites = await InviteCode.find(query)
      .populate('redeemedByUserId', 'name email phone')
      .sort({ [sortField]: sortOrder })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean({ virtuals: true });

    // Apply virtual-field status filter in-memory
    let filtered = invites;
    const validStatuses = ['active', 'disabled', 'redeemed', 'expired', 'revoked'];
    if (status && validStatuses.includes(status)) {
      filtered = invites.filter((c) => c.status === status);
    }

    // Aggregated summary counts
    const now = new Date();
    const [aggResult] = await InviteCode.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          redeemed: { $sum: { $cond: ['$redeemed', 1, 0] } },
          revoked: { $sum: { $cond: ['$revoked', 1, 0] } },
          disabled: { $sum: { $cond: ['$disabled', 1, 0] } },
          expired: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$revoked', false] },
                    { $eq: ['$disabled', false] },
                    { $eq: ['$redeemed', false] },
                    { $lt: ['$expiresAt', now] },
                    { $ne: ['$expiresAt', null] }
                  ]
                },
                1, 0
              ]
            }
          }
        }
      }
    ]);

    const total = aggResult?.total || 0;
    const summary = aggResult
      ? {
          total,
          redeemed: aggResult.redeemed,
          revoked: aggResult.revoked,
          disabled: aggResult.disabled,
          expired: aggResult.expired,
          active: total - aggResult.redeemed - aggResult.revoked - aggResult.disabled - aggResult.expired
        }
      : { total: 0, active: 0, redeemed: 0, expired: 0, revoked: 0, disabled: 0 };

    return res.json({ ok: true, invites: filtered, total, summary });
  } catch (err) {
    console.error('❌ invite-codes GET error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET /api/invite-codes/stats ───────────────────────────────────────────────
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const [totals, byDuration, redeemedThisMonth, redeemedThisWeek, recentRedemptions] = await Promise.all([
      InviteCode.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            redeemed: { $sum: { $cond: ['$redeemed', 1, 0] } },
            revoked: { $sum: { $cond: ['$revoked', 1, 0] } },
            disabled: { $sum: { $cond: ['$disabled', 1, 0] } },
            totalUses: { $sum: { $size: '$redeemedByList' } }
          }
        }
      ]),
      InviteCode.aggregate([
        { $group: { _id: '$membershipDuration', count: { $sum: 1 }, redeemed: { $sum: { $cond: ['$redeemed', 1, 0] } } } },
        { $sort: { count: -1 } }
      ]),
      InviteCode.countDocuments({ redeemedAt: { $gte: startOfMonth } }),
      InviteCode.countDocuments({ redeemedAt: { $gte: startOfWeek } }),
      InviteCode.find({ redeemed: true })
        .sort({ redeemedAt: -1 })
        .limit(10)
        .populate('redeemedByUserId', 'name email phone trade')
        .lean({ virtuals: true })
    ]);

    return res.json({
      ok: true,
      stats: {
        totals: totals[0] || { total: 0, redeemed: 0, revoked: 0, disabled: 0, totalUses: 0 },
        byDuration,
        redeemedThisMonth,
        redeemedThisWeek,
        recentRedemptions
      }
    });
  } catch (err) {
    console.error('❌ invite-codes/stats error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET /api/invite-codes/export ─────────────────────────────────────────────
router.get('/export', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, membershipDuration } = req.query;

    const query = {};
    if (membershipDuration && ['30days', '90days', '6months', '12months', 'unlimited'].includes(membershipDuration)) {
      query.membershipDuration = membershipDuration;
    }

    const invites = await InviteCode.find(query)
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });

    // Filter by virtual status if requested
    const filtered = status && ['active', 'disabled', 'redeemed', 'expired', 'revoked'].includes(status)
      ? invites.filter((c) => c.status === status)
      : invites;

    const csvHeader = [
      'Code', 'Status', 'MembershipDuration', 'UsesAllowed', 'UsesRemaining',
      'AssignedName', 'AssignedEmail', 'AssignedPhone', 'AssignedState', 'AssignedTrade',
      'Notes', 'ExpiresAt', 'CreatedAt', 'RedeemedAt', 'RedeemedBy'
    ].join(',');

    const escape = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n\r]/.test(s) ? `"${s}"` : s;
    };

    const rows = filtered.map((c) => [
      escape(c.code),
      escape(c.status),
      escape(c.membershipDuration),
      escape(c.usesAllowed === 0 ? 'unlimited' : c.usesAllowed),
      escape(c.usesAllowed === 0 ? 'unlimited' : c.usesRemaining),
      escape(c.assignedName),
      escape(c.assignedEmail),
      escape(c.assignedPhone),
      escape(c.assignedState),
      escape(c.assignedTrade),
      escape(c.notes),
      escape(c.expiresAt ? new Date(c.expiresAt).toISOString() : ''),
      escape(new Date(c.createdAt).toISOString()),
      escape(c.redeemedAt ? new Date(c.redeemedAt).toISOString() : ''),
      escape(c.redeemedBy || '')
    ].join(','));

    const csv = [csvHeader, ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="fixlo-invite-codes-${Date.now()}.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error('❌ invite-codes/export error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET /api/invite-codes/:id/history ────────────────────────────────────────
router.get('/:id/history', requireAuth, requireAdmin, async (req, res) => {
  try {
    const invite = await InviteCode.findById(req.params.id)
      .populate('redeemedByUserId', 'name email phone trade')
      .lean({ virtuals: true });

    if (!invite) return res.status(404).json({ ok: false, error: 'Code not found' });

    return res.json({ ok: true, invite, redemptions: invite.redeemedByList || [] });
  } catch (err) {
    console.error('❌ invite-codes/:id/history error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── POST /api/invite-codes/disable ───────────────────────────────────────────
router.post('/disable', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ ok: false, error: 'Code is required' });

    const invite = await InviteCode.findOne({ code: code.trim().toUpperCase() });
    if (!invite) return res.status(404).json({ ok: false, error: 'Code not found' });
    if (invite.revoked) return res.status(400).json({ ok: false, error: 'Code is already revoked' });
    if (invite.redeemed) return res.status(400).json({ ok: false, error: 'Cannot disable a fully redeemed code' });

    invite.disabled = true;
    await invite.save();

    auditLog('disabled', invite.code, req.user?.email);
    return res.json({ ok: true, message: `Code ${invite.code} has been disabled` });
  } catch (err) {
    console.error('❌ invite-codes/disable error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── POST /api/invite-codes/enable ────────────────────────────────────────────
router.post('/enable', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ ok: false, error: 'Code is required' });

    const invite = await InviteCode.findOne({ code: code.trim().toUpperCase() });
    if (!invite) return res.status(404).json({ ok: false, error: 'Code not found' });
    if (invite.revoked) return res.status(400).json({ ok: false, error: 'Cannot enable a revoked code' });

    invite.disabled = false;
    await invite.save();

    auditLog('enabled', invite.code, req.user?.email);
    return res.json({ ok: true, message: `Code ${invite.code} has been re-enabled` });
  } catch (err) {
    console.error('❌ invite-codes/enable error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── POST /api/invite-codes/revoke ────────────────────────────────────────────
router.post('/revoke', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ ok: false, error: 'Code is required' });

    const invite = await InviteCode.findOne({ code: code.trim().toUpperCase() });
    if (!invite) return res.status(404).json({ ok: false, error: 'Code not found' });
    if (invite.redeemed) {
      return res.status(400).json({ ok: false, error: 'Cannot revoke a code that has already been fully redeemed' });
    }

    invite.revoked = true;
    await invite.save();

    auditLog('revoked', invite.code, req.user?.email);
    return res.json({ ok: true, message: `Code ${invite.code} has been permanently revoked` });
  } catch (err) {
    console.error('❌ invite-codes/revoke error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── POST /api/invite-codes/duplicate ─────────────────────────────────────────
router.post('/duplicate', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ ok: false, error: 'Source code is required' });

    const source = await InviteCode.findOne({ code: code.trim().toUpperCase() }).lean();
    if (!source) return res.status(404).json({ ok: false, error: 'Source code not found' });

    const newCode = await generateUniqueCode();
    const invite = await InviteCode.create({
      code: newCode,
      assignedName: source.assignedName,
      assignedEmail: source.assignedEmail,
      assignedPhone: source.assignedPhone,
      assignedState: source.assignedState,
      assignedTrade: source.assignedTrade,
      membershipDuration: source.membershipDuration,
      planType: source.planType,
      usesAllowed: source.usesAllowed,
      usesRemaining: source.usesAllowed, // reset to full
      notes: source.notes,
      expiresAt: defaultExpiresAt(),
      createdBy: req.user?.id || null,
      createdByEmail: req.user?.email || null
    });

    auditLog('duplicated', newCode, req.user?.email, { from: code });
    return res.status(201).json({ ok: true, invite });
  } catch (err) {
    console.error('❌ invite-codes/duplicate error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── DELETE /api/invite-codes/:id ──────────────────────────────────────────────
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const invite = await InviteCode.findById(req.params.id);
    if (!invite) return res.status(404).json({ ok: false, error: 'Code not found' });
    if (invite.redeemed || (invite.redeemedByList && invite.redeemedByList.length > 0)) {
      return res.status(400).json({ ok: false, error: 'Cannot delete a code that has been redeemed' });
    }

    auditLog('deleted', invite.code, req.user?.email);
    await invite.deleteOne();
    return res.json({ ok: true, message: `Code ${invite.code} has been deleted` });
  } catch (err) {
    console.error('❌ invite-codes DELETE error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── POST /api/invite-codes/validate ──────────────────────────────────────────
// Public — check if a code is valid without redeeming it
router.post('/validate', validateRateLimit, async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ ok: false, valid: false, error: 'Code is required' });

    const invite = await InviteCode.findOne({ code: code.trim().toUpperCase() }).lean({ virtuals: true });

    auditLog('validate_attempt', code, 'public', { ip: req.ip });

    if (!invite) {
      return res.json({ ok: true, valid: false, reason: 'Invalid invitation code.' });
    }
    if (invite.revoked) {
      return res.json({ ok: true, valid: false, reason: 'Code has been revoked.' });
    }
    if (invite.disabled) {
      return res.json({ ok: true, valid: false, reason: 'This code is currently inactive.' });
    }
    if (invite.redeemed) {
      return res.json({ ok: true, valid: false, reason: 'This code has already been used.' });
    }
    // Multi-use: check remaining uses (0 = unlimited)
    if (invite.usesAllowed > 0 && invite.usesRemaining <= 0) {
      return res.json({ ok: true, valid: false, reason: 'This code has reached its maximum number of uses.' });
    }
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return res.json({ ok: true, valid: false, reason: 'This code has expired. Please request a new invitation code.' });
    }

    return res.json({
      ok: true,
      valid: true,
      meta: {
        membershipDuration: invite.membershipDuration || '12months',
        planType: invite.planType,
        assignedName: invite.assignedName || null,
        assignedState: invite.assignedState || null,
        assignedTrade: invite.assignedTrade || null,
        usesRemaining: invite.usesAllowed === 0 ? 'unlimited' : invite.usesRemaining
      }
    });
  } catch (err) {
    console.error('❌ invite-codes/validate error:', err.message);
    return res.status(500).json({ ok: false, valid: false, error: err.message });
  }
});

// ── POST /api/invite-codes/redeem ─────────────────────────────────────────────
// Requires pro to be authenticated; applies membership to their account
router.post('/redeem', requireAuth, async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ ok: false, error: 'Code is required' });

    const proId = req.user?.id;
    if (!proId) return res.status(401).json({ ok: false, error: 'Authentication required' });

    const invite = await InviteCode.findOne({ code: code.trim().toUpperCase() });
    if (!invite) return res.status(404).json({ ok: false, error: 'Invalid invitation code.' });

    if (invite.revoked)  return res.status(400).json({ ok: false, error: 'This invitation code has been revoked.' });
    if (invite.disabled) return res.status(400).json({ ok: false, error: 'This invitation code is currently inactive.' });
    if (invite.redeemed) return res.status(400).json({ ok: false, error: 'This code has already been fully used.' });
    if (invite.usesAllowed > 0 && invite.usesRemaining <= 0) {
      return res.status(400).json({ ok: false, error: 'This code has reached its maximum number of uses.' });
    }
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return res.status(400).json({ ok: false, error: 'This code has expired. Please request a new invitation code.' });
    }

    const pro = await Pro.findById(proId);
    if (!pro) return res.status(404).json({ ok: false, error: 'Pro account not found' });

    if (pro.redeemedInviteCode || pro.inviteCodeUsed) {
      return res.status(400).json({ ok: false, error: 'You have already redeemed an invitation code.' });
    }

    // Optional phone restriction check
    if (invite.assignedPhone) {
      const norm = (p) => p.replace(/\D/g, '').slice(-10);
      if (norm(invite.assignedPhone) !== norm(pro.phone)) {
        return res.status(403).json({
          ok: false,
          error: 'This invitation code was assigned to a different phone number.'
        });
      }
    }

    // Optional email restriction check
    if (invite.assignedEmail && pro.email && invite.assignedEmail.toLowerCase() !== pro.email.toLowerCase()) {
      return res.status(403).json({
        ok: false,
        error: 'This invitation code was assigned to a different email address.'
      });
    }

    // Calculate freeAccessUntil based on membershipDuration
    const freeAccessUntil = InviteCode.calcFreeAccessUntil(invite.membershipDuration || '12months');

    // Apply membership to the pro account
    pro.subscriptionPlan = 'pro';
    pro.subscriptionStatus = 'free_year';
    pro.subscriptionActive = true;
    pro.isActive = true;
    pro.freeAccessUntil = freeAccessUntil;
    pro.redeemedInviteCode = invite.code;
    pro.inviteCodeUsed = invite.code;
    await pro.save();

    // Update invite code atomically
    const newRemaining = invite.usesAllowed === 0 ? 0 : Math.max(0, invite.usesRemaining - 1);
    const nowFullyUsed = invite.usesAllowed > 0 && newRemaining === 0;

    await InviteCode.findOneAndUpdate(
      { _id: invite._id },
      {
        $set: {
          usesRemaining: newRemaining,
          redeemed: nowFullyUsed,
          redeemedAt: nowFullyUsed ? new Date() : invite.redeemedAt,
          redeemedBy: nowFullyUsed ? String(pro._id) : invite.redeemedBy,
          redeemedByUserId: nowFullyUsed ? pro._id : invite.redeemedByUserId
        },
        $push: {
          redeemedByList: {
            proId: pro._id,
            proName: pro.name,
            proEmail: pro.email,
            proPhone: pro.phone,
            redeemedAt: new Date()
          }
        }
      }
    );

    auditLog('redeemed', invite.code, pro.email, {
      proId: String(pro._id),
      duration: invite.membershipDuration,
      freeUntil: freeAccessUntil
    });

    const isHighValue = invite.membershipDuration === '12months' || invite.membershipDuration === 'unlimited';
    const notifyMsg = isHighValue
      ? `🔑 HIGH-VALUE code ${invite.code} (${invite.membershipDuration}) redeemed by ${pro.email}`
      : `Code ${invite.code} (${invite.membershipDuration}) redeemed by ${pro.email}`;
    notifyAdmin(notifyMsg).catch(() => {});

    console.log(`✅ Invite code ${invite.code} redeemed by pro ${pro._id} (${pro.email}) — duration: ${invite.membershipDuration}`);

    return res.json({
      ok: true,
      message: 'Invitation code accepted! Your free membership has been activated.',
      membershipDuration: invite.membershipDuration,
      freeAccessUntil
    });
  } catch (err) {
    console.error('❌ invite-codes/redeem error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
