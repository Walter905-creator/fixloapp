// Rewrite Meta Decision Logic - RULE-BASED ONLY (NO LLM)
// Decides when to rewrite meta titles/descriptions

const thresholds = require('../config/thresholds');
const ctrBenchmarks = require('../config/ctrBenchmarks');

/**
 * Decides which pages need meta tag rewrites
 * @param {Array} gscData - Query performance data from GSC
 * @returns {Array} Array of REWRITE_META decisions
 */
function decideRewriteMeta(gscData) {
  console.log('🔍 Analyzing pages for meta tag optimization...');
  
  const decisions = [];
  
  gscData.forEach(query => {
    // Rule 1: Must have sufficient impressions for statistical significance
    if (query.impressions < thresholds.MIN_IMPRESSIONS_REWRITE) {
      return;
    }
    
    // Rule 2: Must be in visible positions (top 20)
    if (query.position < thresholds.MIN_POSITION_REWRITE || 
        query.position > thresholds.MAX_POSITION_REWRITE) {
      return;
    }
    
    // Rule 3: CTR must be underperforming for its position
    if (!ctrBenchmarks.isUnderperforming(Math.round(query.position), query.ctr)) {
      return;
    }
    
    // Rule 4: Must have page identifier
    if (!query.service || !query.city) {
      return;
    }
    
    // Decision approved: Rewrite meta tags
    decisions.push({
      action: 'REWRITE_META',
      service: query.service,
      city: query.city,
      reason: `Low CTR ${(query.ctr * 100).toFixed(2)}% at position ${query.position.toFixed(1)}`,
      priority: calculatePriority(query),
      data: {
        currentCTR: query.ctr,
        expectedCTR: ctrBenchmarks.getExpectedCTR(Math.round(query.position)),
        position: query.position,
        impressions: query.impressions,
        query: query.query,
      },
    });
  });
  
  // Sort by priority and limit batch size
  decisions.sort((a, b) => b.priority - a.priority);
  const limitedDecisions = decisions.slice(0, 10); // Max 10 rewrites per run
  
  console.log(`✅ Created ${limitedDecisions.length} meta rewrite decisions`);
  return limitedDecisions;
}

/**
 * Calculate priority for meta rewrites
 * Pages with most potential impact get highest priority
 */
function calculatePriority(query) {
  const expectedCTR = ctrBenchmarks.getExpectedCTR(Math.round(query.position));
  const ctrGap = expectedCTR - query.ctr;
  
  // Priority = potential additional clicks
  return query.impressions * ctrGap;
}

module.exports = {
  decideRewriteMeta,
};
