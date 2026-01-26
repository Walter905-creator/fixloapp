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
    try {
      // SAFETY: Only auto-start if SOCIAL_AUTOMATION_ENABLED is true
      // When false, scheduler must be started manually via API
      const automationEnabled = process.env.SOCIAL_AUTOMATION_ENABLED === 'true';
      
      scheduler.start();
      
      console.log('✅ Social Media Manager initialized');
      if (automationEnabled) {
        console.log('🚀 Social automation ENABLED');
        console.log('📅 Scheduler running');
      } else {
        console.log('⚠️ Social automation DISABLED (scheduler started but posting blocked)');
      }
    } catch (error) {
      console.log('ℹ️ Scheduler not auto-started:', error.message);
      console.log('   Use POST /api/social/scheduler/start to start manually');
      console.log('✅ Social Media Manager initialized');
    }
  } else {
    console.log('✅ Social Media Manager initialized');
    console.log('ℹ️ Scheduler not started (manual control)');
  }
  
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
