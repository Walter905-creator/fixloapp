const Pro = require('../models/Pro');
const { sendEmail } = require('./emailService');
const { sendSms } = require('../utils/twilio');

const DAY_MS = 24 * 60 * 60 * 1000;
const FRONTEND_URL = String(process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://www.fixloapp.com').replace(/\/$/, '');

function daysUntil(date, now = new Date()) {
  if (!date) return null;
  return Math.max(0, Math.ceil((new Date(date).getTime() - now.getTime()) / DAY_MS));
}

function isStandardFreeTrial(pro) {
  return !!pro.freeAccessUntil && !pro.inviteCodeUsed;
}

async function sendTrialPaymentReminder(pro, now = new Date()) {
  const remaining = daysUntil(pro.freeAccessUntil, now);
  const billingUrl = `${FRONTEND_URL}/dashboard/pro?tab=Billing`;
  const price = Number(pro.subscriptionPrice || 59.99).toFixed(2);

  if (pro.email) {
    await sendEmail(
      pro.email,
      'Your Fixlo Pro free period ends soon',
      `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#111827">
          <h2>Your Fixlo Pro free period ends in ${remaining} day${remaining === 1 ? '' : 's'}</h2>
          <p>Your 3-month free period ends on <strong>${new Date(pro.freeAccessUntil).toLocaleDateString('en-US')}</strong>.</p>
          <p>To keep Fixlo Pro active after that date, add a payment method now. You will not be charged before the free period ends.</p>
          <p>After the free period, your Fixlo Pro plan is <strong>$${price}/month</strong> unless you cancel.</p>
          <p><a href="${billingUrl}" style="display:inline-block;background:#111827;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">Add payment method</a></p>
          <p style="font-size:13px;color:#6b7280">If you do not add a payment method, paid billing will not start automatically and Pro access may end when the free period expires.</p>
        </div>
      `
    );
  }

  if (pro.phone && pro.smsConsent) {
    await sendSms(
      pro.phone,
      `Fixlo: Your 3-month Pro free period ends in ${remaining} day${remaining === 1 ? '' : 's'}. Add a payment method in Billing to continue after the trial. No charge before it ends. Reply STOP to unsubscribe.`
    );
  }
}

async function processProTrialBilling(now = new Date()) {
  const reminderCutoff = new Date(now.getTime() + 15 * DAY_MS);

  const reminderCandidates = await Pro.find({
    freeAccessUntil: { $gt: now, $lte: reminderCutoff },
    trialReminder15DaySentAt: null,
    $or: [{ inviteCodeUsed: null }, { inviteCodeUsed: { $exists: false } }]
  });

  let remindersSent = 0;
  let reminderErrors = 0;

  for (const pro of reminderCandidates) {
    if (!isStandardFreeTrial(pro)) continue;
    try {
      await sendTrialPaymentReminder(pro, now);
      pro.trialReminder15DaySentAt = now;
      await pro.save();
      remindersSent += 1;
    } catch (error) {
      reminderErrors += 1;
      console.error(`[PRO_TRIAL_BILLING] Reminder failed for ${pro._id}: ${error.message}`);
    }
  }

  const expiryCandidates = await Pro.find({
    freeAccessUntil: { $lte: now },
    subscriptionType: { $ne: 'lifetime' },
    $or: [{ inviteCodeUsed: null }, { inviteCodeUsed: { $exists: false } }]
  });

  let expiredWithoutBilling = 0;

  for (const pro of expiryCandidates) {
    if (!isStandardFreeTrial(pro)) continue;
    if (pro.stripeSubscriptionId) continue;
    if (pro.trialExpiredAt) continue;

    pro.isActive = false;
    pro.subscriptionActive = false;
    pro.subscriptionStatus = 'inactive';
    pro.paymentStatus = 'pending';
    pro.trialExpiredAt = now;
    await pro.save();
    expiredWithoutBilling += 1;
  }

  return {
    scannedForReminder: reminderCandidates.length,
    remindersSent,
    reminderErrors,
    expiredWithoutBilling
  };
}

module.exports = {
  DAY_MS,
  daysUntil,
  processProTrialBilling,
  sendTrialPaymentReminder
};
