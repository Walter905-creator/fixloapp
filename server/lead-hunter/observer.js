// Observer Mode - Intelligence Gathering Only
// Read-only, idempotent, safe by default

const { fetchCompetitors, filterCompetitorData } = require('./ingestion/fetchCompetitors');
const { fetchMarketGaps } = require('./ingestion/fetchMarketGaps');
const { fetchFixloPages } = require('./ingestion/fetchSEOMetrics');
const { scoreOpportunities, filterByScore } = require('./analysis/scoreOpportunities');
const { log, logOpportunities } = require('./utils/logger');
const limits = require('./config/limits');

/**
 * Runs Observer Mode
 * Gathers intelligence and logs opportunities (NO EXECUTION)
 */
async function runObserver() {
  console.log('🎯 Lead Hunter starting in OBSERVER mode...');
  console.log('📖 Mode: Read-only intelligence gathering');
  const startTime = Date.now();
  
  try {
    // Step 1: Fetch competitor data
    console.log('\n📍 Step 1: Fetching competitor data');
    const competitorData = await fetchCompetitors({
      useMockData: true, // Always use mock data for safety
    });
    
    log.info('observer', `Fetched ${competitorData.length} competitor rankings`);
    
    // Step 2: Fetch existing Fixlo pages
    console.log('\n📍 Step 2: Fetching existing Fixlo pages');
    const existingPages = await fetchFixloPages();
    
    log.info('observer', `Found ${existingPages.size} existing pages`);
    
    // Step 3: Identify market gaps
    console.log('\n📍 Step 3: Identifying market gaps');
    const gaps = await fetchMarketGaps(competitorData, existingPages);
    
    log.info('observer', `Identified ${gaps.length} market gaps`);
    
    // Step 4: Score and prioritize opportunities
    console.log('\n📍 Step 4: Scoring opportunities');
    const scoredOpportunities = scoreOpportunities(gaps);
    
    // Step 5: Filter by minimum score
    const minLogScore = limits.OBSERVER_MODE.MIN_LOG_SCORE;
    const filteredOpportunities = filterByScore(scoredOpportunities, minLogScore);
    
    console.log(`\n📊 Results: ${filteredOpportunities.length} opportunities (score >= ${minLogScore})`);
    
    // Step 6: Log opportunities
    console.log('\n📍 Step 5: Logging opportunities');
    logOpportunities(filteredOpportunities, 'observer');
    
    // Step 7: Display summary
    displayObserverSummary(filteredOpportunities);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️ Observer run completed in ${duration}s`);
    log.success('observer', `Run completed in ${duration}s, logged ${filteredOpportunities.length} opportunities`);
    
    return {
      success: true,
      opportunities: filteredOpportunities,
      duration,
    };
    
  } catch (error) {
    log.error('observer', 'Observer run failed', error);
    throw error;
  }
}

/**
 * Displays observer mode summary
 * @param {Array} opportunities - Filtered opportunities
 */
function displayObserverSummary(opportunities) {
  console.log('\n📊 Observer Mode Summary');
  console.log('═══════════════════════════════════════');
  
  // Count by priority
  const priorityCounts = {
    HIGH: opportunities.filter(o => o.priority === 'HIGH').length,
    MEDIUM: opportunities.filter(o => o.priority === 'MEDIUM').length,
    LOW: opportunities.filter(o => o.priority === 'LOW').length,
  };
  
  console.log(`\n🎯 Opportunities by Priority:`);
  console.log(`   HIGH:   ${priorityCounts.HIGH} (score >= 80)`);
  console.log(`   MEDIUM: ${priorityCounts.MEDIUM} (score 60-79)`);
  console.log(`   LOW:    ${priorityCounts.LOW} (score 40-59)`);
  
  // Top opportunities
  const top5 = opportunities.slice(0, 5);
  if (top5.length > 0) {
    console.log(`\n🏆 Top 5 Opportunities:`);
    top5.forEach((opp, i) => {
      console.log(`   ${i + 1}. ${opp.service} in ${opp.city}, ${opp.state} (score: ${opp.score})`);
    });
  }
  
  // Count by state
  const stateCounts = {};
  opportunities.forEach(opp => {
    stateCounts[opp.state] = (stateCounts[opp.state] || 0) + 1;
  });
  
  console.log(`\n📍 Opportunities by State:`);
  Object.entries(stateCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([state, count]) => {
      console.log(`   ${state}: ${count}`);
    });
  
  // Count by service
  const serviceCounts = {};
  opportunities.forEach(opp => {
    serviceCounts[opp.service] = (serviceCounts[opp.service] || 0) + 1;
  });
  
  console.log(`\n🔧 Opportunities by Service:`);
  Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([service, count]) => {
      console.log(`   ${service}: ${count}`);
    });
  
  console.log('\n═══════════════════════════════════════');
  console.log('✅ Observer mode complete - NO ACTIONS TAKEN');
  console.log('📄 Opportunities logged to file for review');
}

module.exports = {
  runObserver,
};

// Execute when run directly
if (require.main === module) {
  runObserver()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Observer mode failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}
