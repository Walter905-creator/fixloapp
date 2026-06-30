/**
 * Recruiter SMS Notification Service
 *
 * Sends Twilio SMS notifications to recruiters, pros, and admins
 * for recruiter network events.
 *
 * Uses the existing sendSms utility from utils/twilio.js.
 * Does NOT replace or modify existing SMS functionality.
 */

const { sendSms } = require('../utils/twilio');

// Admin phone(s) to notify for critical events
const ADMIN_PHONE = process.env.ADMIN_PHONE || process.env.TWILIO_FROM_NUMBER;

/**
 * SMS templates for recruiter events
 */
const RECRUITER_TEMPLATES = {
  new_referral: () =>
    `🎉 Fixlo: A new pro has signed up using your referral link. Log in to your dashboard to track your commission. Reply STOP to opt out.`,

  first_payment: () =>
    `💰 Fixlo: Your referred pro has completed their first payment. Commission has been created. Reply STOP to opt out.`,

  commission_generated: ({ amount }) =>
    `💰 Fixlo: Your commission of $${amount} has been created and is in the verification period. Reply STOP to opt out.`,

  commission_held: ({ amount }) =>
    `⏳ Fixlo: Your commission of $${amount} is now in the verification period. Reply STOP to opt out.`,

  commission_approved: ({ amount }) =>
    `✅ Fixlo: Your commission of $${amount} is now available for payout. Reply STOP to opt out.`,

  payout_sent: ({ amount }) =>
    `💵 Fixlo: Your weekly payout of $${amount} has been sent. Reply STOP to opt out.`,

  fraud_review: () =>
    `⚠️ Fixlo: One of your referrals requires manual review. Our team will reach out if needed. Reply STOP to opt out.`,

  weekly_summary: ({ newPros, pendingCommissions, availablePayouts, paidThisWeek }) =>
    `📊 Fixlo Weekly Summary:\nNew Pros: ${newPros}\nPending Commissions: $${pendingCommissions}\nAvailable Payouts: $${availablePayouts}\nPaid This Week: $${paidThisWeek}\nReply STOP to opt out.`
};

/**
 * Admin SMS templates
 */
const ADMIN_TEMPLATES = {
  large_payout: ({ amount, recruiterName }) =>
    `⚠️ Fixlo Admin: Large payout of $${amount} queued for recruiter ${recruiterName}.`,

  fraud_detected: ({ recruiterName, detail }) =>
    `🚨 Fixlo Admin: Fraud activity detected for recruiter ${recruiterName}. ${detail}`,

  duplicate_referral: ({ email }) =>
    `⚠️ Fixlo Admin: Duplicate referral attempt detected for email ${email}.`,

  payout_failure: ({ amount, recruiterName, error }) =>
    `❌ Fixlo Admin: Stripe payout of $${amount} FAILED for recruiter ${recruiterName}. Error: ${error}`,

  high_performer: ({ recruiterName, earnings }) =>
    `🌟 Fixlo Admin: Recruiter ${recruiterName} has earned $${earnings} — high performer threshold exceeded.`
};

/**
 * Send SMS to a recruiter respecting their preferences.
 *
 * @param {object} recruiter  RecruiterProfile document
 * @param {string} eventType  Key from RECRUITER_TEMPLATES
 * @param {object} data       Template variables
 */
