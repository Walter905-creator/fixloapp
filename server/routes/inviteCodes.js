// routes/inviteCodes.js — Invite code validation, redemption, and admin management
const router = require('express').Router();
const InviteCode = require('../models/InviteCode');
const { requireDatabase } = require('../config/database');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

router.use(requireDatabase);

// ── Public: validate a code (does NOT redeem it) ──────────────────────────────
// POST /api/invite-codes/validate
router.post('/validate', async (req, res) => {
  const { code } = req.body || {};
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ valid: false, error: 'Invitation code is required' });
  }

  try {
    const invite = await InviteCode.findOne({ code: code.trim().toUpperCase() });

    if (!invite) {
      return res.status(404).json({ valid: false, error: 'This invitation code is invalid, expired, or already used.' });
    }
    if (invite.redeemed) {
      return res.status(409).json({ valid: false, error: 'This invitation code is invalid, expired, or already used.' });
    }
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return res.status(410).json({ valid: false, error: 'This invitation code is invalid, expired, or already used.' });
    }

    return res.json({
      valid: true,
      planType: invite.planType,
      message: 'Invitation code accepted. Your first year of Fixlo Pro is free.'
    });
  } catch (err) {
    console.error('Invite code validate error:', err);
    return res.status(500).json({ valid: false, error: 'Server error validating invitation code' });
  }
});

// ── Admin: create one or more invite codes ─────────────────────────────────────
// POST /api/invite-codes  (requires admin auth)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { assignedName, assignedEmail, assignedPhone, notes, prefix, expiresAt, count } = req.body || {};

  try {
    const total = Math.min(Math.max(parseInt(count, 10) || 1, 1), 50);
    const created = [];

    for (let i = 0; i < total; i++) {
      const doc = await InviteCode.createUniqueCode({
        assignedName,
        assignedEmail,
        assignedPhone,
        notes,
        prefix,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      });
      created.push(doc);
    }

    return res.status(201).json({ success: true, codes: created });
  } catch (err) {
    console.error('Invite code create error:', err);
    return res.status(500).json({ error: 'Server error creating invitation code' });
  }
});

// ── Admin: list all invite codes ───────────────────────────────────────────────
// GET /api/invite-codes  (requires admin auth)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { redeemed, limit = 100, skip = 0 } = req.query;
    const filter = {};
    if (redeemed === 'true') filter.redeemed = true;
    if (redeemed === 'false') filter.redeemed = false;

    const codes = await InviteCode.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Math.min(Number(limit), 500))
      .populate('redeemedByProId', 'name email phone');

    return res.json({ success: true, codes });
  } catch (err) {
    console.error('Invite code list error:', err);
    return res.status(500).json({ error: 'Server error listing invitation codes' });
  }
});

module.exports = router;
