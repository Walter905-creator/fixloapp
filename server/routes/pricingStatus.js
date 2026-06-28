const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
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
    // Check database connection before accessing MongoDB
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ Database not connected, returning default pricing status');
      
      // Get country code from query param or default to US
      const countryCode = req.query.countryCode || 'US';
      
      // Calculate prices for the country (without database access)
      const proPrice = calculatePrice('proMonthlySubscription', countryCode);
      const premiumPrice = calculatePrice('premiumMonthlySubscription', countryCode);
       
      return res.json({
        success: true,
        data: {
          earlyAccessSpotsRemaining: 0,
          earlyAccessAvailable: false,
          currentPrice: proPrice.amount,
          nextPrice: premiumPrice.amount,
          currentPriceFormatted: formatPrice(proPrice.amount, proPrice.currency),
          nextPriceFormatted: formatPrice(premiumPrice.amount, premiumPrice.currency),
          currency: proPrice.currency,
          proPrice: proPrice.amount,
          premiumPrice: premiumPrice.amount,
          proPriceFormatted: formatPrice(proPrice.amount, proPrice.currency),
          premiumPriceFormatted: formatPrice(premiumPrice.amount, premiumPrice.currency),
          message: `Fixlo Pro is ${formatPrice(proPrice.amount, proPrice.currency)}/month and Fixlo Premium is ${formatPrice(premiumPrice.amount, premiumPrice.currency)}/month.`
        },
        timestamp: new Date().toISOString(),
        note: 'Database temporarily unavailable. Showing standard pricing'
      });
    }
    
    // Get country code from query param or default to US
    const countryCode = req.query.countryCode || 'US';
    
    // Calculate prices for the country
    const proPrice = calculatePrice('proMonthlySubscription', countryCode);
    const premiumPrice = calculatePrice('premiumMonthlySubscription', countryCode);
    
    res.json({
      success: true,
      data: {
        earlyAccessSpotsRemaining: 0,
        earlyAccessAvailable: false,
        currentPrice: proPrice.amount,
        nextPrice: premiumPrice.amount,
        currentPriceFormatted: formatPrice(proPrice.amount, proPrice.currency),
        nextPriceFormatted: formatPrice(premiumPrice.amount, premiumPrice.currency),
        currency: proPrice.currency,
        proPrice: proPrice.amount,
        premiumPrice: premiumPrice.amount,
        proPriceFormatted: formatPrice(proPrice.amount, proPrice.currency),
        premiumPriceFormatted: formatPrice(premiumPrice.amount, premiumPrice.currency),
        message: `Fixlo Pro is ${formatPrice(proPrice.amount, proPrice.currency)}/month. Fixlo Premium is ${formatPrice(premiumPrice.amount, premiumPrice.currency)}/month with priority lead access.`
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
    // Check database connection before accessing MongoDB
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'Database not connected',
        message: 'Daily decrement requires database connection',
        timestamp: new Date().toISOString()
      });
    }
    
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
