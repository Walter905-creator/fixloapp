const DecisionEngine = require('./decisionEngine');
const ContentGenerator = require('./contentGenerator');
const PageMapper = require('./pageMapper');
const { getGSCClient } = require('./gscClient');
const SEOAgentAction = require('../../models/SEOAgentAction');
const SEOPageMapping = require('../../models/SEOPageMapping');
const {
  AUTO_STOP_CLICK_DROP_THRESHOLD,
  PERFORMANCE_LOOKBACK_DAYS
} = require('../../config/seoAgentConstants');

/**
 * SEO Agent Orchestrator
 * 
 * Main controller that:
 * 1. Fetches data from GSC
 * 2. Runs decision engine
 * 3. Executes decisions with content generator
 * 4. Updates sitemap and submits for indexing
 * 5. Monitors performance and auto-stops if needed
 */
class SEOAgent {
  constructor() {
    this.decisionEngine = new DecisionEngine();
    this.contentGenerator = new ContentGenerator();
    this.pageMapper = new PageMapper();
    this.gscClient = getGSCClient();
    this.isRunning = false;
    this.shouldStop = false;
  }

  /**
   * Main agent execution flow
   */
  async run() {
    if (this.isRunning) {
      console.log('⚠️ Agent is already running');
      return { status: 'already_running' };
    }

    this.isRunning = true;
    console.log('🚀 Starting SEO Agent...');

    const results = {
      dataSync: null,
      decisions: [],
      actions: [],
      errors: []
    };

    try {
      // Step 1: Check auto-stop conditions
      const shouldStop = await this.checkAutoStop();
      if (shouldStop) {
        console.log('🛑 Auto-stop triggered. Agent will not run.');
        this.isRunning = false;
        return { status: 'auto_stopped', reason: shouldStop };
      }

      // Step 2: Sync GSC data
      console.log('📊 Syncing Google Search Console data...');
      try {
        results.dataSync = await this.gscClient.syncLastNDays(7);
        console.log(`✅ Synced ${results.dataSync.pages} page records, ${results.dataSync.queries} query records`);
      } catch (error) {
        console.error('❌ Failed to sync GSC data:', error.message);
        results.errors.push({ step: 'data_sync', error: error.message });
        // Continue anyway - may have existing data
      }

      // Step 3: Update page mappings
      console.log('🗺️ Updating page mappings...');
      await this.pageMapper.mapExistingPages();

      // Step 4: Run decision engine
      console.log('🧠 Running decision engine...');
      const decisions = await this.decisionEngine.runAllDecisions();
      results.decisions = decisions;

      // Step 5: Execute decisions
      console.log(`⚙️ Executing ${decisions.length} decisions...`);
      for (const decision of decisions) {
        try {
          const action = await this.executeDecision(decision);
          results.actions.push(action);
        } catch (error) {
          console.error(`❌ Failed to execute decision:`, error.message);
          results.errors.push({
            step: 'execution',
            decision: decision.actionType,
            error: error.message
          });
        }
      }

      console.log('✅ SEO Agent run complete');
      
    } catch (error) {
      console.error('❌ SEO Agent error:', error.message);
      results.errors.push({ step: 'agent', error: error.message });
    } finally {
      this.isRunning = false;
    }

    return results;
  }

  /**
   * Execute a single decision
   */
  async executeDecision(decision) {
    const startTime = Date.now();

    // Create action log
    const action = await SEOAgentAction.create(decision);

    try {
      action.status = 'IN_PROGRESS';
      await action.save();

      let llmOutput = null;

      switch (decision.actionType) {
        case 'CREATE_PAGE':
          llmOutput = await this.executePageCreation(decision);
          break;

        case 'REWRITE_META':
          llmOutput = await this.executeMetaRewrite(decision);
          break;

        case 'EXPAND_CONTENT':
          llmOutput = await this.executeContentExpansion(decision);
          break;

        case 'FREEZE_PAGE':
          await this.executePageFreeze(decision);
          break;

        default:
          throw new Error(`Unknown action type: ${decision.actionType}`);
      }

      const executionTime = Date.now() - startTime;
      await action.markCompleted(llmOutput, executionTime);

      console.log(`✅ Completed ${decision.actionType} in ${executionTime}ms`);
      return action;

    } catch (error) {
      await action.markFailed(error);
      throw error;
    }
  }

  /**
   * Execute page creation
   */
  async executePageCreation(decision) {
    console.log(`📄 Creating page: ${decision.service} in ${decision.city}`);

    // Generate content with LLM
    const content = await this.contentGenerator.generatePage(
      decision.service,
      decision.city,
      decision.state
    );

    // Generate meta tags
    const meta = await this.contentGenerator.generateMeta(
      null, // No URL yet
      decision.service,
      decision.city,
      decision.state,
      decision.inputData
    );

    // Generate schema
    const serviceSchema = this.contentGenerator.generateSchema(
      decision.service,
      decision.city,
      decision.state
    );

    const faqSchema = this.contentGenerator.generateFAQSchema(content.faqs);

    // Create page mapping
    const mapping = await this.pageMapper.createPageMapping(
      decision.service,
      decision.city,
      decision.state
    );

    // TODO: Actually create the page in the frontend
    // For now, we're just logging and tracking the mapping

    // Submit to GSC for indexing
    try {
      await this.gscClient.submitUrlForIndexing(mapping.url);
    } catch (error) {
      console.warn('⚠️ Failed to submit for indexing:', error.message);
    }

    return {
      title: meta.title,
      metaDescription: meta.metaDescription,
      h1: content.h1,
      content: JSON.stringify(content),
      model: content.model,
      tokens: content.tokens + meta.tokens
    };
  }

