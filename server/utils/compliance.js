/**
 * Regulatory Compliance Utilities
 * Provides compliance checking and requirements for different jurisdictions
 */

const COMPLIANCE_REQUIREMENTS = {
  US: {
    dataProtection: ['No federal data protection law', 'State laws: CCPA (California), others vary'],
    consumerRights: ['FTC consumer protection', 'State-specific consumer laws'],
    contractualRequirements: ['Electronic signatures valid under ESIGN Act', 'Terms must be clearly disclosed'],
    businessLicense: 'Varies by state and locality',
    backgroundChecks: 'Permitted with consent (FCRA applies)',
    paymentProcessing: 'PCI DSS compliance required',
    advertising: 'FTC truth in advertising rules',
    accessibility: 'ADA Title III for websites recommended'
  },
  CA: {
    dataProtection: ['PIPEDA (federal)', 'Provincial privacy laws (e.g., Quebec Law 25)'],
    consumerRights: ['Consumer Protection Act (federal)', 'Provincial consumer protection'],
    contractualRequirements: ['Electronic Commerce Act allows e-contracts', 'Clear disclosure required'],
    businessLicense: 'Provincial business registration required',
    backgroundChecks: 'Permitted with consent, subject to privacy laws',
    paymentProcessing: 'PCI DSS compliance required',
    advertising: 'Competition Act truth in advertising',
    accessibility: 'AODA (Ontario), similar provincial laws'
  },
  GB: {
    dataProtection: ['UK GDPR', 'Data Protection Act 2018'],
    consumerRights: ['Consumer Rights Act 2015', 'Consumer Contracts Regulations 2013'],
    contractualRequirResidency: ['Electronic signatures valid', '14-day cooling-off period for distance contracts'],
    businessLicense: 'Companies House registration',
    backgroundChecks: 'DBS checks available, subject to GDPR',
    paymentProcessing: 'PCI DSS + FCA regulations',
    advertising: 'ASA (Advertising Standards Authority) codes',
    accessibility: 'Equality Act 2010 website accessibility'
  },
  ES: {
    dataProtection: ['GDPR', 'LOPDGDD (Spanish data protection)'],
    consumerRights: ['Consumer Rights Act', 'EU Consumer Rights Directive'],
    contractualRequirements: ['E-commerce Directive', '14-day withdrawal right'],
    businessLicense: 'Business registration required',
    backgroundChecks: 'Subject to GDPR restrictions',
    paymentProcessing: 'PCI DSS + PSD2 requirements',
    advertising: 'Spanish Advertising Law',
    accessibility: 'Royal Decree 1112/2018 website accessibility'
  },
  AU: {
    dataProtection: ['Privacy Act 1988', 'APPs (Australian Privacy Principles)'],
    consumerRights: ['Australian Consumer Law (ACL)'],
    contractualRequirements: ['Electronic Transactions Act', 'ACL unfair contract terms'],
    businessLicense: 'ABN registration required',
    backgroundChecks: 'National Police Checks available',
    paymentProcessing: 'PCI DSS compliance required',
    advertising: 'ACCC consumer protection',
    accessibility: 'Disability Discrimination Act website access'
  },
  NZ: {
    dataProtection: ['Privacy Act 2020'],
    consumerRights: ['Consumer Guarantees Act 1993', 'Fair Trading Act 1986'],
    contractualRequirements: ['Electronic Transactions Act 2002', 'Clear disclosure required'],
    businessLicense: 'NZBN registration required',
    backgroundChecks: 'Police vetting available',
    paymentProcessing: 'PCI DSS compliance required',
    advertising: 'Fair Trading Act standards',
    accessibility: 'Human Rights Act website accessibility'
  },
  MX: {
    dataProtection: ['Ley Federal de Protección de Datos Personales'],
    consumerRights: ['Ley Federal de Protección al Consumidor'],
    contractualRequirements: ['Electronic commerce regulations', 'PROFECO oversight'],
    businessLicense: 'RFC (tax ID) and business permits',
    backgroundChecks: 'Available with consent',
    paymentProcessing: 'PCI DSS + local banking regulations',
    advertising: 'PROFECO advertising standards',
    accessibility: 'Accessibility regulations developing'
  },
  BR: {
    dataProtection: ['LGPD (Lei Geral de Proteção de Dados)'],
    consumerRights: ['Código de Defesa do Consumidor (CDC)'],
    contractualRequirements: ['Electronic signature law', '7-day withdrawal for digital goods'],
    businessLicense: 'CNPJ registration required',
    backgroundChecks: 'Criminal background checks available',
    paymentProcessing: 'PCI DSS + Central Bank regulations',
    advertising: 'CONAR advertising standards',
    accessibility: 'Brazilian Inclusion Law'
  },
  CO: {
    dataProtection: ['Ley 1581 de 2012 (data protection)'],
    consumerRights: ['Estatuto del Consumidor'],
    contractualRequirements: ['E-commerce regulations', 'SIC oversight'],
    businessLicense: 'NIT registration required',
    backgroundChecks: 'Available through official channels',
    paymentProcessing: 'PCI DSS + local regulations',
    advertising: 'SIC consumer protection',
    accessibility: 'Accessibility regulations developing'
  },
  CL: {
    dataProtection: ['Ley 19.628 (data protection)'],
    consumerRights: ['Ley del Consumidor'],
    contractualRequirements: ['Electronic document law', 'SERNAC oversight'],
    businessLicense: 'RUT and business registration',
    backgroundChecks: 'Police certificates available',
    paymentProcessing: 'PCI DSS + CMF regulations',
    advertising: 'SERNAC advertising standards',
    accessibility: 'Accessibility laws developing'
  },
  AR: {
    dataProtection: ['Ley 25.326 (data protection)'],
    consumerRights: ['Ley de Defensa del Consumidor'],
    contractualRequirements: ['Digital signature law', 'Consumer protection oversight'],
    businessLicense: 'CUIT registration required',
    backgroundChecks: 'Criminal records available',
    paymentProcessing: 'PCI DSS + BCRA regulations',
    advertising: 'Consumer protection standards',
    accessibility: 'Accessibility regulations developing'
  }
};

