// server/services/referralReward.js
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

/**
 * Safely extends an active subscription by ~30 days using trial_end.
 * Works whether the sub is in-trial or active; no proration or invoice today.
 */
async function grantOneMonthFree(subscriptionId, idempotencyKeyBase = '') {
  if (!subscriptionId) throw new Error('Missing subscriptionId');

  // Fetch current subscription
  const sub = await stripe.subscriptions.retrieve(subscriptionId);

  // Compute a new trial_end ~30 days from now (in seconds)
  const THIRTY_DAYS = 30 * 24 * 60 * 60;
  const now = Math.floor(Date.now() / 1000);

  // If already on trial in the future, extend from current trial_end; else from now
  const baseline = (sub.trial_end && sub.trial_end > now) ? sub.trial_end : now;
  const newTrialEnd = baseline + THIRTY_DAYS;

  // Update subscription trial_end; avoid proration/invoice today
  const updated = await stripe.subscriptions.update(
    subscriptionId,
    {
      trial_end: newTrialEnd,
      proration_behavior: 'none'
    },
    {
      idempotencyKey: `${idempotencyKeyBase || subscriptionId}-grant-1m-${newTrialEnd}`
    }
  );

  return updated;
}

/**
 * Grants one month to both referrer and referee.
 * Call this when your referral condition is met (e.g., referee completes first paid job).
 */
async function rewardReferralWithMonth({ referrerSubscriptionId, refereeSubscriptionId, correlationId }) {
  const results = {};
  if (referrerSubscriptionId) {
    results.referrer = await grantOneMonthFree(referrerSubscriptionId, `${correlationId}-referrer`);
  }
  if (refereeSubscriptionId) {
    results.referee = await grantOneMonthFree(refereeSubscriptionId, `${correlationId}-referee`);
  }
  return results;
}

module.exports = {
  grantOneMonthFree,
  rewardReferralWithMonth
};