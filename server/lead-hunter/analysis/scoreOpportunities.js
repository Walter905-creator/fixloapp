// Opportunity Scoring Algorithm
// Prioritizes opportunities based on multiple factors

const limits = require('../config/limits');
const dataSources = require('../config/dataSources');

/**
 * Calculates opportunity score for a given opportunity
 * @param {Object} opportunity - Opportunity object
 * @returns {number} Score (0-100)
 */
function calculateOpportunityScore(opportunity) {
  let score = 0;
  
  // 1. Position weight (for competitor gaps)
  if (opportunity.competitorPosition) {
    if (opportunity.competitorPosition <= 3) {
      score += limits.SCORING.POSITION_WEIGHT_TOP_3;
    } else if (opportunity.competitorPosition <= 5) {
      score += limits.SCORING.POSITION_WEIGHT_TOP_5;
    } else if (opportunity.competitorPosition <= 10) {
      score += limits.SCORING.POSITION_WEIGHT_TOP_10;
    }
  }
  
  // 2. Population weight (city size)
  if (opportunity.city) {
    const cityData = getCityData(opportunity.city, opportunity.state);
    if (cityData) {
      score += getPopulationWeight(cityData.population);
    }
  }
  
  // 3. Service demand weight
  score += getServiceWeight(opportunity.service);
  
  // 4. Competitive intensity (if available)
  if (opportunity.competitorCount) {
    if (opportunity.competitorCount < 5) {
      score += limits.SCORING.COMPETITION_WEIGHT_LOW;
    } else if (opportunity.competitorCount < 10) {
      score += limits.SCORING.COMPETITION_WEIGHT_MEDIUM;
    }
  }
  
  // 5. Impression volume (for position opportunities)
  if (opportunity.impressions) {
    if (opportunity.impressions >= 500) score += 20;
    else if (opportunity.impressions >= 200) score += 15;
    else if (opportunity.impressions >= 100) score += 10;
  }
  
  // Cap score at 100
  return Math.min(score, 100);
}

/**
 * Gets city population data
 * @param {string} city - City name
 * @param {string} state - State code
 * @returns {Object|null} City data
 */
function getCityData(city, state) {
  const cities = dataSources.MOCK_DATA.cities;
  return cities.find(c => c.name === city && c.state === state) || null;
}

/**
 * Gets population weight for scoring
 * @param {number} population - City population
 * @returns {number} Weight score
 */
function getPopulationWeight(population) {
  if (population >= 1000000) {
    return limits.SCORING.POPULATION_WEIGHT_LARGE;
  } else if (population >= 500000) {
    return limits.SCORING.POPULATION_WEIGHT_MEDIUM;
  } else if (population >= 100000) {
    return limits.SCORING.POPULATION_WEIGHT_SMALL;
  }
  return 0;
}

/**
 * Gets service demand weight
 * @param {string} service - Service name
 * @returns {number} Weight score
 */
function getServiceWeight(service) {
  // High-demand services
  const highDemandServices = ['plumbing', 'electrical', 'hvac'];
  
  if (highDemandServices.includes(service)) {
    return limits.SCORING.SERVICE_WEIGHT_HIGH_DEMAND;
  }
  
  return 0;
}

/**
 * Scores and sorts opportunities
 * @param {Array} opportunities - Array of opportunities
 * @returns {Array} Sorted and scored opportunities
 */
function scoreOpportunities(opportunities) {
  console.log(`⚖️ Scoring ${opportunities.length} opportunities...`);
  
  // Calculate score for each opportunity
  const scored = opportunities.map(opp => ({
    ...opp,
    score: calculateOpportunityScore(opp),
  }));
  
  // Sort by score (highest first)
  scored.sort((a, b) => b.score - a.score);
  
  // Categorize by priority
  const categorized = scored.map(opp => ({
    ...opp,
    priority: getPriorityCategory(opp.score),
  }));
  
  console.log('✅ Opportunities scored and prioritized');
  logScoringSummary(categorized);
  
  return categorized;
}

/**
 * Gets priority category based on score
 * @param {number} score - Opportunity score
 * @returns {string} Priority category
 */
function getPriorityCategory(score) {
  if (score >= limits.SCORE_THRESHOLDS.HIGH_PRIORITY) {
    return 'HIGH';
  } else if (score >= limits.SCORE_THRESHOLDS.MEDIUM_PRIORITY) {
    return 'MEDIUM';
  } else if (score >= limits.SCORE_THRESHOLDS.LOW_PRIORITY) {
    return 'LOW';
  }
  return 'IGNORE';
}

/**
 * Filters opportunities by minimum score
 * @param {Array} opportunities - Scored opportunities
 * @param {number} minScore - Minimum score threshold
 * @returns {Array} Filtered opportunities
 */
function filterByScore(opportunities, minScore) {
  return opportunities.filter(opp => opp.score >= minScore);
}

/**
 * Logs scoring summary
 * @param {Array} opportunities - Scored opportunities
 */
function logScoringSummary(opportunities) {
  const summary = {
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    IGNORE: 0,
  };
  
  opportunities.forEach(opp => {
    summary[opp.priority]++;
  });
  
  console.log('📊 Priority breakdown:');
  console.log(`   HIGH: ${summary.HIGH}`);
  console.log(`   MEDIUM: ${summary.MEDIUM}`);
  console.log(`   LOW: ${summary.LOW}`);
  console.log(`   IGNORE: ${summary.IGNORE}`);
}

/**
 * Gets top N opportunities
 * @param {Array} opportunities - Scored opportunities
 * @param {number} limit - Number to return
 * @returns {Array} Top opportunities
 */
function getTopOpportunities(opportunities, limit = 10) {
  return opportunities
    .filter(opp => opp.priority !== 'IGNORE')
    .slice(0, limit);
}

module.exports = {
  calculateOpportunityScore,
  scoreOpportunities,
  getPriorityCategory,
  filterByScore,
  getTopOpportunities,
};
