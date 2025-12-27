const express = require('express');
const router = express.Router();
const countryDetectionService = require('../utils/countryDetection');
const { getAllSupportedCountries, getCountryByCode } = require('../config/countries');

/**
 * GET /api/country/detect
 * Detect user's country based on their IP address
 */
router.get('/detect', async (req, res) => {
  try {
    const ip = countryDetectionService.extractIP(req);
    console.log(`📍 Country detection request from IP: ${ip}`);
    
    const countryInfo = await countryDetectionService.detectCountry(ip);
    
    res.json({
      success: true,
      data: countryInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Country detection error:', error);
    
    // Return default country on error
    const defaultInfo = countryDetectionService.getDefaultCountryInfo();
    
    res.json({
      success: true,
      data: defaultInfo,
      error: 'Failed to detect country, using default',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/country/supported
 * Get list of all supported countries
 */
router.get('/supported', (req, res) => {
  try {
    const countries = getAllSupportedCountries();
    
    res.json({
      success: true,
      data: countries,
      count: countries.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching supported countries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supported countries',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/country/info/:countryCode
 * Get information about a specific country
 */
router.get('/info/:countryCode', (req, res) => {
  try {
    const { countryCode } = req.params;
    const country = getCountryByCode(countryCode);
    
    if (!country) {
      return res.status(404).json({
        success: false,
        error: `Country ${countryCode} not found`,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: country,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching country info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch country information',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/country/cache-stats
 * Get cache statistics (for monitoring)
 */
router.get('/cache-stats', (req, res) => {
  try {
    const stats = countryDetectionService.getCacheStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching cache stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cache statistics',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
