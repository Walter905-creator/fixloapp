// Expand Content Decision Logic - RULE-BASED ONLY (NO LLM)
// Decides when to expand page content (add FAQs, etc.)

const thresholds = require('../config/thresholds');

/**
 * Decides which pages need content expansion
 * @param {Array} gscData - Query performance data from GSC
 * @returns {Array} Array of EXPAND_CONTENT decisions
 */
function decideExpandContent(gscData) {
  console.log('🔍 Analyzing pages for content expansion...');
  
  const decisions = [];
  
  gscData.forEach(query => {
    // Rule 1: Must have good impressions (page is being seen)
    if (query.impressions < thresholds.MIN_IMPRESSIONS_EXPAND) {
      return;
    }
    
    // Rule 2: Must be in top 10 (good position but room to improve)
    if (query.position < thresholds.MIN_POSITION_EXPAND || 
        query.position > thresholds.MAX_POSITION_EXPAND) {
      return;
    }
    
    // Rule 3: CTR is decent but not great (room for improvement)
    if (query.ctr < thresholds.LOW_CTR_THRESHOLD || 
        query.ctr >= thresholds.HIGH_CTR_THRESHOLD) {
      return;
    }
    
    // Rule 4: Must have page identifier
    if (!query.service || !query.city) {
      return;
    }
    
    // Decision approved: Expand content
    decisions.push({
      action: 'EXPAND_CONTENT',
      service: query.service,
      city: query.city,
      reason: `Good position ${query.position.toFixed(1)} with ${query.impressions} impressions - expand to capture more`,
      priority: calculatePriority(query),
      data: {
        currentCTR: query.ctr,
        position: query.position,
        impressions: query.impressions,
        clicks: query.clicks,
        query: query.query,
      },
    });
  });
  
  // Sort by priority and limit batch size
  decisions.sort((a, b) => b.priority - a.priority);
  const limitedDecisions = decisions.slice(0, 5); // Max 5 expansions per run
  
  console.log(`✅ Created ${limitedDecisions.length} content expansion decisions`);
  return limitedDecisions;
}

/**
 * Calculate priority for content expansion
 * Focus on pages with most traffic potential
 */
function calculatePriority(query) {
  let score = 0;
  
  // More impressions = higher priority
  score += query.impressions / 5;
  
  // Better position = higher priority
  score += (11 - query.position) * 10;
  
  // Moderate CTR is ideal for expansion
  score += query.ctr * 500;
  
  return score;
}

module.exports = {
  decideExpandContent,
};
