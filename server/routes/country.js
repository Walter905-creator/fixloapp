const express = require('express');
const router = express.Router();
const countryDetectionService = require('../utils/countryDetection');
const countryCache = require('../utils/countryCache');
const { getAllSupportedCountries, getCountryByCode } = require('../config/countries');

/**
 * GET /api/country/detect
 * Detect user's country based on their IP address with multi-layer caching
 * 
 * Cache Priority Order:
 * 1. HTTP Cookie (country_code) - 60-day TTL
 * 2. Database field (Pro.country) - if authenticated
 * 3. External IP geolocation (fallback only)
 * 
 * This endpoint NEVER returns errors - always returns a valid country
 * to ensure country detection is treated as non-critical enrichment.
 */
router.get('/detect', async (req, res) => {
  try {
    // Extract IP for logging and throttle check
    const ip = countryDetectionService.extractIP(req);
    console.log(`📍 Country detection request from IP: ${ip}`);
    
    // Step 1: Check for cached country (cookie or database)
    const cachedCountry = await countryCache.getCachedCountry(req);
    
    if (cachedCountry) {
      // Return cached result immediately - no external API calls needed
      console.log(`✅ Using cached country: ${cachedCountry.country} (source: ${cachedCountry.source})`);
      
      return res.json({
        country: cachedCountry.country,
        cached: true,
        expiresAt: cachedCountry.expiresAt
      });
    }
    
    // Step 2: Check request throttle to prevent burst detections
    if (countryCache.shouldThrottle(ip)) {
      // Return default country if request is being throttled
      // Note: This is still treated as "uncached" since no external detection occurred
      const defaultInfo = countryDetectionService.getDefaultCountryInfo();
      const expiresAt = countryCache.getExpirationDate();
      
      console.log(`⏱️ Request throttled, returning default: ${defaultInfo.countryCode}`);
      
      return res.json({
        country: defaultInfo.countryCode,
        cached: true, // Throttled requests are effectively cached (not re-detected)
        expiresAt: expiresAt
      });
    }
    
    // Step 3: No cache found - perform external country detection (fallback)
    console.log(`🔍 No cache found, detecting country from IP...`);
    const countryInfo = await countryDetectionService.detectCountry(ip);
    
    // Step 4: Cache the detected country in all available layers
    await countryCache.cacheCountry(req, res, countryInfo.countryCode);
    
    // Step 5: Return standardized response
    const expiresAt = countryCache.getExpirationDate();
    
    res.json({
      country: countryInfo.countryCode,
      cached: false,
      expiresAt: expiresAt
    });
    
  } catch (error) {
    // CRITICAL: Never return 4xx/5xx errors for country detection
    // Always return a safe default to prevent blocking core flows
    console.error('❌ Country detection error:', error);
    
    const defaultInfo = countryDetectionService.getDefaultCountryInfo();
    const expiresAt = countryCache.getExpirationDate();
    
    // Attempt to cache the default to prevent repeated failures
    let wasCached = false;
    try {
      await countryCache.cacheCountry(req, res, defaultInfo.countryCode);
      wasCached = true;
    } catch (cacheError) {
      console.debug('Could not cache default country:', cacheError.message);
    }
    
    // Return default country with success response
    // cached=true if we successfully cached it, false otherwise
    res.json({
      country: defaultInfo.countryCode,
      cached: wasCached,
      expiresAt: expiresAt
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
