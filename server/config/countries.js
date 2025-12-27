/**
 * Global Expansion Country Configuration
 * Defines supported countries and their settings for Fixlo's international expansion
 */

const SUPPORTED_COUNTRIES = {
  // North America
  US: {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    language: 'en',
    region: 'North America',
    timezone: 'America/New_York',
    active: true,
    launchDate: '2024-01-01'
  },
  CA: {
    code: 'CA',
    name: 'Canada',
    currency: 'CAD',
    currencySymbol: 'C$',
    language: 'en',
    region: 'North America',
    timezone: 'America/Toronto',
    active: true,
    launchDate: '2025-01-01'
  },
  
  // Europe
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    language: 'en',
    region: 'Europe',
    timezone: 'Europe/London',
    active: true,
    launchDate: '2025-01-01'
  },
  ES: {
    code: 'ES',
    name: 'Spain',
    currency: 'EUR',
    currencySymbol: '€',
    language: 'es',
    region: 'Europe',
    timezone: 'Europe/Madrid',
    active: true,
    launchDate: '2025-01-01'
  },
  
  // Oceania
  AU: {
    code: 'AU',
    name: 'Australia',
    currency: 'AUD',
    currencySymbol: 'A$',
    language: 'en',
    region: 'Oceania',
    timezone: 'Australia/Sydney',
    active: true,
    launchDate: '2025-01-01'
  },
  NZ: {
    code: 'NZ',
    name: 'New Zealand',
    currency: 'NZD',
    currencySymbol: 'NZ$',
    language: 'en',
    region: 'Oceania',
    timezone: 'Pacific/Auckland',
    active: true,
    launchDate: '2025-01-01'
  },
  
  // Latin America
  MX: {
    code: 'MX',
    name: 'Mexico',
    currency: 'MXN',
    currencySymbol: 'MX$',
    language: 'es',
    region: 'Latin America',
    timezone: 'America/Mexico_City',
    active: true,
    launchDate: '2025-01-01'
  },
  BR: {
    code: 'BR',
    name: 'Brazil',
    currency: 'BRL',
    currencySymbol: 'R$',
    language: 'pt',
    region: 'Latin America',
    timezone: 'America/Sao_Paulo',
    active: true,
    launchDate: '2025-01-01'
  },
  CO: {
    code: 'CO',
    name: 'Colombia',
    currency: 'COP',
    currencySymbol: 'COL$',
    language: 'es',
    region: 'Latin America',
    timezone: 'America/Bogota',
    active: true,
    launchDate: '2025-01-01'
  },
  CL: {
    code: 'CL',
    name: 'Chile',
    currency: 'CLP',
    currencySymbol: 'CLP$',
    language: 'es',
    region: 'Latin America',
    timezone: 'America/Santiago',
    active: true,
    launchDate: '2025-01-01'
  },
  AR: {
    code: 'AR',
    name: 'Argentina',
    currency: 'ARS',
    currencySymbol: 'AR$',
    language: 'es',
    region: 'Latin America',
    timezone: 'America/Argentina/Buenos_Aires',
    active: true,
    launchDate: '2025-01-01'
  }
};

/**
 * Get country configuration by country code
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {object|null} Country configuration or null if not found
 */
function getCountryByCode(countryCode) {
  if (!countryCode) return null;
  const code = countryCode.toUpperCase();
  return SUPPORTED_COUNTRIES[code] || null;
}

/**
 * Check if country is supported
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {boolean} True if country is supported and active
 */
function isCountrySupported(countryCode) {
  const country = getCountryByCode(countryCode);
  return country ? country.active : false;
}

/**
 * Get all supported countries
 * @returns {Array} Array of country configurations
 */
function getAllSupportedCountries() {
  return Object.values(SUPPORTED_COUNTRIES).filter(country => country.active);
}

/**
 * Get countries by region
 * @param {string} region - Region name
 * @returns {Array} Array of country configurations in the region
 */
function getCountriesByRegion(region) {
  return Object.values(SUPPORTED_COUNTRIES).filter(
    country => country.active && country.region === region
  );
}

/**
 * Get default country (US)
 * @returns {object} US country configuration
 */
function getDefaultCountry() {
  return SUPPORTED_COUNTRIES.US;
}

module.exports = {
  SUPPORTED_COUNTRIES,
  getCountryByCode,
  isCountrySupported,
  getAllSupportedCountries,
  getCountriesByRegion,
  getDefaultCountry
};
