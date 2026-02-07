# Facebook Daily Poster - Log Examples

## Production Log Examples

This document shows what logs will appear in Render when the Facebook Daily Poster is running.

### 1. Server Startup (with SOCIAL_AUTOMATION_ENABLED=true)

```
📱 Initializing Social Media Manager...
✅ Configured platforms: meta_facebook, meta_instagram
✅ AI content generation enabled
📅 Starting social media scheduler...
✅ Social scheduler started with 4 jobs
  - scheduled-posting: */15 * * * *
  - token-refresh: 0 */6 * * *
  - metrics-collection: 0 2 * * *
  - retry-failed: 0 * * * *
✅ Social Media Manager initialized
🚀 Social automation ENABLED
📅 Scheduler running
⏰ Daily post generation scheduled: 0 6 * * *
⏰ Daily post publish time: 10:00
🚀 Facebook Daily Poster initialized (enabled=true)
```

### 2. Daily Post Generation (runs at 6:00 AM)

```
✍️ Generating daily Facebook post... {"timestamp":"2026-02-07T11:00:00.000Z"}
✅ Found 2 active account(s)
✍️ Generating daily Facebook post for city: Miami {"theme":"service-specific","service":"plumbing"}
📤 Publishing Facebook post to page: ***1234 (meta_facebook)
[Daily Poster] Generating content with params: {
  platform: 'meta_facebook',
  contentType: 'service-specific',
  city: 'Miami',
  includeHashtags: false,
  includeCallToAction: true,
  service: 'plumbing'
}
✅ Facebook post scheduled successfully (postId: ***5678) {
  platform: 'meta_facebook',
  status: 'scheduled',
  scheduledFor: '2026-02-07T15:00:00.000Z'
}
✅ Daily post generation complete: 2 succeeded, 0 failed
```

### 3. Post Publishing (runs at 10:00 AM via scheduler)

```
📤 Processing 2 scheduled posts...
📤 Publishing Facebook post to page: ***1234 { platform: 'meta_facebook', postId: '***5678' }
✅ Facebook post published successfully (postId: ***9012) {
  platform: 'meta_facebook',
  postId: '***5678',
  url: 'https://facebook.com/...'
}
✅ Published post ***5678 to meta_facebook
```

### 4. Error Cases

#### No Active Accounts
```
✍️ Generating daily Facebook post... {"timestamp":"2026-02-07T11:00:00.000Z"}
⚠️ No active Facebook/Instagram accounts found
```

#### Content Generation Failure
```
❌ Failed to create post for meta_facebook: Content generation failed for service-specific (plumbing)
❌ Daily post generation failed: all 2 attempts failed
```

#### Publishing Failure
```
📤 Publishing Facebook post to page: ***1234 { platform: 'meta_facebook', postId: '***5678' }
❌ Facebook post failed: Account token is invalid - re-authorization required { platform: 'meta_facebook', postId: '***5678' }
❌ Failed to publish post ***5678: Account token is invalid - re-authorization required
```

### 5. Manual Trigger via API

```
POST /api/social/daily-poster/generate-now

✍️ Manual post generation triggered { platform: 'meta_facebook' }
📤 Publishing Facebook post to page: ***1234 (meta_facebook)
[Daily Poster] Generating content with params: {...}
✅ Facebook post scheduled successfully (postId: ***5678) {...}
✅ Manual post generation successful {
  postId: '***5678',
  platform: 'meta_facebook',
  scheduledFor: '2026-02-07T15:00:00.000Z'
}
```

### 6. Status Endpoint Response

```
GET /api/social/daily-poster/status

{
  "success": true,
  "enabled": true,
  "running": true,
  "generationCron": "0 6 * * *",
  "publishTime": "10:00",
  "cityMode": "single",
  "currentCity": "Miami",
  "lastRun": "2026-02-07T11:00:00.000Z",
  "lastResult": "success",
  "config": {
    "generateTime": "0 6 * * *",
    "publishTime": "10:00",
    "contentTypes": ["service-specific", "general", "seasonal"],
    "services": ["plumbing", "electrical", "hvac", "landscaping", "general-maintenance"],
    "requiresApproval": true,
    "defaultCity": "Miami",
    "cityMode": "single",
    "platforms": ["meta_facebook", "meta_instagram"]
  },
  "nextRunInfo": "Daily at 0 6 * * * (generate) and 10:00 (publish)",
  "message": "Daily poster is active. Posts will be generated and scheduled daily."
}
```

## How to Search Logs in Render

Use these grep patterns to find specific events:

```bash
# All daily poster activity
grep "Daily Poster\|🚀 Facebook\|✍️\|📤\|✅ Facebook\|❌ Facebook" logs

# Initialization only
grep "🚀 Facebook Daily Poster" logs

# Generation events
grep "✍️ Generating daily Facebook post" logs

# Publishing events  
grep "📤 Publishing Facebook post" logs

# Success events
grep "✅ Facebook post" logs

# Failure events
grep "❌ Facebook post" logs

# Cron schedule registration
grep "⏰ Daily post" logs
```

## Security Notes

- ✅ All Facebook page IDs are redacted (show only last 4 chars: ***1234)
- ✅ All post IDs are redacted (show only last 4 chars: ***5678)
- ✅ Access tokens are never logged
- ✅ User data is not logged
- ✅ Only metadata needed for debugging is included
