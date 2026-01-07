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

// Core toggle - entire engine can be disabled instantly
const DISTRIBUTION_ENGINE_ENABLED = process.env.DISTRIBUTION_ENGINE_ENABLED === 'true';

// Publishing rate limits (daily)
const RATE_LIMITS = {
  maxPagesPerDay: parseInt(process.env.DISTRIBUTION_MAX_PAGES_PER_DAY) || 50,
  maxPagesPerHour: parseInt(process.env.DISTRIBUTION_MAX_PAGES_PER_HOUR) || 5,
  maxPagesPerRoute: parseInt(process.env.DISTRIBUTION_MAX_PAGES_PER_ROUTE) || 10,
  minPublishIntervalMinutes: parseInt(process.env.DISTRIBUTION_MIN_INTERVAL_MINUTES) || 15,
  cooldownHours: parseInt(process.env.DISTRIBUTION_COOLDOWN_HOURS) || 24,
};

// Content quality requirements
const CONTENT_QUALITY = {
  minWordCount: parseInt(process.env.DISTRIBUTION_MIN_WORD_COUNT) || 300,
  maxWordCount: parseInt(process.env.DISTRIBUTION_MAX_WORD_COUNT) || 1500,
  minHeadings: parseInt(process.env.DISTRIBUTION_MIN_HEADINGS) || 3,
  maxHeadings: parseInt(process.env.DISTRIBUTION_MAX_HEADINGS) || 8,
  minParagraphs: parseInt(process.env.DISTRIBUTION_MIN_PARAGRAPHS) || 5,
  requireFAQ: process.env.DISTRIBUTION_REQUIRE_FAQ !== 'false',
  minFAQItems: parseInt(process.env.DISTRIBUTION_MIN_FAQ_ITEMS) || 3,
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
  maxUrlsPerSitemap: parseInt(process.env.DISTRIBUTION_MAX_URLS_PER_SITEMAP) || 5000,
  updateFrequency: process.env.DISTRIBUTION_SITEMAP_UPDATE_FREQ || 'daily',
  defaultPriority: parseFloat(process.env.DISTRIBUTION_SITEMAP_PRIORITY) || 0.7,
  autoSubmit: process.env.DISTRIBUTION_AUTO_SUBMIT_SITEMAP !== 'false',
};

// Monitoring thresholds
const MONITORING = {
  maxCrawlErrorRate: parseFloat(process.env.DISTRIBUTION_MAX_CRAWL_ERROR_RATE) || 0.1, // 10%
  minIndexRate: parseFloat(process.env.DISTRIBUTION_MIN_INDEX_RATE) || 0.5, // 50%
  indexCheckDelayDays: parseInt(process.env.DISTRIBUTION_INDEX_CHECK_DELAY_DAYS) || 7,
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
  maxLinksPerPage: parseInt(process.env.DISTRIBUTION_MAX_LINKS_PER_PAGE) || 5,
  linkDensityMax: parseFloat(process.env.DISTRIBUTION_LINK_DENSITY_MAX) || 0.02, // 2% of content
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
