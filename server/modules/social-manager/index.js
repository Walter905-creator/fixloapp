/**
 * Social Media Manager Module
 * 
 * Automated social media management for Fixlo
 * Fully modular and extractable for standalone SaaS
 * 
 * @module social-manager
 */

const routes = require('./routes');
const scheduler = require('./scheduler');
const models = require('./models');
const { contentGenerator } = require('./content');
const analyticsService = require('./analytics');
const adminService = require('./admin');
const postingService = require('./posting');
const { getConfiguredPlatforms } = require('./oauth');

/**
 * Initialize the social manager module
 * @param {Object} options - Initialization options
 */
async function initialize(options = {}) {
  const {
    startScheduler = true,
    requireApproval = true
  } = options;
  
  console.log('📱 Initializing Social Media Manager...');
  
  // Verify encryption key
  if (!process.env.SOCIAL_ENCRYPTION_KEY) {
    console.error('❌ SOCIAL_ENCRYPTION_KEY not configured');
    console.error('   Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"');
    throw new Error('SOCIAL_ENCRYPTION_KEY is required');
  }
  
  // Check configured platforms
  const platforms = getConfiguredPlatforms();
  console.log(`✅ Configured platforms: ${platforms.length > 0 ? platforms.join(', ') : 'none'}`);
  
  if (platforms.length === 0) {
    console.warn('⚠️ No social media platforms configured');
    console.warn('   Set SOCIAL_*_CLIENT_ID and SOCIAL_*_CLIENT_SECRET environment variables');
  }
  
  // Check AI content generation
  if (process.env.OPENAI_API_KEY) {
    console.log('✅ AI content generation enabled');
  } else {
    console.warn('⚠️ AI content generation disabled (OPENAI_API_KEY not set)');
  }
  
  // Start scheduler
  if (startScheduler) {
    scheduler.start();
  } else {
    console.log('ℹ️ Scheduler not started (manual control)');
  }
  
  console.log('✅ Social Media Manager initialized');
  console.log(`   Manual approval: ${requireApproval ? 'ENABLED' : 'DISABLED'}`);
  
  return {
    routes,
    scheduler,
    models,
    contentGenerator,
    analyticsService,
    adminService,
    postingService
  };
}

/**
 * Shutdown the social manager module
 */
async function shutdown() {
  console.log('🛑 Shutting down Social Media Manager...');
  
  scheduler.stop();
  
  console.log('✅ Social Media Manager shut down');
}

module.exports = {
  initialize,
  shutdown,
  routes,
  scheduler,
  models,
  contentGenerator,
  analyticsService,
  adminService,
  postingService
};
