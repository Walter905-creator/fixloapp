// Freeze Page Decision Logic - RULE-BASED ONLY (NO LLM)
// Decides when to freeze a page (stop making changes to winners)

const thresholds = require('../config/thresholds');

/**
 * Decides which pages should be frozen (no more changes)
 * @param {Array} gscData - Query performance data from GSC
 * @returns {Array} Array of FREEZE_PAGE decisions
 */
function decideFreezePage(gscData) {
  console.log('🔍 Analyzing pages for freezing (protecting winners)...');
  
  const decisions = [];
  
  gscData.forEach(query => {
    // Rule 1: Must have high impressions (established page)
    if (query.impressions < thresholds.MIN_IMPRESSIONS_FREEZE) {
      return;
    }
    
    // Rule 2: Must be in top positions
    if (query.position > thresholds.TOP_POSITION_THRESHOLD) {
      return;
    }
    
    // Rule 3: Must have high CTR (winning performance)
    if (query.ctr < thresholds.HIGH_CTR_THRESHOLD) {
      return;
    }
    
    // Rule 4: Must have page identifier
    if (!query.service || !query.city) {
      return;
    }
    
    // Decision approved: Freeze this winner
    decisions.push({
      action: 'FREEZE_PAGE',
      service: query.service,
      city: query.city,
      reason: `Winner: Position ${query.position.toFixed(1)}, CTR ${(query.ctr * 100).toFixed(2)}%, ${query.impressions} impressions`,
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
  
  console.log(`✅ Created ${decisions.length} freeze decisions (protecting winners)`);
  return decisions;
}

/**
 * Calculate priority for freezing
 * Best performing pages get highest priority for protection
 */
function calculatePriority(query) {
  let score = 0;
  
  // Top position = highest priority
  score += (4 - query.position) * 100;
  
  // High CTR = higher priority
  score += query.ctr * 2000;
  
  // High traffic = higher priority
  score += query.clicks * 2;
  
  return score;
}

module.exports = {
  decideFreezePage,
};
