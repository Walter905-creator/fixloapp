// Clone Winners Decision Logic - RULE-BASED ONLY (NO LLM)
// Decides which winning patterns to replicate

const thresholds = require('../config/thresholds');

/**
 * Decides which winning page patterns should be cloned
 * This runs weekly, not daily
 * @param {Object} patterns - Extracted winning patterns
 * @returns {Array} Array of CLONE_WINNER decisions
 */
function decideCloneWinners(patterns) {
  console.log('🔍 Analyzing winning patterns for cloning...');
  
  if (!patterns || !patterns.winners || patterns.winners.length === 0) {
    console.log('ℹ️ No winning patterns to clone');
    return [];
  }
  
  const decisions = [];
  
  patterns.winners.forEach(winner => {
    // Rule 1: Must have proven performance
    if (winner.avgCTR < thresholds.HIGH_CTR_THRESHOLD) {
      return;
    }
    
    // Rule 2: Must have sufficient sample size
    if (winner.totalImpressions < thresholds.MIN_IMPRESSIONS_FREEZE * 2) {
      return;
    }
    
    // Rule 3: Must have identifiable pattern
    if (!winner.pattern || !winner.targetCities) {
      return;
    }
    
    // Create clone decisions for each target city
    winner.targetCities.forEach(city => {
      decisions.push({
        action: 'CLONE_WINNER',
        service: winner.service,
        city: city,
        sourcePattern: winner.pattern,
        reason: `Clone winner pattern: ${winner.pattern} (CTR: ${(winner.avgCTR * 100).toFixed(2)}%)`,
        priority: calculatePriority(winner),
        data: {
          sourceCTR: winner.avgCTR,
          sourcePosition: winner.avgPosition,
          sourceImpressions: winner.totalImpressions,
          patternType: winner.pattern,
        },
      });
    });
  });
  
  // Limit batch size for safety
  const limitedDecisions = decisions.slice(0, 10); // Max 10 clones per week
  
  console.log(`✅ Created ${limitedDecisions.length} clone winner decisions`);
  return limitedDecisions;
}

/**
 * Calculate priority for cloning winners
 * Best performers get highest priority
 */
function calculatePriority(winner) {
  let score = 0;
  
  // High CTR = higher priority
  score += winner.avgCTR * 1000;
  
  // Good position = higher priority
  score += (11 - winner.avgPosition) * 10;
  
  // High traffic = higher priority
  score += winner.totalImpressions / 10;
  
  return score;
}

module.exports = {
  decideCloneWinners,
};
