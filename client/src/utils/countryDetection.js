// client/src/utils/countryDetection.js
import { API_BASE } from './config';

/**
 * Country Detection Utility for Frontend
 * Provides client-side access to country detection API
 */

let cachedCountryInfo = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Detect user's country based on their IP address
 * @returns {Promise<object>} Country information
 */
export async function detectUserCountry() {
  // Return cached result if available and not expired
  if (cachedCountryInfo && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    console.log('🎯 Using cached country detection');
    return cachedCountryInfo;
  }

  try {
    console.log('🌍 Detecting user country...');
    const response = await fetch(`${API_BASE}/api/country/detect`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      cachedCountryInfo = result.data;
      cacheTimestamp = Date.now();
      console.log(`✅ Country detected: ${result.data.countryName} (${result.data.countryCode})`);
      return result.data;
    } else {
      throw new Error('Invalid response from country detection API');
    }
  } catch (error) {
    console.error('❌ Failed to detect country:', error);
    
    // Return default country info (US)
    const defaultInfo = {
      countryCode: 'US',
      countryName: 'United States',
      city: '',
      region: '',
      currency: 'USD',
      currencySymbol: '$',
      language: 'en',
      timezone: 'America/New_York',
      supported: true,
      fallback: true
    };
    
    cachedCountryInfo = defaultInfo;
    cacheTimestamp = Date.now();
    
    return defaultInfo;
  }
}

/**
 * Get list of all supported countries
 * @returns {Promise<Array>} Array of supported countries
 */
export async function getSupportedCountries() {
  try {
    const response = await fetch(`${API_BASE}/api/country/supported`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    } else {
      throw new Error('Invalid response from supported countries API');
    }
  } catch (error) {
    console.error('❌ Failed to fetch supported countries:', error);
    return [];
  }
}

/**
 * Get information about a specific country
 * @param {string} countryCode - ISO country code
 * @returns {Promise<object|null>} Country information or null
 */
export async function getCountryInfo(countryCode) {
  try {
    const response = await fetch(`${API_BASE}/api/country/info/${countryCode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    } else {
      throw new Error('Invalid response from country info API');
    }
  } catch (error) {
    console.error(`❌ Failed to fetch country info for ${countryCode}:`, error);
    return null;
  }
}

/**
 * Clear cached country information
 */
export function clearCountryCache() {
  cachedCountryInfo = null;
  cacheTimestamp = null;
  console.log('🗑️ Country detection cache cleared');
}

/**
 * Check if country is supported
 * @param {string} countryCode - ISO country code
 * @returns {boolean} True if country is supported
 */
export async function isCountrySupported(countryCode) {
  try {
    const info = await getCountryInfo(countryCode);
    return info ? info.active : false;
  } catch (error) {
    console.error(`❌ Failed to check if country ${countryCode} is supported:`, error);
    return false;
  }
}

/**
 * Format price with country-specific currency
 * @param {number} amount - Price amount
 * @param {object} countryInfo - Country information object
 * @returns {string} Formatted price string
 */
export function formatPrice(amount, countryInfo) {
  if (!countryInfo) {
    return `$${amount.toFixed(2)}`;
  }
  
  const symbol = countryInfo.currencySymbol || '$';
  const formattedAmount = amount.toFixed(2);
  
  // For some currencies, symbol goes after the amount
  if (countryInfo.currency === 'EUR' || countryInfo.currency === 'BRL') {
    return `${formattedAmount}${symbol}`;
  }
  
  return `${symbol}${formattedAmount}`;
}

export default {
  detectUserCountry,
  getSupportedCountries,
  getCountryInfo,
  clearCountryCache,
  isCountrySupported,
  formatPrice
};
