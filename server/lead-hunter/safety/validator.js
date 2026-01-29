// Input Validator and Sanitizer
// Ensures all data is safe and valid

/**
 * Validates an opportunity object
 * @param {Object} opportunity - Opportunity to validate
 * @returns {Object} { valid: boolean, errors: Array }
 */
function validateOpportunity(opportunity) {
  const errors = [];
  
  // Required fields
  if (!opportunity.type || typeof opportunity.type !== 'string') {
    errors.push('Missing or invalid type');
  }
  
  if (!opportunity.service || typeof opportunity.service !== 'string') {
    errors.push('Missing or invalid service');
  }
  
  if (!opportunity.city || typeof opportunity.city !== 'string') {
    errors.push('Missing or invalid city');
  }
  
  if (!opportunity.state || typeof opportunity.state !== 'string') {
    errors.push('Missing or invalid state');
  }
  
  if (typeof opportunity.score !== 'number' || opportunity.score < 0 || opportunity.score > 100) {
    errors.push('Invalid score (must be 0-100)');
  }
  
  // Validate type
  const validTypes = ['CITY_GAP', 'SERVICE_GAP', 'POSITION_OPPORTUNITY'];
  if (opportunity.type && !validTypes.includes(opportunity.type)) {
    errors.push(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
  }
  
  // Validate state (2-letter code)
  if (opportunity.state && opportunity.state.length !== 2) {
    errors.push('State must be 2-letter code');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a proposal object
 * @param {Object} proposal - Proposal to validate
 * @returns {Object} { valid: boolean, errors: Array }
 */
function validateProposal(proposal) {
  const errors = [];
  
  // Required fields
  if (!proposal.action || typeof proposal.action !== 'string') {
    errors.push('Missing or invalid action');
  }
  
  if (!proposal.service || typeof proposal.service !== 'string') {
    errors.push('Missing or invalid service');
  }
  
  if (!proposal.city || typeof proposal.city !== 'string') {
    errors.push('Missing or invalid city');
  }
  
  if (!proposal.state || typeof proposal.state !== 'string') {
    errors.push('Missing or invalid state');
  }
  
  if (!proposal.reason || typeof proposal.reason !== 'string') {
    errors.push('Missing or invalid reason');
  }
  
  if (typeof proposal.score !== 'number' || proposal.score < 0 || proposal.score > 100) {
    errors.push('Invalid score (must be 0-100)');
  }
  
  // Validate action
  const validActions = ['CREATE_PAGE', 'REWRITE_META', 'EXPAND_CONTENT'];
  if (proposal.action && !validActions.includes(proposal.action)) {
    errors.push(`Invalid action. Must be one of: ${validActions.join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes a string (removes dangerous characters)
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
  if (typeof str !== 'string') {
    return '';
  }
  
  // Remove control characters and trim
  return str.replace(/[\x00-\x1F\x7F]/g, '').trim();
}

/**
 * Validates a city name
 * @param {string} city - City name to validate
 * @returns {boolean} True if valid
 */
function isValidCity(city) {
  if (typeof city !== 'string' || city.length < 2 || city.length > 50) {
    return false;
  }
  
  // Allow letters, spaces, hyphens, apostrophes
  return /^[a-zA-Z\s\-']+$/.test(city);
}

/**
 * Validates a service name
 * @param {string} service - Service name to validate
 * @returns {boolean} True if valid
 */
function isValidService(service) {
  if (typeof service !== 'string' || service.length < 2 || service.length > 30) {
    return false;
  }
  
  // Allow letters, spaces, hyphens
  return /^[a-z\-]+$/.test(service);
}

/**
 * Validates a state code
 * @param {string} state - State code to validate
 * @returns {boolean} True if valid
 */
function isValidState(state) {
  if (typeof state !== 'string' || state.length !== 2) {
    return false;
  }
  
  // Must be uppercase letters
  return /^[A-Z]{2}$/.test(state);
}

/**
 * Validates and sanitizes competitor data
 * @param {Object} data - Competitor data to validate
 * @returns {Object} { valid: boolean, errors: Array, sanitized: Object }
 */
function validateCompetitorData(data) {
  const errors = [];
  const sanitized = {};
  
  // Validate and sanitize fields
  if (data.competitor) {
    sanitized.competitor = sanitizeString(data.competitor);
    if (!sanitized.competitor) {
      errors.push('Invalid competitor name');
    }
  } else {
    errors.push('Missing competitor');
  }
  
  if (data.service) {
    sanitized.service = sanitizeString(data.service).toLowerCase();
    if (!isValidService(sanitized.service)) {
      errors.push('Invalid service name');
    }
  } else {
    errors.push('Missing service');
  }
  
  if (data.city) {
    sanitized.city = sanitizeString(data.city);
    if (!isValidCity(sanitized.city)) {
      errors.push('Invalid city name');
    }
  } else {
    errors.push('Missing city');
  }
  
  if (data.state) {
    sanitized.state = sanitizeString(data.state).toUpperCase();
    if (!isValidState(sanitized.state)) {
      errors.push('Invalid state code');
    }
  } else {
    errors.push('Missing state');
  }
  
  if (typeof data.position === 'number') {
    sanitized.position = data.position;
    if (data.position < 1 || data.position > 100) {
      errors.push('Position must be between 1 and 100');
    }
  } else {
    errors.push('Missing or invalid position');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}

module.exports = {
  validateOpportunity,
  validateProposal,
  validateCompetitorData,
  sanitizeString,
  isValidCity,
  isValidService,
  isValidState,
};
