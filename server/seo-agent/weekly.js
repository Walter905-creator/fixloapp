// Weekly SEO Agent Run
// Orchestrates weekly analysis and pattern learning

const { evaluateWeekly } = require('./learning/evaluateWeekly');
const { extractPatterns } = require('./learning/extractPatterns');
const { decideCloneWinners } = require('./decisions/decideCloneWinners');
const { createPage } = require('./actions/createPage');

/**
 * Weekly SEO Agent Run
 * 
 * Flow:
 * 1. Evaluate past week's performance
 * 2. Extract winning patterns
 * 3. Clone successful patterns to new locations
 */
async function runWeekly() {
  console.log('🚀 Starting weekly SEO agent run...');
  const startTime = Date.now();
  
  try {
    // Step 1: Evaluate performance
    console.log('\n📍 Step 1: Evaluating weekly performance');
    const report = await evaluateWeekly();
    
    console.log(`📊 Evaluation summary:`);
    console.log(`   Total pages analyzed: ${report.totalPages}`);
    console.log(`   Winners: ${report.winners}`);
    console.log(`   Losers: ${report.losers}`);
    console.log(`   Average CTR change: ${(report.avgCTRChange * 100).toFixed(2)}%`);
    
    // Step 2: Extract patterns
    console.log('\n📍 Step 2: Extracting winning patterns');
    const patterns = await extractPatterns(report);
    
    console.log(`🔍 Patterns found: ${patterns.winners.length}`);
    patterns.winners.forEach(w => {
      console.log(`   ${w.pattern}: CTR ${(w.avgCTR * 100).toFixed(2)}%, Position ${w.avgPosition.toFixed(1)}`);
    });
    
    // Step 3: Clone winners
    console.log('\n📍 Step 3: Deciding which patterns to clone');
    const cloneDecisions = decideCloneWinners(patterns);
    
    console.log(`📋 Clone decisions: ${cloneDecisions.length}`);
    
    // Step 4: Execute cloning
    console.log('\n📍 Step 4: Executing pattern cloning');
    const results = await executeCloning(cloneDecisions);
    
    // Step 5: Log results
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n📊 Weekly Report:');
    console.log(`   Patterns cloned: ${results.success}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   Duration: ${duration}s`);
    
    console.log('\n✅ Weekly SEO agent run completed successfully');
    
  } catch (error) {
    console.error('\n❌ Weekly SEO agent run failed:', error.message);
    throw error;
  }
}

/**
 * Execute pattern cloning
 */
async function executeCloning(decisions) {
  const results = {
    total: decisions.length,
    success: 0,
    failed: 0,
    details: [],
  };
  
  for (const decision of decisions) {
    try {
      // Clone using the same createPage action
      const result = await createPage(decision);
      
      if (result.success) {
        results.success++;
        console.log(`✅ Cloned winner to: ${result.slug}`);
      } else {
        results.failed++;
      }
      
      results.details.push({
        service: decision.service,
        city: decision.city,
        pattern: decision.sourcePattern,
        success: result.success,
      });
      
    } catch (error) {
      console.error(`❌ Clone failed: ${decision.service} in ${decision.city}`, error.message);
      results.failed++;
      results.details.push({
        service: decision.service,
        city: decision.city,
        pattern: decision.sourcePattern,
        success: false,
        error: error.message,
      });
    }
  }
  
  return results;
}

module.exports = {
  runWeekly,
};

// Execute when run directly
if (require.main === module) {
  runWeekly()
    .then(() => {
      console.log('✅ Weekly SEO agent run completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ SEO Agent failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}
