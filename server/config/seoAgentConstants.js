// SEO Agent Global Constants
// PHASE 0 — Guardrails

/**
 * Minimum impressions required to consider creating a new page
 * Only create pages if there's proven search demand
 */
const MIN_IMPRESSIONS_CREATE = 100;

/**
 * Minimum impressions required before testing CTR optimization
 * Don't waste time optimizing pages with insufficient data
 */
const MIN_IMPRESSIONS_CTR_TEST = 200;

/**
 * Expected CTR benchmarks by search position
 * Used to identify underperforming pages that need meta optimization
 * Based on industry standards for local service searches
 */
const CTR_BENCHMARK_BY_POSITION = {
  1: 0.35,   // 35% CTR for position 1
  2: 0.25,   // 25% CTR for position 2
  3: 0.18,   // 18% CTR for position 3
  4: 0.12,   // 12% CTR for position 4
  5: 0.09,   // 9% CTR for position 5
  6: 0.07,   // 7% CTR for position 6
  7: 0.05,   // 5% CTR for position 7
  8: 0.04,   // 4% CTR for position 8
  9: 0.03,   // 3% CTR for position 9
  10: 0.025, // 2.5% CTR for position 10
  11: 0.02,  // 2% for positions 11-20
  12: 0.02,
  13: 0.02,
  14: 0.02,
  15: 0.02,
  16: 0.015,
  17: 0.015,
  18: 0.015,
  19: 0.015,
  20: 0.015,
  21: 0.01,  // 1% for positions 21-30
  22: 0.01,
  23: 0.01,
  24: 0.01,
  25: 0.01,
  26: 0.01,
  27: 0.01,
  28: 0.01,
  29: 0.01,
  30: 0.01
};

/**
 * Number of days to wait before declaring a page "dead"
 * After this period with no traction, page may be frozen/deleted
 */
const PAGE_DEAD_DAYS = 30;

/**
 * Position range for triggering page creation
 * Only create pages for queries ranking in positions 8-30
 * (shows opportunity but no dedicated page exists)
 */
const PAGE_CREATE_POSITION_MIN = 8;
const PAGE_CREATE_POSITION_MAX = 30;

/**
 * Position range for content expansion
 * Pages ranking 4-15 are "near top" and need depth to push higher
 */
const CONTENT_EXPAND_POSITION_MIN = 4;
const CONTENT_EXPAND_POSITION_MAX = 15;

/**
 * Minimum clicks trend percentage increase to trigger content expansion
 * Page must show upward momentum (e.g., 10% increase week-over-week)
 */
const CLICKS_TREND_THRESHOLD = 0.10; // 10% increase

/**
 * Maximum bounce rate allowed for content expansion
 * Don't expand content on pages with poor engagement
 */
const MAX_BOUNCE_RATE_EXPANSION = 0.60; // 60%

/**
 * Minimum pages required for pattern analysis
 * Need sufficient sample size to identify "winners"
 */
const MIN_PAGES_FOR_PATTERN_ANALYSIS = 10;

/**
 * Days to look back for performance comparison
 * Used in learning loop to compare before/after metrics
 */
const PERFORMANCE_LOOKBACK_DAYS = 14;

/**
 * Percentage drop in organic clicks that triggers auto-stop
 * If clicks drop more than this % over 14 days, pause the agent
 */
const AUTO_STOP_CLICK_DROP_THRESHOLD = 0.20; // 20% drop

/**
 * Maximum pages to create per day
 * Prevents mass-generation (HARD RULE)
 */
const MAX_PAGES_PER_DAY = 5;

/**
 * Maximum meta rewrites per day
 * Prevents over-optimization
 */
const MAX_META_REWRITES_PER_DAY = 10;

/**
 * Minimum days between re-optimizing the same page
 * Don't thrash pages with constant changes
 */
const MIN_DAYS_BETWEEN_OPTIMIZATIONS = 7;

/**
 * Winning pattern threshold
 * Page must outperform peers by this percentage to be cloned
 */
const WINNING_PATTERN_THRESHOLD = 0.25; // 25% better performance

/**
 * Services available on Fixlo platform
 * Used for generating service pages
 */
const FIXLO_SERVICES = [
  'plumbing',
  'electrical',
  'hvac',
  'carpentry',
  'painting',
  'roofing',
  'house-cleaning',
  'junk-removal',
  'landscaping',
  'handyman',
  'appliance-repair',
  'pest-control',
  'window-cleaning',
  'gutter-cleaning',
  'pressure-washing'
];

/**
 * Trust signals to include in meta descriptions
 * Used by LLM to generate compelling meta tags
 */
const TRUST_SIGNALS = [
  'vetted pros',
  'background checked',
  'licensed professionals',
  'instant response',
  'same-day service',
  'free quotes',
  'satisfaction guaranteed',
  'local experts',
  'verified reviews',
  'insured professionals'
];

/**
 * Action verbs for meta titles
 * Used to create action-oriented titles
 */
const ACTION_VERBS = [
  'Find',
  'Hire',
  'Connect with',
  'Get',
  'Book',
  'Request',
  'Compare',
  'Discover'
];

/**
 * HARD RULES (Non-negotiable)
 */
const HARD_RULES = {
  NEVER_MASS_GENERATE: 'Never create pages in bulk without individual data validation',
  NEVER_TOUCH_WITHOUT_DATA: 'Never modify pages without sufficient impression/click data',
  ALWAYS_DECIDE_WITH_LOGIC: 'Decision engine must use pure logic, not LLM',
  LLM_ONLY_FOR_EXECUTION: 'LLM is worker only, not decider',
  MEASURE_EVERYTHING: 'Log all decisions, actions, and outcomes',
  SELF_CORRECT_OR_STOP: 'If not improving metrics, change logic or stop'
};

module.exports = {
  // Thresholds
  MIN_IMPRESSIONS_CREATE,
  MIN_IMPRESSIONS_CTR_TEST,
  CTR_BENCHMARK_BY_POSITION,
  PAGE_DEAD_DAYS,
  PAGE_CREATE_POSITION_MIN,
  PAGE_CREATE_POSITION_MAX,
  CONTENT_EXPAND_POSITION_MIN,
  CONTENT_EXPAND_POSITION_MAX,
  CLICKS_TREND_THRESHOLD,
  MAX_BOUNCE_RATE_EXPANSION,
  MIN_PAGES_FOR_PATTERN_ANALYSIS,
  PERFORMANCE_LOOKBACK_DAYS,
  AUTO_STOP_CLICK_DROP_THRESHOLD,
  
  // Rate limits
  MAX_PAGES_PER_DAY,
  MAX_META_REWRITES_PER_DAY,
  MIN_DAYS_BETWEEN_OPTIMIZATIONS,
  
  // Pattern analysis
  WINNING_PATTERN_THRESHOLD,
  
  // Content data
  FIXLO_SERVICES,
  TRUST_SIGNALS,
  ACTION_VERBS,
  
  // Rules
  HARD_RULES
};
