/**
 * International Pricing Configuration
 * Defines pricing strategies and conversion rates for different countries
 */

// Base pricing in USD (US market)
const BASE_PRICING = {
  proMonthlySubscription: 59.99,
  proAnnualSubscription: 599.99, // 2 months free
  aiPlusMonthlySubscription: 99.00 // AI+ tier with priority lead access
};

/**
 * Currency conversion rates (relative to USD)
 * These should be updated regularly via an external API in production
 * For now, using approximate fixed rates
 */
const CURRENCY_RATES = {
  USD: 1.00,
  CAD: 1.35,     // 1 USD = 1.35 CAD
  GBP: 0.79,     // 1 USD = 0.79 GBP
  EUR: 0.92,     // 1 USD = 0.92 EUR
  AUD: 1.52,     // 1 USD = 1.52 AUD
  NZD: 1.67,     // 1 USD = 1.67 NZD
  MXN: 17.25,    // 1 USD = 17.25 MXN
  BRL: 4.95,     // 1 USD = 4.95 BRL
  COP: 3850,     // 1 USD = 3850 COP
  CLP: 920,      // 1 USD = 920 CLP
  ARS: 350       // 1 USD = 350 ARS (highly variable)
};

/**
 * Country-specific pricing adjustments
 * Allows for market-specific pricing strategies beyond simple currency conversion
 * multiplier: Applied after currency conversion (1.0 = no adjustment)
 * roundingStrategy: 'standard', 'psychological', 'nearest5', 'nearest10'
 */
const COUNTRY_PRICING_ADJUSTMENTS = {
  US: {
    multiplier: 1.0,
    roundingStrategy: 'psychological' // e.g., 59.99 instead of 60.00
  },
  CA: {
    multiplier: 1.0,
    roundingStrategy: 'psychological'
  },
  GB: {
    multiplier: 1.0,
    roundingStrategy: 'psychological'
  },
  ES: {
    multiplier: 0.95, // 5% discount for Spain market penetration
    roundingStrategy: 'psychological'
  },
  AU: {
    multiplier: 1.0,
    roundingStrategy: 'psychological'
  },
  NZ: {
    multiplier: 0.95, // 5% discount for smaller market
    roundingStrategy: 'psychological'
  },
  MX: {
    multiplier: 0.90, // 10% discount for Latin American market
    roundingStrategy: 'nearest10'
  },
  BR: {
    multiplier: 0.90,
    roundingStrategy: 'nearest5'
  },
  CO: {
    multiplier: 0.85, // 15% discount for emerging market
    roundingStrategy: 'nearest10'
  },
  CL: {
    multiplier: 0.90,
    roundingStrategy: 'nearest10'
  },
  AR: {
    multiplier: 0.85, // 15% discount due to economic conditions
    roundingStrategy: 'nearest10'
  }
};

/**
 * Apply rounding strategy to price
 * @param {number} price - The price to round
 * @param {string} strategy - Rounding strategy
 * @param {string} currency - Currency code
 * @returns {number} Rounded price
 */
function applyRoundingStrategy(price, strategy, currency) {
  switch (strategy) {
    case 'psychological':
      // Round to .99 ending for currencies with cents
      if (['USD', 'CAD', 'GBP', 'EUR', 'AUD', 'NZD', 'BRL'].includes(currency)) {
        return Math.floor(price) + 0.99;
      }
      // For currencies without cents, round to 9 ending
      return Math.floor(price / 10) * 10 + 9;
    
    case 'nearest5':
      return Math.round(price / 5) * 5;
    
    case 'nearest10':
      return Math.round(price / 10) * 10;
    
    case 'standard':
    default:
      // Round to 2 decimal places for currencies with cents
      if (['USD', 'CAD', 'GBP', 'EUR', 'AUD', 'NZD', 'BRL'].includes(currency)) {
        return Math.round(price * 100) / 100;
      }
      // Round to nearest whole number for other currencies
      return Math.round(price);
  }
}

