# 🎯 Fixlo Lead Hunter - User Guide

**Autonomous intelligence system for opportunity detection** - Advisory role, safe by default.

## Overview

The Fixlo Lead Hunter is a companion system to the SEO Agent that:
- Detects market opportunities by analyzing competitor rankings
- Identifies cities and services where Fixlo can expand
- Proposes opportunities to the SEO Agent (advisory role only)
- Optimizes SEO Agent thresholds through performance analysis
- **NEVER publishes content directly** - SEO Agent remains in control

## Quick Start

### 1. Observer Mode (Default, Safe)

Run intelligence gathering without any risk:

```bash
cd /path/to/server
node lead-hunter/index.js observer
```

This will:
- ✅ Analyze competitor rankings (mocked data by default)
- ✅ Identify market gaps
- ✅ Score and prioritize opportunities
- ✅ Log results to `logs/lead-hunter-opportunities-YYYY-MM-DD.json`
- ❌ NO actions taken
- ❌ NO SEO Agent interaction

**Safe to run daily via cron.**

### 2. Tuning Mode

Analyze SEO Agent performance and get threshold recommendations:

```bash
node lead-hunter/index.js tuning
```

This will:
- ✅ Read SEO Agent performance metrics
- ✅ Analyze CTR, position, and impression patterns
- ✅ Generate threshold adjustment recommendations
- ✅ Log results to `logs/lead-hunter-tuning-YYYY-MM-DD.json`
- ❌ NO automatic threshold changes
- ❌ Manual review required

**Safe to run weekly.**

### 3. Guarded Mode (Requires Opt-In)

Feed high-priority opportunities to the SEO Agent:

```bash
# First, enable guarded mode in .env
echo "LEAD_HUNTER_MODE=guarded" >> .env

# Run guarded mode
LEAD_HUNTER_MODE=guarded node lead-hunter/index.js guarded
```

This will:
- ✅ Read opportunities from observer mode logs
- ✅ Filter by score threshold (default: >= 60)
- ✅ Create proposal files in `proposals/pending/`
- ✅ SEO Agent evaluates proposals independently
- ❌ NO direct publishing
- ❌ SEO Agent decides whether to act

**Requires explicit opt-in. Test with --dry-run first.**

## Operating Modes

### Observer Mode

**Purpose**: Intelligence gathering only.

**Safety Level**: 🟢 Maximum (read-only)

**What it does**:
1. Fetches competitor ranking data (mocked by default)
2. Compares to existing Fixlo pages
3. Identifies gaps and opportunities
4. Scores opportunities by priority
5. Logs everything to JSON files

**What it doesn't do**:
- ❌ Does NOT call external APIs (uses mocks)
- ❌ Does NOT write to database
- ❌ Does NOT trigger SEO Agent
- ❌ Does NOT create proposals

**Output**:
```
logs/lead-hunter-opportunities-2024-01-29.json
```

**Example output**:
```json
{
  "timestamp": "2024-01-29T12:00:00.000Z",
  "mode": "observer",
  "count": 23,
  "opportunities": [
    {
      "type": "CITY_GAP",
      "service": "plumbing",
      "city": "Austin",
      "state": "TX",
      "competitorPosition": 3,
      "competitor": "homeadvisor",
      "reason": "homeadvisor ranks at position 3, Fixlo has no page",
      "score": 85,
      "priority": "HIGH"
    }
  ]
}
```

**Activation**:
```bash
# Default mode
node lead-hunter/index.js observer

# Or explicitly via environment
LEAD_HUNTER_MODE=observer node lead-hunter/index.js
```

**Recommended schedule**: Daily

---

### Guarded Mode

**Purpose**: Feed opportunities to SEO Agent with safety controls.

**Safety Level**: 🟡 Medium (requires opt-in)

**What it does**:
1. Reads opportunities from observer mode logs
2. Filters by minimum score (default: 60)
3. Checks rate limits (default: max 10/day)
4. Creates proposal files for SEO Agent
5. Logs all actions

**What it doesn't do**:
- ❌ Does NOT bypass SEO Agent decision logic
- ❌ Does NOT publish pages directly
- ❌ Does NOT modify database
- ❌ Does NOT force SEO Agent to act

**Output**:
```
proposals/pending/proposal-<uuid>.json
logs/lead-hunter-guarded-2024-01-29.log
```