async function sendRecruiterSms(recruiter, eventType, data = {}) {
  if (!recruiter?.phoneNumber) return { disabled: true, reason: 'No phone number' };

  // Require explicit SMS opt-in
  if (!recruiter.smsOptIn) return { disabled: true, reason: 'SMS opt-in not granted' };

  // Check per-event preferences (fine-grained opt-out)
  const prefs = recruiter.smsNotifications || {};
  const prefMap = {
    new_referral: 'referrals',
    first_payment: 'commissions',
    commission_generated: 'commissions',
    commission_held: 'commissions',
    commission_approved: 'commissions',
    payout_sent: 'payouts',
    fraud_review: 'fraud',
    weekly_summary: 'weeklySummary'
  };

  const prefKey = prefMap[eventType];
  if (prefKey && prefs[prefKey] === false) {
    return { disabled: true, reason: `SMS opt-out: ${prefKey}` };
  }

  const templateFn = RECRUITER_TEMPLATES[eventType];
  if (!templateFn) {
    console.warn(`⚠️ [RecruiterSMS] Unknown event type: ${eventType}`);
    return { disabled: true, reason: 'Unknown event type' };
  }

  const message = templateFn(data);

  try {
    const result = await sendSms(recruiter.phoneNumber, message);
    console.log(`📱 [RecruiterSMS] Sent "${eventType}" to recruiter ${recruiter._id}`);
    return result;
  } catch (err) {
    console.error(`❌ [RecruiterSMS] Failed to send "${eventType}" to ${recruiter.phoneNumber}:`, err.message);
    return { error: err.message };
  }
}

/**
 * Send admin SMS notification.
 *
 * @param {string} eventType  Key from ADMIN_TEMPLATES
 * @param {object} data       Template variables
 */
async function sendAdminSms(eventType, data = {}) {
  if (!ADMIN_PHONE) return { disabled: true, reason: 'No admin phone configured' };

  const templateFn = ADMIN_TEMPLATES[eventType];
  if (!templateFn) {
    console.warn(`⚠️ [RecruiterSMS] Unknown admin event type: ${eventType}`);
    return { disabled: true, reason: 'Unknown event type' };
  }

  const message = templateFn(data);

  try {
    const result = await sendSms(ADMIN_PHONE, message);
    console.log(`📱 [RecruiterSMS] Admin alert "${eventType}" sent`);
    return result;
  } catch (err) {
    console.error(`❌ [RecruiterSMS] Admin alert failed for "${eventType}":`, err.message);
    return { error: err.message };
  }
}

/**
 * Send weekly SMS summary to all active recruiters with a phone number.
 */
async function sendWeeklySmsToAllRecruiters() {
  const RecruiterProfile = require('../models/RecruiterProfile');
  const RecruiterCommission = require('../models/RecruiterCommission');
  const RecruiterReferral = require('../models/RecruiterReferral');
  const RecruiterPayout = require('../models/RecruiterPayout');

  const recruiters = await RecruiterProfile.find({
    status: 'active',
    phoneNumber: { $exists: true, $ne: null },
    smsOptIn: true,
    'smsNotifications.weeklySummary': { $ne: false }
  });

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let sentCount = 0;

  for (const recruiter of recruiters) {
    try {
      const [newPros, pendingAgg, approvedAgg, paidAgg] = await Promise.all([
        RecruiterReferral.countDocuments({ recruiterId: recruiter._id, createdAt: { $gte: oneWeekAgo } }),
        RecruiterCommission.aggregate([
          { $match: { recruiterId: recruiter._id, status: { $in: ['pending', 'held'] } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        RecruiterCommission.aggregate([
          { $match: { recruiterId: recruiter._id, status: 'approved' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        RecruiterPayout.aggregate([
          { $match: { recruiterId: recruiter._id, status: 'paid', payoutDate: { $gte: oneWeekAgo } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);

      await sendRecruiterSms(recruiter, 'weekly_summary', {
        newPros,
        pendingCommissions: ((pendingAgg[0]?.total || 0) / 100).toFixed(2),
        availablePayouts: ((approvedAgg[0]?.total || 0) / 100).toFixed(2),
        paidThisWeek: ((paidAgg[0]?.total || 0) / 100).toFixed(2)
      });

      sentCount++;
    } catch (err) {
      console.error(`❌ [WeeklySMS] Failed for recruiter ${recruiter._id}:`, err.message);
    }
  }

  return sentCount;
}

module.exports = {
  sendRecruiterSms,
  sendAdminSms,
  sendWeeklySmsToAllRecruiters
};
