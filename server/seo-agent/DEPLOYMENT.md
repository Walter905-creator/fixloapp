# 🚀 SEO Agent Deployment Guide

## Production Deployment Checklist

### Prerequisites
- [x] Node.js 18+ installed
- [ ] MongoDB connection configured
- [ ] OpenAI API key configured
- [ ] Google Search Console API access
- [ ] Google Indexing API access (optional)

### Step 1: Environment Configuration

Edit `/server/.env` and add:

```bash
# Required
OPENAI_API_KEY=sk-your_actual_key_here
MONGODB_URI=your_mongodb_connection_string

# Required for production (use mock data for testing)
GSC_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"..."}'
GSC_SITE_URL=https://www.fixloapp.com

# Optional but recommended
GOOGLE_INDEXING_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# Agent control
SEO_AGENT_ENABLED=false  # Set to true after testing
SEO_AGENT_MODE=safe      # Keep 'safe' for first 30 days
```

### Step 2: Google Cloud Setup

#### A. Enable APIs
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select or create project
3. Enable these APIs:
   - Search Console API
   - Indexing API

#### B. Create Service Account
```bash
# In Google Cloud Console:
1. IAM & Admin → Service Accounts
2. Create Service Account
   - Name: fixlo-seo-agent
   - Description: SEO automation for Fixlo
3. Grant role: Service Account User
4. Create JSON key → Download
```

#### C. Grant Search Console Access
```bash
# In Search Console:
1. Go to https://search.google.com/search-console
2. Select property: fixloapp.com
3. Settings → Users and permissions
4. Add User:
   - Email: service-account@project.iam.gserviceaccount.com
   - Permission: Full
```

### Step 3: Database Setup

The SEOPage model will be automatically created on first use.

Verify MongoDB connection:
```bash
cd server
node -e "require('dotenv').config(); require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('✅ Connected')).catch(e => console.error('❌', e))"
```

### Step 4: Testing

```bash
cd server

# Test with mock data (no API keys needed)
npm run seo-agent:daily
npm run seo-agent:weekly

# Verify test suite
node test-seo-agent.js

# Check logs
ls -lh logs/seo-agent*.log
```

Expected output:
- ✅ Safety check passes
- ✅ Mock GSC data generated
- ✅ Decisions made
- ⚠️ Actions fail (no OpenAI key) - this is OK for testing

### Step 5: Production Test with Real APIs

```bash
# Set OPENAI_API_KEY and GSC_SERVICE_ACCOUNT_KEY in .env
# Then run:
npm run seo-agent:daily

# Check results:
# - Real GSC data fetched
# - Pages created (if opportunities found)
# - Check MongoDB for new SEOPage documents
```

### Step 6: Automation Setup

Choose one option:

#### Option A: Cron Jobs (Recommended for VPS)

```bash
# Create logs directory
mkdir -p logs

# Edit crontab
crontab -e

# Add (replace PATH):
PATH=/home/runner/work/fixloapp/fixloapp/server

# Daily at 3 AM UTC
0 3 * * * cd $PATH && node seo-agent/index.js daily >> logs/seo-agent-daily.log 2>&1

# Weekly Sunday 4 AM UTC
0 4 * * 0 cd $PATH && node seo-agent/index.js weekly >> logs/seo-agent-weekly.log 2>&1

# Verify cron is running
crontab -l
```

#### Option B: Render Cron Jobs

```yaml
# In render.yaml or Dashboard:
services:
  - type: cron
    name: seo-agent-daily
    env: docker
    schedule: "0 3 * * *"
    buildCommand: cd server && npm install
    startCommand: node seo-agent/index.js daily
    
  - type: cron
    name: seo-agent-weekly
    env: docker
    schedule: "0 4 * * 0"
    buildCommand: cd server && npm install
    startCommand: node seo-agent/index.js weekly
```

#### Option C: In-Process (node-cron)

Add to `/server/index.js` after Express setup:

