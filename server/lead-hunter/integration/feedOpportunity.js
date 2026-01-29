// Feed Opportunity to SEO Agent
// Guarded mode integration layer

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { validateProposal } = require('../safety/validator');

// Generate UUID v4 without external dependency
function generateUUID() {
  return crypto.randomUUID();
}
const { checkProposalLimit, recordProposal } = require('../safety/rateLimiter');
const { log } = require('../utils/logger');

const PROPOSALS_DIR = path.join(__dirname, '../../proposals');
const PENDING_DIR = path.join(PROPOSALS_DIR, 'pending');
const PROCESSED_DIR = path.join(PROPOSALS_DIR, 'processed');

// Ensure directories exist
[PROPOSALS_DIR, PENDING_DIR, PROCESSED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Feeds an opportunity to the SEO agent
 * @param {Object} opportunity - Opportunity to feed
 * @param {Object} options - Feed options
 * @returns {Object} Result of feed operation
 */
async function feedOpportunity(opportunity, options = {}) {
  const {
    dryRun = false,
  } = options;
  
  // Validate opportunity score meets minimum
  const minScore = parseInt(process.env.LEAD_HUNTER_MIN_OPPORTUNITY_SCORE || '60');
  if (opportunity.score < minScore) {
    log.warning('guarded', `Opportunity score ${opportunity.score} below minimum ${minScore}, skipping`);
    return {
      success: false,
      reason: 'Score below minimum threshold',
      fed: false,
    };
  }
  
  // Check rate limits
  const limitCheck = checkProposalLimit();
  if (!limitCheck.allowed) {
    log.warning('guarded', limitCheck.reason);
    return {
      success: false,
      reason: limitCheck.reason,
      fed: false,
    };
  }
  
  // Convert opportunity to proposal
  const proposal = opportunityToProposal(opportunity);
  
  // Validate proposal
  const validation = validateProposal(proposal);
  if (!validation.valid) {
    log.error('guarded', `Invalid proposal: ${validation.errors.join(', ')}`);
    return {
      success: false,
      reason: `Validation failed: ${validation.errors.join(', ')}`,
      fed: false,
    };
  }
  
  if (dryRun) {
    log.info('guarded', 'Dry run: Would feed proposal to SEO agent');
    console.log('📋 Proposal:', JSON.stringify(proposal, null, 2));
    return {
      success: true,
      reason: 'Dry run',
      fed: false,
      proposal,
    };
  }
  
  // Write proposal file
  try {
    const proposalId = generateUUID();
    const filename = `proposal-${proposalId}.json`;
    const filepath = path.join(PENDING_DIR, filename);
    
    const proposalData = {
      id: proposalId,
      ...proposal,
      submittedAt: new Date().toISOString(),
      source: 'lead-hunter',
      status: 'pending',
    };
    
    fs.writeFileSync(filepath, JSON.stringify(proposalData, null, 2));
    
    // Record proposal for rate limiting
    recordProposal();
    
    log.success('guarded', `Proposal fed to SEO agent: ${filename}`);
    
    return {
      success: true,
      fed: true,
      proposalId,
      filepath,
      proposal: proposalData,
    };
    
  } catch (error) {
    log.error('guarded', 'Failed to feed proposal', error);
    return {
      success: false,
      reason: error.message,
      fed: false,
    };
  }
}

/**
 * Converts opportunity to SEO agent proposal format
 * @param {Object} opportunity - Opportunity object
 * @returns {Object} Proposal object
 */
function opportunityToProposal(opportunity) {
  return {
    action: 'CREATE_PAGE', // Default action for city gaps
    service: opportunity.service,
    city: opportunity.city,
    state: opportunity.state,
    reason: opportunity.reason,
    score: opportunity.score,
    priority: opportunity.priority,
    data: {
      type: opportunity.type,
      competitorPosition: opportunity.competitorPosition,
      competitor: opportunity.competitor,
    },
  };
}

/**
 * Feeds multiple opportunities (batch)
 * @param {Array} opportunities - Array of opportunities
 * @param {Object} options - Feed options
 * @returns {Object} Results of batch feed
 */
async function feedOpportunities(opportunities, options = {}) {
  const {
    maxPerBatch = 5,
    dryRun = false,
  } = options;
  
  log.info('guarded', `Feeding ${opportunities.length} opportunities (max ${maxPerBatch} per batch)...`);
  
  const results = {
    total: opportunities.length,
    fed: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };
  
  // Limit to max per batch
  const toFeed = opportunities.slice(0, maxPerBatch);
  
  for (const opportunity of toFeed) {
    const result = await feedOpportunity(opportunity, { dryRun });
    
    if (result.fed) {
      results.fed++;
    } else if (result.success === false) {
      results.failed++;
    } else {
      results.skipped++;
    }
    
    results.details.push({
      opportunity: `${opportunity.service} in ${opportunity.city}`,
      score: opportunity.score,
      result: result.reason || (result.fed ? 'Fed' : 'Skipped'),
      proposalId: result.proposalId,
    });
    
    // Cooldown between proposals
    if (!dryRun && result.fed) {
      await sleep(1000); // 1 second between proposals
    }
  }
  
  results.skipped += opportunities.length - toFeed.length;
  
  log.info('guarded', `Batch complete: ${results.fed} fed, ${results.skipped} skipped, ${results.failed} failed`);
  
  return results;
}

/**
 * Reads pending proposals
 * @returns {Array} Array of pending proposal objects
 */
function readPendingProposals() {
  try {
    const files = fs.readdirSync(PENDING_DIR).filter(f => f.endsWith('.json'));
    
    return files.map(file => {
      const filepath = path.join(PENDING_DIR, file);
      const content = fs.readFileSync(filepath, 'utf-8');
      return JSON.parse(content);
    });
    
  } catch (error) {
    console.error('❌ Failed to read pending proposals:', error.message);
    return [];
  }
}

/**
 * Sleep helper
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  feedOpportunity,
  feedOpportunities,
  opportunityToProposal,
  readPendingProposals,
};
