/**
 * Recruiter Commission Engine
 *
 * Called after a pro's FIRST subscription payment succeeds (via Stripe webhook).
 *
 * Commission structure:
 *   Level 1 (direct recruiter): 50% of first-month amount
 *   Level 2 (parent recruiter): 10% of first-month amount
 *
 * Hold period: 14 days before commissions move to 'approved'.
 */

const RecruiterReferral = require('../models/RecruiterReferral');
const RecruiterCommission = require('../models/RecruiterCommission');
const RecruiterProfile = require('../models/RecruiterProfile');
const { sendRecruiterSms } = require('./recruiterSmsService');
const { notify: ownerNotify } = require('./ownerNotificationService');

const LEVEL1_RATE = 0.50;
const LEVEL2_RATE = 0.10;
const HOLD_DAYS = 14;

/**
 * Generate commissions for a referral after first payment.
 *
 * @param {string} stripeSubscriptionId  Stripe subscription ID
 * @param {number} amountCents           First payment amount in cents
 * @returns {object} result
 */
async function generateCommissionsForFirstPayment(stripeSubscriptionId, amountCents) {
  // Find the referral record
  const referral = await RecruiterReferral.findOne({ stripeSubscriptionId });
  if (!referral) {
    return { ok: false, reason: 'No referral found for subscription' };
  }

  if (referral.firstPaymentDate) {
    return { ok: false, reason: 'Commission already generated for this referral' };
  }

  // Guard against fraud
  if (referral.status === 'fraud_review') {
    return { ok: false, reason: 'Referral under fraud review' };
  }

  // Mark first payment
  referral.firstPaymentDate = new Date();
  referral.subscriptionAmount = amountCents;
  referral.status = 'active';
  await referral.save();

  const holdUntil = new Date(Date.now() + HOLD_DAYS * 24 * 60 * 60 * 1000);
  const createdCommissions = [];

  // Level 1: direct recruiter
  const l1Amount = Math.round(amountCents * LEVEL1_RATE);
  const l1Commission = await RecruiterCommission.create({
    referralId: referral._id,
    recruiterId: referral.recruiterId,
    level: 1,
    amount: l1Amount,
    sourceAmount: amountCents,
    status: 'held',
    holdUntil
  });
  createdCommissions.push(l1Commission);

  // Update recruiter profile stats
  await RecruiterProfile.findByIdAndUpdate(referral.recruiterId, {
    $inc: {
      heldCommissions: l1Amount,
      lifetimeCommissions: l1Amount
    }
  });

  // Send SMS to level-1 recruiter
  try {
    const recruiter = await RecruiterProfile.findById(referral.recruiterId);
    if (recruiter?.phoneNumber) {
      await sendRecruiterSms(recruiter, 'commission_generated', {
        amount: (l1Amount / 100).toFixed(2)
      });
    }
    // Owner notification — level-1 referral commission
    ownerNotify('referral_commission', {
      recruiter:      recruiter?.name || String(referral.recruiterId),
      professional:   String(referral.proId || 'N/A'),
      amount:         (l1Amount / 100).toFixed(2),
      referralLevel:  1,
      commissionId:   String(l1Commission._id)
    }).catch(() => {});
  } catch (smsErr) {
    console.warn('⚠️ Could not send level-1 commission SMS:', smsErr.message);
  }

  // Level 2: parent recruiter (if exists)
  if (referral.parentRecruiterId) {
    const l2Amount = Math.round(amountCents * LEVEL2_RATE);
    const l2Commission = await RecruiterCommission.create({
      referralId: referral._id,
      recruiterId: referral.parentRecruiterId,
      level: 2,
      amount: l2Amount,
      sourceAmount: amountCents,
      status: 'held',
      holdUntil
    });
    createdCommissions.push(l2Commission);

    await RecruiterProfile.findByIdAndUpdate(referral.parentRecruiterId, {
      $inc: {
        heldCommissions: l2Amount,
        lifetimeCommissions: l2Amount
      }
    });

    // SMS for level-2 recruiter
    try {
      const parentRecruiter = await RecruiterProfile.findById(referral.parentRecruiterId);
      if (parentRecruiter?.phoneNumber) {
        await sendRecruiterSms(parentRecruiter, 'commission_generated', {
          amount: (l2Amount / 100).toFixed(2)
        });
      }
      // Owner notification — level-2 referral commission
      ownerNotify('referral_commission', {
        recruiter:      parentRecruiter?.name || String(referral.parentRecruiterId),
        professional:   String(referral.proId || 'N/A'),
        amount:         (l2Amount / 100).toFixed(2),
        referralLevel:  2,
        commissionId:   String(l2Commission._id)
      }).catch(() => {});
    } catch (smsErr) {
      console.warn('⚠️ Could not send level-2 commission SMS:', smsErr.message);
    }
  }

  console.log(`✅ [CommissionEngine] Generated ${createdCommissions.length} commission(s) for referral ${referral._id}`);
  return { ok: true, commissions: createdCommissions };
}

/**
 * Cancel all pending/held commissions for a referral
 * (called when subscription fails, refunded, or cancelled).
 *
 * @param {string} stripeSubscriptionId
 * @param {string} reason  'cancelled' | 'refunded' | 'fraud_review'
 */