**Example proposal**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "action": "CREATE_PAGE",
  "service": "plumbing",
  "city": "Austin",
  "state": "TX",
  "reason": "homeadvisor ranks at position 3, Fixlo has no page",
  "score": 85,
  "priority": "HIGH",
  "submittedAt": "2024-01-29T12:00:00.000Z",
  "source": "lead-hunter",
  "status": "pending"
}
```

**Activation**:
```bash
# Requires explicit opt-in
echo "LEAD_HUNTER_MODE=guarded" >> .env
LEAD_HUNTER_MODE=guarded node lead-hunter/index.js guarded

# Test with dry run first
LEAD_HUNTER_MODE=guarded node lead-hunter/index.js guarded --dry-run
```

**Required environment variables**:
```bash
LEAD_HUNTER_MODE=guarded  # Explicit opt-in (REQUIRED)
LEAD_HUNTER_MAX_DAILY_FEEDS=10  # Max proposals per day (optional)
LEAD_HUNTER_MIN_OPPORTUNITY_SCORE=60  # Minimum score to feed (optional)
```

**Recommended schedule**: Daily (after observer mode)

**Integration with SEO Agent**:

The SEO Agent can be modified to read proposal files and evaluate them:

```javascript
// In SEO Agent's daily run, add:
const proposals = readProposals(); // Read from proposals/pending/
const decisions = [...existingDecisions, ...evaluateProposals(proposals)];
// SEO Agent applies its own rules to proposals
```

**Critical**: SEO Agent retains full decision authority. It can reject any proposal.

---

### Tuning Mode

**Purpose**: Optimize SEO Agent thresholds based on performance data.

**Safety Level**: 🟢 Maximum (read-only)

**What it does**:
1. Reads SEO Agent performance metrics (last 30 days)
2. Analyzes CTR patterns by position
3. Evaluates impression thresholds
4. Generates threshold recommendations
5. Logs recommendations with supporting data

**What it doesn't do**:
- ❌ Does NOT modify thresholds automatically
- ❌ Does NOT change SEO Agent configuration
- ❌ Requires manual review and application

**Output**:
```
logs/lead-hunter-tuning-2024-01-29.json
```

**Example recommendations**:
```json
{
  "timestamp": "2024-01-29T12:00:00.000Z",
  "count": 3,
  "recommendations": [
    {
      "type": "CTR_THRESHOLD",
      "threshold": "LOW_CTR_THRESHOLD",
      "currentValue": 0.02,
      "recommendedValue": 0.025,
      "reason": "Average CTR (2.8%) above current low threshold (2.0%)",
      "impact": "Fewer pages flagged for meta rewrite",
      "confidence": "MEDIUM"
    }
  ]
}
```

**Activation**:
```bash
# Default: last 30 days
node lead-hunter/index.js tuning

# Custom time range
node lead-hunter/index.js tuning --days=60
```

**Applying recommendations**:

After reviewing recommendations:

1. Open `/server/seo-agent/config/thresholds.js`
2. Update threshold values
3. Test SEO Agent with new values
4. Monitor performance

**Recommended schedule**: Weekly

---

## Configuration

### Environment Variables

Add to `/server/.env`:

```bash
# Lead Hunter Mode
LEAD_HUNTER_MODE=observer  # observer | guarded | tuning
LEAD_HUNTER_ENABLED=true   # Master enable/disable

# Guarded Mode Settings
LEAD_HUNTER_MAX_DAILY_FEEDS=10  # Max proposals per day
LEAD_HUNTER_MIN_OPPORTUNITY_SCORE=60  # Minimum score to feed

# External API Settings (future)
SERP_API_KEY=your_key_here
SERP_API_ENABLED=false  # Start with false (use mocks)
SERP_API_RATE_LIMIT=100  # Calls per hour

# Safety Settings
LEAD_HUNTER_TIMEOUT_MS=5000  # External call timeout
LEAD_HUNTER_LOCK_TIMEOUT_MIN=60  # Lock expiry time
```

### Configuration Files

Located in `/server/lead-hunter/config/`:

- `modes.js` - Mode definitions and characteristics
- `limits.js` - Rate limits and safety bounds
- `dataSources.js` - Data source configurations

## Automated Scheduling

### Using Cron

Add to crontab:

```bash
# Observer mode - daily at 2am UTC
0 2 * * * cd /path/to/server && node lead-hunter/index.js observer >> logs/lead-hunter-observer.log 2>&1

# Guarded mode - daily at 3am UTC (after observer)
0 3 * * * cd /path/to/server && LEAD_HUNTER_MODE=guarded node lead-hunter/index.js guarded >> logs/lead-hunter-guarded.log 2>&1

