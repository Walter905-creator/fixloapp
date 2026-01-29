// Weekly SEO Agent Run
// Orchestrates weekly analysis and pattern learning

const { evaluateWeekly } = require('./learning/evaluateWeekly');
const { extractPatterns } = require('./learning/extractPatterns');
const { decideCloneWinners } = require('./decisions/decideCloneWinners');
const { createPage } = require('./actions/createPage');

/**
 * Get current timestamp in ISO format for logging
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Weekly SEO Agent Run
 * 
 * Flow:
 * 1. Evaluate past week's performance
 * 2. Extract winning patterns
 * 3. Clone successful patterns to new locations
 */
async function runWeekly() {
  console.log(`[${getTimestamp()}] 🚀 Starting weekly SEO agent run...`);
  console.log(`[${getTimestamp()}] [SEO][WEEKLY] Running autonomous learning loop`);
  const startTime = Date.now();
  
  try {
    // Step 1: Evaluate performance
    console.log(`\n[${getTimestamp()}] 📍 Step 1: Evaluating weekly performance`);
    console.log(`[${getTimestamp()}] [SEO][WEEKLY] Reading stored performance data from daily runs...`);
    const report = await evaluateWeekly();
    
    console.log(`[${getTimestamp()}] [SEO][WEEKLY] ✅ Performance data loaded`);
    console.log(`[${getTimestamp()}] 📊 Evaluation summary:`);
    console.log(`   Total pages analyzed: ${report.totalPages}`);
    console.log(`   Winners: ${report.winners}`);
    console.log(`   Losers: ${report.losers}`);
    console.log(`   Average CTR change: ${(report.avgCTRChange * 100).toFixed(2)}%`);
    
    // Step 2: Extract patterns
    console.log(`\n[${getTimestamp()}] 📍 Step 2: Extracting winning patterns`);
    console.log(`[${getTimestamp()}] [SEO][WEEKLY] Analyzing top performers for patterns...`);
    const patterns = await extractPatterns(report);
    
    console.log(`[${getTimestamp()}] [SEO][WEEKLY] ✅ Pattern extraction complete`);
    console.log(`[${getTimestamp()}] 🔍 Patterns detected: ${patterns.winners.length}`);
    
    if (patterns.winners.length > 0) {
      console.log(`[${getTimestamp()}] [SEO][WEEKLY] Winning patterns identified:`);
      patterns.winners.forEach(w => {
        console.log(`   - ${w.pattern}: CTR ${(w.avgCTR * 100).toFixed(2)}%, Position ${w.avgPosition.toFixed(1)}, Impressions: ${w.totalImpressions}`);
        console.log(`     Target cities for expansion: ${w.targetCities.length} cities`);
      });
    } else {
      console.log(`[${getTimestamp()}] [SEO][WEEKLY] ℹ️ No winning patterns detected this week`);
    }
    
    // Step 3: Clone winners
    console.log(`\n[${getTimestamp()}] 📍 Step 3: Deciding which patterns to clone`);
    const cloneDecisions = decideCloneWinners(patterns);
    
    console.log(`[${getTimestamp()}] [SEO][WEEKLY] Actions queued: ${cloneDecisions.length}`);
    
    if (cloneDecisions.length > 0) {
      console.log(`[${getTimestamp()}] [SEO][WEEKLY] Queued actions breakdown:`);
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
    console.log(`\n[${getTimestamp()}] 📍 Step 4: Executing pattern cloning`);
    console.log(`[${getTimestamp()}] [SEO][WEEKLY] Running autonomous replication...`);
    const results = await executeCloning(cloneDecisions);
    
    // Step 5: Log results
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n[${getTimestamp()}] 📊 Weekly Report:`);
    console.log(`   Patterns cloned: ${results.success}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   Duration: ${duration}s`);
    
    console.log(`\n[${getTimestamp()}] [SEO][WEEKLY] ✅ Autonomous learning loop completed`);
    console.log(`[${getTimestamp()}] ✅ Weekly SEO agent run completed successfully`);
    
  } catch (error) {
    console.error(`\n[${getTimestamp()}] [SEO][WEEKLY] ❌ ERROR: Weekly SEO agent run failed | ${error.message}`);
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
