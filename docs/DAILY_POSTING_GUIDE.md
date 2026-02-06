# Daily Automated Posting - Complete Guide

## Overview

The Daily Poster feature automatically generates and publishes one post per day to your Facebook Business page (and optionally Instagram). Posts are created with AI-generated content that rotates through different themes and topics throughout the week.

---

## Quick Start

### 1. Enable Daily Posting

```bash
# Add to server/.env
SOCIAL_DAILY_POST_ENABLED=true
SOCIAL_DAILY_POST_GENERATE_TIME="0 6 * * *"  # Generate at 6 AM daily
SOCIAL_DAILY_POST_PUBLISH_TIME="10:00"        # Publish at 10 AM daily
SOCIAL_DAILY_POST_CITY="Miami"                # Your city for localized content
SOCIAL_DAILY_POST_REQUIRE_APPROVAL=false      # Auto-publish without approval
```

### 2. Start Daily Poster

```bash
curl -X POST https://fixloapp.com/api/social/daily-poster/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Verify It's Running

```bash
curl https://fixloapp.com/api/social/daily-poster/status
```

**That's it!** Posts will now be generated daily at 6 AM and published at 10 AM.

---

## How It Works

### Daily Content Schedule

The system automatically rotates content types by day of week:

| Day | Content Type | Example Topic |
|-----|--------------|---------------|
| **Sunday** | General/Trust building | "Why homeowners trust Fixlo..." |
| **Monday** | Service highlight | "Expert plumbing services..." |
| **Tuesday** | Tips/Education | "5 signs you need HVAC maintenance..." |
| **Wednesday** | Service highlight | "Professional electrical repairs..." |
| **Thursday** | Seasonal content | "Winter home prep checklist..." |
| **Friday** | Weekend prep | "Get your home weekend-ready..." |
| **Saturday** | Success stories | "This week's home transformations..." |

### Posting Timeline

1. **6:00 AM** - AI generates content based on day's theme
2. **Content created** - Post is saved as "scheduled" or "pending_approval"
3. **10:00 AM** - Post is automatically published to Facebook
4. **Throughout day** - Analytics are collected

---

## Configuration Options

### Environment Variables

Add these to your `server/.env` file:

```bash
# Daily Posting Configuration
SOCIAL_DAILY_POST_ENABLED=true

# When to generate daily posts (cron format)
# Default: "0 6 * * *" (6 AM daily)
SOCIAL_DAILY_POST_GENERATE_TIME="0 6 * * *"

# When to publish posts (HH:MM format)
# Default: "10:00" (10 AM)
SOCIAL_DAILY_POST_PUBLISH_TIME="10:00"

# City for localized content
# Default: "Miami"
SOCIAL_DAILY_POST_CITY="Miami"

# Require manual approval before posting
# Default: false (auto-publish)
SOCIAL_DAILY_POST_REQUIRE_APPROVAL=false

# Platforms to post to (comma-separated)
# Default: meta_facebook,meta_instagram
SOCIAL_DAILY_POST_PLATFORMS=meta_facebook,meta_instagram
```

### Cron Time Format

The `SOCIAL_DAILY_POST_GENERATE_TIME` uses standard cron format:

```
 ┌──────────── minute (0 - 59)
 │ ┌────────── hour (0 - 23)
 │ │ ┌──────── day of month (1 - 31)
 │ │ │ ┌────── month (1 - 12)
 │ │ │ │ ┌──── day of week (0 - 6) (0=Sunday)
 │ │ │ │ │
 * * * * *