# Tuning mode - weekly on Sunday at 4am UTC
0 4 * * 0 cd /path/to/server && node lead-hunter/index.js tuning >> logs/lead-hunter-tuning.log 2>&1
```

### Deployment Considerations

**Phase 1: Observer Only (Week 1-2)**
- Run observer mode daily
- Review opportunity logs
- Validate detection logic
- NO guarded mode yet

**Phase 2: Add Tuning (Week 3-4)**
- Add weekly tuning mode
- Review threshold recommendations
- Test adjustments manually

**Phase 3: Enable Guarded (Week 5+)**
- Start with `MAX_DAILY_FEEDS=2`
- Monitor SEO Agent response
- Gradually increase limit

## Monitoring

### Logs

All logs are written to `/server/logs/`:

```
lead-hunter-observer-2024-01-29.log
lead-hunter-guarded-2024-01-29.log
lead-hunter-tuning-2024-01-29.log
lead-hunter-opportunities-2024-01-29.json
lead-hunter-tuning-2024-01-29.json
```

### Check Logs

```bash
# Observer logs
tail -f logs/lead-hunter-observer-$(date +%Y-%m-%d).log

# Guarded logs
tail -f logs/lead-hunter-guarded-$(date +%Y-%m-%d).log

# View opportunities
cat logs/lead-hunter-opportunities-$(date +%Y-%m-%d).json | jq .

# View tuning recommendations
cat logs/lead-hunter-tuning-$(date +%Y-%m-%d).json | jq .
```

### Rate Limits

Check current rate limit status:

```bash
# View rate limit state
node -e "const rl = require('./lead-hunter/safety/rateLimiter'); console.log(rl.getRateLimitStatus())"
```

## Troubleshooting

### "Lock already exists"

Another instance is running. Wait for it to complete or remove stale lock:

```bash
rm locks/lead-hunter-observer.lock
```

### "Guarded mode requires explicit opt-in"

Set environment variable:

```bash
export LEAD_HUNTER_MODE=guarded
# OR add to .env file
echo "LEAD_HUNTER_MODE=guarded" >> .env
```

### "No opportunities found"

Run observer mode first:

```bash
node lead-hunter/index.js observer
```

### "Daily proposal limit reached"

Rate limit exceeded. Wait until tomorrow or increase limit:

```bash
export LEAD_HUNTER_MAX_DAILY_FEEDS=20
```

## Safety Features

### 1. Lock Management

Prevents concurrent runs of the same mode:

- Lock files in `/server/locks/`
- Auto-cleanup after 60 minutes
- Graceful handling of signals (SIGINT, SIGTERM)

### 2. Rate Limiting

All external interactions are rate-limited:

- SERP API: 100/hour, 500/day
- Proposals: 10/day (guarded mode)
- Configurable via environment

### 3. Validation

All data is validated before processing:

- Input sanitization
- Type checking
- Boundary validation
- Error handling

### 4. Read-Only Default

Observer and tuning modes are read-only:

- NO database writes
- NO external API calls (mock data)
- NO SEO Agent interaction

### 5. Explicit Opt-In

Guarded mode requires explicit configuration:

- Environment variable check
- Cannot run accidentally
- Full logging and audit trail

## Architecture

For detailed architecture documentation, see:
- [ARCHITECTURE.md](./ARCHITECTURE.md)

## Integration with SEO Agent

Lead Hunter and SEO Agent are **completely separate**:

- Lead Hunter: Intelligence and proposals
- SEO Agent: Evaluation and execution

**Lead Hunter does NOT modify SEO Agent code.**

Integration happens via proposal files:

```
Lead Hunter (guarded) → proposals/pending/*.json
                            ↓
SEO Agent (optional) → Read proposals
                            ↓
SEO Agent → Evaluate with own rules
                            ↓
SEO Agent → Execute or reject
```

## What This Is NOT

❌ A content publisher  
❌ A replacement for SEO Agent  
❌ An autonomous executor  
❌ A dashboard or UI  

## What This IS

✅ An intelligence layer  
✅ An opportunity detector  
✅ A proposal generator  
✅ A performance optimizer  
✅ A safe, advisory system  

## Success Metrics

After 30 days:

**Observer Mode**:
- Opportunities detected: 10-50/day
- Accuracy rate: >80%
- Zero false positives

**Guarded Mode**:
- Proposals fed: 5-10/day
- SEO Agent acceptance rate: >50%
- Pages created: 3-7/day

**Tuning Mode**:
- Recommendations: 1-2/week
- Implementation rate: >50%
- Performance improvement: >10%

## Support

For issues or questions:
1. Check logs in `/server/logs/`
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Verify configuration in `.env`
4. Check rate limits and locks

## License

Same as parent Fixlo application.
