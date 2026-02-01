const express = require('express');
const router = express.Router();
const EarlyAccessSpots = require('../models/EarlyAccessSpots');
const { calculatePrice, formatPrice } = require('../config/pricing');

/**
 * GET /api/pricing-status
 * Returns current pricing status including early access availability
 * 
 * Response:
 * {
 *   earlyAccessSpotsRemaining: number,
 *   earlyAccessAvailable: boolean,
 *   currentPrice: number,
 *   nextPrice: number,
 *   currentPriceFormatted: string,
 *   nextPriceFormatted: string
 * }
 */
router.get('/', async (req, res) => {
  try {
    // Get or create early access spots instance
    const spotsInstance = await EarlyAccessSpots.getInstance();
    
    // Determine if early access is available
    const earlyAccessAvailable = spotsInstance.isEarlyAccessAvailable();
    
    // Get country code from query param or default to US
    const countryCode = req.query.countryCode || 'US';
    
    // Calculate prices for the country
    const earlyAccessPrice = calculatePrice('proMonthlySubscriptionEarlyAccess', countryCode);
    const standardPrice = calculatePrice('proMonthlySubscription', countryCode);
    
    // Determine current price based on availability
    const currentPrice = earlyAccessAvailable 
      ? earlyAccessPrice.amount 
      : standardPrice.amount;
    
    const currentPriceFormatted = earlyAccessAvailable
      ? formatPrice(earlyAccessPrice.amount, earlyAccessPrice.currency)
      : formatPrice(standardPrice.amount, standardPrice.currency);
    
    const nextPriceFormatted = formatPrice(standardPrice.amount, standardPrice.currency);
    
    res.json({
      success: true,
      data: {
        earlyAccessSpotsRemaining: spotsInstance.spotsRemaining,
        earlyAccessAvailable,
        currentPrice,
        nextPrice: standardPrice.amount,
        currentPriceFormatted,
        nextPriceFormatted,
        currency: earlyAccessAvailable ? earlyAccessPrice.currency : standardPrice.currency,
        message: earlyAccessAvailable 
          ? `Only ${spotsInstance.spotsRemaining} early-access spots remain. Once filled, Fixlo Pro increases to ${nextPriceFormatted}/month permanently.`
          : `Early access has ended. Fixlo Pro is now ${nextPriceFormatted}/month.`
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching pricing status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pricing status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/pricing-status/daily-decrement
 * Performs daily spot decrement (1-3 spots)
 * Should be called by a cron job or scheduler once per day
 * 
 * Security: Should be protected by API key or internal-only access
 */
router.post('/daily-decrement', async (req, res) => {
  try {
    // Optional: Add API key validation here
    const apiKey = req.headers['x-api-key'];
    const expectedKey = process.env.PRICING_API_KEY;
    
    if (expectedKey && apiKey !== expectedKey) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid API key'
      });
    }
    
    const spotsInstance = await EarlyAccessSpots.getInstance();
    const decremented = await spotsInstance.performDailyDecrement();
    
    res.json({
      success: true,
      data: {
        decremented,
        spotsRemaining: spotsInstance.spotsRemaining,
        message: decremented 
          ? `Daily decrement performed. ${spotsInstance.spotsRemaining} spots remaining.`
          : 'Daily decrement already performed today or spots at 0.'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error performing daily decrement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform daily decrement',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