/**
 * Get compliance requirements for a country
 * @param {string} countryCode - ISO country code
 * @returns {object|null} Compliance requirements
 */
function getComplianceRequirements(countryCode) {
  return COMPLIANCE_REQUIREMENTS[countryCode] || null;
}

/**
 * Check if GDPR applies to country
 * @param {string} countryCode - ISO country code
 * @returns {boolean} True if GDPR applies
 */
function isGDPRApplicable(countryCode) {
  return ['GB', 'ES'].includes(countryCode);
}

/**
 * Check if withdrawal/cooling-off period applies
 * @param {string} countryCode - ISO country code
 * @returns {object} Withdrawal period information
 */
function getWithdrawalPeriod(countryCode) {
  const periods = {
    GB: { days: 14, applies: true, name: 'Cooling-off period' },
    ES: { days: 14, applies: true, name: 'Right of withdrawal' },
    AU: { days: 0, applies: false, name: 'No statutory period for digital services' },
    BR: { days: 7, applies: true, name: 'Right of withdrawal for digital goods' },
    // Other countries typically no statutory withdrawal for immediate digital services
    US: { days: 0, applies: false, name: 'No federal requirement' },
    CA: { days: 0, applies: false, name: 'Varies by province' },
    NZ: { days: 0, applies: false, name: 'No statutory period' },
    MX: { days: 0, applies: false, name: 'No statutory period' },
    CO: { days: 0, applies: false, name: 'No statutory period' },
    CL: { days: 0, applies: false, name: 'No statutory period' },
    AR: { days: 0, applies: false, name: 'No statutory period' }
  };
  
  return periods[countryCode] || { days: 0, applies: false, name: 'Not specified' };
}

/**
 * Get data retention requirements
 * @param {string} countryCode - ISO country code
 * @returns {object} Data retention info
 */
function getDataRetentionRequirements(countryCode) {
  const requirements = {
    US: 'Varies by state and data type (e.g., CCPA: no specific retention limit)',
    CA: 'PIPEDA: retain as long as necessary for identified purpose',
    GB: 'UK GDPR: no longer than necessary for purpose',
    ES: 'GDPR: no longer than necessary for purpose',
    AU: 'Privacy Act: destroy when no longer needed',
    NZ: 'Privacy Act: retain only as long as required',
    MX: 'Data protection law: period proportional to purpose',
    BR: 'LGPD: period necessary to fulfill purpose',
    CO: 'Ley 1581: period authorized by data subject',
    CL: 'Ley 19.628: varies by sector',
    AR: 'Ley 25.326: varies, generally business records 10 years'
  };
  
  return requirements[countryCode] || 'Consult local legal counsel';
}

/**
 * Check compliance status for operations in country
 * @param {string} countryCode - ISO country code
 * @param {object} currentStatus - Current compliance status
 * @returns {object} Compliance check results
 */
function checkCompliance(countryCode, currentStatus = {}) {
  const requirements = getComplianceRequirements(countryCode);
  
  if (!requirements) {
    return {
      compliant: false,
      error: 'Country not supported',
      missing: []
    };
  }
  
  const checks = {
    hasPrivacyPolicy: currentStatus.hasPrivacyPolicy || false,
    hasTermsOfService: currentStatus.hasTermsOfService || false,
    hasCookieConsent: currentStatus.hasCookieConsent || false,
    hasDataProtection: currentStatus.hasDataProtection || false,
    hasBusinessLicense: currentStatus.hasBusinessLicense || false,
    hasPCICompliance: currentStatus.hasPCICompliance || false
  };
  
  const missing = [];
  
  if (!checks.hasPrivacyPolicy) missing.push('Privacy Policy');
  if (!checks.hasTermsOfService) missing.push('Terms of Service');
  if (!checks.hasDataProtection && isGDPRApplicable(countryCode)) {
    missing.push('GDPR Compliance Documentation');
  }
  if (!checks.hasCookieConsent && isGDPRApplicable(countryCode)) {
    missing.push('Cookie Consent Banner');
  }
  if (!checks.hasBusinessLicense) {
    missing.push(`Business Registration (${requirements.businessLicense})`);
  }
  if (!checks.hasPCICompliance) {
    missing.push('PCI DSS Compliance');
  }
  
  return {
    compliant: missing.length === 0,
    country: countryCode,
    missing: missing,
    requirements: requirements,
    withdrawalPeriod: getWithdrawalPeriod(countryCode),
    dataRetention: getDataRetentionRequirements(countryCode)
  };
}

module.exports = {
  COMPLIANCE_REQUIREMENTS,
  getComplianceRequirements,
  isGDPRApplicable,
  getWithdrawalPeriod,
  getDataRetentionRequirements,
  checkCompliance
};
