const GSCPageDaily = require('../../models/GSCPageDaily');
const GSCQueryDaily = require('../../models/GSCQueryDaily');
const SEOPageMapping = require('../../models/SEOPageMapping');
const SEOAgentAction = require('../../models/SEOAgentAction');
const {
  MIN_IMPRESSIONS_CREATE,
  MIN_IMPRESSIONS_CTR_TEST,
  CTR_BENCHMARK_BY_POSITION,
  PAGE_DEAD_DAYS,
  PAGE_CREATE_POSITION_MIN,
  PAGE_CREATE_POSITION_MAX,
  CONTENT_EXPAND_POSITION_MIN,
  CONTENT_EXPAND_POSITION_MAX,
  CLICKS_TREND_THRESHOLD,
  MAX_BOUNCE_RATE_EXPANSION,
  MAX_PAGES_PER_DAY,
  MAX_META_REWRITES_PER_DAY,
  MIN_DAYS_BETWEEN_OPTIMIZATIONS,
  WINNING_PATTERN_THRESHOLD
} = require('../../config/seoAgentConstants');

/**
 * SEO Decision Engine - THE BRAIN
 * 
 * IMPORTANT: NO LLM ALLOWED HERE
 * This is pure logic-based decision making
 * 
 * The decision engine analyzes GSC data and decides:
 * - When to create pages
 * - When to rewrite meta tags
 * - When to expand content
 * - When to freeze/kill pages
 * - When to clone winning patterns
 */
class DecisionEngine {
  constructor() {
    this.decisions = [];
  }

  /**
   * Run all decision checks
   * Returns array of decisions to be executed
   */
  async runAllDecisions() {
    console.log('🧠 Running SEO Decision Engine...');
    
    this.decisions = [];

    // Check rate limits first
    const canCreate = await this.checkRateLimit('CREATE_PAGE', MAX_PAGES_PER_DAY);
    const canRewrite = await this.checkRateLimit('REWRITE_META', MAX_META_REWRITES_PER_DAY);

    // Run decision checks
    if (canCreate) {
      await this.checkPageCreation();
    } else {
      console.log('⚠️ Page creation rate limit reached for today');
    }

    if (canRewrite) {
      await this.checkMetaRewrite();
    } else {
      console.log('⚠️ Meta rewrite rate limit reached for today');
    }

    await this.checkContentExpansion();
    await this.checkPageFreeze();

    console.log(`✅ Decision engine complete. ${this.decisions.length} decisions made.`);
    return this.decisions;
  }

  /**
   * Task 2.1 — Page Creation Decision
   * 
   * Create a page ONLY if:
   * - Query impressions ≥ MIN_IMPRESSIONS_CREATE
   * - Avg position between 8–30
   * - No dedicated page exists
   */
  async checkPageCreation() {
    console.log('📊 Checking page creation opportunities...');

    // Find queries with high impressions but no dedicated page
    const opportunities = await GSCQueryDaily.findOpportunities(
      MIN_IMPRESSIONS_CREATE,
      PAGE_CREATE_POSITION_MIN,
      PAGE_CREATE_POSITION_MAX
    );

    for (const opp of opportunities) {
      // Check if we already have a page for this query
      const parsed = this.parseQueryForServiceCity(opp._id);
      
      if (!parsed.service || !parsed.city) {
        continue; // Can't create page without service + city
      }

      // Check if page already exists
      const existingPage = await SEOPageMapping.findOne({
        service: parsed.service,
        city: parsed.city
      });

      if (existingPage) {
        continue; // Page already exists
      }

      // Check rate limit
      const todayCount = await SEOAgentAction.getTodayActionCount('CREATE_PAGE');
      if (todayCount >= MAX_PAGES_PER_DAY) {
        break; // Rate limit reached
      }

      // Decision: CREATE PAGE
      const decision = {
        actionType: 'CREATE_PAGE',
        service: parsed.service,
        city: parsed.city,
        state: parsed.state,
        reason: `High impressions (${opp.totalImpressions}), avg position ${opp.avgPosition.toFixed(1)}, no dedicated page`,
        inputData: {
          impressions: opp.totalImpressions,
          clicks: opp.totalClicks,
          position: opp.avgPosition
        }
      };

      this.decisions.push(decision);
      console.log(`✅ Decision: CREATE_PAGE for ${parsed.service} in ${parsed.city}`);
    }
  }

