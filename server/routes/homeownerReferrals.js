const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const requireAuth = require('../middleware/requireAuth');
const { requireDatabase } = require('../config/database');
const Homeowner = require('../models/Homeowner');
const referrals = require('../services/homeownerReferralService');
const router = express.Router();
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15, standardHeaders: true, legacyHeaders: false });

router.use(requireDatabase);
router.get('/invitation/:code', async (req, res) => {
  try {
    const invitation = await referrals.validateInvitation(req.params.code);
    res.json({ valid: !!invitation, discountPercent: 10 });
  } catch (error) { res.status(error.status || 500).json({ error: error.status ? error.message : 'Unable to check invitation.' }); }
});

router.use(requireAuth, async (req, res, next) => {
  if (req.user.role !== 'homeowner') return res.status(403).json({ error: 'Homeowner access required.' });
  try {
    req.homeowner = await Homeowner.findById(req.user.id);
    if (!req.homeowner) return res.status(404).json({ error: 'Account not found.' });
    next();
  } catch { res.status(500).json({ error: 'Unable to load account.' }); }
});

router.get('/', async (req, res) => {
  try { res.json(await referrals.referralStatus(req.homeowner)); }
  catch { res.status(500).json({ error: 'Unable to load invitation.' }); }
});

router.post('/phone/send', otpLimiter, async (req, res) => {
  if (req.body?.verificationConsent !== true) return res.status(400).json({ error: 'Please agree to receive the verification text.' });
  const phone = referrals.phoneNumber(req.homeowner.phone);
  if (!phone) return res.status(400).json({ error: 'Add a valid phone number to your profile first.' });
  if (req.homeowner.verifiedPhone) return res.json({ alreadyVerified: true });
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_PHONE;
  if (!sid || !token || !from || !process.env.JWT_SECRET) return res.status(503).json({ error: 'Phone verification is temporarily unavailable. Please try again later.' });
  try {
    const code = String(crypto.randomInt(100000, 1000000));
    const hash = crypto.createHmac('sha256', process.env.JWT_SECRET).update(`${req.homeowner._id}:${phone}:${code}`).digest('hex');
    const challenge = await Homeowner.findOneAndUpdate({
      _id: req.homeowner._id,
      $or: [{ phoneCodeSentAt: { $exists: false } }, { phoneCodeSentAt: null }, { phoneCodeSentAt: { $lt: new Date(Date.now() - 60000) } }]
    }, { $set: { phoneCodeHash: hash, phoneCodePhone: phone, phoneCodeExpires: new Date(Date.now() + 10 * 60000), phoneCodeSentAt: new Date(), phoneCodeAttempts: 0 } }, { new: true });
    if (!challenge) return res.status(429).json({ error: 'Please wait one minute before requesting another code.' });
    try {
      await require('twilio')(sid, token).messages.create({ to: phone, from, body: `Fixlo: Your phone verification code is ${code}. It expires in 10 minutes. Reply STOP to opt out.` });
    } catch (error) {
      await Homeowner.updateOne({ _id: challenge._id, phoneCodeHash: hash }, { $unset: { phoneCodeHash: 1, phoneCodeExpires: 1, phoneCodeSentAt: 1 } });
      return res.status(502).json({ error: 'The verification text could not be sent. Please try again.' });
    }
    res.json({ sent: true });
  } catch { res.status(500).json({ error: 'Unable to send verification code.' }); }
});

router.post('/phone/verify', otpLimiter, async (req, res) => {
  try {
    const phone = referrals.phoneNumber(req.homeowner.phone);
    const code = String(req.body?.code || '');
    if (!/^\d{6}$/.test(code) || !phone || !process.env.JWT_SECRET) return res.status(400).json({ error: 'Enter the six-digit verification code.' });
    // Increment attempts atomically so concurrent guesses share the same limit.
    const challenge = await Homeowner.findOneAndUpdate({ _id: req.homeowner._id, phoneCodePhone: phone, phoneCodeExpires: { $gt: new Date() }, phoneCodeAttempts: { $lt: 5 } }, { $inc: { phoneCodeAttempts: 1 } }, { new: true }).select('+phoneCodeHash');
    const hash = crypto.createHmac('sha256', process.env.JWT_SECRET).update(`${req.homeowner._id}:${phone}:${code}`).digest('hex');
    if (!challenge?.phoneCodeHash || challenge.phoneCodeHash !== hash) return res.status(400).json({ error: 'Invalid or expired code. Request another code if needed.' });
    const homeowner = await Homeowner.findOneAndUpdate({ _id: challenge._id, phoneCodeHash: hash, phoneCodePhone: phone, phoneCodeExpires: { $gt: new Date() } }, { $set: { verifiedPhone: phone, phoneVerifiedAt: new Date() }, $unset: { phoneCodeHash: 1, phoneCodeExpires: 1 } }, { new: true });
    if (!homeowner) return res.status(409).json({ error: 'This verification code has already been used.' });
    await referrals.grantDiscount(homeowner);
    res.json(await referrals.referralStatus(homeowner));
  } catch (error) { res.status(error.status || 500).json({ error: error.status ? error.message : 'Unable to verify your phone.' }); }
});

module.exports = router;