async function cancelCommissionsForSubscription(stripeSubscriptionId, reason = 'cancelled') {
  const referral = await RecruiterReferral.findOne({ stripeSubscriptionId });
  if (!referral) return { ok: false };

  const validStatus = ['pending', 'held'];
  const result = await RecruiterCommission.updateMany(
    { referralId: referral._id, status: { $in: validStatus } },
    { $set: { status: reason === 'fraud_review' ? 'fraud_review' : reason } }
  );

  // Revert held stats
  const cancelled = await RecruiterCommission.find({ referralId: referral._id });
  for (const c of cancelled) {
    await RecruiterProfile.findByIdAndUpdate(c.recruiterId, {
      $inc: { heldCommissions: -c.amount, lifetimeCommissions: -c.amount }
    });
  }

  referral.status = reason === 'fraud_review' ? 'fraud_review' : 'cancelled';
  await referral.save();

  console.log(`⚠️ [CommissionEngine] Cancelled commissions for subscription ${stripeSubscriptionId}: ${reason}`);
  return { ok: true, modified: result.modifiedCount || 0 };
}

/**
 * Release held commissions whose holdUntil has passed.
 * Called by scheduled task.
 */
async function releaseApprovedCommissions() {
  const released = await RecruiterCommission.releaseHeld();

  if (released > 0) {
    // Update approvedCommissions on affected recruiter profiles
    const now = new Date();
    const recentlyApproved = await RecruiterCommission.find({
      status: 'approved',
      holdUntil: { $lte: now },
      payoutId: null
    });

    const byRecruiter = {};
    for (const c of recentlyApproved) {
      const id = c.recruiterId.toString();
      byRecruiter[id] = (byRecruiter[id] || 0) + c.amount;
    }

    for (const [recruiterId, totalAmount] of Object.entries(byRecruiter)) {
      const recruiter = await RecruiterProfile.findById(recruiterId);
      if (!recruiter) continue;

      // Recalculate held vs approved from DB to avoid drift
      const heldTotal = await RecruiterCommission.aggregate([
        { $match: { recruiterId: recruiter._id, status: 'held' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const approvedTotal = await RecruiterCommission.aggregate([
        { $match: { recruiterId: recruiter._id, status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      recruiter.heldCommissions = heldTotal[0]?.total || 0;
      recruiter.approvedCommissions = approvedTotal[0]?.total || 0;
      await recruiter.save();

      // SMS notification
      try {
        if (recruiter.phoneNumber && recruiter.smsOptIn) {
          await sendRecruiterSms(recruiter, 'commission_approved', {
            amount: (totalAmount / 100).toFixed(2)
          });
        }
      } catch (smsErr) {
        console.warn('⚠️ Could not send commission approval SMS:', smsErr.message);
      }
    }
  }

  return released;
}

/**
 * Process weekly payouts for all recruiters with approved commissions.
 * Runs every Monday.
 */
async function processWeeklyPayouts() {
  let stripe;
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  } catch (e) {
    console.warn('⚠️ Stripe not available for payouts:', e.message);
    return { ok: false, reason: 'Stripe not initialized' };
  }

  const RecruiterPayout = require('../models/RecruiterPayout');

  // Find recruiters with approved commissions and a connected Stripe account
  const recruiters = await RecruiterProfile.find({
    status: 'active',
    stripeConnectAccountId: { $ne: null },
    stripeConnectOnboarded: true
  });

  const results = [];

  for (const recruiter of recruiters) {
    try {
      const approvedCommissions = await RecruiterCommission.find({
        recruiterId: recruiter._id,
        status: 'approved',
        payoutId: null
      });

      if (!approvedCommissions.length) continue;

      const totalCents = approvedCommissions.reduce((sum, c) => sum + c.amount, 0);
      if (totalCents < 100) continue; // skip if less than $1

      // Create Stripe transfer
      const transfer = await stripe.transfers.create({
        amount: totalCents,
        currency: 'usd',
        destination: recruiter.stripeConnectAccountId,
        metadata: {
          recruiterId: recruiter._id.toString(),
          commissionCount: String(approvedCommissions.length)
        }
      });

      // Create payout record
      const payout = await RecruiterPayout.create({
        recruiterId: recruiter._id,
        amount: totalCents,
        stripeTransferId: transfer.id,
        payoutDate: new Date(),
        status: 'paid',
        commissionIds: approvedCommissions.map(c => c._id)
      });

      // Mark commissions as paid
      const commissionIds = approvedCommissions.map(c => c._id);
      await RecruiterCommission.updateMany(
        { _id: { $in: commissionIds } },
        { $set: { status: 'paid', paidDate: new Date(), payoutId: payout._id } }
      );

      // Update recruiter stats
      recruiter.approvedCommissions = 0;
      recruiter.paidCommissions = (recruiter.paidCommissions || 0) + totalCents;
      await recruiter.save();

      // SMS notification
      try {
        if (recruiter.phoneNumber && recruiter.smsOptIn) {
          await sendRecruiterSms(recruiter, 'payout_sent', {
            amount: (totalCents / 100).toFixed(2)
          });
        }
      } catch (smsErr) {
        console.warn('⚠️ SMS for payout failed:', smsErr.message);
      }

      results.push({ recruiterId: recruiter._id, amount: totalCents, status: 'paid' });
      console.log(`✅ [WeeklyPayout] Sent $${(totalCents / 100).toFixed(2)} to recruiter ${recruiter._id}`);
    } catch (err) {
      console.error(`❌ [WeeklyPayout] Failed for recruiter ${recruiter._id}:`, err.message);

      // Create failed payout record using the already-required RecruiterPayout
      await RecruiterPayout.create({
        recruiterId: recruiter._id,
        amount: 0,
        status: 'failed',
        failureReason: err.message
      });

      results.push({ recruiterId: recruiter._id, status: 'failed', error: err.message });
    }
  }

  return { ok: true, results };
}

module.exports = {
  generateCommissionsForFirstPayment,
  cancelCommissionsForSubscription,
  releaseApprovedCommissions,
  processWeeklyPayouts
};
