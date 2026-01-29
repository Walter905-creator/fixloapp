// Fetch Competitor Data - MOCKED for Safety
// Real implementation would use SERP APIs

const dataSources = require('../config/dataSources');
const { checkCrawlLimit, recordCrawlRequest } = require('../safety/rateLimiter');
const { validateCompetitorData } = require('../safety/validator');

/**
 * Fetches competitor ranking data
 * @param {Object} options - Fetch options
 * @returns {Array} Array of competitor ranking objects
 */
async function fetchCompetitors(options = {}) {
  const {
    services = dataSources.MOCK_DATA.services.slice(0, 2), // Default: plumbing, electrical
    cities = dataSources.MOCK_DATA.cities.slice(0, 5),     // Default: first 5 cities
    useMockData = true,  // Default to mock data for safety
  } = options;
  
  console.log(`📡 Fetching competitor data (mock=${useMockData})...`);
  
  if (!useMockData) {
    // Check rate limits before real API calls
    const limitCheck = checkCrawlLimit();
    if (!limitCheck.allowed) {
      console.warn(`⚠️ Rate limit exceeded: ${limitCheck.reason}`);
      console.log('ℹ️ Falling back to mock data');
      return fetchMockCompetitorData(services, cities);
    }
  }
  
  // For now, always use mock data
  // Real implementation would call SERP APIs here
  return fetchMockCompetitorData(services, cities);
}

/**
 * Generates mock competitor data
 * @param {Array} services - Services to mock
 * @param {Array} cities - Cities to mock
 * @returns {Array} Mock competitor data
 */
function fetchMockCompetitorData(services, cities) {
  const competitors = dataSources.MOCK_DATA.competitors;
  const mockData = [];
  
  // Generate mock rankings for each service x city combination
  for (const service of services) {
    for (const city of cities) {
      // Each competitor has some ranking
      for (let i = 0; i < competitors.length; i++) {
        const competitor = competitors[i];
        
        // Randomly decide if this competitor ranks for this query
        // 60% chance they rank
        if (Math.random() < 0.6) {
          const position = Math.floor(Math.random() * 20) + 1; // Position 1-20
          
          const data = {
            competitor: competitor.name,
            service,
            city: city.name,
            state: city.state,
            position,
            source: 'mock',
            timestamp: new Date().toISOString(),
          };
          
          // Validate before adding
          const validation = validateCompetitorData(data);
          if (validation.valid) {
            mockData.push(validation.sanitized);
          }
        }
      }
    }
  }
  
  console.log(`✅ Generated ${mockData.length} mock competitor rankings`);
  return mockData;
}

/**
 * Fetches real competitor data from SERP API (future implementation)
 * @param {string} service - Service to search for
 * @param {string} city - City to search in
 * @returns {Array} Real competitor data
 */
async function fetchRealCompetitorData(service, city) {
  // TODO: Implement SERP API integration
  // This would call SerpApi or similar service
  
  const apiKey = process.env.SERP_API_KEY;
  const enabled = process.env.SERP_API_ENABLED === 'true';
  
  if (!enabled || !apiKey) {
    throw new Error('SERP API not enabled or configured');
  }
  
  // Record the API call for rate limiting
  recordCrawlRequest();
  
  // Example SERP API call structure:
  // const response = await fetch(`https://serpapi.com/search?q=${service}+in+${city}&api_key=${apiKey}`);
  // const data = await response.json();
  // return parseSerpapiResults(data);
  
  throw new Error('Real SERP API not implemented yet');
}

/**
 * Filters competitor data based on criteria
 * @param {Array} data - Raw competitor data
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered data
 */
function filterCompetitorData(data, filters = {}) {
  const {
    maxPosition = 20,
    focusServices = [],
    focusStates = [],
  } = filters;
  
  let filtered = data;
  
  // Filter by position
  if (maxPosition) {
    filtered = filtered.filter(item => item.position <= maxPosition);
  }
  
  // Filter by services
  if (focusServices.length > 0) {
    filtered = filtered.filter(item => focusServices.includes(item.service));
  }
  
  // Filter by states
  if (focusStates.length > 0) {
    filtered = filtered.filter(item => focusStates.includes(item.state));
  }
  
  return filtered;
}

module.exports = {
  fetchCompetitors,
  fetchMockCompetitorData,
  fetchRealCompetitorData,
  filterCompetitorData,
};
