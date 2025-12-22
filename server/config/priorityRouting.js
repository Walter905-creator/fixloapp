/**
 * Priority Pro Configuration
 * 
 * Centralized configuration for priority pro routing system.
 * To add more cities, add entries to the PRIORITY_ROUTING object.
 */

const PRIORITY_ROUTING = {
  charlotte: {
    phone: '+15164449953',
    name: 'Walter Arevalo',
    delayMinutes: 3
  },
  // Add more cities here:
  // miami: {
  //   phone: '+1...',
  //   name: 'Pro Name',
  //   delayMinutes: 3
  // }
};

/**
 * Get priority pro configuration for a city
 * @param {string} city - City name (case-insensitive)
 * @returns {object|null} Priority pro config or null if no priority routing for city
 */
function getPriorityConfig(city) {
  if (!city) return null;
  const normalizedCity = city.toLowerCase().trim();
  return PRIORITY_ROUTING[normalizedCity] || null;
}

/**
 * Check if a city has priority routing enabled
 * @param {string} city - City name
 * @returns {boolean}
 */
function hasPriorityRouting(city) {
  return getPriorityConfig(city) !== null;
}

/**
 * Get delay in milliseconds for a city
 * @param {string} city - City name
 * @returns {number} Delay in milliseconds
 */
function getDelayMs(city) {
  const config = getPriorityConfig(city);
  return config ? config.delayMinutes * 60 * 1000 : 0;
}

/**
 * Find priority pro configuration by phone number
 * @param {string} phone - Phone number (will be normalized)
 * @returns {object|null} Priority pro config with city, or null if not found
 */
function findPriorityProByPhone(phone) {
  const normalizeE164 = require('../utils/twilio').normalizeE164;
  const normalizedPhone = normalizeE164(phone);
  
  for (const [cityName, config] of Object.entries(PRIORITY_ROUTING)) {
    if (normalizeE164(config.phone) === normalizedPhone) {
      return { ...config, city: cityName };
    }
  }
  return null;
}

module.exports = {
  PRIORITY_ROUTING,
  getPriorityConfig,
  hasPriorityRouting,
  getDelayMs,
  findPriorityProByPhone
};
