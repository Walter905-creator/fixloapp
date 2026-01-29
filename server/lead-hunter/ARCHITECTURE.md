# 🎯 Fixlo Autonomous Lead Hunter - Architecture

**Intelligent opportunity detection system** - Backend only, advisory mode by default.

## Overview

The Fixlo Lead Hunter is an autonomous intelligence system that:
- Analyzes competitor rankings and market opportunities
- Identifies gaps in Fixlo's service coverage
- Proposes expansion opportunities to the SEO agent
- Optimizes SEO agent thresholds through performance analysis
- **NEVER publishes content directly** - advisory role only

## Core Principles

1. **Separation of Concerns**: Lead Hunter detects, SEO Agent executes
2. **Safe by Default**: Observer mode is the default, execution requires explicit opt-in
3. **Advisory Role**: Proposes opportunities, never forces actions
4. **Read-Only First**: All external interactions are safe and limited
5. **Full Transparency**: Every action is logged and traceable

## Architecture

```
/server/lead-hunter/
├── index.js                    # Entry point (mode selector)
├── observer.js                 # Observer mode orchestrator
├── guarded.js                  # Guarded execution orchestrator
├── tuning.js                   # Threshold tuning orchestrator
├── ARCHITECTURE.md             # This file
├── README.md                   # Usage documentation
│
├── /config/                    # Configuration
│   ├── modes.js               # Mode definitions and flags
│   ├── limits.js              # Rate limits and safety bounds
│   └── dataSources.js         # External data source configs
│
├── /ingestion/                 # Data gathering (read-only)
│   ├── fetchCompetitors.js    # Mock competitor SERP data
│   ├── fetchMarketGaps.js     # Identify coverage gaps
│   └── fetchSEOMetrics.js     # Read SEO agent performance
│
├── /analysis/                  # Opportunity detection
│   ├── analyzeCities.js       # City coverage analysis
│   ├── analyzeServices.js     # Service gap detection
│   └── scoreOpportunities.js  # Priority scoring algorithm
│
├── /integration/               # SEO agent interface
│   ├── proposePage.js         # Propose page creation
│   ├── feedOpportunity.js     # Feed opportunity to SEO agent
│   └── validateSafety.js      # Safety checks before feeding
│
├── /tuning/                    # Threshold optimization
│   ├── analyzePerformance.js  # Performance metric analysis
│   ├── recommendThresholds.js # Threshold adjustments
│   └── generateReport.js      # Tuning recommendations
│
├── /utils/                     # Shared utilities
│   ├── lockManager.js         # Process locking (same as SEO agent)
│   └── logger.js              # Structured logging
│
└── /safety/                    # Safety controls
    ├── rateLimiter.js         # Rate limiting for external calls
    └── validator.js           # Input validation and sanitization
```

## Operating Modes

### 1. Observer Mode (DEFAULT)

**Purpose**: Intelligence gathering only, zero execution risk.

