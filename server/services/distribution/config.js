/**
 * Distribution Engine Configuration
 * 
 * Central configuration for the Distribution Engine module.
 * Controls all aspects of automated content generation and distribution.
 * 
 * SAFETY PRINCIPLES:
 * - No scraping private data
 * - No fake reviews
 * - No automated logins where forbidden
 * - No comment spam
 * - No keyword stuffing
 * - No identical content duplication
 */

require('dotenv').config();

// Helper to validate and parse integer environment variables
function parseIntEnv(value, defaultValue, min = null, max = null) {
  const parsed = parseInt(value);
  if (isNaN(parsed)) return defaultValue;
  if (min !== null && parsed < min) return defaultValue;
  if (max !== null && parsed > max) return defaultValue;
  return parsed;
}

// Helper to validate and parse float environment variables
function parseFloatEnv(value, defaultValue, min = null, max = null) {
  const parsed = parseFloat(value);
  if (isNaN(parsed)) return defaultValue;
  if (min !== null && parsed < min) return defaultValue;
  if (max !== null && parsed > max) return defaultValue;
  return parsed;
}

// Core toggle - entire engine can be disabled instantly
const DISTRIBUTION_ENGINE_ENABLED = process.env.DISTRIBUTION_ENGINE_ENABLED === 'true';

// Publishing rate limits (daily)
const RATE_LIMITS = {
  maxPagesPerDay: parseIntEnv(process.env.DISTRIBUTION_MAX_PAGES_PER_DAY, 50, 1, 1000),
  maxPagesPerHour: parseIntEnv(process.env.DISTRIBUTION_MAX_PAGES_PER_HOUR, 5, 1, 100),
  maxPagesPerRoute: parseIntEnv(process.env.DISTRIBUTION_MAX_PAGES_PER_ROUTE, 10, 1, 100),
  minPublishIntervalMinutes: parseIntEnv(process.env.DISTRIBUTION_MIN_INTERVAL_MINUTES, 15, 1, 1440),
  cooldownHours: parseIntEnv(process.env.DISTRIBUTION_COOLDOWN_HOURS, 24, 1, 720),
  queueRandomWindow: parseIntEnv(process.env.DISTRIBUTION_QUEUE_RANDOM_WINDOW, 5, 1, 20), // Number of items to consider for random selection
};

// Content quality requirements
const CONTENT_QUALITY = {
  minWordCount: parseIntEnv(process.env.DISTRIBUTION_MIN_WORD_COUNT, 300, 100, 10000),
  maxWordCount: parseIntEnv(process.env.DISTRIBUTION_MAX_WORD_COUNT, 1500, 300, 20000),
  minHeadings: parseIntEnv(process.env.DISTRIBUTION_MIN_HEADINGS, 3, 1, 20),
  maxHeadings: parseIntEnv(process.env.DISTRIBUTION_MAX_HEADINGS, 8, 3, 50),
  minParagraphs: parseIntEnv(process.env.DISTRIBUTION_MIN_PARAGRAPHS, 5, 1, 100),
  requireFAQ: process.env.DISTRIBUTION_REQUIRE_FAQ !== 'false',
  minFAQItems: parseIntEnv(process.env.DISTRIBUTION_MIN_FAQ_ITEMS, 3, 1, 20),
};

// Services available for SEO page generation
const SERVICES = [
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
  'appliance-repair'
];

// Major cities for service+city combinations
const MAJOR_CITIES = [
  'miami', 'new-york', 'los-angeles', 'chicago', 'houston',
  'phoenix', 'philadelphia', 'san-antonio', 'san-diego', 'dallas',
  'san-jose', 'austin', 'jacksonville', 'fort-worth', 'columbus',
  'charlotte', 'san-francisco', 'indianapolis', 'seattle', 'denver',
  'washington', 'boston', 'nashville', 'atlanta', 'portland',
  'las-vegas', 'detroit', 'baltimore', 'memphis', 'louisville'
];

// SEO page variants
const PAGE_VARIANTS = {
  standard: true, // service + city
  nearMe: true, // service + "near me"
  emergency: true, // emergency/same-day variants
  seasonal: true, // seasonal variants (winter, summer, holiday)
  bilingual: true, // English + Spanish
};

