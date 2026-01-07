# Fixlo Distribution Engine

**Internal infrastructure for expanding Fixlo's online visibility, SEO surface area, and brand presence.**

## Overview

The Distribution Engine is a compliant, safety-first system for programmatic SEO and content distribution. It operates entirely within Fixlo's infrastructure and follows strict safety principles.

## Core Principles

✅ **Safe & Compliant**
- No scraping private data
- No fake reviews
- No automated logins where forbidden
- No comment spam
- No keyword stuffing
- No identical content duplication

✅ **Instant Disable**
- Single environment variable (`DISTRIBUTION_ENGINE_ENABLED=false`) stops everything
- Emergency stop endpoint available
- Self-healing monitors prevent runaway growth

✅ **Quality First**
- Unique content generation with variation engine
- Minimum word count and quality checks
- Content fingerprint tracking to prevent duplication
- Human-readable, helpful content only

## Architecture

```
server/services/distribution/
├── index.js              # Main orchestrator
├── config.js             # Configuration management
├── logger.js             # Comprehensive logging & audit trail
├── contentGenerator.js   # Content generation with variation
├── rateLimiter.js        # Publishing velocity control
├── monitor.js            # Monitoring & self-healing
├── sitemapManager.js     # Automatic sitemap updates
├── socialEcho.js         # Social content preparation (no auto-post)
└── ownedNetwork.js       # Owned domain export (manual only)
```

## Features

### 1. Programmatic SEO Expansion
- Generates SEO pages for service + city combinations
- "Near me" and emergency variants
- Seasonal variants
- Bilingual support (English + Spanish)
- Unique content with AI-powered variation
- FAQ schema generation

### 2. Publishing Rate Control
- Daily, hourly, and per-route limits
- Randomized publish timing
- Cooldown logic
- Queue management
- Never publishes everything at once

### 3. Content Variation Engine
- Unique structure for every page
- Synonym rotation
- Template variation
- Content fingerprint tracking
- Quality validation

### 4. Indexing & Discovery Layer
- Automatic sitemap updates
- Sitemap segmentation (5000 URLs per file)
- Search engine pinging
- Index status tracking
- Retry logic for non-indexed pages

### 5. Owned Authority Network (Config-Ready)
- Export content as Markdown/HTML
- API payload generation
- **Manual publishing only** - no automation
- Multi-domain configuration support

### 6. Social Echo (Low Risk Only)
- Generate social-ready summaries
- Platform-specific formatting
- Scheduling payload preparation
- **NO AUTO-POSTING** - preparation only
- Educational tone focus

### 7. Monitoring & Self-Healing
- Track pages created, indexed, ignored
- Crawl error detection
- Automatic slowdown when issues detected
- Auto-pause for critical issues
- Content rewrite flagging

## Configuration

All configuration is done via environment variables in `.env`:

```bash
# Master toggle
DISTRIBUTION_ENGINE_ENABLED=false

# Rate limits
DISTRIBUTION_MAX_PAGES_PER_DAY=50
DISTRIBUTION_MAX_PAGES_PER_HOUR=5
DISTRIBUTION_MIN_INTERVAL_MINUTES=15

# Content quality
DISTRIBUTION_MIN_WORD_COUNT=300
DISTRIBUTION_REQUIRE_FAQ=true

# Monitoring
DISTRIBUTION_AUTO_SLOWDOWN=true
DISTRIBUTION_AUTO_PAUSE=true
```

See `.env.example` for complete configuration options.

## API Endpoints

All endpoints require admin authentication and are prefixed with `/api/distribution`:

### Status & Monitoring
- `GET /status` - Get engine status
- `GET /report` - Get detailed status report with recommendations
- `GET /config` - Get current configuration

### Operations
- `POST /initialize` - Initialize the engine
- `POST /generate` - Generate pages for service+city combinations
- `POST /generate-single` - Generate a single page
- `POST /process-queue` - Process publishing queue
- `POST /check-indexing` - Check indexing status
- `POST /update-sitemap` - Update sitemap files

### Control
- `POST /emergency-stop` - Emergency disable
- `POST /deactivate-slowdown` - Deactivate slowdown mode
- `POST /deactivate-pause` - Deactivate pause mode

## Usage

### 1. Enable the Engine

```bash
# In .env
DISTRIBUTION_ENGINE_ENABLED=true
```

### 2. Initialize

```bash
curl -X POST http://localhost:3001/api/distribution/initialize \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 3. Generate Pages

```bash
# Generate pages for a service across all major cities
curl -X POST http://localhost:3001/api/distribution/generate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service": "plumbing",
    "limit": 10
  }'
