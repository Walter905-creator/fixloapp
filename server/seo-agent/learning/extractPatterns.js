// Pattern Extraction
// Identifies winning patterns from top performers

const thresholds = require('../config/thresholds');

/**
 * Extracts patterns from evaluation report
 * @param {Object} report - Weekly evaluation report
 * @returns {Promise<Object>} Extracted patterns
 */
async function extractPatterns(report) {
  console.log('🔍 Extracting winning patterns...');
  
  const patterns = {
    winners: [],
    insights: [],
  };
  
  if (!report.topPerformers || report.topPerformers.length === 0) {
    console.log('ℹ️ No top performers to analyze');
    return patterns;
  }
  
  // Analyze top performers for patterns
  const servicePatterns = {};
  const cityPatterns = {};
  
  report.topPerformers.forEach(page => {
    // Group by service
    if (!servicePatterns[page.service]) {
      servicePatterns[page.service] = {
        service: page.service,
        pages: [],
        totalCTR: 0,
        totalPosition: 0,
        totalImpressions: 0,
      };
    }
    
    servicePatterns[page.service].pages.push(page);
    servicePatterns[page.service].totalCTR += page.current.ctr;
    servicePatterns[page.service].totalPosition += page.current.position;
    servicePatterns[page.service].totalImpressions += page.current.impressions;
    
    // Group by city
    if (!cityPatterns[page.city]) {
      cityPatterns[page.city] = {
        city: page.city,
        pages: [],
        totalCTR: 0,
      };
    }
    
    cityPatterns[page.city].pages.push(page);
    cityPatterns[page.city].totalCTR += page.current.ctr;
  });
  
  // Identify winning service patterns
  Object.values(servicePatterns).forEach(pattern => {
    if (pattern.pages.length >= thresholds.MIN_SAMPLE_SIZE / 5) { // At least 2 examples
      const avgCTR = pattern.totalCTR / pattern.pages.length;
      const avgPosition = pattern.totalPosition / pattern.pages.length;
      
      if (avgCTR >= thresholds.HIGH_CTR_THRESHOLD) {
        // This service performs well - find cities to expand to
        const existingCities = new Set(pattern.pages.map(p => p.city));
        const targetCities = getTargetCities(existingCities);
        
        patterns.winners.push({
          pattern: `${pattern.service}-service`,
          service: pattern.service,
          avgCTR,
          avgPosition,
          totalImpressions: pattern.totalImpressions,
          exampleCount: pattern.pages.length,
          targetCities,
        });
      }
    }
  });
  
  // Add insights
  if (patterns.winners.length > 0) {
    patterns.insights.push({
      type: 'service_success',
      message: `${patterns.winners.length} service patterns identified for replication`,
      services: patterns.winners.map(w => w.service),
    });
  }
  
  console.log(`✅ Extracted ${patterns.winners.length} winning patterns`);
  
  return patterns;
}

/**
 * Get target cities for expansion
 * Returns cities from initial scope that aren't already covered
 */
function getTargetCities(existingCities) {
  // Initial scope: California cities
  const californiaCities = [
    'los-angeles', 'san-francisco', 'san-diego', 'sacramento', 'san-jose',
    'fresno', 'long-beach', 'oakland', 'bakersfield', 'anaheim',
    'santa-ana', 'riverside', 'stockton', 'irvine', 'chula-vista',
    'fremont', 'santa-clarita', 'modesto', 'fontana', 'moreno-valley',
  ];
  
  // Filter out existing cities
  const targetCities = californiaCities.filter(city => !existingCities.has(city));
  
  // Return limited batch (max 5 new cities per pattern)
  return targetCities.slice(0, 5);
}

module.exports = {
  extractPatterns,
};
