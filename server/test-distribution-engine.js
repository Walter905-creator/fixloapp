/**
 * Test script for Distribution Engine
 * 
 * Basic validation of distribution engine functionality
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Enable distribution engine for testing
process.env.DISTRIBUTION_ENGINE_ENABLED = 'true';

const distributionEngine = require('./services/distribution');
const config = require('./services/distribution/config');
const logger = require('./services/distribution/logger');

async function runTests() {
  console.log('🧪 Distribution Engine Test Suite\n');
  
  // Test 1: Configuration
  console.log('Test 1: Configuration Validation');
  try {
    console.log('✓ Distribution Engine Enabled:', config.DISTRIBUTION_ENGINE_ENABLED);
    console.log('✓ Services Available:', config.SERVICES.length);
    console.log('✓ Major Cities:', config.MAJOR_CITIES.length);
    console.log('✓ Rate Limits Configured:', config.RATE_LIMITS.maxPagesPerDay);
    console.log('Test 1: PASSED\n');
  } catch (error) {
    console.error('Test 1: FAILED', error.message);
    process.exit(1);
  }
  
  // Test 2: Initialization
  console.log('Test 2: Engine Initialization');
  try {
    const initialized = await distributionEngine.initialize();
    if (initialized) {
      console.log('✓ Engine initialized successfully');
      console.log('Test 2: PASSED\n');
    } else {
      throw new Error('Initialization returned false');
    }
  } catch (error) {
    console.error('Test 2: FAILED', error.message);
    process.exit(1);
  }
  
  // Test 3: Single Page Generation
  console.log('Test 3: Single Page Generation');
  try {
    const page = await distributionEngine.generatePage({
      service: 'plumbing',
      location: 'miami',
      variant: 'standard',
      language: 'en',
    });
    
    if (page && page.title && page.url) {
      console.log('✓ Page generated:', page.title);
      console.log('✓ URL:', page.url);
      console.log('✓ Content sections:', page.sections.length);
      console.log('✓ FAQ items:', page.faq.length);
      console.log('Test 3: PASSED\n');
    } else {
      throw new Error('Page generation failed');
    }
  } catch (error) {
    console.error('Test 3: FAILED', error.message);
    process.exit(1);
  }
  
  // Test 4: Status Report
  console.log('Test 4: Status Report');
  try {
    const status = distributionEngine.getStatus();
    console.log('✓ Engine Status:', status.enabled ? 'Enabled' : 'Disabled');
    console.log('✓ Pages Created:', status.metrics.pagesCreated);
    console.log('✓ Rate Limiter Status:', status.rateLimiter.dailyRemaining, 'remaining today');
    console.log('Test 4: PASSED\n');
  } catch (error) {
    console.error('Test 4: FAILED', error.message);
    process.exit(1);
  }
  
  // Test 5: Safety Guardrails
  console.log('Test 5: Safety Guardrails');
  try {
    // Check social echo auto-post is disabled
    if (config.SOCIAL_ECHO.autoPost === false) {
      console.log('✓ Social auto-post is disabled (safe)');
    } else {
      throw new Error('SAFETY VIOLATION: Auto-post is enabled');
    }
    
    // Check owned network requires manual approval
    if (config.OWNED_NETWORK.manualPublishOnly === true) {
      console.log('✓ Owned network requires manual approval (safe)');
    } else {
      throw new Error('SAFETY VIOLATION: Auto-publish is enabled');
    }
    
    console.log('Test 5: PASSED\n');
  } catch (error) {
    console.error('Test 5: FAILED', error.message);
    process.exit(1);
  }
  
  // Test 6: Content Quality Validation
  console.log('Test 6: Content Quality Validation');
  try {
    const contentGenerator = require('./services/distribution/contentGenerator');
    const content = contentGenerator.generatePageContent({
      service: 'electrical',
      location: 'new-york',
      variant: 'emergency',
      language: 'en',
    });
    
    if (content) {
      const fullText = contentGenerator.contentToText(content);
      const wordCount = contentGenerator.countWords(fullText);
      
      console.log('✓ Content generated');
      console.log('✓ Word count:', wordCount);
      console.log('✓ Meets minimum:', wordCount >= config.CONTENT_QUALITY.minWordCount);
      console.log('✓ FAQ items:', content.faq.length, '>=', config.CONTENT_QUALITY.minFAQItems);
      
      if (wordCount >= config.CONTENT_QUALITY.minWordCount) {
        console.log('Test 6: PASSED\n');
      } else {
        throw new Error('Content does not meet quality requirements');
      }
    } else {
      throw new Error('Content generation returned null');
    }
  } catch (error) {
    console.error('Test 6: FAILED', error.message);
    process.exit(1);
  }
  
  // Test 7: Rate Limiter
  console.log('Test 7: Rate Limiter');
  try {
    const rateLimiter = require('./services/distribution/rateLimiter');
    const canPublish = rateLimiter.canPublish('test/route');
    
    console.log('✓ Rate limiter operational');
    console.log('✓ Can publish:', canPublish);
    console.log('✓ Daily count:', rateLimiter.dailyCount);
    console.log('Test 7: PASSED\n');
  } catch (error) {
    console.error('Test 7: FAILED', error.message);
    process.exit(1);
  }
  
  // Test 8: Monitor
  console.log('Test 8: Monitor');
  try {
    const monitor = require('./services/distribution/monitor');
    const metrics = monitor.getMetrics();
    
    console.log('✓ Monitor operational');
    console.log('✓ Pages created:', metrics.pagesCreated);
    console.log('✓ Slowdown active:', metrics.slowdownActive);
    console.log('✓ Pause active:', metrics.pauseActive);
    console.log('Test 8: PASSED\n');
  } catch (error) {
    console.error('Test 8: FAILED', error.message);
    process.exit(1);
  }
  
  console.log('✅ All tests passed!');
  console.log('\nDistribution Engine is ready for use.');
  console.log('Remember to set DISTRIBUTION_ENGINE_ENABLED=true in .env to enable in production.\n');
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