```

### 4. Monitor Status

```bash
curl http://localhost:3001/api/distribution/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 5. Get Recommendations

```bash
curl http://localhost:3001/api/distribution/report \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Testing

Run the test suite:

```bash
cd server
node test-distribution-engine.js
```

This validates:
- Configuration
- Engine initialization
- Content generation
- Quality checks
- Safety guardrails
- Rate limiting
- Monitoring

## Safety Guardrails

### Automatic Protections

1. **Rate Limiting**: Hard caps on daily/hourly publishing
2. **Cooldown**: Automatic pauses when issues detected
3. **Content Fingerprinting**: Prevents duplicate content
4. **Quality Validation**: Enforces minimum standards
5. **Self-Healing**: Slows or pauses when metrics degrade

### Manual Safety

1. **No Auto-Posting**: Social content requires manual approval
2. **No Auto-Publishing**: Owned network content requires manual action
3. **Emergency Stop**: Instant disable via API or environment variable
4. **Audit Trail**: All actions logged

### What Will NEVER Happen

- ❌ Automated logins to third-party platforms
- ❌ Mass posting to Reddit, forums, or social media
- ❌ Scraping private data
- ❌ Creating fake reviews
- ❌ Hidden redirects or cloaking
- ❌ Keyword stuffing
- ❌ Identical content duplication

## Monitoring

### Key Metrics

- **Index Rate**: Percentage of published pages that get indexed
- **Error Rate**: Percentage of crawl errors
- **Velocity**: Pages created per day/hour
- **Queue Length**: Pages waiting to be published

### Health Indicators

✅ **Healthy**
- Index rate > 50%
- Error rate < 10%
- No slowdown or pause active

⚠️ **Warning** (Auto-slowdown may activate)
- Index rate 30-50%
- Error rate 10-20%

🛑 **Critical** (Auto-pause may activate)
- Index rate < 30%
- Error rate > 20%

## Logging

All actions are logged to `logs/distribution/`:

- `distribution-YYYY-MM-DD.log` - General logs
- `audit-YYYY-MM-DD.log` - Audit trail of all actions

Logs include:
- Page generation events
- Publishing events
- Rate limit hits
- Indexing checks
- Auto-slowdown/pause activations
- Safety guardrail triggers

## Output Directories

- `distribution-output/` - Exported content for owned domains
- `social-output/` - Social media scheduling payloads

Both are gitignored and for manual review only.

## Deployment

The Distribution Engine is included in the backend deployment but disabled by default.

To enable in production:

1. Set `DISTRIBUTION_ENGINE_ENABLED=true` in production environment
2. Configure rate limits appropriately
3. Enable monitoring and alerts
4. Review generated content regularly
5. Monitor Search Console for issues

## Compliance

The Distribution Engine is designed for long-term sustainable growth:

- **Google Guidelines**: Follows webmaster guidelines
- **Content Quality**: Human-readable, helpful content
- **Natural Growth**: Rate-limited, randomized timing
- **Transparency**: No hidden techniques or cloaking
- **Defensible**: All automation is compliant and documented

## Success Criteria

- ✅ Increased indexed pages over time
- ✅ Increased impressions in Search Console
- ✅ No manual penalties from search engines
- ✅ No platform complaints
- ✅ Sustainable long-term growth
- ✅ Zero safety incidents

## Troubleshooting

### Engine won't initialize
- Check `DISTRIBUTION_ENGINE_ENABLED=true` in .env
- Verify configuration values are valid
- Check logs for specific errors

### No pages being published
- Check rate limits (may be at capacity)
- Check if in cooldown or pause mode
- Check queue length via status endpoint

### Low indexing rate
- Engine will auto-slowdown
- Review content quality
- Check for technical issues with pages
- Verify sitemap is updating

### Emergency situations
- Use `/emergency-stop` endpoint
- Or set `DISTRIBUTION_ENGINE_ENABLED=false`
- Engine stops immediately

## Future Enhancements

Potential additions (not yet implemented):

- Google Search Console API integration for real indexing data
- A/B testing for content templates
- Machine learning for optimal timing
- Automatic content improvement based on performance
- Multi-language expansion beyond English/Spanish
- Integration with analytics for ROI tracking

## Support

For questions or issues:

1. Check logs in `logs/distribution/`
2. Review status report via API
3. Run test suite to validate setup
4. Contact development team if issues persist

---

**Built as infrastructure, not a hack.**
**Designed for scale and safety.**
**Ready to grow Fixlo responsibly.**
