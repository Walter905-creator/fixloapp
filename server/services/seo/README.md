# Fixlo SEO Domination Agent 🤖

An autonomous SEO agent that decides when to create, update, or ignore pages based on real Google Search Console data. It acts without human approval, measures results, and self-corrects to optimize for organic clicks → leads.

## Overview

The SEO Agent follows the principle: **If the agent doesn't decide, act, and self-correct, it's not allowed in Fixlo.**

### Core Principles

1. **Data-Driven Decisions**: Never create or modify pages without sufficient impression/click data
2. **Pure Logic Decision Engine**: No LLM in the decision-making process
3. **LLM as Worker Only**: Content generation uses LLM, but decisions use logic
4. **Self-Correcting**: Monitors performance and auto-stops if metrics decline
5. **Rate-Limited**: Maximum 5 new pages/day, 10 meta rewrites/day to prevent mass-generation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SEO Agent Orchestrator                   │
├─────────────────────────────────────────────────────────────┤
│  Phase 1: Data Ingestion                                     │
│    ├── Google Search Console API Client                      │
│    ├── Daily page performance sync                           │
│    └── Daily query performance sync                          │
├─────────────────────────────────────────────────────────────┤
│  Phase 2: Decision Engine (PURE LOGIC, NO LLM)              │
│    ├── Page Creation Decision                                │
│    ├── Meta Rewrite Decision                                 │
│    ├── Content Expansion Decision                            │
│    ├── Page Freeze/Kill Decision                             │
│    └── Clone Winners Decision                                │
├─────────────────────────────────────────────────────────────┤
│  Phase 3: Execution Layer (LLM ALLOWED)                      │
│    ├── Page Generator (OpenAI)                               │
│    ├── Meta Rewriter (OpenAI)                                │
│    └── Content Expander (OpenAI)                             │
├─────────────────────────────────────────────────────────────┤
│  Phase 4: Indexing & Distribution                            │
│    ├── Sitemap Updater                                       │
│    └── GSC URL Submission                                    │
├─────────────────────────────────────────────────────────────┤
│  Phase 5: Learning Loop                                      │
│    ├── Performance Evaluator                                 │
│    ├── Pattern Extraction                                    │
│    └── Auto-Scale Winners                                    │
└─────────────────────────────────────────────────────────────┘
```

## Configuration

### Required Environment Variables

```bash
# Google Search Console
GSC_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GSC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GSC_SITE_URL=sc-domain:fixloapp.com

# OpenAI
OPENAI_API_KEY=sk-...

# Agent Control
SEO_AGENT_ENABLED=true
SEO_AGENT_API_KEY=your-secret-key

# MongoDB (already configured)
MONGODB_URI=mongodb+srv://...
```

### Google Search Console Setup

1. Create a Google Cloud Project
2. Enable the Search Console API
3. Create a Service Account
4. Download the JSON credentials
5. Add the service account email to your Search Console property as a user
6. Set `GSC_CLIENT_EMAIL` and `GSC_PRIVATE_KEY` environment variables

## Decision Rules

### Page Creation
**Creates a page ONLY if:**
- Query impressions ≥ 100
- Average position between 8-30
- No dedicated page exists

### Meta Rewrite
**Rewrites meta ONLY if:**
- Impressions ≥ 200
- CTR < benchmark for position
- Not optimized in last 7 days

### Content Expansion
**Expands content ONLY if:**
- Average position 4-15
- Clicks trending up (>10%)
- Not optimized in last 7 days

### Page Freeze
**Freezes a page if:**
- Indexed ≥ 30 days
- Impressions < 100
- No upward trend

## Rate Limits (Safety Guardrails)

- **Max pages per day**: 5
- **Max meta rewrites per day**: 10
- **Min days between optimizations**: 7
- **Auto-stop threshold**: 20% click drop over 14 days

## API Endpoints

All endpoints require `X-API-Key` header or `?apiKey=` query parameter.

### Status & Control

```bash
# Get agent status
GET /api/seo-agent/status

# Manually trigger agent run
POST /api/seo-agent/run

# Sync GSC data manually
POST /api/seo-agent/sync-gsc
Body: { "days": 7 }

# Test configuration
POST /api/seo-agent/test
```

### Monitoring

```bash
# Get recent actions
GET /api/seo-agent/actions?limit=50&page=1&actionType=CREATE_PAGE

