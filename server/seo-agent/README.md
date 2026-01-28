# 🧠 Fixlo SEO Domination Agent

**Autonomous SEO growth infrastructure** - Backend only, no UI, no buttons.

## Overview

The Fixlo SEO Domination Agent is an autonomous system that:
- Analyzes Google Search Console data
- Makes rule-based decisions about page creation and optimization
- Uses AI only for content generation (never for decisions)
- Operates on a schedule via cron jobs
- Self-monitors with safety kill switch

## Architecture

```
/server/seo-agent/
├── index.js              # Entry point (daily/weekly mode selector)
├── daily.js              # Daily orchestrator
├── weekly.js             # Weekly orchestrator
├── /config/              # Configuration (thresholds, benchmarks)
│   ├── thresholds.js
│   └── ctrBenchmarks.js
├── /ingestion/           # Data fetching
│   ├── fetchGSC.js       # Google Search Console data
│   └── fetchFixloPages.js
├── /decisions/           # Rule-based logic (NO LLM)
│   ├── decideCreatePage.js
│   ├── decideRewriteMeta.js
│   ├── decideExpandContent.js
│   ├── decideFreezePage.js
│   └── decideCloneWinners.js
├── /actions/             # Execution (LLM allowed)
│   ├── createPage.js     # ✅ Uses OpenAI
│   ├── rewriteMeta.js    # ✅ Uses OpenAI
│   ├── expandContent.js  # ✅ Uses OpenAI
│   └── submitIndexing.js
├── /learning/            # Weekly analysis
│   ├── evaluateWeekly.js
│   └── extractPatterns.js
└── /safety/              # Kill switch
    └── killSwitch.js
```

## What OpenAI Is Used For

| Task | LLM Allowed |
|------|-------------|
| Page titles | ✅ Yes |
| Meta descriptions | ✅ Yes |
| FAQ content | ✅ Yes |
| Content blocks | ✅ Yes |
| Decisions | ❌ NO |
| Scheduling | ❌ NO |
| Learning logic | ❌ NO |

## Usage

### Manual Execution

```bash
# Daily run (from server directory)
node seo-agent/index.js daily

# Weekly run
node seo-agent/index.js weekly
```

### Automated via Cron (Production)

Add to crontab:
```bash
# Daily at 3am UTC
0 3 * * * cd /path/to/server && node seo-agent/index.js daily >> logs/seo-agent-daily.log 2>&1

# Weekly on Sunday at 4am UTC
0 4 * * 0 cd /path/to/server && node seo-agent/index.js weekly >> logs/seo-agent-weekly.log 2>&1
```

## Configuration

### Environment Variables

Required in `/server/.env`:

```bash
# Google Search Console API
GSC_SERVICE_ACCOUNT_KEY=your_service_account_json_key
GSC_SITE_URL=https://www.fixloapp.com

# Google Indexing API
GOOGLE_INDEXING_SERVICE_ACCOUNT_KEY=your_indexing_key

# OpenAI (already configured)
OPENAI_API_KEY=sk-your_key_here

# MongoDB (already configured)
MONGODB_URI=your_mongodb_connection

# SEO Agent Control
SEO_AGENT_ENABLED=false  # Enable autonomous operation
SEO_AGENT_MODE=safe      # 'safe' or 'aggressive'
```

### Initial Scope (SAFE START)

The agent is intentionally limited to prove itself:

- **Services**: 2 (plumbing, electrical)
- **Cities**: 10-20 (California only)
- **State**: 1 (California)
- **Duration**: 30 days trial

After 30-45 days, evaluate:
- Indexed pages ↑
- Impressions ↑
- CTR ↑
- Leads ↑

## How It Works

### Daily Run Flow

1. **Safety Check** - Verify no critical metrics drop
2. **Fetch Data** - Get GSC queries + existing pages
3. **Make Decisions** - Apply rules (NO LLM):
   - Create pages for high-impression queries (position 8-30)
   - Rewrite meta for underperforming CTR
   - Expand content for top 10 positions
   - Freeze winners (protect top performers)
4. **Execute Actions** - Generate content (LLM allowed)
5. **Log Results** - Track what happened

### Weekly Run Flow

1. **Evaluate Performance** - Analyze past week
2. **Extract Patterns** - Identify what works
3. **Clone Winners** - Replicate success to new locations

## Safety Features

### Kill Switch

Automatically halts if:
- Clicks drop >30%
- Index errors >10%
- Suspicious patterns detected

### Limits

- Max 5 new pages per daily run
- Max 10 meta rewrites per daily run
- Max 5 content expansions per daily run
- Max 10 clones per weekly run

### Frozen Pages

Winners (high CTR + top 3 position) are automatically frozen to prevent changes.

## Decision Logic Examples

### Create Page Rule

```javascript
✅ Impressions >= 100
✅ Position between 8-30
✅ Service in allowed list
✅ City in scope
✅ Page doesn't exist
→ CREATE PAGE
```

### Rewrite Meta Rule

```javascript
✅ Impressions >= 50
✅ Position 1-20
✅ CTR < expected for position
✅ Page exists
→ REWRITE META
```

## Monitoring

Check logs:
```bash
tail -f /path/to/server/logs/seo-agent-daily.log
tail -f /path/to/server/logs/seo-agent-weekly.log
```

Query database:
```javascript
// Find all SEO agent pages
db.seopages.find({ 'metadata.createdBy': 'seo-agent' })

// Find frozen winners
db.seopages.find({ status: 'frozen' })

// Top performers
db.seopages.find().sort({ 'performance.ctr': -1 }).limit(10)
```

## What This Is NOT

❌ A chatbot  
❌ A marketing tool  
❌ A dashboard  
❌ A manual system  

## What This IS

✅ Autonomous growth infrastructure  
✅ Self-optimizing SEO system  
✅ Rule-based decision engine  
✅ AI-powered content generator  

## Reality Check

This is how serious platforms win. Set it up, let it run, measure results after 30-45 days.

If metrics improve → expand scope  
If metrics don't → fix logic, not content
