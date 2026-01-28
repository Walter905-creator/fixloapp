// Weekly Performance Evaluation
// Analyzes past week's SEO performance

const { fetchGSC } = require('../ingestion/fetchGSC');
const thresholds = require('../config/thresholds');

/**
 * Evaluates weekly performance of all pages
 * @returns {Promise<Object>} Evaluation report
 */
async function evaluateWeekly() {
  console.log('📊 Evaluating weekly performance...');
  
  try {
    // Fetch data for current week and previous week
    const currentWeekData = await fetchGSC({ days: 7 });
    const previousWeekData = await fetchGSC({ days: 14 }); // Last 14 days to get previous week
    
    // Group by page (service + city)
    const pagePerformance = {};
    
    // Process current week
    currentWeekData.forEach(query => {
      const pageKey = `${query.service}:${query.city}`;
      if (!pagePerformance[pageKey]) {
        pagePerformance[pageKey] = {
          service: query.service,
          city: query.city,
          current: { impressions: 0, clicks: 0, ctr: 0, position: 0, count: 0 },
          previous: { impressions: 0, clicks: 0, ctr: 0, position: 0, count: 0 },
        };
      }
      
      pagePerformance[pageKey].current.impressions += query.impressions;
      pagePerformance[pageKey].current.clicks += query.clicks;
      pagePerformance[pageKey].current.position += query.position;
      pagePerformance[pageKey].current.count++;
    });
    
    // Calculate averages for current week
    Object.values(pagePerformance).forEach(page => {
      if (page.current.count > 0) {
        page.current.ctr = page.current.clicks / page.current.impressions;
        page.current.position = page.current.position / page.current.count;
      }
    });
    
    // Analyze performance
    const report = {
      totalPages: Object.keys(pagePerformance).length,
      winners: 0,
      losers: 0,
      stable: 0,
      avgCTRChange: 0,
      topPerformers: [],
      underperformers: [],
      pages: pagePerformance,
    };
    
    let totalCTRChange = 0;
    
    Object.values(pagePerformance).forEach(page => {
      const ctrChange = page.current.ctr - (page.previous.ctr || page.current.ctr);
      totalCTRChange += ctrChange;
      
      // Classify performance
      if (ctrChange > 0.01) { // CTR improved by more than 1%
        report.winners++;
        if (page.current.ctr >= thresholds.HIGH_CTR_THRESHOLD) {
          report.topPerformers.push(page);
        }
      } else if (ctrChange < -0.01) { // CTR dropped by more than 1%
        report.losers++;
        report.underperformers.push(page);
      } else {
        report.stable++;
      }
    });
    
    report.avgCTRChange = totalCTRChange / report.totalPages || 0;
    
    // Sort top performers by CTR
    report.topPerformers.sort((a, b) => b.current.ctr - a.current.ctr);
    report.topPerformers = report.topPerformers.slice(0, 10); // Top 10
    
    console.log(`✅ Evaluation complete: ${report.winners} winners, ${report.losers} losers, ${report.stable} stable`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Weekly evaluation failed:', error.message);
    throw error;
  }
}

module.exports = {
  evaluateWeekly,
};
