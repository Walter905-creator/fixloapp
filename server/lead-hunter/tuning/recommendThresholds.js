// Threshold Tuning - Analyze and Recommend Optimizations
// Reads SEO agent performance and proposes threshold adjustments

const { fetchSEOMetrics, aggregateMetricsByPage } = require('../ingestion/fetchSEOMetrics');
const seoThresholds = require('../../seo-agent/config/thresholds');

/**
 * Analyzes SEO agent performance and recommends threshold adjustments
 * @param {Object} options - Analysis options
 * @returns {Array} Array of recommendation objects
 */
async function recommendThresholds(options = {}) {
  const {
    days = 30,
    minSampleSize = 20,
  } = options;
  
  console.log(`🔬 Analyzing SEO performance (last ${days} days)...`);
  
  // Fetch metrics
  const metrics = await fetchSEOMetrics({ days });
  
  if (metrics.length < minSampleSize) {
    console.log(`⚠️ Insufficient data: ${metrics.length} records (need ${minSampleSize})`);
    return [];
  }
  
  const recommendations = [];
  
  // 1. Analyze CTR thresholds
  const ctrRecommendations = analyzeCTRThresholds(metrics);
  recommendations.push(...ctrRecommendations);
  
  // 2. Analyze position ranges
  const positionRecommendations = analyzePositionRanges(metrics);
  recommendations.push(...positionRecommendations);
  
  // 3. Analyze impression minimums
  const impressionRecommendations = analyzeImpressionThresholds(metrics);
  recommendations.push(...impressionRecommendations);
  
  console.log(`✅ Generated ${recommendations.length} tuning recommendations`);
  
  return recommendations;
}

/**
 * Analyzes CTR thresholds for optimization
 * @param {Array} metrics - SEO metrics
 * @returns {Array} CTR recommendations
 */
function analyzeCTRThresholds(metrics) {
  const recommendations = [];
  
  // Calculate actual CTR distribution
  const ctrs = metrics.map(m => m.ctr).sort((a, b) => a - b);
  const avgCTR = ctrs.reduce((sum, ctr) => sum + ctr, 0) / ctrs.length;
  const medianCTR = ctrs[Math.floor(ctrs.length / 2)];
  
  console.log(`📊 CTR Analysis: avg=${(avgCTR * 100).toFixed(2)}%, median=${(medianCTR * 100).toFixed(2)}%`);
  
  // Compare to current thresholds
  const currentLowCTR = seoThresholds.LOW_CTR_THRESHOLD;
  const currentMediumCTR = seoThresholds.MEDIUM_CTR_THRESHOLD;
  const currentHighCTR = seoThresholds.HIGH_CTR_THRESHOLD;
  
  // Recommendation: Low CTR threshold
  if (avgCTR < currentLowCTR * 0.8) {
    recommendations.push({
      type: 'CTR_THRESHOLD',
      threshold: 'LOW_CTR_THRESHOLD',
      currentValue: currentLowCTR,
      recommendedValue: Math.round(avgCTR * 0.8 * 1000) / 1000,
      reason: `Average CTR (${(avgCTR * 100).toFixed(2)}%) is significantly below current low threshold (${(currentLowCTR * 100).toFixed(2)}%)`,
      impact: 'More pages would be flagged for meta rewrite',
      confidence: 'MEDIUM',
    });
  }
  
  // Recommendation: High CTR threshold
  const topPerformers = ctrs.slice(Math.floor(ctrs.length * 0.9)); // Top 10%
  const avgTopCTR = topPerformers.reduce((sum, ctr) => sum + ctr, 0) / topPerformers.length;
  
  if (avgTopCTR > currentHighCTR * 1.2) {
    recommendations.push({
      type: 'CTR_THRESHOLD',
      threshold: 'HIGH_CTR_THRESHOLD',
      currentValue: currentHighCTR,
      recommendedValue: Math.round(avgTopCTR * 0.9 * 1000) / 1000,
      reason: `Top performers average ${(avgTopCTR * 100).toFixed(2)}% CTR, well above current high threshold (${(currentHighCTR * 100).toFixed(2)}%)`,
      impact: 'Freeze protection applied to more high-performing pages',
      confidence: 'HIGH',
    });
  }
  
  return recommendations;
}

/**
 * Analyzes position range thresholds
 * @param {Array} metrics - SEO metrics
 * @returns {Array} Position recommendations
 */
