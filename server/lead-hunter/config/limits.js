// Lead Hunter Rate Limits and Safety Bounds
// All external interactions must respect these limits

module.exports = {
  // External API Rate Limits
  EXTERNAL_API: {
    // SERP API limits
    SERP_MAX_PER_HOUR: 100,
    SERP_MAX_PER_DAY: 500,
    
    // Competitor crawling limits
    CRAWL_MAX_PER_HOUR: 50,
    CRAWL_MAX_PER_DAY: 200,
    
    // General timeout for all external calls
    REQUEST_TIMEOUT_MS: 5000,
  },
  
  // Guarded Mode Limits
  GUARDED_MODE: {
    // Maximum opportunities to feed to SEO agent per day
    MAX_PROPOSALS_PER_DAY: 10,
    
    // Minimum opportunity score to consider feeding
    MIN_FEED_SCORE: 60,
    
    // Maximum proposals per run
    MAX_PROPOSALS_PER_RUN: 5,
    
    // Cooldown between proposals (ms)
    PROPOSAL_COOLDOWN_MS: 1000,
  },
  
  // Observer Mode Limits
  OBSERVER_MODE: {
    // Maximum opportunities to log per run
    MAX_OPPORTUNITIES_PER_RUN: 100,
    
    // Maximum external data sources to query
    MAX_DATA_SOURCES: 5,
    
    // Minimum score to log opportunity
    MIN_LOG_SCORE: 40,
  },
  
  // Tuning Mode Limits
  TUNING_MODE: {
    // Minimum data points required for recommendation
    MIN_SAMPLE_SIZE: 20,
    
    // Minimum days of data required
    MIN_DAYS_OF_DATA: 7,
    
    // Maximum recommendations per run
    MAX_RECOMMENDATIONS: 10,
  },
  
  // Lock Management
  LOCK: {
    // Lock expiry time in minutes
    TIMEOUT_MINUTES: 60,
    
    // Lock file location
    LOCK_DIR: './locks',
  },
  
  // Scoring Weights
  SCORING: {
    // Position weights (top positions = higher opportunity)
    POSITION_WEIGHT_TOP_3: 50,
    POSITION_WEIGHT_TOP_5: 30,
    POSITION_WEIGHT_TOP_10: 20,
    
    // Population weights (larger cities = higher priority)
    POPULATION_WEIGHT_LARGE: 30,  // > 1M
    POPULATION_WEIGHT_MEDIUM: 20, // > 500K
    POPULATION_WEIGHT_SMALL: 10,  // > 100K
    
    // Service demand weights
    SERVICE_WEIGHT_HIGH_DEMAND: 10,
    
    // Competitive intensity (fewer competitors = better)
    COMPETITION_WEIGHT_LOW: 15,   // < 5 competitors
    COMPETITION_WEIGHT_MEDIUM: 10, // < 10 competitors
  },
  
  // Score thresholds for prioritization
  SCORE_THRESHOLDS: {
    HIGH_PRIORITY: 80,
    MEDIUM_PRIORITY: 60,
    LOW_PRIORITY: 40,
  },
};
