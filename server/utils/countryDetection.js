const axios = require('axios');
const { getCountryByCode, getDefaultCountry } = require('../config/countries');

/**
 * Country Detection Service
 * Detects user's country based on IP address using ipapi.co
 */
class CountryDetectionService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 60 * 60 * 1000; // 1 hour cache
    this.apiTimeout = 5000; // 5 second timeout for API calls
    
    // Start cache cleanup (every hour)
    this.cacheCleanupInterval = setInterval(() => {
      this.cleanExpiredCache();
    }, 60 * 60 * 1000);
  }

  /**
   * Detect country from IP address
   * @param {string} ip - IP address to lookup
   * @returns {Promise<object>} Country information
   */
  async detectCountry(ip) {
    // Check cache first
    const cacheKey = `country_${ip}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      console.log(`🌍 Detecting country for IP: ${ip}`);
      
      // Call ipapi.co for IP geolocation
      const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
        timeout: this.apiTimeout,
        headers: {
          'User-Agent': 'Fixlo/1.0.0'
        }
      });

      const data = response.data;
      
      // Extract country code
      const countryCode = data.country_code || data.country;
      
      if (!countryCode) {
        console.warn(`⚠️ No country code returned for IP: ${ip}`);
        return this.getDefaultCountryInfo();
      }

      // Get country configuration
      const countryConfig = getCountryByCode(countryCode);
      
      const countryInfo = {
        countryCode: countryCode,
        countryName: data.country_name || (countryConfig ? countryConfig.name : countryCode),
        city: data.city || '',
        region: data.region || '',
        currency: countryConfig ? countryConfig.currency : 'USD',
        currencySymbol: countryConfig ? countryConfig.currencySymbol : '$',
        language: countryConfig ? countryConfig.language : 'en',
        timezone: data.timezone || (countryConfig ? countryConfig.timezone : 'UTC'),
        supported: countryConfig ? countryConfig.active : false,
        latitude: data.latitude || null,
        longitude: data.longitude || null
      };

      console.log(`✅ Country detected: ${countryInfo.countryName} (${countryCode}), Supported: ${countryInfo.supported}`);
      
      // Cache the result
      this.setCacheResult(cacheKey, countryInfo);
      
      return countryInfo;
      
    } catch (error) {
      console.error(`❌ Failed to detect country for IP ${ip}:`, error.message);
      
      // Return default country on error
      return this.getDefaultCountryInfo();
    }
  }

  /**
   * Extract IP from request object
   * @param {object} req - Express request object
   * @returns {string} IP address
   */
  extractIP(req) {
    // Try various headers for proxy situations
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
               req.headers['x-real-ip'] ||
               req.connection?.remoteAddress ||
               req.socket?.remoteAddress ||
               req.ip ||
               '0.0.0.0';
    
    // Clean IPv6 localhost addresses
    if (ip === '::1' || ip === '::ffff:127.0.0.1' || ip === '127.0.0.1') {
      return '0.0.0.0'; // Use placeholder for localhost
    }
    
    // Remove IPv6 prefix if present
    return ip.replace(/^::ffff:/, '');
  }

  /**
   * Get default country info (US)
   * @returns {object} Default country information
   */
  getDefaultCountryInfo() {
    const defaultCountry = getDefaultCountry();
    return {
      countryCode: defaultCountry.code,
      countryName: defaultCountry.name,
      city: '',
      region: '',
      currency: defaultCountry.currency,
      currencySymbol: defaultCountry.currencySymbol,
      language: defaultCountry.language,
      timezone: defaultCountry.timezone,
      supported: true,
      latitude: null,
      longitude: null,
      fallback: true
    };
  }

  /**
   * Get cached result if available and not expired
   */
  getCachedResult(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`🎯 Using cached country detection for: ${key}`);
      return cached.data;
    }
    return null;
  }

  /**
   * Cache a result with timestamp
   */
  setCacheResult(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clean expired cache entries
   */
  cleanExpiredCache() {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= this.cacheTimeout) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 Removed ${removedCount} expired country detection cache entries`);
    }
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Country detection cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp < this.cacheTimeout) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      cacheTimeout: this.cacheTimeout
    };
  }
}

module.exports = new CountryDetectionService();
