// Market Gap Detection - Identify Coverage Opportunities
// Compares competitor presence vs Fixlo presence

const { fetchFixloPages } = require('./fetchSEOMetrics');

/**
 * Identifies market gaps where competitors rank but Fixlo doesn't
 * @param {Array} competitorData - Competitor ranking data
 * @param {Set} existingPages - Set of existing Fixlo pages
 * @returns {Array} Array of gap opportunities
 */
async function fetchMarketGaps(competitorData, existingPages = null) {
  console.log('🔍 Analyzing market gaps...');
  
  // Fetch existing pages if not provided
  if (!existingPages) {
    existingPages = await fetchFixloPages();
  }
  
  const gaps = [];
  const seen = new Set();
  
  for (const competitor of competitorData) {
    const key = `${competitor.service}-${competitor.city}-${competitor.state}`;
    
    // Skip if we've already analyzed this combination
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    
    // Check if Fixlo has this page
    const fixloHasPage = existingPages.has(key);
    
    if (!fixloHasPage) {
      // This is a gap - competitor ranks but we don't have a page
      gaps.push({
        type: 'CITY_GAP',
        service: competitor.service,
        city: competitor.city,
        state: competitor.state,
        competitorPosition: competitor.position,
        competitor: competitor.competitor,
        reason: `${competitor.competitor} ranks at position ${competitor.position}, Fixlo has no page`,
      });
    }
  }
  
  console.log(`✅ Found ${gaps.length} market gap opportunities`);
  return gaps;
}

/**
 * Identifies service gaps (services competitors offer that Fixlo doesn't)
 * @param {Array} competitorData - Competitor data
 * @param {Set} fixloServices - Set of services Fixlo offers
 * @returns {Array} Service gap opportunities
 */
function identifyServiceGaps(competitorData, fixloServices) {
  const gaps = [];
  const servicesByCity = {};
  
  // Group competitor services by city
  for (const competitor of competitorData) {
    const cityKey = `${competitor.city}-${competitor.state}`;
    
    if (!servicesByCity[cityKey]) {
      servicesByCity[cityKey] = {
        city: competitor.city,
        state: competitor.state,
        competitorServices: new Set(),
      };
    }
    
    servicesByCity[cityKey].competitorServices.add(competitor.service);
  }
  
  // Identify gaps
  for (const cityKey in servicesByCity) {
    const cityData = servicesByCity[cityKey];
    
    for (const service of cityData.competitorServices) {
      if (!fixloServices.has(service)) {
        gaps.push({
          type: 'SERVICE_GAP',
          service,
          city: cityData.city,
          state: cityData.state,
          reason: `Competitors offer ${service} in ${cityData.city}, Fixlo does not`,
        });
      }
    }
  }
  
  return gaps;
}

/**
 * Identifies position opportunities (queries where we rank but poorly)
 * @param {Array} metrics - Fixlo SEO metrics
 * @param {number} minImpressions - Minimum impressions to consider
 * @param {number} positionThreshold - Position threshold (e.g., 10)
 * @returns {Array} Position opportunity objects
 */
function identifyPositionOpportunities(metrics, minImpressions = 100, positionThreshold = 10) {
  const opportunities = [];
  
  for (const metric of metrics) {
    // High impressions but poor position = opportunity
    if (metric.impressions >= minImpressions && metric.position > positionThreshold) {
      opportunities.push({
        type: 'POSITION_OPPORTUNITY',
        service: metric.service,
        city: metric.city,
        state: metric.state,
        currentPosition: metric.position,
        impressions: metric.impressions,
        ctr: metric.ctr,
        reason: `High impressions (${metric.impressions}) but poor position (${metric.position.toFixed(1)})`,
      });
    }
  }
  
  return opportunities;
}

module.exports = {
  fetchMarketGaps,
  identifyServiceGaps,
  identifyPositionOpportunities,
};
