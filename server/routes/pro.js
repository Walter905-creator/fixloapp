// routes/pro.js — Pro SaaS auth & dashboard
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Pro = require('../models/Pro');
const JobRequest = require('../models/JobRequest');
const { normalizePhoneToE164 } = require('../utils/phoneNormalizer');
const { isUSPhoneNumber } = require('../utils/twilio');

function requireJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
}

// Auth middleware — verifies token and attaches req.user
function requireAuth(req, res, next) {
  const raw = req.headers.authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : null;
  if (!token) {
    console.log(`🔒 requireAuth: no token on ${req.method} ${req.path}`);
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, requireJwtSecret());
    req.user = decoded;
    // Normalize id: support both { proId } (legacy proRoutes tokens) and { id } (current tokens)
    req.user.id = decoded.id || decoded.proId;
    console.log(`🔐 requireAuth: token valid, user.id=${req.user.id}`);
    return next();
  } catch {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
}

// Subscription gate — must come after requireAuth; always checks DB for freshness
async function requireActiveSubscription(req, res, next) {
  try {
    const pro = await Pro.findById(req.user.id).select('subscriptionActive subscriptionType');
    if (!pro) return res.status(404).json({ error: 'Pro account not found' });
    // Lifetime members always have access
    if (pro.subscriptionType === 'lifetime') {
      req.user.subscriptionActive = true;
      req.user.subscriptionType = 'lifetime';
      return next();
    }
    if (!pro.subscriptionActive) {
      return res.status(403).json({
        error: 'Subscription inactive',
        subscriptionActive: false,
        message: 'Your subscription is inactive. Please renew to access leads.'
      });
    }
    // Attach fresh subscription status to request
    req.user.subscriptionActive = pro.subscriptionActive;
    req.user.subscriptionType = pro.subscriptionType;
    return next();
  } catch (err) {
    console.error('Subscription gate error:', err);
    return res.status(500).json({ error: 'Server error checking subscription' });
  }
}

