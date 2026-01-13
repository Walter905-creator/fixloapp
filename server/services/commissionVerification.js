const CommissionReferral = require('../models/CommissionReferral');
const Pro = require('../models/Pro');

/**
 * Commission Verification Service
 * 
 * Handles the 30-day verification process for commission referrals.
 * This service checks if referred Pros have stayed active for 30 days
 * and marks their referrals as eligible for payout.
 * 
 * CRITICAL RULES:
 * - Only runs when REFERRALS_ENABLED=true
 * - Verifies Pro is still active (subscription active)
 * - Marks referral as 'eligible' after 30 days
 * - Records eligibleDate for tracking
 */

/**
 * Check and update referrals that have reached 30-day mark
 * @returns {Object} Results of the verification process
 */
async function verify30DayReferrals() {
  // Check feature flag
  const enabled = process.env.REFERRALS_ENABLED === 'true';
  if (!enabled) {
    return {
      success: true,
      checked: 0,
      eligible: 0,
      failed: 0,
      message: 'Commission referral feature is disabled'
    };
  }

  try {
    const now = new Date();
    let checked = 0;
    let eligible = 0;
    let failed = 0;

    // Find all active referrals that haven't completed 30 days yet
    const activeReferrals = await CommissionReferral.find({
      status: 'active',
      is30DaysComplete: false,
      thirtyDayMarkDate: { $lte: now } // 30-day mark has passed
    });

    checked = activeReferrals.length;
    console.log(`🔍 Checking ${checked} commission referrals for 30-day eligibility...`);

    for (const referral of activeReferrals) {
      try {
        // Verify the Pro is still active
        const pro = await Pro.findById(referral.referredProId);
        
        if (!pro) {
          console.warn(`⚠️ Pro not found for referral: ${referral._id}`);
          // Mark as cancelled if Pro doesn't exist
          referral.status = 'cancelled';
          await referral.save();
          failed++;
          continue;
        }

        // Check if Pro's subscription is active
        // Assuming Pro model has subscriptionStatus or similar field
        const isActive = pro.subscriptionStatus === 'active' || 
                        pro.subscriptionStatus === 'trialing' ||
                        (pro.stripeSubscriptionId && !pro.subscriptionCancelled);

        if (isActive) {
          // Pro is still active after 30 days - mark as eligible
          referral.is30DaysComplete = true;
          referral.status = 'eligible';
          referral.eligibleDate = now;
          await referral.save();
          
          console.log(`✅ Referral eligible: ${referral.referredProEmail} ($${(referral.commissionAmount / 100).toFixed(2)})`);
          eligible++;
        } else {
          // Pro cancelled before 30 days - mark referral as cancelled
          referral.status = 'cancelled';
          referral.is30DaysComplete = false;
          await referral.save();
          
          console.log(`❌ Referral cancelled: ${referral.referredProEmail} (Pro inactive)`);
          failed++;
        }
      } catch (err) {
        console.error(`❌ Error processing referral ${referral._id}:`, err.message);
        failed++;
      }
    }

    const result = {
      success: true,
      checked,
      eligible,
      failed,
      message: `Processed ${checked} referrals: ${eligible} eligible, ${failed} failed`
    };

    console.log(`✅ 30-day verification completed:`, result);
    return result;

  } catch (err) {
    console.error('❌ Error in 30-day verification:', err);
    return {
      success: false,
      checked: 0,
      eligible: 0,
      failed: 0,
      error: err.message
    };
  }
}

module.exports = {
  verify30DayReferrals
};
