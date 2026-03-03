const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Pro = require('../models/Pro');

/**
 * Hash a token using SHA-256 for secure comparison.
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * GET /pro/setup-account/:token
 * Validate setup token and return a page for the pro to fill in account details.
 */
router.get('/setup-account/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Setup token is required' });
    }

    const tokenHash = hashToken(token);
    const pro = await Pro.findOne({
      accountSetupTokenHash: tokenHash,
      accountSetupExpires: { $gt: new Date() }
    });

    if (!pro) {
      return res.status(400).json({
        valid: false,
        error: 'This setup link is invalid or has expired. Please contact support.'
      });
    }

    return res.json({
      valid: true,
      proId: pro._id,
      phone: pro.phone
    });
  } catch (err) {
    console.error('❌ Pro setup-account GET error:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/pro/complete-setup
 * Complete account setup with name, trade, and password.
 * Body: { token, name, trade, password }
 */
router.post('/complete-setup', async (req, res) => {
  try {
    const { token, name, trade, password } = req.body || {};

    if (!token || !name || !trade || !password) {
      return res.status(400).json({ error: 'token, name, trade, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const tokenHash = hashToken(token);
    const pro = await Pro.findOne({
      accountSetupTokenHash: tokenHash,
      accountSetupExpires: { $gt: new Date() }
    });

    if (!pro) {
      return res.status(400).json({ error: 'This setup link is invalid or has expired.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    pro.name = name;
    pro.trade = trade;
    pro.password = passwordHash;
    pro.accountCreated = true;
    pro.accountSetupTokenHash = undefined;
    pro.accountSetupExpires = undefined;

    await pro.save();

    console.log(`✅ Pro ${pro._id} completed account setup`);

    return res.json({
      success: true,
      message: 'Account setup complete. You can now log in.',
      redirect: '/pro/login'
    });
  } catch (err) {
    console.error('❌ Pro complete-setup POST error:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
