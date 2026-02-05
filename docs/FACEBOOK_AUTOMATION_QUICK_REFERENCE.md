# Facebook Business Automation - Quick Reference

## 🚀 Quick Start (5 Minutes)

### Step 1: Set Environment Variables
```bash
# In server/.env
SOCIAL_META_CLIENT_ID=your_meta_app_id
SOCIAL_META_CLIENT_SECRET=your_meta_app_secret
SOCIAL_ENCRYPTION_KEY=your_32_byte_base64_key
SOCIAL_AUTOMATION_ENABLED=false  # Start with false for safety
OPENAI_API_KEY=sk-your_openai_key  # Optional
```

### Step 2: Generate Encryption Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Step 3: Connect Facebook Page
```bash
# Get OAuth URL
curl https://fixloapp.com/api/social/connect/meta_facebook/url

# Complete OAuth in browser, then verify:
curl https://fixloapp.com/api/social/force-status
```

### Step 4: Test Posting
```bash
curl -X POST https://fixloapp.com/api/social/post/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Step 5: Enable Automation
```bash
# Update .env
SOCIAL_AUTOMATION_ENABLED=true

# Restart server, then start scheduler:
curl -X POST https://fixloapp.com/api/social/scheduler/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📡 Essential API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/social/force-status` | GET | Check connection status |
| `/api/social/post/test` | POST | Send test post |
| `/api/social/scheduler/start` | POST | Enable automation |
| `/api/social/scheduler/status` | GET | Check scheduler status |
| `/api/social/generate-content` | POST | AI content generation |
| `/api/social/post` | POST | Schedule post |

---

## 🎯 Common Tasks

### Check if Facebook is Connected
```bash
curl https://fixloapp.com/api/social/force-status
```

### Generate AI Content
```bash
curl -X POST https://fixloapp.com/api/social/generate-content \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "meta_facebook",
    "contentType": "service-specific",
    "service": "home-services",
    "city": "Miami"
  }'
```

### Schedule a Post
```bash
curl -X POST https://fixloapp.com/api/social/post \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "facebook_account_id",
    "content": "Your post content",
    "scheduledFor": "2024-02-06T14:00:00Z",
    "requiresApproval": false
  }'
```

### Emergency Stop
```bash
curl -X POST https://fixloapp.com/api/social/admin/emergency-stop \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"activate": true, "reason": "Review needed"}'
```

---

## 🔧 Troubleshooting

### "Meta OAuth not configured"
➡️ Add `SOCIAL_META_CLIENT_ID` and `SOCIAL_META_CLIENT_SECRET` to .env

### "No Facebook Pages found"
➡️ Ensure you have a Facebook Business Page with admin access

### "Page access token not available"
➡️ Switch your Meta app to **Live Mode** (not Development)

### "SOCIAL_AUTOMATION_ENABLED=false"
➡️ Set to `true` in .env and restart server

### Posts not publishing
1. Check scheduler: `GET /api/social/scheduler/status`
2. Verify connection: `GET /api/social/force-status`
3. Check automation flag: `SOCIAL_AUTOMATION_ENABLED=true`
4. Review audit logs: `GET /api/social/admin/audit-logs`

---

## 📊 Posting Schedule

**Optimal Times (Automatic):**
- Weekdays: 9-11 AM, 3-4 PM EST
- Weekends: 10 AM - 2 PM EST

**Rate Limits:**
- 50 posts/hour per page
- 200 posts/day per page

**Scheduler Jobs:**
- Every 15 min: Check scheduled posts
- Every 6 hours: Refresh tokens
- Daily 2 AM: Collect metrics
- Every hour: Retry failed posts

---

## 🎨 Content Types

### Service-Specific
```json
{
  "contentType": "service-specific",
  "service": "plumbing",
  "city": "Miami",
  "season": "winter"
}
```

### General Updates
```json
{
  "contentType": "general",
  "topic": "trust"
}
```

### Seasonal
```json
{
  "contentType": "seasonal",
  "season": "winter",
  "city": "Miami"
}
```

---

## 🛡️ Safety Features

✅ **Manual Approval Mode** - Review before posting
```bash
POST /api/social/admin/approval-mode
{"requiresApproval": true}
```

✅ **Emergency Stop** - Halt all automation instantly
```bash
POST /api/social/admin/emergency-stop
{"activate": true}
```

✅ **Audit Logs** - Track all actions
```bash
GET /api/social/admin/audit-logs
```

✅ **Token Encryption** - AES-256-GCM protection

---

## 📚 Documentation

- **Full Setup Guide:** `/docs/FACEBOOK_BUSINESS_AUTOMATION_SETUP.md`
- **API Reference:** `/server/modules/social-manager/README.md`
- **Posting Guide:** `/docs/SOCIAL_MEDIA_POSTING_GUIDE.md`

---

## 🆘 Support

1. Run setup wizard: `node scripts/setup-facebook-automation.js`
2. Check audit logs for errors
3. Verify Meta app is in Live mode
4. Ensure all environment variables set
5. Review server logs for details

---

**Your Facebook Business:**
- Business ID: 209925905542846
- Asset ID: 209920418876728
- URL: https://business.facebook.com/latest/home?asset_id=209920418876728&business_id=209925905542846
