/**
 * Country Cache Helper Module
 * Manages country detection caching with cookie, database, and in-memory strategies
 * 
 * Cache Priority:
 * 1. HTTP Cookie (country_code) - 60-day TTL
 * 2. Database field (Pro.country) - if authenticated
 * 3. External detection (fallback only)
 * 
 * This module ensures country detection is treated as non-critical enrichment
 * and never blocks core application flows.
 */

const COUNTRY_COOKIE_NAME = 'country_code';
const COUNTRY_COOKIE_MAX_AGE = 60 * 24 * 60 * 60 * 1000; // 60 days in milliseconds
const COUNTRY_CACHE_TTL = 60 * 24 * 60 * 60 * 1000; // 60 days in milliseconds

// In-memory throttle to prevent multiple detections in same request burst
const requestThrottle = new Map();
const THROTTLE_WINDOW = 5000; // 5 seconds - prevent rapid duplicate requests

/**
 * Check if a cached country value is expired
 * @param {number} timestamp - Cache timestamp in milliseconds
 * @returns {boolean} True if expired
 */
function isCacheExpired(timestamp) {
  if (!timestamp) return true;
  return Date.now() - timestamp > COUNTRY_CACHE_TTL;
}

/**
 * Calculate expiration date from now
 * @returns {string} ISO date string 60 days from now
 */
function getExpirationDate() {
  const expiresAt = new Date();
  expiresAt.setTime(expiresAt.getTime() + COUNTRY_CACHE_TTL);
  return expiresAt.toISOString();
}

/**
 * Parse cookie timestamp and check if expired
 * @param {string} cookieValue - Cookie value in format "COUNTRYCODE:TIMESTAMP"
 * @returns {object|null} {country, timestamp} or null if invalid/expired
 */
function parseCookieValue(cookieValue) {
  if (!cookieValue || typeof cookieValue !== 'string') return null;
  
  const parts = cookieValue.split(':');
  if (parts.length !== 2) return null;
  
  const country = parts[0];
  const timestamp = parseInt(parts[1], 10);
  
  if (!country || isNaN(timestamp)) return null;
  if (isCacheExpired(timestamp)) return null;
  
  return { country, timestamp };
}

/**
 * Create cookie value with timestamp
 * @param {string} countryCode - Two-letter country code
 * @returns {string} Cookie value in format "COUNTRYCODE:TIMESTAMP"
 */
function createCookieValue(countryCode) {
  return `${countryCode}:${Date.now()}`;
}

/**
 * Check if request should be throttled (prevent burst requests)
 * @param {string} identifier - Unique identifier (IP or user ID)
 * @returns {boolean} True if should throttle
 */
function shouldThrottle(identifier) {
  if (!identifier) return false;
  
  const key = `throttle_${identifier}`;
  const lastRequest = requestThrottle.get(key);
  
  if (lastRequest && Date.now() - lastRequest < THROTTLE_WINDOW) {
    console.debug(`[CountryCache] Throttling rapid request for: ${identifier}`);
    return true;
  }
  
  requestThrottle.set(key, Date.now());
  
  // Clean up old entries periodically
  if (requestThrottle.size > 1000) {
    const now = Date.now();
    for (const [k, timestamp] of requestThrottle.entries()) {
      if (now - timestamp >= THROTTLE_WINDOW) {
        requestThrottle.delete(k);
      }
    }
  }
  
  return false;
}

/**
 * Get country from HTTP cookie if valid and not expired
 * @param {object} req - Express request object
 * @returns {object|null} {country, expiresAt, source: 'cookie'} or null
 */
function getCountryFromCookie(req) {
  try {
    const cookieValue = req.cookies?.[COUNTRY_COOKIE_NAME];
    if (!cookieValue) return null;
    
    const parsed = parseCookieValue(cookieValue);
    if (!parsed) return null;
    
    console.debug(`[CountryCache] Found valid cookie cache: ${parsed.country}`);
    
    return {
      country: parsed.country,
      expiresAt: new Date(parsed.timestamp + COUNTRY_CACHE_TTL).toISOString(),
      source: 'cookie'
    };
  } catch (error) {
    console.debug(`[CountryCache] Error reading cookie:`, error.message);
    return null;
  }
}

/**
 * Get country from database (Pro model) if user is authenticated
 * @param {object} req - Express request object
 * @returns {Promise<object|null>} {country, expiresAt, source: 'database'} or null
 */
async function getCountryFromDatabase(req) {
  try {
    // Check if user is authenticated (Pro user)
    const userId = req.user?.id || req.user?._id;
    if (!userId) return null;
    
    const Pro = require('../models/Pro');
    const pro = await Pro.findById(userId).select('country').lean();
    
    if (pro?.country) {
      console.debug(`[CountryCache] Found database cache for Pro user: ${pro.country}`);
      
      return {
        country: pro.country,
        expiresAt: getExpirationDate(),
        source: 'database'
      };
    }
    
    return null;
  } catch (error) {
    console.debug(`[CountryCache] Error reading from database:`, error.message);
    return null;
  }
}

/**
 * Set country in HTTP cookie with 60-day expiration
 * @param {object} res - Express response object
 * @param {string} countryCode - Two-letter country code
 */
function setCountryInCookie(res, countryCode) {
  try {
    const cookieValue = createCookieValue(countryCode);
    
    res.cookie(COUNTRY_COOKIE_NAME, cookieValue, {
      maxAge: COUNTRY_COOKIE_MAX_AGE,
      httpOnly: true, // Prevent XSS attacks
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      path: '/'
    });
    
    console.debug(`[CountryCache] Set cookie cache: ${countryCode}`);
  } catch (error) {
    console.debug(`[CountryCache] Error setting cookie:`, error.message);
  }
}

/**
 * Update country in database for authenticated Pro user
 * @param {object} req - Express request object
 * @param {string} countryCode - Two-letter country code
 */
async function updateCountryInDatabase(req, countryCode) {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return;
    
    const Pro = require('../models/Pro');
    await Pro.findByIdAndUpdate(userId, { country: countryCode });
    
    console.debug(`[CountryCache] Updated database cache for Pro user: ${countryCode}`);
  } catch (error) {
    console.debug(`[CountryCache] Error updating database:`, error.message);
  }
}

/**
 * Get cached country from any available source (cookie or database)
 * @param {object} req - Express request object
 * @returns {Promise<object|null>} {country, expiresAt, source} or null
 */
async function getCachedCountry(req) {
  // Priority 1: Check HTTP cookie
  const cookieCache = getCountryFromCookie(req);
  if (cookieCache) return cookieCache;
  
  // Priority 2: Check database (if authenticated)
  const dbCache = await getCountryFromDatabase(req);
  if (dbCache) return dbCache;
  
  return null;
}

/**
 * Store country in all available caches
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {string} countryCode - Two-letter country code
 */
async function cacheCountry(req, res, countryCode) {
  // Store in HTTP cookie (always)
  setCountryInCookie(res, countryCode);
  
  // Store in database (if authenticated)
  await updateCountryInDatabase(req, countryCode);
}

module.exports = {
  COUNTRY_COOKIE_NAME,
  COUNTRY_CACHE_TTL,
  getCachedCountry,
  cacheCountry,
  shouldThrottle,
  getExpirationDate,
  isCacheExpired
};