// Variant modifiers
const VARIANT_MODIFIERS = {
  emergency: ['emergency', 'same-day', '24-hour', 'urgent'],
  seasonal: ['winter', 'summer', 'spring', 'fall', 'holiday'],
  timing: ['last-minute', 'immediate', 'fast', 'quick'],
};

// Languages supported
const LANGUAGES = ['en', 'es'];

// Sitemap configuration
const SITEMAP_CONFIG = {
  maxUrlsPerSitemap: parseIntEnv(process.env.DISTRIBUTION_MAX_URLS_PER_SITEMAP, 5000, 100, 50000),
  updateFrequency: process.env.DISTRIBUTION_SITEMAP_UPDATE_FREQ || 'daily',
  defaultPriority: parseFloatEnv(process.env.DISTRIBUTION_SITEMAP_PRIORITY, 0.7, 0.0, 1.0),
  autoSubmit: process.env.DISTRIBUTION_AUTO_SUBMIT_SITEMAP !== 'false',
};

// Monitoring thresholds
const MONITORING = {
  maxCrawlErrorRate: parseFloatEnv(process.env.DISTRIBUTION_MAX_CRAWL_ERROR_RATE, 0.1, 0.0, 1.0),
  minIndexRate: parseFloatEnv(process.env.DISTRIBUTION_MIN_INDEX_RATE, 0.5, 0.0, 1.0),
  indexCheckDelayDays: parseIntEnv(process.env.DISTRIBUTION_INDEX_CHECK_DELAY_DAYS, 7, 1, 365),
  autoSlowdownEnabled: process.env.DISTRIBUTION_AUTO_SLOWDOWN !== 'false',
  autoPauseEnabled: process.env.DISTRIBUTION_AUTO_PAUSE !== 'false',
};

// Owned authority network (config-ready, no automation)
const OWNED_NETWORK = {
  enabled: process.env.DISTRIBUTION_OWNED_NETWORK_ENABLED === 'true',
  domains: process.env.DISTRIBUTION_OWNED_DOMAINS ? 
    process.env.DISTRIBUTION_OWNED_DOMAINS.split(',').map(d => d.trim()) : [],
  outputDirectory: process.env.DISTRIBUTION_OUTPUT_DIR || './distribution-output',
  exportFormats: ['markdown', 'html'],
  manualPublishOnly: true, // Always require manual approval
};

// Social echo (preparation only, no auto-posting)
const SOCIAL_ECHO = {
  enabled: process.env.DISTRIBUTION_SOCIAL_ECHO_ENABLED === 'true',
  platforms: ['twitter', 'facebook', 'linkedin'], // Configuration only
  generatePayloads: true,
  autoPost: false, // ALWAYS false - never auto-post
  outputDirectory: process.env.DISTRIBUTION_SOCIAL_OUTPUT_DIR || './social-output',
  tone: 'educational', // Educational, helpful, not promotional
};

// Internal linking configuration
const INTERNAL_LINKING = {
  enabled: process.env.DISTRIBUTION_INTERNAL_LINKING !== 'false',
  maxLinksPerPage: parseIntEnv(process.env.DISTRIBUTION_MAX_LINKS_PER_PAGE, 5, 1, 20),
  linkDensityMax: parseFloatEnv(process.env.DISTRIBUTION_LINK_DENSITY_MAX, 0.02, 0.0, 0.1),
  onlyRelevantServices: true,
};

// Logging configuration
const LOGGING = {
  enabled: true, // Always log
  logLevel: process.env.DISTRIBUTION_LOG_LEVEL || 'info',
  logDirectory: process.env.DISTRIBUTION_LOG_DIR || './logs/distribution',
  auditTrail: true, // Always maintain audit trail
};

module.exports = {
  DISTRIBUTION_ENGINE_ENABLED,
  RATE_LIMITS,
  CONTENT_QUALITY,
  SERVICES,
  MAJOR_CITIES,
  PAGE_VARIANTS,
  VARIANT_MODIFIERS,
  LANGUAGES,
  SITEMAP_CONFIG,
  MONITORING,
  OWNED_NETWORK,
  SOCIAL_ECHO,
  INTERNAL_LINKING,
  LOGGING,
};
