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
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🚀 Starting weekly SEO agent run...`);
  console.log(`[${timestamp}] [SEO][WEEKLY] Running autonomous learning loop`);
  const startTime = Date.now();
  
  try {
    // Step 1: Evaluate performance
    console.log(`\n[${timestamp}] 📍 Step 1: Evaluating weekly performance`);
    console.log(`[${timestamp}] [SEO][WEEKLY] Reading stored performance data from daily runs...`);
    const report = await evaluateWeekly();
    
    console.log(`[${timestamp}] [SEO][WEEKLY] ✅ Performance data loaded`);
    console.log(`[${timestamp}] 📊 Evaluation summary:`);
    console.log(`   Total pages analyzed: ${report.totalPages}`);
    console.log(`   Winners: ${report.winners}`);
    console.log(`   Losers: ${report.losers}`);
    console.log(`   Average CTR change: ${(report.avgCTRChange * 100).toFixed(2)}%`);
    
    // Step 2: Extract patterns
    const timestamp2 = new Date().toISOString();
    console.log(`\n[${timestamp2}] 📍 Step 2: Extracting winning patterns`);
    console.log(`[${timestamp2}] [SEO][WEEKLY] Analyzing top performers for patterns...`);
    const patterns = await extractPatterns(report);
    
    console.log(`[${timestamp2}] [SEO][WEEKLY] ✅ Pattern extraction complete`);
    console.log(`[${timestamp2}] 🔍 Patterns detected: ${patterns.winners.length}`);
    
    if (patterns.winners.length > 0) {
      console.log(`[${timestamp2}] [SEO][WEEKLY] Winning patterns identified:`);
      patterns.winners.forEach(w => {
        console.log(`   - ${w.pattern}: CTR ${(w.avgCTR * 100).toFixed(2)}%, Position ${w.avgPosition.toFixed(1)}, Impressions: ${w.totalImpressions}`);
        console.log(`     Target cities for expansion: ${w.targetCities.length} cities`);
      });
    } else {
      console.log(`[${timestamp2}] [SEO][WEEKLY] ℹ️ No winning patterns detected this week`);
    }
    
    // Step 3: Clone winners
    const timestamp3 = new Date().toISOString();
    console.log(`\n[${timestamp3}] 📍 Step 3: Deciding which patterns to clone`);
    const cloneDecisions = decideCloneWinners(patterns);
    
    console.log(`[${timestamp3}] [SEO][WEEKLY] Actions queued: ${cloneDecisions.length}`);
    
    if (cloneDecisions.length > 0) {
      console.log(`[${timestamp3}] [SEO][WEEKLY] Queued actions breakdown:`);
      const actionTypes = cloneDecisions.reduce((acc, d) => {
        const type = d.action || 'REPLICATION';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      Object.entries(actionTypes).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count}`);
      });
    }
    
    // Step 4: Execute cloning
    const timestamp4 = new Date().toISOString();
    console.log(`\n[${timestamp4}] 📍 Step 4: Executing pattern cloning`);
    console.log(`[${timestamp4}] [SEO][WEEKLY] Running autonomous replication...`);
    const results = await executeCloning(cloneDecisions);
    
    // Step 5: Log results
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const timestamp5 = new Date().toISOString();
    console.log(`\n[${timestamp5}] 📊 Weekly Report:`);
    console.log(`   Patterns cloned: ${results.success}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   Duration: ${duration}s`);
    
    console.log(`\n[${timestamp5}] [SEO][WEEKLY] ✅ Autonomous learning loop completed`);
    console.log(`[${timestamp5}] ✅ Weekly SEO agent run completed successfully`);
    
  } catch (error) {
    const errorTimestamp = new Date().toISOString();
    console.error(`\n[${errorTimestamp}] [SEO][WEEKLY] ❌ ERROR: Weekly SEO agent run failed | ${error.message}`);
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
