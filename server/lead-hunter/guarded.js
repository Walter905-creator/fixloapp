// Guarded Execution Mode - Feed SEO Agent Safely
// Proposes opportunities with strict safety controls

const { readRecentOpportunities } = require('./utils/logger');
const { feedOpportunities } = require('./integration/feedOpportunity');
const { filterByScore, getTopOpportunities } = require('./analysis/scoreOpportunities');
const { log } = require('./utils/logger');
const { getRateLimitStatus } = require('./safety/rateLimiter');
const limits = require('./config/limits');

/**
 * Runs Guarded Execution Mode
 * Feeds high-priority opportunities to SEO agent with safety controls
 */
async function runGuarded(options = {}) {
  const {
    dryRun = false,
  } = options;
  
  console.log('🎯 Lead Hunter starting in GUARDED mode...');
  console.log('🛡️ Mode: Feed opportunities to SEO agent with safety controls');
  
  if (dryRun) {
    console.log('🧪 DRY RUN: No proposals will be written');
  }
  
  const startTime = Date.now();
  
  try {
    // Step 1: Validate mode is enabled
    console.log('\n📍 Step 1: Validating guarded mode');
    validateGuardedMode();
    
    // Step 2: Check rate limits
    console.log('\n📍 Step 2: Checking rate limits');
    displayRateLimitStatus();
    
    // Step 3: Read opportunities from observer mode
    console.log('\n📍 Step 3: Reading opportunities from observer mode');
    const opportunities = readRecentOpportunities();
    
    if (opportunities.length === 0) {
      console.log('⚠️ No opportunities found. Run observer mode first.');
      log.warning('guarded', 'No opportunities found from observer mode');
      return {
        success: true,
        fed: 0,
        reason: 'No opportunities available',
      };
    }
    
    log.info('guarded', `Loaded ${opportunities.length} opportunities from observer mode`);
    
    // Step 4: Filter by minimum score
    const minScore = parseInt(process.env.LEAD_HUNTER_MIN_OPPORTUNITY_SCORE || '60');
    const filtered = filterByScore(opportunities, minScore);
    
    console.log(`📊 Filtered to ${filtered.length} opportunities (score >= ${minScore})`);
    
    if (filtered.length === 0) {
      console.log('⚠️ No opportunities meet minimum score threshold');
      return {
        success: true,
        fed: 0,
        reason: 'No opportunities meet score threshold',
      };
    }
    
    // Step 5: Get top opportunities
    const maxPerRun = limits.GUARDED_MODE.MAX_PROPOSALS_PER_RUN;
    const topOpportunities = getTopOpportunities(filtered, maxPerRun);
    
    console.log(`\n🎯 Selected top ${topOpportunities.length} opportunities to feed`);
    
    // Step 6: Feed opportunities to SEO agent
    console.log('\n📍 Step 4: Feeding opportunities to SEO agent');
    const results = await feedOpportunities(topOpportunities, {
      maxPerBatch: maxPerRun,
      dryRun,
    });
    
    // Step 7: Display results
    displayGuardedSummary(results);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️ Guarded run completed in ${duration}s`);
    log.success('guarded', `Run completed in ${duration}s, fed ${results.fed} proposals`);
    
    return {
      success: true,
      ...results,
      duration,
    };
    
  } catch (error) {
    log.error('guarded', 'Guarded mode failed', error);
    throw error;
  }
}

/**
 * Validates guarded mode is properly configured
 */
function validateGuardedMode() {
  const mode = process.env.LEAD_HUNTER_MODE;
  
  if (mode !== 'guarded') {
    throw new Error(
      '🚨 Guarded mode requires explicit opt-in via LEAD_HUNTER_MODE=guarded environment variable'
    );
  }
  
  console.log('✅ Guarded mode explicitly enabled via LEAD_HUNTER_MODE=guarded');
  log.info('guarded', 'Mode validated: explicit opt-in confirmed');
}

/**
 * Displays current rate limit status
 */
function displayRateLimitStatus() {
  const status = getRateLimitStatus();
  
  console.log('📊 Rate Limit Status:');
  console.log(`   Proposals today: ${status.proposals.day}/${status.proposals.maxDay}`);
  
  if (status.proposals.day >= status.proposals.maxDay) {
    throw new Error(
      `🚨 Daily proposal limit reached (${status.proposals.maxDay}). Try again tomorrow.`
    );
  }
  
  const remaining = status.proposals.maxDay - status.proposals.day;
  console.log(`✅ Remaining proposals today: ${remaining}`);
}

/**
 * Displays guarded mode summary
 * @param {Object} results - Feed results
 */
function displayGuardedSummary(results) {
  console.log('\n📊 Guarded Mode Summary');
  console.log('═══════════════════════════════════════');
  console.log(`   Total opportunities: ${results.total}`);
  console.log(`   ✅ Fed to SEO agent: ${results.fed}`);
  console.log(`   ⏭️ Skipped: ${results.skipped}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  
  if (results.details.length > 0) {
    console.log(`\n📋 Details:`);
    results.details.slice(0, 10).forEach((detail, i) => {
      console.log(`   ${i + 1}. ${detail.opportunity} (score: ${detail.score}) - ${detail.result}`);
    });
  }
  
  console.log('\n═══════════════════════════════════════');
  console.log('✅ Guarded mode complete');
  console.log('ℹ️ SEO agent will evaluate proposals and decide whether to act');
}

module.exports = {
  runGuarded,
};

// Execute when run directly
if (require.main === module) {
  // Check for dry run flag
  const dryRun = process.argv.includes('--dry-run');
  
  runGuarded({ dryRun })
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Guarded mode failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}
