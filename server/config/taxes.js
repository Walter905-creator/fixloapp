/**
 * Tax Configuration for Global Markets
 * Defines tax rates, types, and handling for different jurisdictions
 */

const TAX_CONFIGURATIONS = {
  US: {
    name: 'United States',
    taxType: 'Sales Tax',
    taxRate: 0, // Varies by state - handled separately
    taxIncluded: false,
    taxIdName: 'EIN',
    taxIdRequired: true,
    notes: 'Sales tax varies by state and locality. No federal sales tax.',
    stateTaxes: {
      // Sample of states - would be expanded in production
      NC: { rate: 0.0475, name: 'North Carolina' },
      CA: { rate: 0.0725, name: 'California' },
      NY: { rate: 0.04, name: 'New York' },
      TX: { rate: 0.0625, name: 'Texas' },
      FL: { rate: 0.06, name: 'Florida' }
    }
  },
  CA: {
    name: 'Canada',
    taxType: 'GST/HST/PST',
    taxRate: 0.05, // Federal GST
    taxIncluded: false,
    taxIdName: 'GST/HST Number',
    taxIdRequired: true,
    notes: 'Tax varies by province. GST 5% federal, HST/PST provincial.',
    provinceTaxes: {
      ON: { rate: 0.13, name: 'HST Ontario', type: 'HST' },
      QC: { rate: 0.14975, name: 'GST+QST Quebec', type: 'GST+PST' },
      BC: { rate: 0.12, name: 'GST+PST British Columbia', type: 'GST+PST' },
      AB: { rate: 0.05, name: 'GST Alberta', type: 'GST' }
    }
  },
  GB: {
    name: 'United Kingdom',
    taxType: 'VAT',
    taxRate: 0.20,
    taxIncluded: true,
    taxIdName: 'VAT Number',
    taxIdRequired: true,
    notes: 'Standard VAT rate is 20%. Reduced rate 5%, zero rate for some services.'
  },
  ES: {
    name: 'Spain',
    taxType: 'IVA (VAT)',
    taxRate: 0.21,
    taxIncluded: true,
    taxIdName: 'NIF/CIF',
    taxIdRequired: true,
    notes: 'Standard IVA rate is 21%. Reduced rates: 10% and 4% for certain services.'
  },
  AU: {
    name: 'Australia',
    taxType: 'GST',
    taxRate: 0.10,
    taxIncluded: true,
    taxIdName: 'ABN',
    taxIdRequired: true,
    notes: 'GST of 10% applies to most goods and services. Some services GST-free.'
  },
  NZ: {
    name: 'New Zealand',
    taxType: 'GST',
    taxRate: 0.15,
    taxIncluded: true,
    taxIdName: 'NZBN',
    taxIdRequired: true,
    notes: 'GST of 15% applies to most goods and services.'
  },
  MX: {
    name: 'Mexico',
    taxType: 'IVA',
    taxRate: 0.16,
    taxIncluded: false,
    taxIdName: 'RFC',
    taxIdRequired: true,
    notes: 'IVA (VAT) rate is 16%. Border regions may have 8% rate.'
  },
  BR: {
    name: 'Brazil',
    taxType: 'Multiple (ICMS, PIS, COFINS)',
    taxRate: 0.17, // Approximate effective rate
    taxIncluded: true,
    taxIdName: 'CNPJ',
    taxIdRequired: true,
    notes: 'Complex tax system with federal and state taxes. Electronic invoices (NFe) required.'
  },
  CO: {
    name: 'Colombia',
    taxType: 'IVA',
    taxRate: 0.19,
    taxIncluded: false,
    taxIdName: 'NIT',
    taxIdRequired: true,
    notes: 'IVA rate is 19%. Some services exempt or reduced rate.'
  },
  CL: {
    name: 'Chile',
    taxType: 'IVA',
    taxRate: 0.19,
    taxIncluded: false,
    taxIdName: 'RUT',
    taxIdRequired: true,
    notes: 'IVA rate is 19%. Applied to most goods and services.'
  },
  AR: {
    name: 'Argentina',
    taxType: 'IVA',
    taxRate: 0.21,
    taxIncluded: false,
    taxIdName: 'CUIT',
    taxIdRequired: true,
    notes: 'IVA rate is 21%. Additional digital services tax may apply.'
  }
};