/**
 * Calculate price for a specific country
 * @param {string} priceType - Type of price (e.g., 'proMonthlySubscription')
 * @param {string} countryCode - ISO country code
 * @returns {object} Price information
 */
function calculatePrice(priceType, countryCode) {
  const basePrice = BASE_PRICING[priceType];
  
  if (basePrice === undefined) {
    throw new Error(`Invalid price type: ${priceType}`);
  }
  
  // Map country code to currency code
  const currencyMap = {
    'US': 'USD',
    'CA': 'CAD',
    'GB': 'GBP',
    'ES': 'EUR',
    'AU': 'AUD',
    'NZ': 'NZD',
    'MX': 'MXN',
    'BR': 'BRL',
    'CO': 'COP',
    'CL': 'CLP',
    'AR': 'ARS'
  };
  
  const currencyCode = currencyMap[countryCode] || 'USD';
  
  // If base price is 0, return 0 regardless of country
  if (basePrice === 0) {
    return {
      amount: 0,
      currency: currencyCode,
      baseAmount: 0,
      baseCurrency: 'USD',
      conversionRate: 1,
      adjustmentMultiplier: 1
    };
  }
  
  // Get currency rate and adjustment
  const currencyRate = CURRENCY_RATES[currencyCode] || CURRENCY_RATES.USD;
  const adjustment = COUNTRY_PRICING_ADJUSTMENTS[countryCode] || COUNTRY_PRICING_ADJUSTMENTS.US;
  
  // Calculate price: base USD price * currency rate * market adjustment
  let price = basePrice * currencyRate * adjustment.multiplier;
  
  // Apply rounding strategy
  price = applyRoundingStrategy(price, adjustment.roundingStrategy, currencyCode);
  
  return {
    amount: price,
    currency: currencyCode,
    baseAmount: basePrice,
    baseCurrency: 'USD',
    conversionRate: currencyRate,
    adjustmentMultiplier: adjustment.multiplier
  };
}

/**
 * Get all prices for a country
 * @param {string} countryCode - ISO country code
 * @returns {object} All prices for the country
 */
function getAllPrices(countryCode) {
  const prices = {};
  
  for (const priceType in BASE_PRICING) {
    prices[priceType] = calculatePrice(priceType, countryCode);
  }
  
  return prices;
}

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {number} Converted amount
 */
function convertCurrency(amount, fromCurrency, toCurrency) {
  const fromRate = CURRENCY_RATES[fromCurrency] || 1;
  const toRate = CURRENCY_RATES[toCurrency] || 1;
  
  // Convert to USD first, then to target currency
  const usdAmount = amount / fromRate;
  return usdAmount * toRate;
}

/**
 * Format price with currency symbol and proper formatting
 * @param {number} amount - Price amount
 * @param {string} currency - Currency code
 * @returns {string} Formatted price string
 */
function formatPrice(amount, currency) {
  const symbols = {
    USD: '$',
    CAD: 'C$',
    GBP: '£',
    EUR: '€',
    AUD: 'A$',
    NZD: 'NZ$',
    MXN: 'MX$',
    BRL: 'R$',
    COP: 'COL$',
    CLP: 'CLP$',
    ARS: 'AR$'
  };
  
  const symbol = symbols[currency] || '$';
  
  // Currencies with decimal places
  const decimals = ['USD', 'CAD', 'GBP', 'EUR', 'AUD', 'NZD', 'BRL'].includes(currency) ? 2 : 0;
  
  const formattedAmount = amount.toFixed(decimals);
  
  // For most currencies, symbol goes before amount
  return `${symbol}${formattedAmount}`;
}

module.exports = {
  BASE_PRICING,
  CURRENCY_RATES,
  COUNTRY_PRICING_ADJUSTMENTS,
  calculatePrice,
  getAllPrices,
  convertCurrency,
  formatPrice,
  applyRoundingStrategy
};