```javascript
// SEO Agent Scheduler (if enabled)
if (process.env.SEO_AGENT_ENABLED === 'true') {
  const cron = require('node-cron');
  
  // Daily at 3 AM
  cron.schedule('0 3 * * *', async () => {
    console.log('🤖 Running SEO Agent (daily)...');
    try {
      await require('./seo-agent/daily').runDaily();
    } catch (error) {
      console.error('❌ SEO Agent daily run failed:', error);
    }
  });
  
  // Weekly Sunday 4 AM
  cron.schedule('0 4 * * 0', async () => {
    console.log('🤖 Running SEO Agent (weekly)...');
    try {
      await require('./seo-agent/weekly').runWeekly();
    } catch (error) {
      console.error('❌ SEO Agent weekly run failed:', error);
    }
  });
  
  console.log('✅ SEO Agent autonomous mode ENABLED');
}
```

### Step 7: Monitoring

#### Daily Checks (First Week)

```bash
# Check logs
tail -f logs/seo-agent-daily.log

# Count new pages
mongosh "$MONGODB_URI" --eval "db.seopages.countDocuments({'metadata.createdBy':'seo-agent'})"

# Check recent pages
mongosh "$MONGODB_URI" --eval "db.seopages.find({'metadata.createdBy':'seo-agent'}).sort({createdAt:-1}).limit(5).pretty()"
```

#### Weekly Metrics

Track in spreadsheet:
| Week | Pages Created | Impressions | Clicks | CTR | Leads |
|------|--------------|-------------|---------|-----|-------|
| 1    | ?            | ?           | ?       | ?   | ?     |
| 2    | ?            | ?           | ?       | ?   | ?     |
| ...  | ...          | ...         | ...     | ... | ...   |

#### Alert Setup

```bash
# Add to cron:
# Check for failures and email alert
5 3 * * * grep -q "❌" logs/seo-agent-daily.log && echo "SEO Agent failed - check logs" | mail -s "SEO Agent Alert" admin@fixloapp.com
```

### Step 8: 30-Day Evaluation

After 30-45 days, evaluate:

✅ **Success Indicators:**
- Indexed pages increased
- Impressions trending up
- CTR improving
- Leads increasing
- No kill switch triggers

❌ **Warning Signs:**
- No new pages indexed
- Impressions flat or down
- Kill switch frequent triggers
- Content quality issues

### Step 9: Expansion (If Successful)

Edit `/server/seo-agent/config/thresholds.js`:

```javascript
// Expand scope gradually
MAX_SERVICES: 5,  // Was 2
MAX_CITIES: 50,   // Was 20
MAX_STATES: 3,    // Was 1
```

Monitor closely for first week after expansion.

## Rollback Plan

If things go wrong:

```bash
# 1. Disable agent
# Set in .env:
SEO_AGENT_ENABLED=false

# 2. Stop cron jobs
crontab -e
# Comment out SEO agent lines

# 3. Mark problematic pages
mongosh "$MONGODB_URI"
db.seopages.updateMany(
  {'metadata.createdBy': 'seo-agent'},
  {$set: {status: 'draft'}}
)

# 4. Review and fix issues
# 5. Re-test manually before re-enabling
```

## Support Contacts

- **Technical Issues**: Check logs first
- **API Issues**: Google Cloud Console
- **Database Issues**: MongoDB Atlas
- **Content Issues**: Review OpenAI prompts in actions/

## Success Metrics Dashboard

Create at: `/admin/seo-agent-stats`

Display:
- Total pages created
- Average CTR
- Top performers
- Recent activity
- Kill switch history
- Weekly trends

## Maintenance

### Weekly Tasks
- Review logs for errors
- Check top performing pages
- Monitor kill switch triggers
- Verify GSC data sync

### Monthly Tasks
- Evaluate performance metrics
- Adjust thresholds if needed
- Review content quality
- Plan scope expansion

### Quarterly Tasks
- Full performance review
- Content audit
- Competitor analysis
- Strategy refinement

## Troubleshooting

See QUICK_START.md for common issues and solutions.

## Legal Compliance

Ensure:
- [ ] Content is accurate and not misleading
- [ ] Local service claims are verifiable
- [ ] No trademark violations
- [ ] Privacy policy updated for generated content
- [ ] Terms of service cover automated content

---

**Remember:** This is autonomous growth infrastructure. Set it up correctly once, then let it run and measure results.
