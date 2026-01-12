/**
 * Commission Referral Verification Service
 * 
 * Daily cron job that checks referrals at day 30:
 * - Verifies Pro is still active
 * - Confirms no refunds or chargebacks
 * - Checks for fraud flags
 * - Moves referral from pending → approved
 * 
 * Run daily at 2 AM UTC
 */

const CommissionReferral = require('../models/CommissionReferral');
const CommissionReferrer = require('../models/CommissionReferrer');
const Pro = require('../models/Pro');

/**
 * Check and verify referrals that are 30 days old
 */
async function verifyPendingReferrals() {
  try {
    console.log('🔍 Starting 30-day referral verification...');
    
    const now = new Date();
    
    // Find all pending referrals due for verification
    const pendingReferrals = await CommissionReferral.find({
      status: 'pending',
      verificationDueDate: { $lte: now },
      proId: { $ne: null },
      stripeSubscriptionId: { $ne: null }
    }).populate('proId');
    
    console.log(`📋 Found ${pendingReferrals.length} referrals ready for verification`);
    
    let approved = 0;
    let rejected = 0;
    let errors = 0;
    
    for (const referral of pendingReferrals) {
      try {
        // Run verification checks
        const passed = await referral.runVerificationChecks();
        
        if (passed) {
          // Calculate commission
          referral.calculateCommission();
          
          // Approve referral
          referral.status = 'approved';
          referral.approvedAt = new Date();
          referral.verifiedAt = new Date();
          referral.approvedBy = 'system';
          
          await referral.save();
          
          // Update referrer stats
          const referrer = await CommissionReferrer.findById(referral.referrerId);
          if (referrer) {
            await referrer.updateStats();
          }
          
          approved++;
          console.log(`✅ Approved referral ${referral._id} - Commission: ${referral.currency} ${referral.commissionAmount}`);
        } else {
          // Determine rejection reason
          let reason = 'failed_verification';
          let details = '';
          
          if (!referral.verificationChecks.proStillActive) {
            reason = 'pro_inactive';
            details = 'Pro account is no longer active';
          } else if (!referral.verificationChecks.subscriptionActive) {
            reason = 'subscription_cancelled';
            details = 'Subscription was cancelled before 30 days';
          } else if (!referral.verificationChecks.noFraudFlags) {
            reason = 'fraud_detected';
            details = 'Fraud flags detected';
          } else if (!referral.verificationChecks.noRefunds) {
            reason = 'refund_issued';
            details = 'Refund was issued';
          } else if (!referral.verificationChecks.noChargebacks) {
            reason = 'chargeback';
            details = 'Chargeback detected';
          }
          
          // Reject referral
          referral.status = 'rejected';
          referral.rejectionReason = reason;
          referral.rejectionDetails = details;
          referral.rejectedAt = new Date();
          
          await referral.save();
          
          // Update referrer stats
          const referrer = await CommissionReferrer.findById(referral.referrerId);
          if (referrer) {
            await referrer.updateStats();
          }
          
          rejected++;
          console.log(`❌ Rejected referral ${referral._id} - Reason: ${reason}`);
        }
      } catch (err) {
        console.error(`❌ Error verifying referral ${referral._id}:`, err.message);
        errors++;
      }
    }
    
    console.log('✅ 30-day verification complete');
    console.log(`   Approved: ${approved}`);
    console.log(`   Rejected: ${rejected}`);
    console.log(`   Errors: ${errors}`);
    
    return {
      success: true,
      approved,
      rejected,
      errors
    };
  } catch (err) {
    console.error('❌ Referral verification error:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Check for overdue referrals (past 35 days, still pending)
 * These should be automatically rejected
 */
async function cleanupOverdueReferrals() {
  try {
    const now = new Date();
    const overdueDate = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000); // 35 days ago
    
    const overdueReferrals = await CommissionReferral.find({
      status: 'pending',
      verificationDueDate: { $lte: overdueDate }
    });
    
    console.log(`🧹 Found ${overdueReferrals.length} overdue referrals to clean up`);
    
    for (const referral of overdueReferrals) {
      referral.status = 'rejected';
      referral.rejectionReason = 'failed_verification';
      referral.rejectionDetails = 'Referral overdue - not verified within 35 days';
      referral.rejectedAt = new Date();
      await referral.save();
      
      // Update referrer stats
      const referrer = await CommissionReferrer.findById(referral.referrerId);
      if (referrer) {
        await referrer.updateStats();
      }
    }
    
    console.log(`✅ Cleaned up ${overdueReferrals.length} overdue referrals`);
  } catch (err) {
    console.error('❌ Cleanup error:', err);
  }
}

/**
 * Main verification job - run daily
 */
async function runDailyVerification() {
  console.log('🚀 Starting daily referral verification job...');
  
  // Verify pending referrals
  await verifyPendingReferrals();
  
  // Cleanup overdue referrals
  await cleanupOverdueReferrals();
  
  console.log('✅ Daily verification job complete');
}

module.exports = {
  verifyPendingReferrals,
  cleanupOverdueReferrals,
  runDailyVerification
};