/**
 * Calculate tax amount for a given price and country
 * @param {number} amount - Base amount before tax
 * @param {string} countryCode - ISO country code
 * @param {string} region - State/Province code (optional)
 * @returns {object} Tax calculation details
 */
function calculateTax(amount, countryCode, region = null) {
  const config = TAX_CONFIGURATIONS[countryCode];
  
  if (!config) {
    return {
      amount: 0,
      rate: 0,
      taxType: 'None',
      included: false,
      error: 'Country not found'
    };
  }
  
  let taxRate = config.taxRate;
  let taxName = config.taxType;
  
  // Handle regional taxes
  if (region && countryCode === 'US' && config.stateTaxes[region]) {
    taxRate = config.stateTaxes[region].rate;
    taxName = `${config.stateTaxes[region].name} Sales Tax`;
  } else if (region && countryCode === 'CA' && config.provinceTaxes[region]) {
    taxRate = config.provinceTaxes[region].rate;
    taxName = config.provinceTaxes[region].name;
  }
  
  const taxAmount = amount * taxRate;
  
  return {
    amount: taxAmount,
    rate: taxRate,
    ratePercentage: (taxRate * 100).toFixed(2),
    taxType: taxName,
    included: config.taxIncluded,
    subtotal: amount,
    total: config.taxIncluded ? amount : amount + taxAmount
  };
}

/**
 * Get tax configuration for a country
 * @param {string} countryCode - ISO country code
 * @returns {object|null} Tax configuration
 */
function getTaxConfig(countryCode) {
  return TAX_CONFIGURATIONS[countryCode] || null;
}

/**
 * Check if tax ID is required for country
 * @param {string} countryCode - ISO country code
 * @returns {boolean} True if tax ID required
 */
function isTaxIdRequired(countryCode) {
  const config = TAX_CONFIGURATIONS[countryCode];
  return config ? config.taxIdRequired : false;
}

/**
 * Get tax ID name for country
 * @param {string} countryCode - ISO country code
 * @returns {string} Tax ID name or 'Tax ID'
 */
function getTaxIdName(countryCode) {
  const config = TAX_CONFIGURATIONS[countryCode];
  return config ? config.taxIdName : 'Tax ID';
}

/**
 * Format price with or without tax based on country
 * @param {number} amount - Base amount
 * @param {string} countryCode - ISO country code
 * @param {string} currency - Currency code
 * @returns {string} Formatted price string
 */
function formatPriceWithTax(amount, countryCode, currency) {
  const config = TAX_CONFIGURATIONS[countryCode];
  const taxCalc = calculateTax(amount, countryCode);
  
  const symbols = {
    USD: '$', CAD: 'C$', GBP: '£', EUR: '€', AUD: 'A$',
    NZD: 'NZ$', MXN: 'MX$', BRL: 'R$', COP: 'COL$',
    CLP: 'CLP$', ARS: 'AR$'
  };
  
  const symbol = symbols[currency] || '$';
  
  if (config && config.taxIncluded) {
    return `${symbol}${amount.toFixed(2)} (incl. ${taxCalc.ratePercentage}% ${config.taxType})`;
  } else if (config && taxCalc.rate > 0) {
    return `${symbol}${amount.toFixed(2)} + ${taxCalc.ratePercentage}% ${config.taxType}`;
  } else {
    return `${symbol}${amount.toFixed(2)}`;
  }
}

module.exports = {
  TAX_CONFIGURATIONS,
  calculateTax,
  getTaxConfig,
  isTaxIdRequired,
  getTaxIdName,
  formatPriceWithTax
};
