const axios = require('axios');
const { getCountryByCode, getDefaultCountry } = require('../config/countries');

/**
 * Country Detection Service
 * Detects user's country based on IP address using multiple providers with fallback
 */
class CountryDetectionService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hour cache (extended from 1 hour)
    this.apiTimeout = 5000; // 5 second timeout for API calls
    this.requestThrottle = new Map(); // Track requests per IP to prevent abuse
    this.throttleWindow = 60 * 1000; // 1 minute throttle window
    
    // Geolocation providers in order of preference
    this.providers = [
      {
        name: 'ip-api',
        url: (ip) => `https://ip-api.com/json/${ip}`,
        parser: (data) => ({
          country_code: data.countryCode,
          country_name: data.country,
          city: data.city,
          region: data.regionName,
          timezone: data.timezone,
          latitude: data.lat,
          longitude: data.lon
        }),
        // ip-api.com has 45 requests per minute limit
        rateLimitFriendly: true
      },
      {
        name: 'ipapi.co',
        url: (ip) => `https://ipapi.co/${ip}/json/`,
        parser: (data) => ({
          country_code: data.country_code || data.country,
          country_name: data.country_name,
          city: data.city,
          region: data.region,
          timezone: data.timezone,
          latitude: data.latitude,
          longitude: data.longitude
        }),
        rateLimitFriendly: false
      },
      {
        name: 'ipwhois',
        url: (ip) => `https://ipwho.is/${ip}`,
        parser: (data) => ({
          country_code: data.country_code,
          country_name: data.country,
          city: data.city,
          region: data.region,
          timezone: data.timezone?.id,
          latitude: data.latitude,
          longitude: data.longitude
        }),
        rateLimitFriendly: true
      }
    ];
    
    // Start cache cleanup (every hour)
    this.cacheCleanupInterval = setInterval(() => {
      this.cleanExpiredCache();
      this.cleanThrottleMap();
    }, 60 * 60 * 1000);
  }

  /**
   * Check if IP should be throttled
   * @param {string} ip - IP address
   * @returns {boolean} True if request should be throttled
   */
  shouldThrottle(ip) {
    const key = `throttle_${ip}`;
    const lastRequest = this.requestThrottle.get(key);
    
    if (lastRequest && Date.now() - lastRequest < this.throttleWindow) {
      console.debug(`⏱️ Throttling request for IP: ${ip}`);
      return true;
    }
    
    this.requestThrottle.set(key, Date.now());
    return false;
  }

  /**
   * Clean expired throttle entries
   */
  cleanThrottleMap() {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, timestamp] of this.requestThrottle.entries()) {
      if (now - timestamp >= this.throttleWindow) {
        this.requestThrottle.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.debug(`🧹 Removed ${removedCount} expired throttle entries`);
    }
  }

  /**
   * Try to get country info from a specific provider
   * @param {object} provider - Provider configuration
   * @param {string} ip - IP address
   * @returns {Promise<object|null>} Country data or null
   */
  async tryProvider(provider, ip) {
    try {
      console.debug(`🌐 Trying ${provider.name} for IP: ${ip}`);
      
      const response = await axios.get(provider.url(ip), {
        timeout: this.apiTimeout,
        headers: {
          'User-Agent': 'Fixlo/1.0.0',
          'Accept': 'application/json'
        }
      });

      // Check for rate limit or error responses
      if (response.status === 429) {
        console.debug(`Rate limited by ${provider.name}`);
        return null;
      }

      const data = response.data;
      
      // Some APIs return error in the response body
      if (data.error || data.status === 'fail') {
        console.debug(`${provider.name} returned error:`, data.message || data.error);
        return null;
      }

      return provider.parser(data);
    } catch (error) {
      // Downgrade provider failures to debug logs - these are non-critical
      if (error.response?.status === 429 || error.response?.status === 403) {
        console.debug(`${provider.name} rate limit or access denied`);
      } else {
        console.debug(`${provider.name} failed:`, error.message);
      }
      return null;
    }
  }

  /**
   * Detect country from IP address with multiple provider fallback
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

    // Check throttling
    if (this.shouldThrottle(ip)) {
      console.debug(`🎯 Using default for throttled IP: ${ip}`);
      return this.getDefaultCountryInfo();
    }

    console.debug(`🌍 Detecting country for IP: ${ip}`);
    
    // Try each provider in sequence until one succeeds
    for (const provider of this.providers) {
      const data = await this.tryProvider(provider, ip);
      
      if (data && data.country_code) {
        const countryCode = data.country_code;
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
          longitude: data.longitude || null,
          provider: provider.name
        };

        console.log(`✅ Country detected via ${provider.name}: ${countryInfo.countryName} (${countryCode}), Supported: ${countryInfo.supported}`);
        
        // Cache the result for 60 days
        this.setCacheResult(cacheKey, countryInfo);
        
        return countryInfo;
      }
    }

    // All providers failed, return default
    console.debug(`⚠️ All providers failed for IP: ${ip}, using default`);
    return this.getDefaultCountryInfo();
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
      console.debug(`🎯 Using cached country detection for: ${key}`);
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
      console.debug(`🧹 Removed ${removedCount} expired country detection cache entries`);
    }
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
    console.debug('🗑️ Country detection cache cleared');
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