# Get specific action details
GET /api/seo-agent/actions/:id

# Get page mappings
GET /api/seo-agent/pages?service=plumbing&limit=50

# Get analytics
GET /api/seo-agent/analytics?days=30

# Get current opportunities
GET /api/seo-agent/opportunities?limit=20
```

## Automated Scheduling

The agent runs automatically via cron jobs:

- **Daily at 6:00 AM UTC**: GSC data sync
- **Daily at 7:00 AM UTC**: Agent decision + execution run
- **Weekly on Mondays at 8:00 AM UTC**: Winner analysis

## Database Models

### GSCPageDaily
Stores daily page performance from Google Search Console.

### GSCQueryDaily
Stores daily query performance from Google Search Console.

### SEOPageMapping
Maps service + city combinations to actual URLs and tracks performance.

### SEOAgentAction
Logs every decision and action taken by the agent (critical for learning loop).

## Logging

Every action is logged with:
- Decision rationale
- Input data
- Before/after metrics
- LLM outputs
- Success/failure status
- Execution time

## Learning Loop

The agent continuously learns from its actions:

1. **Weekly Evaluator**: Compares before/after metrics for all actions
2. **Pattern Extraction**: Identifies winning title formulas, services, and city types
3. **Auto-Scale Winners**: Applies proven patterns to new pages

## Safety & Kill Switches

### Auto-Stop Conditions

The agent automatically pauses if:
- Organic clicks drop >20% over 14 days
- Indexing errors spike
- Duplicate content detected

### Manual Override

Agent can be disabled at any time by setting:
```bash
SEO_AGENT_ENABLED=false
```

## Success Metrics (45-60 Days)

✅ Organic clicks ↑  
✅ Indexed pages ↑  
✅ Leads from organic ↑  
❌ If not → decision logic must be changed

## Development

### Testing Locally

```bash
# Set up environment variables
cp server/.env.example server/.env
# Edit server/.env with your credentials

# Install dependencies
cd server
npm install

# Run server
npm run dev

# Test agent manually
curl -X POST http://localhost:3001/api/seo-agent/test \
  -H "X-API-Key: your-secret-key"

curl -X POST http://localhost:3001/api/seo-agent/run \
  -H "X-API-Key: your-secret-key"
```

### Testing Components

```bash
# Test GSC client
node server/test-gsc-client.js

# Test decision engine
node server/test-decision-engine.js

# Test content generator
node server/test-content-generator.js
```

## Files Added

```
server/
├── config/
│   └── seoAgentConstants.js          # Phase 0: Global constants & guardrails
├── models/
│   ├── GSCPageDaily.js                # GSC page performance data
│   ├── GSCQueryDaily.js               # GSC query performance data
│   ├── SEOAgentAction.js              # Agent action logs
│   └── SEOPageMapping.js              # Page mapping & metadata
├── routes/
│   └── seoAgent.js                    # API endpoints
└── services/
    └── seo/
        ├── gscClient.js               # Phase 1: Google Search Console API
        ├── pageMapper.js              # Phase 1: Page mapping
        ├── decisionEngine.js          # Phase 2: Decision logic (NO LLM)
        ├── contentGenerator.js        # Phase 3: Content generation (LLM)
        ├── seoAgent.js                # Main orchestrator
        └── scheduler.js               # Cron job scheduler
```

## Integration with Fixlo

To integrate the agent into the main Fixlo server:

1. **Mount routes** in `server/index.js`:
   ```javascript
   const seoAgentRoutes = require('./routes/seoAgent');
   app.use('/api/seo-agent', seoAgentRoutes);
   ```

2. **Initialize scheduler** in `server/index.js`:
   ```javascript
   const { getSEOAgentScheduler } = require('./services/seo/scheduler');
   getSEOAgentScheduler().initialize();
   ```

3. **Set environment variables** in production (Render, Vercel, etc.)

## Roadmap

- [ ] Frontend integration (actual page creation)
- [ ] Sitemap auto-update after page creation
- [ ] Advanced pattern matching with NLP
- [ ] A/B testing for meta tags
- [ ] Multi-language support
- [ ] Analytics dashboard UI
- [ ] Webhook notifications for important events

## License

Proprietary - Fixlo Inc.