  /**
   * Task 2.2 — Title & Meta Rewrite Decision
   * 
   * Trigger ONLY if:
   * - Impressions ≥ MIN_IMPRESSIONS_CTR_TEST
   * - CTR < benchmark for position
   */
  async checkMetaRewrite() {
    console.log('📊 Checking meta rewrite opportunities...');

    // Get recent page performance
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7); // Last 7 days

    const pages = await GSCPageDaily.aggregate([
      {
        $match: {
          date: { $gte: recentDate },
          impressions: { $gte: MIN_IMPRESSIONS_CTR_TEST }
        }
      },
      {
        $group: {
          _id: '$page',
          avgImpressions: { $avg: '$impressions' },
          avgClicks: { $avg: '$clicks' },
          avgCtr: { $avg: '$ctr' },
          avgPosition: { $avg: '$position' }
        }
      }
    ]);

    for (const page of pages) {
      const position = Math.round(page.avgPosition);
      const benchmarkCtr = this.getCtrBenchmark(position);

      // Check if CTR is below benchmark
      if (page.avgCtr >= benchmarkCtr) {
        continue; // CTR is good
      }

      // Check if page was recently optimized
      const mapping = await SEOPageMapping.findOne({ url: page._id });
      if (mapping && mapping.agentActivity.lastOptimizedAt) {
        const daysSinceOptimization = (Date.now() - mapping.agentActivity.lastOptimizedAt) / (1000 * 60 * 60 * 24);
        if (daysSinceOptimization < MIN_DAYS_BETWEEN_OPTIMIZATIONS) {
          continue; // Too soon to re-optimize
        }
      }

      // Check rate limit
      const todayCount = await SEOAgentAction.getTodayActionCount('REWRITE_META');
      if (todayCount >= MAX_META_REWRITES_PER_DAY) {
        break; // Rate limit reached
      }

      // Decision: REWRITE META
      const decision = {
        actionType: 'REWRITE_META',
        url: page._id,
        reason: `CTR ${(page.avgCtr * 100).toFixed(2)}% below benchmark ${(benchmarkCtr * 100).toFixed(2)}% for position ${position}`,
        inputData: {
          impressions: page.avgImpressions,
          clicks: page.avgClicks,
          ctr: page.avgCtr,
          position: page.avgPosition
        },
        beforeMetrics: {
          impressions: page.avgImpressions,
          clicks: page.avgClicks,
          ctr: page.avgCtr,
          position: page.avgPosition,
          capturedAt: new Date()
        }
      };

      this.decisions.push(decision);
      console.log(`✅ Decision: REWRITE_META for ${page._id}`);
    }
  }

  /**
   * Task 2.3 — Content Expansion Decision
   * 
   * Trigger ONLY if:
   * - Avg position 4–15
   * - Clicks trending up
   * - Bounce rate below threshold (if available)
   */
  async checkContentExpansion() {
    console.log('📊 Checking content expansion opportunities...');

    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);

    const pages = await GSCPageDaily.aggregate([
      {
        $match: {
          date: { $gte: recentDate },
          position: { $gte: CONTENT_EXPAND_POSITION_MIN, $lte: CONTENT_EXPAND_POSITION_MAX }
        }
      },
      {
        $group: {
          _id: '$page',
          avgPosition: { $avg: '$position' },
          avgClicks: { $avg: '$clicks' }
        }
      }
    ]);

    for (const page of pages) {
      // Calculate trend
      const trend = await GSCPageDaily.calculateTrend(page._id, 7);

      if (!trend || trend < CLICKS_TREND_THRESHOLD) {
        continue; // No upward trend
      }

      // Check if recently optimized
      const mapping = await SEOPageMapping.findOne({ url: page._id });
      if (mapping && mapping.agentActivity.lastOptimizedAt) {
        const daysSinceOptimization = (Date.now() - mapping.agentActivity.lastOptimizedAt) / (1000 * 60 * 60 * 24);
        if (daysSinceOptimization < MIN_DAYS_BETWEEN_OPTIMIZATIONS) {
          continue;
        }
      }

      // Decision: EXPAND CONTENT
      const decision = {
        actionType: 'EXPAND_CONTENT',
        url: page._id,
        reason: `Position ${page.avgPosition.toFixed(1)}, clicks trending up ${(trend * 100).toFixed(1)}%`,
        inputData: {
          position: page.avgPosition,
          trend: trend
        }
      };

      this.decisions.push(decision);
      console.log(`✅ Decision: EXPAND_CONTENT for ${page._id}`);
    }
  }

  /**
   * Task 2.4 — Page Freeze / Kill Decision
   * 
   * Trigger if:
   * - Indexed ≥ PAGE_DEAD_DAYS
   * - Impressions < minimum
   * - No upward trend
   */
  async checkPageFreeze() {
    console.log('📊 Checking pages to freeze...');

    const deadPages = await SEOPageMapping.getDeadPages(PAGE_DEAD_DAYS);

    for (const page of deadPages) {
      // Double-check recent performance
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 7);

      const recentData = await GSCPageDaily.find({
        page: page.url,
        date: { $gte: recentDate }
      });

      const totalImpressions = recentData.reduce((sum, d) => sum + d.impressions, 0);

      if (totalImpressions < MIN_IMPRESSIONS_CREATE) {
        // Decision: FREEZE PAGE
        const decision = {
          actionType: 'FREEZE_PAGE',
          url: page.url,
          service: page.service,
          city: page.city,
          reason: `No traction after ${PAGE_DEAD_DAYS} days. Total impressions: ${totalImpressions}`,
          inputData: {
            impressions: totalImpressions,
            daysSinceIndexed: Math.floor((Date.now() - page.indexedAt) / (1000 * 60 * 60 * 24))
          }
        };

        this.decisions.push(decision);
        console.log(`✅ Decision: FREEZE_PAGE for ${page.url}`);
      }
    }
  }

  /**
   * Task 2.5 — Clone Winners Decision (Weekly)
   * 
   * Trigger if:
   * - CTR + clicks outperform peers
   * - Should be run weekly, not daily
   */
  async checkCloneWinners() {
    console.log('📊 Checking for winning patterns to clone...');

    const winners = await SEOPageMapping.getWinners(10);

    for (const winner of winners) {
      // Find similar pages (same service) to compare
      const peers = await SEOPageMapping.find({
        service: winner.service,
        status: 'ACTIVE',
        _id: { $ne: winner._id }
      });

      if (peers.length === 0) continue;

      const avgPeerClicks = peers.reduce((sum, p) => sum + p.currentMetrics.clicks, 0) / peers.length;
      const performanceRatio = winner.currentMetrics.clicks / avgPeerClicks;

      if (performanceRatio > (1 + WINNING_PATTERN_THRESHOLD)) {
        // Decision: CLONE STRUCTURE
        // This is a weekly decision, not added to daily decisions
        console.log(`✅ Winner identified: ${winner.url} (${(performanceRatio * 100).toFixed(0)}% of peer average)`);
      }
    }
  }

  /**
   * Get CTR benchmark for a given position
   */
  getCtrBenchmark(position) {
    if (position <= 30) {
      return CTR_BENCHMARK_BY_POSITION[position] || 0.01;
    }
    return 0.005; // Very low for positions beyond 30
  }

  /**
   * Parse query to extract service and city
   * Simple pattern matching - can be enhanced with NLP
   */
  parseQueryForServiceCity(query) {
    const lowerQuery = query.toLowerCase();

    // Service patterns
    const servicePatterns = {
      plumbing: /plumb(ing|er)/i,
      electrical: /electric(al|ian)/i,
      hvac: /hvac|heating|cooling|air conditioning/i,
      carpentry: /carpentr(y|er)/i,
      painting: /paint(ing|er)/i,
      roofing: /roof(ing|er)/i,
      'house-cleaning': /house cleaning|maid|cleaning service/i,
      'junk-removal': /junk removal|trash removal|hauling/i,
      landscaping: /landscap(ing|er)|lawn care|yard work/i,
      handyman: /handyman|handyperson/i
    };

    let service = null;
    for (const [svc, pattern] of Object.entries(servicePatterns)) {
      if (pattern.test(lowerQuery)) {
        service = svc;
        break;
      }
    }

    // City extraction
    let city = null;
    let state = null;

    const inMatch = lowerQuery.match(/in\s+([a-z\s-]+?)(?:\s|$)/i);
    if (inMatch) {
      const location = inMatch[1].trim();
      const parts = location.split(' ');
      
      // Check if last part is state abbreviation
      if (parts.length > 1 && parts[parts.length - 1].length === 2) {
        state = parts[parts.length - 1];
        city = parts.slice(0, -1).join(' ').replace(/\s+/g, '-');
      } else {
        city = location.replace(/\s+/g, '-');
      }
    }

    return { service, city, state };
  }

  /**
   * Check rate limit for an action type
   */
  async checkRateLimit(actionType, maxPerDay) {
    const todayCount = await SEOAgentAction.getTodayActionCount(actionType);
    return todayCount < maxPerDay;
  }
}

module.exports = DecisionEngine;
