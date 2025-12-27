const express = require('express');
const router = express.Router();
const { calculatePrice, getAllPrices, formatPrice } = require('../config/pricing');
const { getCountryByCode } = require('../config/countries');

/**
 * GET /api/pricing/:countryCode
 * Get pricing for a specific country
 */
router.get('/:countryCode', (req, res) => {
  try {
    const { countryCode } = req.params;
    
    // Validate country
    const country = getCountryByCode(countryCode);
    if (!country) {
      return res.status(404).json({
        success: false,
        error: `Country ${countryCode} not found`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Get all prices for the country
    const prices = getAllPrices(countryCode);
    
    // Format prices for display
    const formattedPrices = {};
    for (const [key, value] of Object.entries(prices)) {
      formattedPrices[key] = {
        ...value,
        formatted: formatPrice(value.amount, value.currency)
      };
    }
    
    res.json({
      success: true,
      data: {
        country: {
          code: country.code,
          name: country.name,
          currency: country.currency,
          currencySymbol: country.currencySymbol
        },
        prices: formattedPrices
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching pricing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pricing',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/pricing/:countryCode/:priceType
 * Get a specific price for a country
 */
router.get('/:countryCode/:priceType', (req, res) => {
  try {
    const { countryCode, priceType } = req.params;
    
    // Validate country
    const country = getCountryByCode(countryCode);
    if (!country) {
      return res.status(404).json({
        success: false,
        error: `Country ${countryCode} not found`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Calculate price
    const price = calculatePrice(priceType, countryCode);
    
    res.json({
      success: true,
      data: {
        country: {
          code: country.code,
          name: country.name,
          currency: country.currency,
          currencySymbol: country.currencySymbol
        },
        priceType: priceType,
        price: {
          ...price,
          formatted: formatPrice(price.amount, price.currency)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching price:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