```

**Examples:**
- `0 6 * * *` - Every day at 6:00 AM
- `0 9 * * 1-5` - Weekdays only at 9:00 AM
- `0 8,12,18 * * *` - Three times daily (8 AM, 12 PM, 6 PM)

---

## API Endpoints

### Start Daily Poster

```bash
POST /api/social/daily-poster/start
```

**Request:**
```bash
curl -X POST https://fixloapp.com/api/social/daily-poster/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Daily poster started",
  "config": {
    "generateTime": "0 6 * * *",
    "publishTime": "10:00",
    "requiresApproval": false
  }
}
```

---

### Stop Daily Poster

```bash
POST /api/social/daily-poster/stop
```

**Request:**
```bash
curl -X POST https://fixloapp.com/api/social/daily-poster/stop \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Daily poster stopped"
}
```

---

### Get Status

```bash
GET /api/social/daily-poster/status
```

**Request:**
```bash
curl https://fixloapp.com/api/social/daily-poster/status
```

**Response:**
```json
{
  "success": true,
  "isEnabled": true,
  "config": {
    "generateTime": "0 6 * * *",
    "publishTime": "10:00",
    "requiresApproval": false,
    "defaultCity": "Miami",
    "contentTypes": ["service-specific", "general", "seasonal"],
    "services": ["plumbing", "electrical", "hvac", "landscaping"],
    "platforms": ["meta_facebook", "meta_instagram"]
  },
  "nextRunTime": "Based on cron schedule"
}
```

---

### Generate Post Now (Manual Trigger)

```bash
POST /api/social/daily-poster/generate-now
```

**Request:**
```bash
curl -X POST https://fixloapp.com/api/social/daily-poster/generate-now \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "meta_facebook"
  }'
```

**Optional parameters:**
```json
{
  "platform": "meta_facebook",
  "theme": {
    "contentType": "service-specific",
    "service": "plumbing"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Daily post generated successfully",
  "post": {
    "id": "post_id",
    "platform": "meta_facebook",
    "content": "Generated post content...",
    "scheduledFor": "2024-02-06T10:00:00.000Z",
    "status": "scheduled"
  }
}
```

---

### Update Configuration

```bash
POST /api/social/daily-poster/config
```

**Request:**
```bash
curl -X POST https://fixloapp.com/api/social/daily-poster/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "publishTime": "14:00",
    "requiresApproval": false,
    "defaultCity": "New York"
  }'
```

**Updatable fields:**
- `generateTime` - Cron schedule for content generation
- `publishTime` - Time of day to publish (HH:MM format)
- `requiresApproval` - Whether posts need manual approval
- `defaultCity` - City for localized content

**Response:**
```json
{
  "success": true,
  "message": "Configuration updated",
  "updated": {
    "publishTime": true,
    "requiresApproval": true,
    "defaultCity": true
  },
  "config": {
    "generateTime": "0 6 * * *",
    "publishTime": "14:00",
    "requiresApproval": false,
    "defaultCity": "New York"
  }
}
```

---

## Content Themes

### Service-Specific Content

Rotates through these services:
- Plumbing
- Electrical
- HVAC
- Landscaping
- General Maintenance

**Example:** "Need a reliable plumber in Miami? Our verified professionals are ready to help with leak repairs, installations, and emergency services. Book trusted local pros today! 🔧"

### General Content

Topics include:
- Trust building
- Homeowner tips
- Weekend prep
- Success stories

**Example:** "Homeowner tip: Regular HVAC maintenance can reduce your energy bills by up to 15%. Our verified pros offer comprehensive maintenance plans. Schedule your service today!"

### Seasonal Content

Adapts to current season:
- **Winter:** Frozen pipes, heating maintenance, weather prep
- **Spring:** Spring cleaning, landscaping, outdoor repairs
- **Summer:** AC maintenance, cooling systems, outdoor projects
- **Fall:** Heating prep, gutter cleaning, weatherization

**Example (Winter):** "❄️ Protect your home this winter! Our Miami professionals offer complete winterization services including pipe insulation, heating checks, and emergency repairs. Stay warm and worry-free!"

---

## Approval Workflow

### Auto-Publish Mode (Default)

When `requiresApproval` is `false`:
1. Content generated at 6 AM
2. Post scheduled for 10 AM
3. Automatically published at 10 AM

### Manual Approval Mode

When `requiresApproval` is `true`:
1. Content generated at 6 AM
2. Post status set to `pending_approval`
3. Admin reviews and approves post
4. Post is published after approval

**To approve a pending post:**
```bash
curl -X POST https://fixloapp.com/api/social/post/{postId}/approve \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Best Practices

### 1. Start with Approval Mode

When first enabling daily posting, use approval mode to review content:

```bash
SOCIAL_DAILY_POST_REQUIRE_APPROVAL=true
```

After you're comfortable with the content quality, disable approval for full automation.

### 2. Customize for Your City

Set your city for localized content:

