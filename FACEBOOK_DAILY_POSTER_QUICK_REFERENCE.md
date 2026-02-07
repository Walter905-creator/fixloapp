# Facebook Daily Poster - Quick Verification Guide

## 🚀 Quick Start

### 1. Enable in Render
Set environment variable:
```bash
SOCIAL_AUTOMATION_ENABLED=true
```

### 2. Verify Startup (Check Render Logs)
```bash
grep "🚀 Facebook Daily Poster" logs
```
**Expected:** `🚀 Facebook Daily Poster initialized (enabled=true)`

### 3. Check Status API
```bash
curl https://your-app.onrender.com/api/social/daily-poster/status
```
**Expected:** `"enabled": true, "running": true`

## 📊 Monitoring in Production

### Daily Execution Verification

**Morning (6:00 AM) - Generation:**
```bash
grep "✍️ Generating daily Facebook post" logs
```

**Late Morning (10:00 AM) - Publishing:**
```bash
grep "✅ Facebook post published" logs
```

### Check for Errors
```bash
grep "❌ Facebook" logs
```

### View All Daily Poster Activity
```bash
grep "Facebook Daily Poster\|✍️\|📤\|✅ Facebook\|❌ Facebook" logs
```

## 🔧 Troubleshooting

### Issue: No logs appearing

**Check 1:** Is it enabled?
```bash
curl https://your-app/api/social/daily-poster/status | jq '.enabled'
```

**Check 2:** Are there active Facebook accounts?
```bash
grep "No active" logs
```

**Fix:** Ensure Facebook account is connected and token is valid

### Issue: Posts generating but not publishing

**Check:** Look for rate limits or token errors
```bash
grep "Rate limit\|token" logs
```

**Fix:** 
- Wait for rate limit to reset
- Re-authorize Facebook connection if token invalid

### Issue: Errors during generation

**Check:** What's the error?
```bash
grep "❌.*daily post" logs | tail -5
```

**Common causes:**
- No OpenAI API key (content generation fails)
- No active accounts
- Database connection issues

## 🎯 Manual Testing

### Trigger Immediate Post Generation
```bash
curl -X POST https://your-app/api/social/daily-poster/generate-now \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Watch logs for:**
```
✍️ Manual post generation triggered
📤 Publishing Facebook post to page: ***XXXX
✅ Manual post generation successful
```

## 📈 Status Endpoint Response

### Healthy System
```json
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
  "message": "Daily poster is active. Posts will be generated and scheduled daily."
}
```

### Not Running
```json
{
  "enabled": false,
  "running": false,
  "lastRun": null,
  "lastResult": null,
  "message": "Daily poster is not running. Call POST /api/social/daily-poster/start to enable."
}
```

## 🔐 Security Checklist

- ✅ Environment variable `SOCIAL_AUTOMATION_ENABLED` set?
- ✅ Facebook tokens stored encrypted?
- ✅ Logs show redacted IDs (`***XXXX`)?
- ✅ No access tokens in logs?
- ✅ Admin endpoints protected?

## 📅 Expected Daily Schedule

| Time | Event | Log Pattern |
|------|-------|-------------|
| 6:00 AM | Generation starts | `✍️ Generating daily Facebook post` |
| 6:01 AM | Posts scheduled | `✅ Facebook post scheduled successfully` |
| 10:00 AM | Publishing starts | `📤 Publishing Facebook post` |
| 10:01 AM | Posts published | `✅ Facebook post published successfully` |

## 🎨 Log Emoji Legend

| Emoji | Meaning | When Used |
|-------|---------|-----------|
| 🚀 | Initialization | Startup only |
| ⏰ | Cron schedule | Startup only |
| ✍️ | Generation | Daily at 6 AM + manual triggers |
| 📤 | Publishing | Daily at 10 AM (via scheduler) |
| ✅ | Success | After successful operations |
| ❌ | Failure | When errors occur |
| ⚠️ | Warning | Non-critical issues |

## 🔍 Useful Grep Commands

### Find all daily poster logs
```bash
grep -E "Facebook Daily Poster|✍️|📤|✅ Facebook|❌ Facebook" logs
```

### Last 24 hours of activity
```bash
grep -E "✍️|📤|✅ Facebook|❌ Facebook" logs | tail -100
```

### Count successful posts today
```bash
grep "✅ Facebook post published" logs | grep $(date +%Y-%m-%d) | wc -l
```

### Count failed attempts today
```bash
grep "❌ Facebook post failed" logs | grep $(date +%Y-%m-%d) | wc -l
```

## 📞 Quick Reference

**Status Endpoint:** `GET /api/social/daily-poster/status`  
**Manual Trigger:** `POST /api/social/daily-poster/generate-now` (requires admin auth)  
**Start Poster:** `POST /api/social/daily-poster/start` (requires admin auth)  
**Stop Poster:** `POST /api/social/daily-poster/stop` (requires admin auth)  

## 🎓 Key Success Indicators

✅ Startup log shows: `🚀 Facebook Daily Poster initialized (enabled=true)`  
✅ Status API shows: `"running": true`  
✅ Daily logs show: `✍️ Generating` at 6 AM  
✅ Daily logs show: `✅ Facebook post published` at 10 AM  
✅ No `❌` errors in recent logs  
✅ `lastRun` is recent (within last 24 hours)  
✅ `lastResult` is `"success"`

---

**For detailed information, see:**
- `FACEBOOK_DAILY_POSTER_AUDIT_SUMMARY.md` - Complete implementation guide
- `docs/FACEBOOK_DAILY_POSTER_LOGS.md` - Log examples
- `SECURITY_SUMMARY_FACEBOOK_DAILY_POSTER.md` - Security details
