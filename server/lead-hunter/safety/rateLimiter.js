// Rate Limiter - Controls External API Call Frequency
// Prevents abuse and ensures cost control

const limits = require('../config/limits');

// In-memory rate limit tracking
const rateLimitState = {
  serpApi: { hour: [], day: [] },
  crawl: { hour: [], day: [] },
  proposals: { day: [] },
};

/**
 * Checks if a rate limit has been exceeded
 * @param {string} type - Type of rate limit (serpApi, crawl, proposals)
 * @param {string} period - Period to check (hour, day)
 * @param {number} max - Maximum allowed in period
 * @returns {boolean} True if limit exceeded
 */
function isRateLimitExceeded(type, period, max) {
  const now = Date.now();
  const periodMs = period === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  
  if (!rateLimitState[type] || !rateLimitState[type][period]) {
    return false;
  }
  
  // Clean old entries
  rateLimitState[type][period] = rateLimitState[type][period].filter(
    timestamp => now - timestamp < periodMs
  );
  
  // Check count
  return rateLimitState[type][period].length >= max;
}

/**
 * Records a rate limit event
 * @param {string} type - Type of rate limit
 * @param {string} period - Period to record (hour, day, or both)
 */
function recordRateLimitEvent(type, period = 'both') {
  const now = Date.now();
  
  if (!rateLimitState[type]) {
    rateLimitState[type] = { hour: [], day: [] };
  }
  
  if (period === 'hour' || period === 'both') {
    rateLimitState[type].hour.push(now);
  }
  
  if (period === 'day' || period === 'both') {
    rateLimitState[type].day.push(now);
  }
}

/**
 * Checks SERP API rate limit
 * @returns {Object} { allowed: boolean, reason: string }
 */
function checkSerpApiLimit() {
  // Check hourly limit
  if (isRateLimitExceeded('serpApi', 'hour', limits.EXTERNAL_API.SERP_MAX_PER_HOUR)) {
    return {
      allowed: false,
      reason: `SERP API hourly limit exceeded (${limits.EXTERNAL_API.SERP_MAX_PER_HOUR} calls/hour)`,
    };
  }
  
  // Check daily limit
  if (isRateLimitExceeded('serpApi', 'day', limits.EXTERNAL_API.SERP_MAX_PER_DAY)) {
    return {
      allowed: false,
      reason: `SERP API daily limit exceeded (${limits.EXTERNAL_API.SERP_MAX_PER_DAY} calls/day)`,
    };
  }
  
  return { allowed: true };
}

/**
 * Checks crawl rate limit
 * @returns {Object} { allowed: boolean, reason: string }
 */
function checkCrawlLimit() {
  // Check hourly limit
  if (isRateLimitExceeded('crawl', 'hour', limits.EXTERNAL_API.CRAWL_MAX_PER_HOUR)) {
    return {
      allowed: false,
      reason: `Crawl hourly limit exceeded (${limits.EXTERNAL_API.CRAWL_MAX_PER_HOUR} calls/hour)`,
    };
  }
  
  // Check daily limit
  if (isRateLimitExceeded('crawl', 'day', limits.EXTERNAL_API.CRAWL_MAX_PER_DAY)) {
    return {
      allowed: false,
      reason: `Crawl daily limit exceeded (${limits.EXTERNAL_API.CRAWL_MAX_PER_DAY} calls/day)`,
    };
  }
  
  return { allowed: true };
}

/**
 * Checks proposal rate limit (guarded mode)
 * @returns {Object} { allowed: boolean, reason: string }
 */
function checkProposalLimit() {
  if (isRateLimitExceeded('proposals', 'day', limits.GUARDED_MODE.MAX_PROPOSALS_PER_DAY)) {
    return {
      allowed: false,
      reason: `Proposal daily limit exceeded (${limits.GUARDED_MODE.MAX_PROPOSALS_PER_DAY} proposals/day)`,
    };
  }
  
  return { allowed: true };
}

/**
 * Records a SERP API call
 */
function recordSerpApiCall() {
  recordRateLimitEvent('serpApi', 'both');
}

/**
 * Records a crawl request
 */
function recordCrawlRequest() {
  recordRateLimitEvent('crawl', 'both');
}

/**
 * Records a proposal submission
 */
function recordProposal() {
  recordRateLimitEvent('proposals', 'day');
}

/**
 * Gets current rate limit status
 * @returns {Object} Current state of all rate limits
 */
function getRateLimitStatus() {
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * 60 * 60 * 1000;
  
  return {
    serpApi: {
      hour: rateLimitState.serpApi.hour.filter(t => now - t < hourMs).length,
      maxHour: limits.EXTERNAL_API.SERP_MAX_PER_HOUR,
      day: rateLimitState.serpApi.day.filter(t => now - t < dayMs).length,
      maxDay: limits.EXTERNAL_API.SERP_MAX_PER_DAY,
    },
    crawl: {
      hour: rateLimitState.crawl.hour.filter(t => now - t < hourMs).length,
      maxHour: limits.EXTERNAL_API.CRAWL_MAX_PER_HOUR,
      day: rateLimitState.crawl.day.filter(t => now - t < dayMs).length,
      maxDay: limits.EXTERNAL_API.CRAWL_MAX_PER_DAY,
    },
    proposals: {
      day: rateLimitState.proposals.day.filter(t => now - t < dayMs).length,
      maxDay: limits.GUARDED_MODE.MAX_PROPOSALS_PER_DAY,
    },
  };
}

module.exports = {
  checkSerpApiLimit,
  checkCrawlLimit,
  checkProposalLimit,
  recordSerpApiCall,
  recordCrawlRequest,
  recordProposal,
  getRateLimitStatus,
};