```bash
SOCIAL_DAILY_POST_CITY="Your City"
```

This makes posts more relevant to your local audience.

### 3. Choose Optimal Posting Time

Facebook engagement is highest:
- **Weekdays:** 9-11 AM, 3-4 PM
- **Weekends:** 10 AM - 2 PM

Adjust `SOCIAL_DAILY_POST_PUBLISH_TIME` based on your audience analytics.

### 4. Monitor Performance

Check post metrics weekly:

```bash
curl https://fixloapp.com/api/social/metrics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "?startDate=2024-02-01&endDate=2024-02-07"
```

Adjust content strategy based on engagement data.

### 5. Use Emergency Stop if Needed

If you need to immediately halt all posting:

```bash
curl -X POST https://fixloapp.com/api/social/admin/emergency-stop \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"activate": true}'
```

---

## Troubleshooting

### Posts not being generated

**Check:**
1. Daily poster is started: `GET /api/social/daily-poster/status`
2. Facebook account connected: `GET /api/social/force-status`
3. Environment variables set correctly
4. Server has restarted after config changes

**Fix:**
```bash
# Restart daily poster
curl -X POST https://fixloapp.com/api/social/daily-poster/stop \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

curl -X POST https://fixloapp.com/api/social/daily-poster/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Posts stuck in "pending_approval"

**Cause:** Approval mode is enabled

**Fix Option 1 - Approve manually:**
```bash
curl -X POST https://fixloapp.com/api/social/post/{postId}/approve \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Fix Option 2 - Disable approval mode:**
```bash
curl -X POST https://fixloapp.com/api/social/daily-poster/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"requiresApproval": false}'
```

---

### Posts generating but not publishing

**Check:**
1. Main scheduler is running: `GET /api/social/scheduler/status`
2. Automation is enabled: `SOCIAL_AUTOMATION_ENABLED=true`

**Fix:**
```bash
# Start main scheduler
curl -X POST https://fixloapp.com/api/social/scheduler/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Content quality issues

**Improve content by:**

1. **Set your city** for localized content
2. **Use approval mode** to review and refine
3. **Generate test posts** to preview different themes:

```bash
curl -X POST https://fixloapp.com/api/social/daily-poster/generate-now \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "meta_facebook",
    "theme": {
      "contentType": "service-specific",
      "service": "plumbing"
    }
  }'
```

---

## Rate Limits

**Facebook Limits:**
- 50 posts per hour
- 200 posts per day

**Daily Poster Usage:**
- 1 post per day (well within limits)
- Safe for long-term use

---

## Integration with Main Scheduler

The Daily Poster works alongside the main scheduler:

- **Daily Poster:** Generates one post per day
- **Main Scheduler:** Publishes scheduled posts (including daily posts)

Both must be running for full automation:

```bash
# Start both systems
curl -X POST https://fixloapp.com/api/social/daily-poster/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

curl -X POST https://fixloapp.com/api/social/scheduler/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Monitoring & Analytics

### View Scheduled Posts

```bash
# Get all scheduled posts
curl https://fixloapp.com/api/social/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Check Post Performance

```bash
# Get metrics for last 30 days
curl "https://fixloapp.com/api/social/metrics?startDate=2024-01-06&endDate=2024-02-06" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Audit Logs

```bash
# View daily poster actions
curl "https://fixloapp.com/api/social/admin/audit-logs?action=daily_post_generation" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Complete Setup Checklist

- [ ] Set environment variables in `server/.env`
- [ ] Ensure Facebook page is connected
- [ ] Start main scheduler
- [ ] Start daily poster
- [ ] Generate test post to verify
- [ ] Review first few days with approval mode
- [ ] Disable approval mode for full automation
- [ ] Monitor performance weekly
- [ ] Adjust timing based on analytics

---

## Support

For issues or questions:
1. Check daily poster status: `GET /api/social/daily-poster/status`
2. Review audit logs for errors
3. Verify main scheduler is running
4. Check server logs for detailed error messages

---

**🎉 Your Facebook Business page now posts automatically every day!**

The system handles:
- ✅ AI content generation
- ✅ Theme rotation
- ✅ Seasonal adaptation
- ✅ Automatic scheduling
- ✅ Publishing
- ✅ Performance tracking
