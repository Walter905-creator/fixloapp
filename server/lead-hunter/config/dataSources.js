// Lead Hunter Data Source Configuration
// Defines where and how to gather intelligence

module.exports = {
  // Mock data configuration (default for safety)
  MOCK_DATA: {
    enabled: true,
    
    // Mock competitors and their services
    competitors: [
      { name: 'homeadvisor', domain: 'homeadvisor.com' },
      { name: 'angi', domain: 'angi.com' },
      { name: 'thumbtack', domain: 'thumbtack.com' },
      { name: 'yelp', domain: 'yelp.com' },
    ],
    
    // Mock services to analyze
    services: [
      'plumbing',
      'electrical',
      'hvac',
      'roofing',
      'landscaping',
      'painting',
      'carpentry',
      'cleaning',
    ],
    
    // Mock cities (initial focus: major metro areas)
    cities: [
      { name: 'Austin', state: 'TX', population: 961855 },
      { name: 'Dallas', state: 'TX', population: 1343573 },
      { name: 'Houston', state: 'TX', population: 2304580 },
      { name: 'San Antonio', state: 'TX', population: 1547253 },
      { name: 'Phoenix', state: 'AZ', population: 1680992 },
      { name: 'San Diego', state: 'CA', population: 1419516 },
      { name: 'Denver', state: 'CO', population: 715522 },
      { name: 'Seattle', state: 'WA', population: 749256 },
      { name: 'Portland', state: 'OR', population: 652503 },
      { name: 'Las Vegas', state: 'NV', population: 641903 },
    ],
  },
  
  // SERP API configuration (disabled by default)
  SERP_API: {
    enabled: false, // Set to true when ready for real data
    apiKey: process.env.SERP_API_KEY || '',
    baseUrl: 'https://serpapi.com/search',
    
    // Query templates
    queryTemplates: [
      '{service} services in {city}',
      '{service} near me {city}',
      'best {service} in {city}',
      '{service} repair {city}',
    ],
    
    // Search parameters
    searchParams: {
      engine: 'google',
      gl: 'us', // Country
      hl: 'en', // Language
      num: 20,  // Results per page
    },
  },
  
  // SEO Agent data sources (read-only)
  SEO_AGENT: {
    // Path to SEO agent logs
    logsPath: './seo-agent/logs',
    
    // Database collections to read
    collections: {
      pages: 'seopages',
      metrics: 'seometrics',
    },
    
    // Fields to read
    fields: {
      page: ['slug', 'service', 'city', 'state', 'createdAt', 'status'],
      metrics: ['impressions', 'clicks', 'ctr', 'position', 'date'],
    },
  },
  
  // Competitor analysis settings
  COMPETITOR_ANALYSIS: {
    // Focus areas (can be expanded)
    focusServices: [
      'plumbing',
      'electrical',
    ],
    
    focusStates: [
      'TX',
      'CA',
      'AZ',
    ],
    
    // Ranking threshold (only analyze top N positions)
    maxPositionToAnalyze: 20,
    
    // Minimum search volume to consider
    minSearchVolume: 100,
  },
  
  // City population data (for prioritization)
  CITY_DATA: {
    // Minimum population to consider
    minPopulation: 50000,
    
    // Population tiers for scoring
    tiers: [
      { min: 1000000, weight: 30 },   // Large cities
      { min: 500000, weight: 20 },    // Medium cities
      { min: 100000, weight: 10 },    // Small cities
      { min: 50000, weight: 5 },      // Very small cities
    ],
  },
};
