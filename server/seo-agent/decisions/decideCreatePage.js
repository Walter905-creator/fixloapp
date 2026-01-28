// Create Page Decision Logic - RULE-BASED ONLY (NO LLM)
// Decides when to create new service pages

const thresholds = require('../config/thresholds');
const { pageExists } = require('../ingestion/fetchFixloPages');

/**
 * Decides which new pages should be created based on GSC data
 * @param {Array} gscData - Query performance data from GSC
 * @param {Set} existingPages - Set of existing page identifiers
 * @returns {Array} Array of CREATE_PAGE decisions
 */
function decideCreatePage(gscData, existingPages) {
  console.log('🔍 Analyzing opportunities for new page creation...');
  
  const decisions = [];
  
  gscData.forEach(query => {
    // Rule 1: Must have sufficient impressions
    if (query.impressions < thresholds.MIN_IMPRESSIONS_CREATE) {
      return;
    }
    
    // Rule 2: Position must be in the "opportunity zone" (8-30)
    if (query.position < thresholds.MIN_POSITION_CREATE || 
        query.position > thresholds.MAX_POSITION_CREATE) {
      return;
    }
    
    // Rule 3: Must have service and city data
    if (!query.service || !query.city) {
      return;
    }
    
    // Rule 4: Page must not already exist
    if (pageExists(existingPages, query.service, query.city)) {
      return;
    }
    
    // Rule 5: Check initial scope limits (SAFE START)
    const allowedServices = ['plumbing', 'electrical']; // First 2 services only
    if (!allowedServices.includes(query.service)) {
      return;
    }
    
    // Decision approved: Create this page
    decisions.push({
      action: 'CREATE_PAGE',
      service: query.service,
      city: query.city,
      state: 'california', // Initial scope: 1 state
      reason: `High impressions (${query.impressions}) at position ${query.position.toFixed(1)}`,
      priority: calculatePriority(query),
      data: {
        impressions: query.impressions,
        position: query.position,
        ctr: query.ctr,
        query: query.query,
      },
    });
  });
  
  // Sort by priority and limit to safe batch size
  decisions.sort((a, b) => b.priority - a.priority);
  const limitedDecisions = decisions.slice(0, 5); // Max 5 new pages per run
  
  console.log(`✅ Created ${limitedDecisions.length} page creation decisions (from ${gscData.length} queries)`);
  return limitedDecisions;
}

/**
 * Calculate priority score for page creation
 * Higher score = higher priority
 */
function calculatePriority(query) {
  let score = 0;
  
  // More impressions = higher priority
  score += query.impressions / 10;
  
  // Better position = higher priority
  score += (31 - query.position) * 2;
  
  // Higher CTR = higher priority
  score += query.ctr * 1000;
  
  return score;
}

module.exports = {
  decideCreatePage,
};