**Responsibilities**:
- Crawl/inspect external signals (mocked or real, safely)
- Detect city gaps (competitors rank, Fixlo doesn't)
- Detect service gaps (competitors offer, Fixlo lacks)
- Log all opportunities to disk
- **NEVER** trigger page creation
- **NEVER** call the SEO agent

**Safety Features**:
- Read-only operations
- Idempotent execution
- Timeout limits on all external calls
- Rate limiting for API calls
- Lock mechanism prevents concurrent runs

**Activation**:
```bash
# Default mode - no config needed
node lead-hunter/index.js observer

# Or via environment
LEAD_HUNTER_MODE=observer node lead-hunter/index.js
```

**Output**:
- `logs/lead-hunter-opportunities-YYYY-MM-DD.json`
- Structured JSON with scored opportunities

### 2. Guarded Execution Mode

**Purpose**: Feed opportunities to SEO agent with strict safety controls.

**Responsibilities**:
- Read opportunities from Observer mode logs
- Apply threshold checks and filters
- Feed validated opportunities to SEO agent
- **DO NOT** bypass SEO agent decision logic
- **DO NOT** publish directly

**Safety Features**:
- Requires explicit opt-in via `LEAD_HUNTER_MODE=guarded`
- Threshold validation before feeding
- Rate limits (max opportunities per day)
- Full audit logging
- SEO agent retains final decision authority

**Activation**:
```bash
# Requires explicit environment variable
LEAD_HUNTER_MODE=guarded node lead-hunter/index.js guarded

# In .env file:
LEAD_HUNTER_MODE=guarded
LEAD_HUNTER_MAX_DAILY_FEEDS=10
```

**Integration Flow**:
```
Observer Mode (daily) → Opportunities Log
                            ↓
Guarded Mode (daily) → Read + Filter → Feed to SEO Agent
                            ↓
SEO Agent → Evaluate → Decide → Execute (or reject)
```

**Constraints**:
- Max 10 opportunities per day (configurable)
- Only feeds if opportunity score > threshold
- SEO agent applies its own rules independently
- No direct database writes from Lead Hunter

### 3. Threshold Tuning Mode

**Purpose**: Analyze SEO agent performance and recommend threshold optimizations.

**Responsibilities**:
- Read SEO agent performance metrics
- Analyze CTR vs position correlations
- Identify underperforming threshold ranges
- Generate threshold adjustment recommendations
- Log recommendations (never auto-apply)

**Safety Features**:
- Read-only analysis
- No automatic threshold changes
- Recommendations require manual review
- Historical performance context included

**Activation**:
```bash
node lead-hunter/index.js tuning

# Or via environment
LEAD_HUNTER_MODE=tuning node lead-hunter/index.js
```

**Output**:
- `logs/lead-hunter-tuning-YYYY-MM-DD.json`
- Recommendations with supporting data

**Analysis Areas**:
1. **CTR Thresholds**: Are current CTR benchmarks optimal?
2. **Position Ranges**: Should we expand/narrow position targets?
3. **Impression Minimums**: Are minimums too high/low?
4. **Conversion Metrics**: Which thresholds correlate with actual leads?

### 4. Architecture Mode (Documentation Only)

**Purpose**: Pure design and documentation, no code execution.

This document represents Architecture Mode - the design blueprint for the system.

## Data Sources

### Competitor Analysis (Mocked Initially)

For safety and initial deployment, competitor data is **mocked**:

```javascript
// Example mock data structure
{
  competitor: "competitor-name",
  service: "plumbing",
  city: "Austin",
  state: "TX",
  position: 5,
  source: "mock"  // or "serp-api" when enabled
}
```

**Real Implementation (Future)**:
- SERP scraping APIs (SerpApi, DataForSEO)
- Competitor website analysis
- Google Maps ranking data

**Safety Requirements for Real Data**:
- API rate limits strictly enforced
- Timeout on all external calls (5s max)
- Fallback to mock data on errors
- Cost tracking and budget limits

### SEO Agent Performance Metrics

Read-only access to SEO agent data:

```javascript
// Metrics read from SEO agent logs or database
{
  page: "/services/plumbing-in-dallas",
  impressions: 1250,
  clicks: 45,
  ctr: 0.036,
  position: 8.2,
  createdAt: "2024-01-15",
  performanceWeek: 7
}
```

**Data Sources**:
- Google Search Console data (via SEO agent)
- MongoDB SEO pages collection
- SEO agent execution logs

### Market Gap Detection

Comparison logic:

```javascript
// Opportunity detection algorithm
const opportunities = [];

for (const competitorRanking of competitorData) {
  const fixloHasPage = existingPages.has(
    `${competitorRanking.service}-${competitorRanking.city}`
  );
  
  if (!fixloHasPage && competitorRanking.position <= 10) {
    opportunities.push({
      type: 'CITY_GAP',
      service: competitorRanking.service,
      city: competitorRanking.city,
      state: competitorRanking.state,
      competitorPosition: competitorRanking.position,
      score: calculateOpportunityScore(competitorRanking),
      reason: 'Competitor ranks top 10, Fixlo has no page'
    });
  }
}
```

## Opportunity Scoring Algorithm

Opportunities are scored to prioritize SEO agent actions:

```javascript
function calculateOpportunityScore(opportunity) {
  let score = 0;
  
  // Position weight (higher is better for gaps)
  if (opportunity.competitorPosition <= 3) score += 50;
  else if (opportunity.competitorPosition <= 5) score += 30;
  else if (opportunity.competitorPosition <= 10) score += 20;
  
  // Population weight (larger cities prioritized)
  if (opportunity.cityPopulation > 1000000) score += 30;
  else if (opportunity.cityPopulation > 500000) score += 20;
  else if (opportunity.cityPopulation > 100000) score += 10;
  
  // Service demand weight
  if (opportunity.service === 'plumbing') score += 10;
  if (opportunity.service === 'electrical') score += 10;
  
  // Competitive intensity (fewer competitors = higher score)
  if (opportunity.competitorCount < 5) score += 15;
  else if (opportunity.competitorCount < 10) score += 10;
  
  return score;
}
```

**Score Ranges**:
- 80-100: High priority (feed immediately in guarded mode)
- 60-79: Medium priority (queue for later)
- 40-59: Low priority (log only)
- <40: Ignore

## Integration with SEO Agent

### Read-Only Interface

Lead Hunter reads from SEO agent outputs:

```javascript
// Read existing pages from SEO agent's database
const SEOPage = require('../seo-agent/models/SEOPage'); // if exists
const existingPages = await SEOPage.find({ 'metadata.createdBy': 'seo-agent' });

// Read performance metrics
const metrics = await SEOMetrics.find({ createdAt: { $gte: last7Days } });
```

### Advisory Interface (Guarded Mode)

Lead Hunter proposes, SEO agent decides:

```javascript
// Lead Hunter creates proposal file
const proposal = {
  type: 'CREATE_PAGE',
  service: 'plumbing',
  city: 'Austin',
  state: 'TX',
  reason: 'Competitor ranks #3, Fixlo has no page',
  score: 85,
  source: 'lead-hunter',
  timestamp: new Date().toISOString()
};

// Write to proposal queue
await writeProposal('proposals/pending/proposal-uuid.json', proposal);

// SEO agent reads proposals (modified separately)
// - Validates against its own rules
// - Applies threshold checks
// - Executes if approved
// - Logs decision (approved/rejected)
```

**Critical**: SEO agent code is NOT modified. Integration happens via:
1. Proposal files in shared directory
2. SEO agent reads proposals as additional input source
3. SEO agent's decision logic remains unchanged

### No Direct Publishing

```javascript
// ❌ FORBIDDEN - Lead Hunter NEVER does this:
await createPage({ service, city, state });
await publishContent(pageData);
await submitToIndex(url);

// ✅ ALLOWED - Lead Hunter only proposes:
await logOpportunity({ type: 'CREATE_PAGE', service, city });
await writeProposal({ action: 'CREATE_PAGE', data: {...} });
```

## Safety Architecture

### Rate Limiting

All external calls are rate-limited:

```javascript
const rateLimiter = {
  serpApi: { maxPerHour: 100, maxPerDay: 500 },
  competitorCrawl: { maxPerHour: 50, maxPerDay: 200 },
  proposals: { maxPerDay: 10 }
};
```

### Timeout Controls

```javascript
// All external calls have strict timeouts
const fetchWithTimeout = (url, timeoutMs = 5000) => {
  return Promise.race([
    fetch(url),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    )
  ]);
};
```

### Lock Management

Prevents concurrent executions:

```javascript
// Same pattern as SEO agent
const { acquireLock, releaseLock } = require('./utils/lockManager');

async function runObserver() {
  const lockAcquired = acquireLock('observer');
  if (!lockAcquired) {
    console.log('Another observer instance is running. Exiting.');
    return;
  }
  
  try {
    // ... observer logic
  } finally {
    releaseLock('observer');
  }
}
```

### Validation & Sanitization

All inputs are validated:

```javascript
function validateOpportunity(opp) {
  if (!opp.service || typeof opp.service !== 'string') {
    throw new Error('Invalid service');
  }
  if (!opp.city || typeof opp.city !== 'string') {
    throw new Error('Invalid city');
  }
  // ... more validation
  return true;
}
```

## Logging Strategy

Structured logging matching SEO agent style:

```javascript
console.log('🎯 Lead Hunter starting in observer mode...');
console.log('📊 Opportunities found:', opportunities.length);
console.log('✅ Observer run completed successfully');
console.log('❌ Failed to fetch competitor data:', error.message);
```

**Log Files**:
- `logs/lead-hunter-observer-YYYY-MM-DD.log` - Observer mode output
- `logs/lead-hunter-guarded-YYYY-MM-DD.log` - Guarded mode output
- `logs/lead-hunter-tuning-YYYY-MM-DD.log` - Tuning mode output
- `logs/lead-hunter-opportunities-YYYY-MM-DD.json` - Structured opportunity data

## Deployment Strategy

### Phase 1: Observer Mode Only (Week 1-2)

- Deploy observer mode only
- Run daily, gather data
- No integration with SEO agent
- Validate opportunity detection logic

### Phase 2: Tuning Mode (Week 3-4)

- Add tuning mode
- Analyze SEO agent performance
- Generate threshold recommendations
- Manual review and application

### Phase 3: Guarded Mode (Week 5+)

- Enable guarded mode with strict limits
- Start with max 2 proposals per day
- Monitor SEO agent response
- Gradually increase if successful

### Phase 4: Expansion (Month 2+)

- Replace mock data with real APIs
- Expand coverage areas
- Increase proposal limits
- Add advanced scoring algorithms

## Success Metrics

After 30 days of operation:

**Observer Mode**:
- Opportunities detected per day: 10-50
- Accuracy rate (valid opportunities): >80%
- Zero false positives causing SEO agent failures

**Guarded Mode**:
- Proposals fed to SEO agent: 5-10/day
- SEO agent acceptance rate: >50%
- Pages created from proposals: 3-7/day
- Performance of proposal-based pages: >= SEO agent average

**Tuning Mode**:
- Threshold recommendations generated: 1-2/week
- Recommendations implemented: >50%
- Performance improvement after tuning: >10%

## What This Is NOT

❌ A content publisher  
❌ A replacement for SEO agent  
❌ An autonomous executor  
❌ A dashboard or UI  

## What This IS

✅ An intelligence layer  
✅ An opportunity detector  
✅ A proposal generator  
✅ A performance optimizer  
✅ A safe, advisory system  

## Extensibility

Future enhancements (post-MVP):

1. **Machine Learning Scoring**: Replace rule-based scoring with ML model
2. **Competitor Tracking**: Monitor specific competitor strategies
3. **Seasonal Analysis**: Detect seasonal demand patterns
4. **Geographic Expansion**: Recommend new state/city expansions
5. **Service Prioritization**: Identify highest-ROI services to add
6. **A/B Testing**: Propose experiments for SEO agent to run

## Technical Constraints

- **Language**: CommonJS (require/module.exports) to match existing codebase
- **No New Dependencies**: Use existing packages where possible
- **MongoDB**: Read-only access to existing collections
- **File System**: Write logs and proposals to `/server/logs/` and `/server/proposals/`
- **Environment Variables**: Use same pattern as SEO agent (`.env` file)

## Configuration Example

```bash
# In /server/.env

# Lead Hunter Mode
LEAD_HUNTER_MODE=observer          # observer | guarded | tuning
LEAD_HUNTER_ENABLED=true           # Master enable/disable

# Guarded Mode Settings
LEAD_HUNTER_MAX_DAILY_FEEDS=10    # Max proposals per day
LEAD_HUNTER_MIN_OPPORTUNITY_SCORE=60  # Minimum score to feed

# External API Settings (when real data is enabled)
SERP_API_KEY=your_key_here
SERP_API_ENABLED=false             # Start with false (use mocks)
SERP_API_RATE_LIMIT=100           # Calls per hour

# Safety Settings
LEAD_HUNTER_TIMEOUT_MS=5000       # External call timeout
LEAD_HUNTER_LOCK_TIMEOUT_MIN=60   # Lock expiry time
```

## Reality Check

This is intelligence infrastructure, not magic. It detects opportunities the SEO agent might miss, proposes expansions backed by competitor data, and optimizes performance through analysis.

Success = SEO agent makes better decisions with Lead Hunter input than without.

Failure = Lead Hunter proposes junk, wastes resources, or causes instability.

Measure ruthlessly. Adjust aggressively. Keep it safe.
