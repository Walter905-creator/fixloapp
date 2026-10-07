const crypto = require('crypto');
const Homeowner = require('../models/Homeowner');
const Discount = require('../models/HomeownerDiscount');
const { normalizePhoneToE164 } = require('../utils/phoneNormalizer');

const CAMPAIGN_CODE = 'FIXLO10';
const normalizeCode = value => typeof value === 'string' ? value.trim().toUpperCase() : '';
const createCode = () => `HW-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

function phoneNumber(value) {
  const result = normalizePhoneToE164(value);
  return result.success && /^\+[1-9]\d{9,14}$/.test(result.phone) ? result.phone : null;
}

async function validateInvitation(code, { email, phone } = {}) {
  const normalized = normalizeCode(code);
  if (!normalized) return null;
  if (normalized === CAMPAIGN_CODE) return { code: normalized, referrerId: null };
  if (!/^HW-[A-F0-9]{12}$/.test(normalized)) throw Object.assign(new Error('Invalid invitation code.'), { status: 400 });
  const referrer = await Homeowner.findOne({ referralCode: normalized }).lean();
  if (!referrer) throw Object.assign(new Error('This invitation code was not found.'), { status: 400 });
  if ((email && referrer.email === email.toLowerCase().trim()) ||
      (phone && phoneNumber(referrer.phone) === phoneNumber(phone))) {
    throw Object.assign(new Error('You cannot use your own invitation code.'), { status: 400 });
  }
  return { code: normalized, referrerId: referrer._id };
}

async function ensureReferralCode(homeownerId) {
  const existing = await Homeowner.findById(homeownerId).select('referralCode').lean();
  if (existing?.referralCode) return existing.referralCode;
  const updated = await Homeowner.findOneAndUpdate(
    { _id: homeownerId, $or: [{ referralCode: { $exists: false } }, { referralCode: null }] },
    { $set: { referralCode: createCode() } }, { new: true }
  );
  return updated?.referralCode || (await Homeowner.findById(homeownerId).select('referralCode').lean())?.referralCode;
}

async function grantDiscount(homeowner) {
  if (!homeowner.invitationCode || !homeowner.verifiedPhone) return null;
  await validateInvitation(homeowner.invitationCode, { email: homeowner.email, phone: homeowner.verifiedPhone });
  try {
    return await Discount.findOneAndUpdate(
      { _id: homeowner.verifiedPhone },
      { $setOnInsert: { homeownerId: homeowner._id, invitationCode: homeowner.invitationCode } },
      { upsert: true, new: true }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    return Discount.findById(homeowner.verifiedPhone);
  }
}

async function referralStatus(homeowner) {
  const code = await ensureReferralCode(homeowner._id);
  let discount = homeowner.verifiedPhone ? await Discount.findById(homeowner.verifiedPhone).lean() : null;
  // Recover a verification interrupted after saving the verified phone.
  if (!discount && homeowner.verifiedPhone && homeowner.invitationCode) {
    try { discount = await grantDiscount(homeowner); }
    catch (error) { if (!error.status) throw error; }
  }
  let status = 'not_invited';
  if (homeowner.invitationCode) {
    status = !homeowner.verifiedPhone ? 'verify_phone' :
      !discount || String(discount.homeownerId) !== String(homeowner._id) ? 'unavailable' :
      discount.usedAt ? 'used' : discount.reservedJobId ? 'reserved' : 'available';
  }
  const base = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://www.fixloapp.com').replace(/\/$/, '');
  return { code, link: `${base}/signup/homeowner?invite=${encodeURIComponent(code)}`, discountPercent: 10, status, phoneVerified: !!homeowner.verifiedPhone };
}

function discountAmounts(grossAmount) {
  if (!Number.isFinite(grossAmount) || grossAmount < 0) throw new Error('Invalid service total.');
  const grossCents = Math.round(grossAmount * 100);
  const discountCents = Math.round(grossCents * 0.1);
  return { grossTotal: grossCents / 100, discountAmount: discountCents / 100, total: (grossCents - discountCents) / 100 };
}

// Reserve atomically BEFORE creating a charge. A failed/uncertain charge retains
// the reservation for this job; another concurrent job cannot spend it again.
async function reserveJobDiscount(job, grossAmount) {
  if (job.homeownerDiscountPhone) return { grossTotal: job.discountGrossTotal, discountAmount: job.discountAmount, total: Math.round((job.discountGrossTotal - job.discountAmount) * 100) / 100 };
  const undiscounted = { grossTotal: grossAmount, discountAmount: 0, total: grossAmount };
  if (!job.email || !phoneNumber(job.phone) || grossAmount <= 0) return undiscounted;
  const homeowner = await Homeowner.findOne({ email: job.email.toLowerCase().trim(), verifiedPhone: phoneNumber(job.phone) }).lean();
  if (!homeowner) return undiscounted;
  const benefit = await Discount.findOneAndUpdate({
    _id: homeowner.verifiedPhone, homeownerId: homeowner._id, usedAt: null,
    $or: [{ reservedJobId: null }, { reservedJobId: job._id }]
  }, { $set: { reservedJobId: job._id } }, { new: true });
  if (!benefit) return undiscounted;
  const amounts = discountAmounts(grossAmount);
  job.homeownerDiscountPhone = homeowner.verifiedPhone;
  job.discountGrossTotal = amounts.grossTotal;
  job.discountAmount = amounts.discountAmount;
  await job.save();
  return amounts;
}

async function completeJobDiscount(job) {
  if (!job.homeownerDiscountPhone) return;
  await Discount.updateOne({ _id: job.homeownerDiscountPhone, reservedJobId: job._id, usedAt: null }, { $set: { usedAt: new Date() } });
}

module.exports = { CAMPAIGN_CODE, normalizeCode, createCode, phoneNumber, validateInvitation, ensureReferralCode, grantDiscount, referralStatus, discountAmounts, reserveJobDiscount, completeJobDiscount };
