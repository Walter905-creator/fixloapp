// Tuning Mode - Threshold Optimization Recommendations
// Analyzes SEO agent performance and proposes tuning

const { recommendThresholds, generateTuningReport } = require('./tuning/recommendThresholds');
const { log, logTuningRecommendations } = require('./utils/logger');
const limits = require('./config/limits');

/**
 * Runs Tuning Mode
 * Analyzes SEO performance and recommends threshold adjustments
 */
async function runTuning(options = {}) {
  const {
    days = 30,
  } = options;
  
  console.log('🎯 Lead Hunter starting in TUNING mode...');
  console.log('🔬 Mode: Analyze performance and recommend threshold optimizations');
  const startTime = Date.now();
  
  try {
    // Step 1: Analyze performance
    console.log(`\n📍 Step 1: Analyzing SEO performance (last ${days} days)`);
    const recommendations = await recommendThresholds({
      days,
      minSampleSize: limits.TUNING_MODE.MIN_SAMPLE_SIZE,
    });
    
    if (recommendations.length === 0) {
      console.log('ℹ️ No threshold adjustments recommended at this time');
      log.info('tuning', 'No recommendations generated - current thresholds appear optimal');
      return {
        success: true,
        recommendations: [],
      };
    }
    
    log.info('tuning', `Generated ${recommendations.length} recommendations`);
    
    // Step 2: Generate report
    console.log('\n📍 Step 2: Generating tuning report');
    const report = generateTuningReport(recommendations);
    
    // Step 3: Log recommendations
    console.log('\n📍 Step 3: Logging recommendations');
    logTuningRecommendations(recommendations);
    
    // Step 4: Display recommendations
    displayTuningRecommendations(recommendations);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️ Tuning run completed in ${duration}s`);
    log.success('tuning', `Run completed in ${duration}s, ${recommendations.length} recommendations logged`);
    
    return {
      success: true,
      recommendations,
      report,
      duration,
    };
    
  } catch (error) {
    log.error('tuning', 'Tuning mode failed', error);
    throw error;
  }
}

/**
 * Displays tuning recommendations
 * @param {Array} recommendations - Array of recommendations
 */
function displayTuningRecommendations(recommendations) {
  console.log('\n📊 Threshold Tuning Recommendations');
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Group by confidence
  const byConfidence = {
    HIGH: recommendations.filter(r => r.confidence === 'HIGH'),
    MEDIUM: recommendations.filter(r => r.confidence === 'MEDIUM'),
    LOW: recommendations.filter(r => r.confidence === 'LOW'),
  };
  
  console.log(`\n✅ HIGH Confidence (${byConfidence.HIGH.length}):`);
  byConfidence.HIGH.forEach((rec, i) => {
    displayRecommendation(rec, i + 1);
  });
  
  console.log(`\n⚠️ MEDIUM Confidence (${byConfidence.MEDIUM.length}):`);
  byConfidence.MEDIUM.forEach((rec, i) => {
    displayRecommendation(rec, i + 1);
  });
  
  console.log(`\nℹ️ LOW Confidence (${byConfidence.LOW.length}):`);
  byConfidence.LOW.forEach((rec, i) => {
    displayRecommendation(rec, i + 1);
  });
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('⚠️ IMPORTANT: These are recommendations only');
  console.log('📝 Manual review and testing required before applying changes');
  console.log('🔄 Update /server/seo-agent/config/thresholds.js to apply');
}

/**
 * Displays a single recommendation
 * @param {Object} rec - Recommendation object
 * @param {number} index - Index number
 */
function displayRecommendation(rec, index) {
  console.log(`\n   ${index}. ${rec.threshold}`);
  console.log(`      Type: ${rec.type}`);
  console.log(`      Current: ${formatValue(rec.currentValue)}`);
  console.log(`      Recommended: ${formatValue(rec.recommendedValue)}`);
  console.log(`      Reason: ${rec.reason}`);
  console.log(`      Impact: ${rec.impact}`);
}

/**
 * Formats a value for display
 * @param {*} value - Value to format
 * @returns {string} Formatted value
 */
function formatValue(value) {
  if (typeof value === 'number') {
    return value < 1 ? `${(value * 100).toFixed(2)}%` : value.toString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value.toString();
}

module.exports = {
  runTuning,
};

// Execute when run directly
if (require.main === module) {
  // Check for days argument
  const daysArg = process.argv.find(arg => arg.startsWith('--days='));
  const days = daysArg ? parseInt(daysArg.split('=')[1]) : 30;
  
  runTuning({ days })
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Tuning mode failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}
