/**
 * Invite Codes API Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin routes (requireAuth + requireAdmin):
 *   POST   /api/invite-codes/create       — generate one code
 *   POST   /api/invite-codes/bulk-create  — generate multiple codes
 *   GET    /api/invite-codes              — list all codes (with search/filter)
 *   POST   /api/invite-codes/revoke       — revoke a code
 *
 * Public/signup routes (secure validation, no admin required):
 *   POST   /api/invite-codes/validate     — check if a code is valid (used during signup)
 *   POST   /api/invite-codes/redeem       — redeem a code and update pro account
 * ─────────────────────────────────────────────────────────────────────────────
 */
const router = require('express').Router();
const InviteCode = require('../models/InviteCode');
const Pro = require('../models/Pro');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const { requireDatabase } = require('../config/database');

router.use(requireDatabase);

// ─── Helper: create a unique code with retry logic ───────────────────────────
async function generateUniqueCode(prefix = null, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = InviteCode.generateCode(prefix);
    const exists = await InviteCode.findOne({ code: candidate });
    if (!exists) return candidate;
  }
  throw new Error('Failed to generate a unique invite code after multiple attempts');
}

// ─── POST /api/invite-codes/create ───────────────────────────────────────────
// Admin only — create one invite code
router.post('/create', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      assignedName,
      assignedEmail,
      assignedPhone,
      assignedState,
      assignedTrade,
      planType = 'one-year-free',
      expiresAt
    } = req.body || {};

    const code = await generateUniqueCode();

    const invite = await InviteCode.create({
      code,
      assignedName,
      assignedEmail,
      assignedPhone,
      assignedState,
      assignedTrade,
      planType,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.user?.id || null
    });

    return res.status(201).json({ ok: true, invite });
  } catch (err) {
    console.error('❌ invite-codes/create error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── POST /api/invite-codes/bulk-create ──────────────────────────────────────
// Admin only — create multiple invite codes at once
router.post('/bulk-create', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      count = 1,
      assignedState,
      assignedTrade,
      planType = 'one-year-free',
      expiresAt
    } = req.body || {};

    const qty = Math.min(Math.max(parseInt(count) || 1, 1), 100); // cap at 100

    const created = [];
    for (let i = 0; i < qty; i++) {
      const code = await generateUniqueCode();
      const invite = await InviteCode.create({
        code,
        assignedState,
        assignedTrade,
        planType,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: req.user?.id || null
      });
      created.push(invite);
    }

    return res.status(201).json({ ok: true, count: created.length, invites: created });
  } catch (err) {
    console.error('❌ invite-codes/bulk-create error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── GET /api/invite-codes ────────────────────────────────────────────────────
// Admin only — list all invite codes, with optional search & status filter
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { search = '', status, page = 1, limit = 50 } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50));

    const query = {};

    // Text search across code / assignedName / assignedEmail / assignedPhone
    // Properly escape all special regex characters to prevent ReDoS
    if (search) {
      const escaped = search.replace(/[\\.*+?^${}()|[\]]/g, '\\$&');
      const re = new RegExp(escaped, 'i');
      query.$or = [
        { code: re },
        { assignedName: re },
        { assignedEmail: re },
        { assignedPhone: re }
      ];
    }

    // Status filter — computed after fetch (virtual), so filter in-memory below
    // Use skip/limit for proper pagination
    const invites = await InviteCode.find(query)
      .populate('redeemedByUserId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean({ virtuals: true });

    // Apply status filter in-memory (because 'status' is a virtual field)
    let filtered = invites;
    if (status && ['pending', 'redeemed', 'expired', 'revoked'].includes(status)) {
      filtered = invites.filter((c) => c.status === status);
    }

    // Summary counts using MongoDB aggregation (efficient — no full collection scan)
    const now = new Date();
    const [aggResult] = await InviteCode.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          redeemed: { $sum: { $cond: ['$redeemed', 1, 0] } },
          revoked: { $sum: { $cond: ['$revoked', 1, 0] } },
          // Expired: not revoked, not redeemed, has expiresAt in the past
          expired: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$revoked', false] },
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
    const reagg = aggResult ? {
      total,
      redeemed: aggResult.redeemed,
      revoked: aggResult.revoked,
      expired: aggResult.expired,
      pending: total - aggResult.redeemed - aggResult.revoked - aggResult.expired
    } : { total: 0, pending: 0, redeemed: 0, expired: 0, revoked: 0 };

    return res.json({ ok: true, invites: filtered, summary: reagg });
  } catch (err) {
    console.error('❌ invite-codes GET error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── POST /api/invite-codes/validate ─────────────────────────────────────────
// Public (used during pro signup) — check if a code is valid without redeeming it
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ ok: false, valid: false, error: 'Code is required' });

    const invite = await InviteCode.findOne({ code: code.trim().toUpperCase() }).lean({ virtuals: true });

    if (!invite) {
      return res.json({ ok: true, valid: false, reason: 'Code not found' });
    }
    if (invite.revoked) {
      return res.json({ ok: true, valid: false, reason: 'Code has been revoked' });
    }
    if (invite.redeemed) {
      return res.json({ ok: true, valid: false, reason: 'Code has already been used' });
    }
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return res.json({ ok: true, valid: false, reason: 'Code has expired' });
    }

    // Optionally return partial assignment info (first name only, no PII)
    const meta = {
      planType: invite.planType,
      assignedName: invite.assignedName || null,
      assignedState: invite.assignedState || null,
      assignedTrade: invite.assignedTrade || null
    };

    return res.json({ ok: true, valid: true, meta });
  } catch (err) {
    console.error('❌ invite-codes/validate error:', err.message);
    return res.status(500).json({ ok: false, valid: false, error: err.message });
  }
});

