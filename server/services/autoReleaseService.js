const JobRequest = require('../models/JobRequest');
const { logPaymentAction } = require('./auditLogger');

/**
 * Auto-release service for stale payment authorizations
 * Prevents stuck payments that were authorized but never captured
 */

// Configuration
const STALE_DAYS = parseInt(process.env.PAYMENT_AUTH_STALE_DAYS) || 7; // Days before auto-release

// Job statuses that should prevent auto-release
// Jobs that are actively being worked on should not have their authorizations released
const ACTIVE_JOB_STATUSES = ['scheduled', 'in-progress', 'completed'];

/**
 * Find and release stale payment authorizations
 * @returns {Promise<Object>} Results of the cleanup operation
 */
async function releaseStaleAuthorizations() {
  try {
    console.log('🔍 Checking for stale payment authorizations...');
    
    // Calculate cutoff date (X days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - STALE_DAYS);

    // Find jobs with stale authorizations
    const staleJobs = await JobRequest.find({
      paymentStatus: 'authorized',
      paymentAuthorizedAt: { $lte: cutoffDate },
      status: { $nin: ACTIVE_JOB_STATUSES } // Exclude active jobs
    });

    console.log(`📊 Found ${staleJobs.length} stale authorizations (older than ${STALE_DAYS} days)`);

    if (staleJobs.length === 0) {
      return {
        success: true,
        releasedCount: 0,
        failedCount: 0,
        message: 'No stale authorizations found'
      };
    }

    // Initialize Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const results = {
      success: true,
      releasedCount: 0,
      failedCount: 0,
      errors: []
    };

    // Release each stale authorization
    for (const job of staleJobs) {
      try {
        if (!job.stripePaymentIntentId) {
          console.warn(`⚠️ Job ${job._id} has no payment intent ID, skipping`);
          continue;
        }

        // Cancel the payment intent
        const paymentIntent = await stripe.paymentIntents.cancel(job.stripePaymentIntentId);
        
        // Update job status
        job.paymentStatus = 'released';
        job.paymentReleasedAt = new Date();
        job.paymentReleasedBy = 'system_auto_release';
        await job.save();

        // Log the auto-release
        await logPaymentAction({
          action: 'released',
          jobId: job._id.toString(),
          stripePaymentIntentId: job.stripePaymentIntentId,
          amount: paymentIntent.amount / 100,
          actorEmail: 'system',
          actorType: 'system'
        });

        console.log(`✅ Auto-released authorization for job ${job._id} (${STALE_DAYS}+ days old)`);
        results.releasedCount++;

      } catch (error) {
        console.error(`❌ Failed to release authorization for job ${job._id}:`, error.message);
        results.failedCount++;
        results.errors.push({
          jobId: job._id.toString(),
          error: error.message
        });

        // Log the failure
        await logPaymentAction({
          action: 'released',
          jobId: job._id.toString(),
          stripePaymentIntentId: job.stripePaymentIntentId,
          actorEmail: 'system',
          actorType: 'system',
          status: 'failure',
          errorMessage: error.message
        });
      }
    }

    console.log(`✅ Auto-release complete: ${results.releasedCount} released, ${results.failedCount} failed`);
    
    return {
      ...results,
      message: `Released ${results.releasedCount} stale authorizations`
    };

  } catch (error) {
    console.error('❌ Error in releaseStaleAuthorizations:', error);
    return {
      success: false,
      releasedCount: 0,
      failedCount: 0,
      error: error.message
    };
  }
}

/**
 * Get statistics on payment authorizations
 * @returns {Promise<Object>} Stats about payment authorizations
 */
async function getAuthorizationStats() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - STALE_DAYS);

    const [
      totalAuthorized,
      staleAuthorized,
      recentlyReleased,
      recentlyCaptured
    ] = await Promise.all([
      JobRequest.countDocuments({ paymentStatus: 'authorized' }),
      JobRequest.countDocuments({ 
        paymentStatus: 'authorized',
        paymentAuthorizedAt: { $lte: cutoffDate }
      }),
      JobRequest.countDocuments({
        paymentStatus: 'released',
        paymentReleasedAt: { $gte: cutoffDate }
      }),
      JobRequest.countDocuments({
        paymentStatus: 'captured',
        paymentCapturedAt: { $gte: cutoffDate }
      })
    ]);

    return {
      totalAuthorized,
      staleAuthorized,
      recentlyReleased,
      recentlyCaptured,
      staleDays: STALE_DAYS
    };
  } catch (error) {
    console.error('❌ Error getting authorization stats:', error);
    return {
      totalAuthorized: 0,
      staleAuthorized: 0,
      recentlyReleased: 0,
      recentlyCaptured: 0,
      staleDays: STALE_DAYS,
      error: error.message
    };
  }
}

module.exports = {
  releaseStaleAuthorizations,
  getAuthorizationStats,
  STALE_DAYS
};
