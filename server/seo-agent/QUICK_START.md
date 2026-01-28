# SEO Agent Quick Start Guide

## Setup (5 minutes)

### 1. Install Dependencies (Already Done)
```bash
cd server
npm install
```

### 2. Configure Environment Variables

Add to `/server/.env`:

```bash
# Google Search Console API (REQUIRED for production)
GSC_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GSC_SITE_URL=https://www.fixloapp.com

# Google Indexing API (Optional but recommended)
GOOGLE_INDEXING_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# OpenAI API (Already configured)
OPENAI_API_KEY=sk-your_key_here

# MongoDB (Already configured)
MONGODB_URI=your_mongodb_connection

# SEO Agent Control
SEO_AGENT_ENABLED=false  # Set to true when ready
```

### 3. Test Manually

```bash
# Test daily run (dry run with mock data)
npm run seo-agent:daily

# Test weekly run
npm run seo-agent:weekly

# Or run directly:
node seo-agent/index.js daily
node seo-agent/index.js weekly
```

### 4. Set Up Automation

**Option A: Cron Jobs (VPS/Dedicated Server)**

```bash
# Edit crontab
crontab -e

# Add these lines (update paths):
0 3 * * * cd /path/to/server && node seo-agent/index.js daily >> logs/seo-agent-daily.log 2>&1
0 4 * * 0 cd /path/to/server && node seo-agent/index.js weekly >> logs/seo-agent-weekly.log 2>&1
```

**Option B: Render Cron Jobs**

1. Go to Render Dashboard
2. Create new Cron Job
3. Set command: `cd server && node seo-agent/index.js daily`
4. Set schedule: `0 3 * * *` (3 AM daily)
5. Repeat for weekly job

**Option C: Node-Cron (In-Process)**

Add to `server/index.js`:

```javascript
const cron = require('node-cron');

if (process.env.SEO_AGENT_ENABLED === 'true') {
  // Daily at 3 AM
  cron.schedule('0 3 * * *', () => {
    require('./seo-agent/daily').runDaily();
  });
  
  // Weekly Sunday at 4 AM
  cron.schedule('0 4 * * 0', () => {
    require('./seo-agent/weekly').runWeekly();
  });
  
  console.log('✅ SEO Agent scheduled tasks enabled');
}
```

## Google Search Console Setup

### 1. Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project or select existing
3. Enable Search Console API
4. Create Service Account
5. Download JSON key

### 2. Grant Access

1. Go to [Search Console](https://search.google.com/search-console)
2. Select property (fixloapp.com)
3. Settings → Users and permissions
4. Add service account email as user
5. Grant "Full" permissions

### 3. Test Connection

```bash
# Set GSC_SERVICE_ACCOUNT_KEY in .env
# Then test:
node seo-agent/index.js daily
```

## Monitoring

### Check Logs

```bash
# Daily logs
tail -f logs/seo-agent-daily.log

# Weekly logs
tail -f logs/seo-agent-weekly.log

# All SEO agent activity
grep "SEO Agent" logs/*.log
```

### Query Database

```bash
# MongoDB shell
mongosh "$MONGODB_URI"

# Count SEO pages
db.seopages.countDocuments({ 'metadata.createdBy': 'seo-agent' })

# Recent pages
db.seopages.find({ 'metadata.createdBy': 'seo-agent' }).sort({ createdAt: -1 }).limit(10)

# Frozen winners
db.seopages.find({ status: 'frozen' })

# Top performers
db.seopages.find().sort({ 'performance.ctr': -1 }).limit(10)
```

### Monitor Metrics

After 7 days:
- Check indexed pages count
- Monitor impressions trend
- Track CTR improvements
- Measure lead generation

After 30 days:
- Full evaluation
- Decide to expand or adjust
- Document learnings

## Safety Features

### Kill Switch

Automatically stops if:
- Clicks drop > 30%
- Index errors > 10%
- Suspicious patterns detected

### Rate Limits

- Max 5 new pages per day
- Max 10 meta rewrites per day
- Max 5 content expansions per day
- Max 10 clones per week

### Frozen Pages

Winners (CTR > 5%, Position ≤ 3) are automatically frozen.

## Troubleshooting

### "GSC_SERVICE_ACCOUNT_KEY not configured"

Set environment variable with JSON key from Google Cloud.

### "SEOPage model not found"

Database connection issue. Check MONGODB_URI.

### "OpenAI not configured"

Set OPENAI_API_KEY in .env.

### No pages created

Check GSC data has queries matching criteria (impressions ≥ 100, position 8-30).

### Kill switch triggered

Check recent metrics. If false alarm, adjust thresholds in `config/thresholds.js`.

## Expanding Scope

After 30-45 days of success:

1. Edit `config/thresholds.js`:
   - Increase MAX_SERVICES to 5-9
   - Increase MAX_CITIES to 50-100
   - Add more states

2. Update `learning/extractPatterns.js`:
   - Add more target cities
   - Add more states

3. Monitor closely for first week after expansion

## Support

Questions? Check:
- README.md in seo-agent directory
- Log files for detailed execution info
- Test results: `node test-seo-agent.js`