// ─── POST /api/invite-codes/redeem ───────────────────────────────────────────
// Called during/after pro signup to apply a one-year-free membership.
// Requires the pro to be authenticated (their account must already exist).
router.post('/redeem', requireAuth, async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ ok: false, error: 'Code is required' });

    const proId = req.user?.id;
    if (!proId) return res.status(401).json({ ok: false, error: 'Authentication required' });

    // Fetch the invite code
    const invite = await InviteCode.findOne({ code: code.trim().toUpperCase() });
    if (!invite) return res.status(404).json({ ok: false, error: 'Invalid invitation code' });

    if (invite.revoked) return res.status(400).json({ ok: false, error: 'This invitation code has been revoked' });
    if (invite.redeemed) return res.status(400).json({ ok: false, error: 'This invitation code has already been used' });
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return res.status(400).json({ ok: false, error: 'This invitation code has expired' });
    }

    // Check if the pro has already redeemed an invite code
    const pro = await Pro.findById(proId);
    if (!pro) return res.status(404).json({ ok: false, error: 'Pro account not found' });

    if (pro.redeemedInviteCode) {
      return res.status(400).json({ ok: false, error: 'You have already redeemed an invitation code' });
    }

    // Optional phone match — if invite was assigned to a specific phone, verify it matches
    if (invite.assignedPhone) {
      const norm = (p) => p.replace(/\D/g, '').slice(-10);
      if (norm(invite.assignedPhone) !== norm(pro.phone)) {
        return res.status(403).json({
          ok: false,
          error: 'This invitation code was assigned to a different phone number'
        });
      }
    }

    // Apply one-year-free membership to the pro
    const freeUntil = new Date();
    freeUntil.setFullYear(freeUntil.getFullYear() + 1);

    pro.subscriptionPlan = 'pro';
    pro.subscriptionStatus = 'free_year';
    pro.subscriptionActive = true;
    pro.isActive = true;
    pro.freeAccessUntil = freeUntil;
    pro.redeemedInviteCode = invite.code;
    await pro.save();

    // Mark invite as redeemed
    invite.redeemed = true;
    invite.redeemedByUserId = pro._id;
    invite.redeemedAt = new Date();
    await invite.save();

    console.log(`✅ Invite code ${invite.code} redeemed by pro ${pro._id} (${pro.email})`);

    return res.json({
      ok: true,
      message: 'Invitation code accepted! Your first year of Fixlo Pro is free.',
      freeAccessUntil: freeUntil
    });
  } catch (err) {
    console.error('❌ invite-codes/redeem error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── POST /api/invite-codes/revoke ───────────────────────────────────────────
// Admin only — revoke an invite code so it can no longer be used
router.post('/revoke', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ ok: false, error: 'Code is required' });

    const invite = await InviteCode.findOne({ code: code.trim().toUpperCase() });
    if (!invite) return res.status(404).json({ ok: false, error: 'Code not found' });

    if (invite.redeemed) {
      return res.status(400).json({ ok: false, error: 'Cannot revoke a code that has already been redeemed' });
    }

    invite.revoked = true;
    await invite.save();

    return res.json({ ok: true, message: `Code ${invite.code} has been revoked` });
  } catch (err) {
    console.error('❌ invite-codes/revoke error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
