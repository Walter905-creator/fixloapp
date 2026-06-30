/**
 * Recruiter Referral Tracking Route
 *
 * Called when a pro signs up via a recruiter link/code.
 *
 * POST /api/recruiter/track-pro-signup
 *   Body: { proId, proEmail, proName, proTrade, proCity, proPhone,
 *           stripeCustomerId, stripeSubscriptionId, refCode, signupIp }
 */

const router = require('express').Router();
const RecruiterProfile = require('../models/RecruiterProfile');
const RecruiterReferralCode = require('../models/RecruiterReferralCode');
const RecruiterReferral = require('../models/RecruiterReferral');
const { sendRecruiterSms } = require('../services/recruiterSmsService');

/**
 * POST /api/recruiter/track-pro-signup
 *
 * This is called internally from the pro signup / Stripe checkout flow.
 * Body can include refCode (recruiter code) to attribute the signup.
 */
router.post('/track-pro-signup', async (req, res) => {
  try {
    const {
      proId,
      proEmail,
      proName,
      proTrade,
      proCity,
      proPhone,
      stripeCustomerId,
      stripeSubscriptionId,
      refCode,
      signupIp
    } = req.body || {};

    if (!proEmail) {
      return res.status(400).json({ error: 'proEmail required' });
    }

    if (!refCode) {
      // No referral code — nothing to track
      return res.json({ ok: true, tracked: false });
    }

    const upperCode = refCode.trim().toUpperCase();

    // --- Fraud check: duplicate email ---
    const existingReferral = await RecruiterReferral.findOne({ proEmail: proEmail.toLowerCase() });
    if (existingReferral) {
      console.warn(`⚠️ [RecruiterTracking] Duplicate pro signup for email: ${proEmail}`);
      return res.json({ ok: true, tracked: false, reason: 'duplicate_email' });
    }

    // --- Resolve recruiter from code ---
    let recruiter = null;
    let referralSource = 'link';

    // 1. Check permanent recruiter code
    recruiter = await RecruiterProfile.findOne({ recruiterCode: upperCode, status: 'active' });

    // 2. Check one-time codes
    if (!recruiter) {
      const oneTimeCode = await RecruiterReferralCode.findOne({
        code: upperCode,
        isActive: true,
        isUsed: false,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
      });

      if (oneTimeCode) {
        recruiter = await RecruiterProfile.findById(oneTimeCode.recruiterId);
        if (recruiter && recruiter.status === 'active') {
          referralSource = 'code';
          // Mark code as used
          oneTimeCode.isUsed = true;
          oneTimeCode.usedBy = proEmail;
          oneTimeCode.usedDate = new Date();
          await oneTimeCode.save();
        }
      }
    }

    if (!recruiter) {
      return res.json({ ok: true, tracked: false, reason: 'recruiter_not_found' });
    }

    // --- Self-referral prevention ---
    if (recruiter.email === proEmail.toLowerCase()) {
      console.warn(`⚠️ [RecruiterTracking] Self-referral attempt by ${proEmail}`);
      return res.json({ ok: true, tracked: false, reason: 'self_referral' });
    }

    // --- Create referral record ---
    const referral = await RecruiterReferral.create({
      recruiterId: recruiter._id,
      parentRecruiterId: recruiter.parentRecruiterId || null,
      proId: proId || null,
      proEmail: proEmail.toLowerCase(),
      proName: proName || '',
      proTrade: proTrade || '',
      proCity: proCity || '',
      proPhone: proPhone || '',
      stripeCustomerId: stripeCustomerId || null,
      stripeSubscriptionId: stripeSubscriptionId || null,
      referralCode: upperCode,
      referralSource,
      signupIp: signupIp || '',
      status: 'pending'
    });

    // Increment stats
    await RecruiterProfile.findByIdAndUpdate(recruiter._id, {
      $inc: { totalReferrals: 1 }
    });

    // SMS to recruiter
    try {
      if (recruiter.phoneNumber && recruiter.smsOptIn) {
        await sendRecruiterSms(recruiter, 'new_referral', {});
      }
    } catch (smsErr) {
      console.warn('⚠️ [RecruiterTracking] SMS failed:', smsErr.message);
    }

    console.log(`✅ [RecruiterTracking] Pro ${proEmail} attributed to recruiter ${recruiter._id}`);
    return res.json({ ok: true, tracked: true, referralId: referral._id });
  } catch (err) {
    console.error('❌ [RecruiterTracking] Error:', err.message);
    return res.status(500).json({ error: 'Tracking failed' });
  }
});

/**
 * PATCH /api/recruiter/referrals/attach-subscription
 * Called when a Stripe subscription is created for a referred pro.
 */
router.patch('/referrals/attach-subscription', async (req, res) => {
  try {
    const { proEmail, stripeCustomerId, stripeSubscriptionId } = req.body || {};
    if (!proEmail) return res.status(400).json({ error: 'proEmail required' });

    const referral = await RecruiterReferral.findOne({ proEmail: proEmail.toLowerCase() });
    if (!referral) return res.json({ ok: true, updated: false });

    if (stripeCustomerId) referral.stripeCustomerId = stripeCustomerId;
    if (stripeSubscriptionId) referral.stripeSubscriptionId = stripeSubscriptionId;
    await referral.save();

    return res.json({ ok: true, updated: true });
  } catch (err) {
    console.error('❌ [RecruiterTracking] attach-subscription error:', err.message);
    return res.status(500).json({ error: 'Could not attach subscription' });
  }
});

module.exports = router;