function analyzePositionRanges(metrics) {
  const recommendations = [];
  
  // Group by position ranges
  const positionBuckets = {
    top3: [],
    top5: [],
    top10: [],
    top20: [],
    beyond20: [],
  };
  
  metrics.forEach(m => {
    if (m.position <= 3) positionBuckets.top3.push(m);
    else if (m.position <= 5) positionBuckets.top5.push(m);
    else if (m.position <= 10) positionBuckets.top10.push(m);
    else if (m.position <= 20) positionBuckets.top20.push(m);
    else positionBuckets.beyond20.push(m);
  });
  
  console.log('📊 Position Distribution:');
  console.log(`   Top 3: ${positionBuckets.top3.length}`);
  console.log(`   4-5: ${positionBuckets.top5.length}`);
  console.log(`   6-10: ${positionBuckets.top10.length}`);
  console.log(`   11-20: ${positionBuckets.top20.length}`);
  console.log(`   >20: ${positionBuckets.beyond20.length}`);
  
  // Analyze CTR by position
  const analyzeBucket = (bucket, name) => {
    if (bucket.length === 0) return null;
    const avgCTR = bucket.reduce((sum, m) => sum + m.ctr, 0) / bucket.length;
    return { name, count: bucket.length, avgCTR };
  };
  
  const bucketAnalysis = [
    analyzeBucket(positionBuckets.top3, 'Top 3'),
    analyzeBucket(positionBuckets.top5, '4-5'),
    analyzeBucket(positionBuckets.top10, '6-10'),
    analyzeBucket(positionBuckets.top20, '11-20'),
  ].filter(Boolean);
  
  // Recommendation: Adjust position ranges based on CTR performance
  const top10CTR = positionBuckets.top10.length > 0
    ? positionBuckets.top10.reduce((sum, m) => sum + m.ctr, 0) / positionBuckets.top10.length
    : 0;
  
  if (top10CTR > seoThresholds.HIGH_CTR_THRESHOLD && positionBuckets.top10.length >= 10) {
    recommendations.push({
      type: 'POSITION_RANGE',
      threshold: 'EXPAND_POSITION_RANGE',
      currentValue: { min: 1, max: 10 },
      recommendedValue: { min: 1, max: 15 },
      reason: `Top 10 positions showing strong CTR (${(top10CTR * 100).toFixed(2)}%), consider expanding content for positions 11-15`,
      impact: 'More pages eligible for content expansion',
      confidence: 'MEDIUM',
    });
  }
  
  return recommendations;
}

/**
 * Analyzes impression threshold optimization
 * @param {Array} metrics - SEO metrics
 * @returns {Array} Impression recommendations
 */
function analyzeImpressionThresholds(metrics) {
  const recommendations = [];
  
  // Analyze conversion correlation with impressions
  // Group by impression ranges
  const impressionBuckets = {
    low: metrics.filter(m => m.impressions < 100),
    medium: metrics.filter(m => m.impressions >= 100 && m.impressions < 500),
    high: metrics.filter(m => m.impressions >= 500),
  };
  
  console.log('📊 Impression Distribution:');
  console.log(`   < 100: ${impressionBuckets.low.length}`);
  console.log(`   100-499: ${impressionBuckets.medium.length}`);
  console.log(`   >= 500: ${impressionBuckets.high.length}`);
  
  // Calculate average CTR by bucket
  const lowCTR = impressionBuckets.low.length > 0
    ? impressionBuckets.low.reduce((sum, m) => sum + m.ctr, 0) / impressionBuckets.low.length
    : 0;
  
  const mediumCTR = impressionBuckets.medium.length > 0
    ? impressionBuckets.medium.reduce((sum, m) => sum + m.ctr, 0) / impressionBuckets.medium.length
    : 0;
  
  const highCTR = impressionBuckets.high.length > 0
    ? impressionBuckets.high.reduce((sum, m) => sum + m.ctr, 0) / impressionBuckets.high.length
    : 0;
  
  // Recommendation: If low-impression pages perform well, lower threshold
  if (lowCTR > mediumCTR && impressionBuckets.low.length >= 10) {
    recommendations.push({
      type: 'IMPRESSION_THRESHOLD',
      threshold: 'MIN_IMPRESSIONS_CREATE',
      currentValue: seoThresholds.MIN_IMPRESSIONS_CREATE,
      recommendedValue: 50,
      reason: `Low-impression pages (<100) showing strong CTR (${(lowCTR * 100).toFixed(2)}% vs ${(mediumCTR * 100).toFixed(2)}%), consider lowering threshold`,
      impact: 'More opportunities will be eligible for page creation',
      confidence: 'LOW',
    });
  }
  
  return recommendations;
}

/**
 * Generates a tuning report
 * @param {Array} recommendations - Recommendations
 * @returns {Object} Formatted report
 */
function generateTuningReport(recommendations) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: recommendations.length,
      byType: {},
      byConfidence: {},
    },
    recommendations,
  };
  
  // Count by type
  recommendations.forEach(rec => {
    report.summary.byType[rec.type] = (report.summary.byType[rec.type] || 0) + 1;
    report.summary.byConfidence[rec.confidence] = (report.summary.byConfidence[rec.confidence] || 0) + 1;
  });
  
  return report;
}

module.exports = {
  recommendThresholds,
  analyzeCTRThresholds,
  analyzePositionRanges,
  analyzeImpressionThresholds,
  generateTuningReport,
};
