// SEO Agent Decision Thresholds
// Hard rules only - NO LLM in decision logic

module.exports = {
  // Create Page Thresholds
  MIN_IMPRESSIONS_CREATE: 100,
  MIN_POSITION_CREATE: 8,
  MAX_POSITION_CREATE: 30,
  
  // Rewrite Meta Thresholds
  MIN_IMPRESSIONS_REWRITE: 50,
  LOW_CTR_THRESHOLD: 0.02, // 2% CTR
  MIN_POSITION_REWRITE: 1,
  MAX_POSITION_REWRITE: 20,
  
  // Expand Content Thresholds
  MIN_IMPRESSIONS_EXPAND: 200,
  MEDIUM_CTR_THRESHOLD: 0.03, // 3% CTR
  MIN_POSITION_EXPAND: 1,
  MAX_POSITION_EXPAND: 10,
  
  // Freeze Page Thresholds
  MIN_IMPRESSIONS_FREEZE: 500,
  HIGH_CTR_THRESHOLD: 0.05, // 5% CTR
  TOP_POSITION_THRESHOLD: 3,
  
  // Safety Kill Switch Thresholds
  CLICKS_DROP_PERCENTAGE: 0.3, // 30% drop
  INDEX_ERROR_RATE: 0.1, // 10% error rate
  MIN_DAYS_FOR_COMPARISON: 7,
  
  // Initial Scope Limits (SAFE START)
  MAX_SERVICES: 2,
  MAX_CITIES: 20,
  MAX_STATES: 1,
  TRIAL_PERIOD_DAYS: 30,
  
  // Weekly Analysis
  MIN_DAYS_FOR_EVALUATION: 7,
  MIN_SAMPLE_SIZE: 10,
};
