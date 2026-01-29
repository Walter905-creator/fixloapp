// Daily SEO Agent Run
// Orchestrates daily SEO optimization tasks

const { checkKillSwitch, getRecentSEOStats } = require('./safety/killSwitch');
const { fetchGSC } = require('./ingestion/fetchGSC');
const { fetchFixloPages } = require('./ingestion/fetchFixloPages');
const { decideCreatePage } = require('./decisions/decideCreatePage');
const { decideRewriteMeta } = require('./decisions/decideRewriteMeta');
const { decideExpandContent } = require('./decisions/decideExpandContent');
const { decideFreezePage } = require('./decisions/decideFreezePage');
const { createPage } = require('./actions/createPage');
const { rewriteMeta } = require('./actions/rewriteMeta');
const { expandContent } = require('./actions/expandContent');
const { submitIndexing } = require('./actions/submitIndexing');

/**
 * Daily SEO Agent Run
 * 
 * Flow:
 * 1. Safety check (kill switch)
 * 2. Fetch data (GSC + existing pages)
 * 3. Make decisions (rule-based, NO LLM)
 * 4. Execute actions (LLM allowed for content only)
 * 5. Log results
 */
async function runDaily() {
  console.log('🚀 Starting daily SEO agent run...');
  const startTime = Date.now();
  
  try {
    // Step 1: Safety check
    console.log('\n📍 Step 1: Safety check');
    const metrics = await getRecentSEOStats();
    await checkKillSwitch(metrics);
    
    // Step 2: Fetch data
    console.log('\n📍 Step 2: Fetching data');
    const gscData = await fetchGSC({ days: 30 });
    const existingPages = await fetchFixloPages();
    
    console.log(`📊 Data summary: ${gscData.length} queries, ${existingPages.size} existing pages`);
    
    // Step 3: Make decisions (RULE-BASED ONLY)
    console.log('\n📍 Step 3: Making decisions');
    const decisions = [
      ...decideCreatePage(gscData, existingPages),
      ...decideRewriteMeta(gscData),
      ...decideExpandContent(gscData),
      ...decideFreezePage(gscData),
    ];
    
    console.log(`📋 Total decisions: ${decisions.length}`);
    logDecisionSummary(decisions);
    
    // Step 4: Execute actions
    console.log('\n📍 Step 4: Executing actions');
    const results = await executeDecisions(decisions);
    
    // Step 5: Log results
    console.log('\n📍 Step 5: Logging results');
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logFinalReport(results, duration);
    
    console.log('\n✅ Daily SEO agent run completed successfully');
    
  } catch (error) {
    console.error('\n❌ Daily SEO agent run failed:', error.message);
    throw error;
  }
}

/**
 * Execute all decisions sequentially
 */
async function executeDecisions(decisions) {
  const results = {
    total: decisions.length,
    success: 0,
    failed: 0,
    skipped: 0,
    details: [],
  };
  
  for (const decision of decisions) {
    try {
      let result;
      
      switch (decision.action) {
        case 'CREATE_PAGE':
          result = await createPage(decision);
          break;
        case 'REWRITE_META':
          result = await rewriteMeta(decision);
          break;
        case 'EXPAND_CONTENT':
          result = await expandContent(decision);
          break;
        case 'FREEZE_PAGE':
          // Freezing means we don't do anything to this page
          result = { success: true, frozen: true };
          console.log(`🧊 Frozen: ${decision.service} in ${decision.city} (${decision.reason})`);
          break;
        default:
          console.warn(`⚠️ Unknown action: ${decision.action}`);
          result = { success: false, error: 'Unknown action' };
      }
      
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
      }
      
      results.details.push({
        action: decision.action,
        service: decision.service,
        city: decision.city,
        success: result.success,
        result,
      });
      
    } catch (error) {
      console.error(`❌ Action failed: ${decision.action}`, error.message);
      results.failed++;
      results.details.push({
        action: decision.action,
        service: decision.service,
        city: decision.city,
        success: false,
        error: error.message,
      });
    }
  }
  
  return results;
}

/**
 * Log decision summary
 */
function logDecisionSummary(decisions) {
  const summary = {};
  decisions.forEach(d => {
    summary[d.action] = (summary[d.action] || 0) + 1;
  });
  
  console.log('📊 Decision breakdown:');
  Object.entries(summary).forEach(([action, count]) => {
    console.log(`   ${action}: ${count}`);
  });
}

/**
 * Log final report
 */
function logFinalReport(results, duration) {
  console.log('📊 Final Report:');
  console.log(`   Total decisions: ${results.total}`);
  console.log(`   ✅ Successful: ${results.success}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   ⏱️ Duration: ${duration}s`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed actions:');
    results.details
      .filter(d => !d.success)
      .forEach(d => {
        console.log(`   ${d.action}: ${d.service} in ${d.city} - ${d.error || 'Unknown error'}`);
      });
  }
}

module.exports = {
  runDaily,
};

// Execute when run directly
if (require.main === module) {
  runDaily()
    .then(() => {
      console.log('✅ Daily SEO agent run completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ SEO Agent failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}
