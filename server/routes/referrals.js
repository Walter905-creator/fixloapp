// server/routes/referrals.js
const express = require('express');
const router = express.Router();
const { rewardReferralWithMonth } = require('../services/referralReward');

/**
 * Complete a referral and grant both users 1 month free
 * POST /api/referrals/complete
 */
router.post('/complete', async (req, res) => {
  try {
    const { referrerSubscriptionId, refereeSubscriptionId, referralId } = req.body;
    
    // Validate required fields
    if (!referrerSubscriptionId || !refereeSubscriptionId) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Both referrerSubscriptionId and refereeSubscriptionId are required' 
      });
    }

    // Generate correlation ID for idempotency
    const correlationId = referralId || `ref-${Date.now()}`;

    console.log(`🎁 Processing referral completion: ${correlationId}`);
    console.log(`Referrer subscription: ${referrerSubscriptionId}`);
    console.log(`Referee subscription: ${refereeSubscriptionId}`);

    // Grant 1 month free to both users
    const results = await rewardReferralWithMonth({
      referrerSubscriptionId,
      refereeSubscriptionId,
      correlationId
    });

    console.log('✅ Referral rewards granted successfully');

    return res.json({ 
      ok: true, 
      results,
      message: 'Both users have been granted 1 month free!' 
    });

  } catch (err) {
    console.error('❌ Referral reward error:', err);
    return res.status(500).json({ 
      ok: false, 
      error: err.message 
    });
  }
});

/**
 * Health check endpoint for referral service
 * GET /api/referrals/health
 */
router.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    service: 'referrals',
    message: 'Referral service is operational' 
  });
});

module.exports = router;