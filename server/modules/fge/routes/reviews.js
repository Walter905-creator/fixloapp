/**
 * FGE Review System Routes
 * POST /api/fge/reviews/request    – send review request after job completion
 * GET  /api/fge/reviews/admin      – admin list of all reviews
 * GET  /api/fge/reviews/public     – public list of approved reviews
 * PUT  /api/fge/reviews/:id/approve
 * PUT  /api/fge/reviews/:id/reject
 */

'use strict';

const router = require('express').Router();
const requireAuth = require('../../../middleware/requireAuth');
const requireAdmin = require('../../../middleware/requireAdmin');
const Review = require('../../../models/Review'); // use existing Review model
const { sendEmail } = require('../services/emailSender');
const { sendSms } = require('../services/smsSender');
const { allowedEnum, posInt } = require('../middleware/sanitize');

const REVIEW_STATUSES = ['pending','approved','rejected'];
const CHANNEL_VALUES  = ['email','sms','both'];

const SITE_BASE_URL = process.env.SITE_BASE_URL || 'https://fixloapp.com';

// ─── Public ───────────────────────────────────────────────────────────────────

router.get('/public', async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return res.json({ ok: true, reviews });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Admin guard ──────────────────────────────────────────────────────────────

router.use(requireAuth, requireAdmin);

// ─── Admin list ───────────────────────────────────────────────────────────────

router.get('/admin', async (req, res) => {
  try {
    const page   = posInt(req.query.page, 1);
    const limit  = posInt(req.query.limit, 20);
    const status = allowedEnum(req.query.status, REVIEW_STATUSES);
    const filter = {};
    if (status) filter.status = status;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    return res.json({ ok: true, reviews, total });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Request review ───────────────────────────────────────────────────────────

/**
 * POST /api/fge/reviews/request
 * Body: { jobId, homeownerEmail, homeownerPhone?, proName, channel? }
 * Sends a review request via email and/or SMS.
 */
router.post('/request', async (req, res) => {
  try {
    const { jobId, homeownerEmail, homeownerPhone, proName } = req.body;
    const channel = allowedEnum(req.body.channel, CHANNEL_VALUES) || 'email';
    if (!homeownerEmail && !homeownerPhone) {
      return res.status(400).json({ ok: false, error: 'homeownerEmail or homeownerPhone required.' });
    }

    const reviewUrl = `${SITE_BASE_URL}/review?job=${jobId}`;
    const message = `Hi! How was your experience with ${proName || 'your Fixlo Pro'}? Leave a quick review: ${reviewUrl}`;

    const results = {};

    if ((channel === 'email' || channel === 'both') && homeownerEmail) {
      results.email = await sendEmail({
        to: homeownerEmail,
        subject: `How was your Fixlo service? Leave a review`,
        html: `<p>Hi there,</p>
<p>We hope your recent home service went well! It would mean a lot if you could take a moment to leave a review for <strong>${proName || 'your Fixlo Pro'}</strong>.</p>
<p><a href="${reviewUrl}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Leave a Review</a></p>
<p>Thank you for choosing Fixlo!</p>`,
        text: message,
      });
    }

    if ((channel === 'sms' || channel === 'both') && homeownerPhone) {
      results.sms = await sendSms({ to: homeownerPhone, body: message, hasConsent: true });
    }

    return res.json({ ok: true, results, reviewUrl });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Approve / reject ─────────────────────────────────────────────────────────

router.put('/:id/approve', async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    if (!review) return res.status(404).json({ ok: false, error: 'Review not found.' });
    return res.json({ ok: true, review });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.put('/:id/reject', async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    if (!review) return res.status(404).json({ ok: false, error: 'Review not found.' });
    return res.json({ ok: true, review });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