// POST /api/pro/register
router.post('/register', async (req, res) => {
  const { name, phone, trade, password } = req.body || {};

  if (!name || !phone || !trade || !password) {
    return res.status(400).json({ error: 'name, phone, trade, and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Registration temporarily unavailable. Please try again later.' });
  }

  try {
    const normResult = normalizePhoneToE164(phone);
    if (!normResult.success) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
    const normalizedPhone = normResult.phone;

    const existing = await Pro.findOne({ phone: normalizedPhone });
    if (existing) {
      return res.status(409).json({ error: 'A pro account with this phone number already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const pro = await Pro.create({
      name: name.trim(),
      phone: normalizedPhone,
      trade,
      password: passwordHash,
      // Required fields with defaults for this simplified registration flow
      email: `${normalizedPhone.replace(/\D/g, '')}@noemail.fixlo.internal`,
      dob: new Date('1990-01-01'),
      location: {
        address: 'United States',
        coordinates: [-74.006, 40.7128]
      }
    });

    const token = jwt.sign(
      { id: pro._id, phone: pro.phone, role: 'pro', subscriptionActive: pro.subscriptionActive },
      requireJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      pro: {
        id: pro._id,
        name: pro.name,
        phone: pro.phone,
        trade: pro.trade,
        subscriptionActive: pro.subscriptionActive
      }
    });
  } catch (err) {
    console.error('Pro register error:', err);
    return res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/pro/login
router.post('/login', async (req, res) => {
  const { phone, password } = req.body || {};

  if (!phone || !password) {
    return res.status(400).json({ error: 'Phone number and password are required' });
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Login temporarily unavailable. Please try again later.' });
  }

  try {
    const normResult = normalizePhoneToE164(phone);
    if (!normResult.success) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
    const normalizedPhone = normResult.phone;

    const pro = await Pro.findOne({ phone: normalizedPhone });
    if (!pro) return res.status(401).json({ error: 'Invalid credentials' });

    if (!pro.password) {
      return res.status(403).json({
        error: 'Password not set. Please reset your password.',
        requiresPasswordReset: true
      });
    }

    const ok = await bcrypt.compare(password, pro.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: pro._id, phone: pro.phone, role: 'pro', subscriptionActive: pro.subscriptionActive },
      requireJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      pro: {
        id: pro._id,
        name: pro.name,
        phone: pro.phone,
        trade: pro.trade,
        subscriptionActive: pro.subscriptionActive
      }
    });
  } catch (err) {
    console.error('Pro login error:', err);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/pro/dashboard — requires auth + active subscription
router.get('/dashboard', requireAuth, requireActiveSubscription, async (req, res) => {
  try {
    console.log(`📊 Dashboard hit: user.id=${req.user.id}`);
    const pro = await Pro.findById(req.user.id).select('-password');
    if (!pro) return res.status(404).json({ ok: false, error: 'Pro account not found' });


    const leads = await JobRequest.find({
      $or: [
        { assignedProId: pro._id },
        { assignedTo: pro._id }
      ]

    // Query leads using both assignment fields for compatibility
    const leads = await JobRequest.find({
      $or: [{ assignedProId: pro._id }, { assignedTo: pro._id }]
 main
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .select('trade name phone email address city description status createdAt scheduledDate');

    console.log(`✅ Dashboard: ${leads.length} leads for pro ${pro._id}`);
    return res.json({
      name: pro.name,
      trade: pro.trade,
      role: pro.role || 'pro',
      subscriptionActive: pro.subscriptionType === 'lifetime' ? true : pro.subscriptionActive,
      subscriptionType: pro.subscriptionType || 'monthly',
      leads
    });
  } catch (err) {
    console.error('Pro dashboard error:', err);
    return res.status(500).json({ ok: false, error: 'Server error fetching dashboard' });
  }
});

// PATCH /api/pro/settings — update notification preferences
router.patch('/settings', requireAuth, async (req, res) => {
  try {
    const { whatsappOptIn, wantsNotifications } = req.body || {};
    const pro = await Pro.findById(req.user.id);
    if (!pro) return res.status(404).json({ error: 'Pro account not found' });

    const isUSPro = pro.country === 'US' || isUSPhoneNumber(pro.phone);

    if (typeof wantsNotifications === 'boolean') {
      pro.wantsNotifications = wantsNotifications;
    }
    if (typeof whatsappOptIn === 'boolean') {
      if (!isUSPro) pro.whatsappOptIn = whatsappOptIn;
    }

    await pro.save();
    return res.json({
      pro: {
        whatsappOptIn: pro.whatsappOptIn,
        wantsNotifications: pro.wantsNotifications,
        smsConsent: pro.smsConsent,
        country: pro.country
      }
    });
  } catch (err) {
    console.error('Pro settings error:', err);
    return res.status(500).json({ error: 'Server error updating settings' });
  }
});

// POST /api/pro/billing-portal — creates Stripe billing portal session
router.post('/billing-portal', requireAuth, async (req, res) => {
  try {
    console.log(`💳 Billing portal hit: user.id=${req.user.id}`);
    const stripe = process.env.STRIPE_SECRET_KEY
      ? require('stripe')(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
      : null;

    if (!stripe) {
      return res.status(503).json({ ok: false, error: 'Payment system not configured' });
    }

    const pro = await Pro.findById(req.user.id).select('stripeCustomerId');
    if (!pro) return res.status(404).json({ ok: false, error: 'Pro account not found' });

    console.log(`💳 Billing portal: stripeCustomerId=${pro.stripeCustomerId || 'none'}`);
    if (!pro.stripeCustomerId) {
      return res.status(400).json({ ok: false, error: 'No billing account found. Please subscribe first.' });
    }

    const clientUrl = process.env.CLIENT_URL || 'https://www.fixloapp.com';
    const session = await stripe.billingPortal.sessions.create({
      customer: pro.stripeCustomerId,
      return_url: `${clientUrl}/pro/dashboard`
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error('Billing portal error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to create billing portal session' });
  }
});

module.exports = router;