  /**
   * Execute meta rewrite
   */
  async executeMetaRewrite(decision) {
    console.log(`✏️ Rewriting meta for: ${decision.url}`);

    // Parse URL to get service and city
    const parsed = this.pageMapper.parseUrl(decision.url);
    if (!parsed) {
      throw new Error('Could not parse URL');
    }

    // Generate new meta tags
    const meta = await this.contentGenerator.generateMeta(
      decision.url,
      parsed.service,
      parsed.city,
      parsed.state,
      decision.inputData
    );

    // Update page mapping
    const mapping = await SEOPageMapping.findOne({ url: decision.url });
    if (mapping) {
      mapping.metadata.title = meta.title;
      mapping.metadata.metaDescription = meta.metaDescription;
      mapping.metadata.lastModified = new Date();
      await mapping.recordOptimization('REWRITE_META');
      await mapping.save();
    }

    // TODO: Actually update the page meta tags in the frontend

    return {
      title: meta.title,
      metaDescription: meta.metaDescription,
      model: meta.model,
      tokens: meta.tokens
    };
  }

  /**
   * Execute content expansion
   */
  async executeContentExpansion(decision) {
    console.log(`📝 Expanding content for: ${decision.url}`);

    const parsed = this.pageMapper.parseUrl(decision.url);
    if (!parsed) {
      throw new Error('Could not parse URL');
    }

    // Generate expansion content
    const expansion = await this.contentGenerator.expandContent(
      decision.url,
      parsed.service,
      parsed.city,
      parsed.state,
      decision.inputData.position
    );

    // Update page mapping
    const mapping = await SEOPageMapping.findOne({ url: decision.url });
    if (mapping) {
      await mapping.recordOptimization('EXPAND_CONTENT');
    }

    // TODO: Actually add the expanded content to the page

    return {
      content: JSON.stringify(expansion),
      model: expansion.model,
      tokens: expansion.tokens
    };
  }

  /**
   * Execute page freeze
   */
  async executePageFreeze(decision) {
    console.log(`🧊 Freezing page: ${decision.url}`);

    const mapping = await SEOPageMapping.findOne({ url: decision.url });
    if (mapping) {
      await mapping.markAsDead();
    }

    // TODO: Optionally remove from sitemap or add noindex
  }

  /**
   * Check auto-stop conditions
   * Returns reason to stop, or null if should continue
   */
  async checkAutoStop() {
    console.log('🔍 Checking auto-stop conditions...');

    try {
      // Get organic clicks for last 14 days vs previous 14 days
      const endDate = new Date();
      const midDate = new Date(endDate);
      midDate.setDate(midDate.getDate() - PERFORMANCE_LOOKBACK_DAYS);
      const startDate = new Date(midDate);
      startDate.setDate(startDate.getDate() - PERFORMANCE_LOOKBACK_DAYS);

      const GSCPageDaily = require('../../models/GSCPageDaily');

      const recentClicks = await GSCPageDaily.aggregate([
        {
          $match: {
            date: { $gte: midDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalClicks: { $sum: '$clicks' }
          }
        }
      ]);

      const previousClicks = await GSCPageDaily.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lt: midDate }
          }
        },
        {
          $group: {
            _id: null,
            totalClicks: { $sum: '$clicks' }
          }
        }
      ]);

      if (recentClicks.length === 0 || previousClicks.length === 0) {
        console.log('⚠️ Insufficient data for auto-stop check');
        return null;
      }

      const recentTotal = recentClicks[0].totalClicks;
      const previousTotal = previousClicks[0].totalClicks;

      if (previousTotal === 0) {
        return null; // No baseline to compare
      }

      const dropPercentage = (previousTotal - recentTotal) / previousTotal;

      if (dropPercentage > AUTO_STOP_CLICK_DROP_THRESHOLD) {
        return `Organic clicks dropped ${(dropPercentage * 100).toFixed(1)}% over ${PERFORMANCE_LOOKBACK_DAYS} days`;
      }

      console.log('✅ Auto-stop check passed');
      return null;
    } catch (error) {
      console.error('❌ Auto-stop check failed:', error.message);
      // Don't block agent run if auto-stop check fails
      return null;
    }
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      gscConfigured: this.gscClient.isConfigured(),
      openaiConfigured: this.contentGenerator.isConfigured()
    };
  }
}

// Singleton instance
let seoAgentInstance = null;

function getSEOAgent() {
  if (!seoAgentInstance) {
    seoAgentInstance = new SEOAgent();
  }
  return seoAgentInstance;
}

module.exports = {
  SEOAgent,
  getSEOAgent
};
