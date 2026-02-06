# Facebook Business Post Automation - Complete Setup Guide

## Overview

This guide walks you through enabling automated posting to your Facebook Business page. The Fixlo app includes a production-ready social media automation system that can automatically create and publish posts to Facebook and Instagram.

**Your Facebook Business Details:**
- Business ID: YOUR_BUSINESS_ID
- Asset ID: YOUR_ASSET_ID  
- Business Manager URL: https://business.facebook.com/latest/home

**Note:** Replace YOUR_BUSINESS_ID and YOUR_ASSET_ID with your actual Facebook Business identifiers.

---

## Prerequisites

Before starting, ensure you have:

1. ✅ **Facebook Business Page** - The page you want to post to
2. ✅ **Meta for Developers Account** - Access to https://developers.facebook.com/
3. ✅ **Admin Access** - Admin permissions on the Facebook Business page
4. ✅ **MongoDB Database** - Connected and accessible
5. ✅ **OpenAI API Key** - For AI content generation (optional but recommended)

---

## Step 1: Create Meta App for Automation

### 1.1 Create New App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **"My Apps"** → **"Create App"**
3. Select **"Business"** as the app type
4. Fill in app details:
   - **App Name:** Fixlo Social Manager
   - **App Contact Email:** Your email
   - **Business Account:** Select your business (ID: 209925905542846)
5. Click **"Create App"**

### 1.2 Add Required Products

Add these products to your app:
- **Facebook Login for Business**
- **Pages API**
- **Instagram Graph API** (if you also want Instagram automation)

### 1.3 Configure OAuth Settings

1. Go to **"Facebook Login"** → **"Settings"**
2. Add OAuth redirect URI:
   ```
   https://fixloapp.com/api/social/oauth/meta/callback
   ```
   Or for development:
   ```
   http://localhost:3001/api/social/oauth/meta/callback
   ```

3. Save changes

### 1.4 Get App Credentials

1. Go to **"Settings"** → **"Basic"**
2. Copy these values:
   - **App ID** → You'll use this as `SOCIAL_META_CLIENT_ID`
   - **App Secret** → Click "Show" and copy as `SOCIAL_META_CLIENT_SECRET`

### 1.5 Request Permissions

For basic posting, you need:
- ✅ `pages_show_list` - No App Review needed (Standard Access)
- ⚠️ `pages_manage_posts` - Requires Standard Access (available after basic verification)

**Note:** You can start with `pages_show_list` and add more permissions later.

### 1.6 Switch to Live Mode

⚠️ **CRITICAL:** Your app must be in **Live Mode** for automation to work.

1. Go to **"Settings"** → **"Basic"**
2. Toggle **"App Mode"** from Development to **Live**
3. Complete any required verification steps

---

## Step 2: Configure Environment Variables

### 2.1 Generate Encryption Key

First, generate a secure encryption key for token storage:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output (e.g., `AbCd1234...==`)

### 2.2 Update Server Environment Variables

Add these variables to your server's `.env` file (usually in `/server/.env`):

```bash
# ============================================
# Facebook Business Automation Configuration
# ============================================

# Meta OAuth Credentials (from Step 1.4)
SOCIAL_META_CLIENT_ID=your_app_id_here
SOCIAL_META_CLIENT_SECRET=your_app_secret_here
SOCIAL_META_REDIRECT_URI=https://fixloapp.com/api/social/oauth/meta/callback

# Token Encryption (from Step 2.1)
SOCIAL_ENCRYPTION_KEY=your_generated_encryption_key_here

# Automation Control (IMPORTANT: Set to 'true' to enable automation)
SOCIAL_AUTOMATION_ENABLED=false

# Optional: AI Content Generation
OPENAI_API_KEY=sk-your_openai_api_key

# Optional: Prefer specific page if you have multiple
SOCIAL_META_PREFERRED_PAGE=fixlo
```

### 2.3 Important Notes

- **SOCIAL_AUTOMATION_ENABLED:** Start with `false` for safety. Enable after testing.
- **OPENAI_API_KEY:** Optional but highly recommended for AI-generated content
- **SOCIAL_META_PREFERRED_PAGE:** If you have multiple Facebook pages, specify which one to use

---

## Step 3: Connect Your Facebook Business Page

### 3.1 Start OAuth Flow

Two ways to connect:

**Option A: Via API**
```bash
# Get OAuth URL
curl https://fixloapp.com/api/social/connect/meta_facebook/url

# Response will include authorization URL like:
# https://www.facebook.com/v18.0/dialog/oauth?client_id=...
```

**Option B: Via Admin Panel**
1. Log in to Fixlo admin panel
2. Navigate to **Social Media** settings
3. Click **"Connect Facebook Page"**
4. Follow OAuth authorization flow

### 3.2 Complete Authorization

1. Click the authorization URL
2. Log in with Facebook account that manages your Business Page
3. Select your Facebook Business Page (Asset ID: 209920418876728)
4. Grant requested permissions
5. You'll be redirected back to Fixlo

### 3.3 Verify Connection

Check connection status:

```bash
curl https://fixloapp.com/api/social/force-status
```

Expected response:
```json
{
  "success": true,
  "facebookConnected": true,
  "pageId": "your_page_id",
  "pageName": "Your Page Name",
  "isTokenValid": true,
  "tokenExpiresAt": "2024-03-15T10:30:00.000Z"
}
```

---

## Step 4: Test Manual Posting

Before enabling automation, test that posting works:

### 4.1 Send Test Post

```bash
curl -X POST https://fixloapp.com/api/social/post/test \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 4.2 Verify Post Published

Check your Facebook Business page to confirm the test post appeared.

**Expected Response:**
```json
{
  "success": true,
  "message": "Test post published successfully",
  "platform": "facebook",
  "postId": "page_id_post_id",
  "postUrl": "https://facebook.com/..."
}
```

---

## Step 5: Enable Automated Posting

### 5.1 Enable Automation Flag

Update your server's `.env` file:

```bash
SOCIAL_AUTOMATION_ENABLED=true
```

Restart your server for changes to take effect.

### 5.2 Start the Scheduler

```bash
curl -X POST https://fixloapp.com/api/social/scheduler/start \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Scheduler started successfully",
  "status": {
    "isRunning": true,
    "emergencyStop": false,
    "activeJobs": 4
  },
  "metaAccounts": {
    "facebook": true
  }
}
```

### 5.3 Verify Scheduler Running

```bash
curl https://fixloapp.com/api/social/scheduler/status
```

---

## Step 6: Schedule Your First Automated Post

### 6.1 Generate AI Content

```bash
curl -X POST https://fixloapp.com/api/social/generate-content \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "meta_facebook",
    "contentType": "service-specific",
    "service": "home-services",
    "city": "Miami"
  }'
```

### 6.2 Schedule Post

```bash
curl -X POST https://fixloapp.com/api/social/post \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "your_facebook_account_id",
    "content": "Your generated content here",
    "scheduledFor": "2024-02-06T14:00:00Z",
    "requiresApproval": true
  }'
```

**Note:** Set `requiresApproval: false` once you trust the automation.

---

## Scheduler Behavior

The scheduler runs automatically with these jobs:

- **Every 15 minutes:** Check for scheduled posts ready to publish
- **Every 6 hours:** Refresh access tokens
- **Daily at 2 AM:** Collect post metrics and analytics
- **Every hour:** Retry failed posts (max 3 attempts)

### Optimal Posting Times

Facebook posts are automatically scheduled during optimal engagement windows:
- **Weekdays:** 9:00 AM - 11:00 AM, 3:00 PM - 4:00 PM (EST)
- **Weekends:** 10:00 AM - 2:00 PM (EST)

---

## Content Generation Options

### Service-Specific Posts
```javascript
{
  "platform": "meta_facebook",
  "contentType": "service-specific",
  "service": "plumbing|electrical|hvac|landscaping",
  "city": "Your City",
  "season": "winter|spring|summer|fall"
}
```

### General Updates
```javascript
{
  "platform": "meta_facebook",
  "contentType": "general",
  "topic": "trust|quality|homeowners"
}
```

### Seasonal Content
```javascript
{
  "platform": "meta_facebook",
  "contentType": "seasonal",
  "season": "winter",
  "city": "Your City"
}
```

---

## Safety Features

### Manual Approval Mode

Start with approval mode enabled to review posts before publishing:

```bash
curl -X POST https://fixloapp.com/api/social/admin/approval-mode \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"requiresApproval": true}'
```

### Emergency Stop

Immediately halt all automated posting:

```bash
curl -X POST https://fixloapp.com/api/social/admin/emergency-stop \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"activate": true, "reason": "Review needed"}'
```

To resume:
```bash
curl -X POST https://fixloapp.com/api/social/admin/emergency-stop \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"activate": false}'
```

---

## Monitoring & Analytics

### Check System Status

```bash
curl https://fixloapp.com/api/social/status
```

### View Post Metrics

```bash
curl https://fixloapp.com/api/social/metrics \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  "?startDate=2024-01-01&endDate=2024-01-31"
```

### View Audit Logs

```bash
curl https://fixloapp.com/api/social/admin/audit-logs \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  "?action=publish_post&platform=meta_facebook"
```

---

## Troubleshooting

### Issue: "Meta OAuth not configured"

**Solution:** Verify environment variables are set correctly:
```bash
echo $SOCIAL_META_CLIENT_ID
echo $SOCIAL_META_CLIENT_SECRET
```

### Issue: "No Facebook Pages found"

**Solution:** Ensure:
1. You have a Facebook Business Page
2. You're logged in with admin access to that page
3. The page is connected to your Business Manager

### Issue: "Page access token not available"

**Solution:** Your Meta app must be in **Live Mode**, not Development Mode.

### Issue: "SOCIAL_AUTOMATION_ENABLED=false"

**Solution:** Automation is disabled by default for safety. Set to `true` in `.env` file.

### Issue: Posts not publishing automatically

**Checklist:**
1. ✅ Scheduler is running: `GET /api/social/scheduler/status`
2. ✅ Scheduled posts exist with correct status
3. ✅ `SOCIAL_AUTOMATION_ENABLED=true`
4. ✅ Facebook account connected and token valid
5. ✅ Manual approval mode disabled (or posts are approved)

---

## Rate Limits

Facebook API has rate limits:
- **50 posts per hour** per page
- **200 posts per day** per page

The scheduler automatically handles rate limiting and will defer posts if limits are reached.

---

## Security Best Practices

1. ✅ **Use HTTPS only** in production
2. ✅ **Rotate encryption key** periodically
3. ✅ **Monitor audit logs** regularly
4. ✅ **Start with approval mode** enabled
5. ✅ **Keep Meta app in Live mode** only after testing
6. ✅ **Use strong JWT secrets**
7. ✅ **Review generated content** before disabling approval mode

---

## Next Steps

Once automation is working:

1. **Set posting schedule** - Configure optimal times for your audience
2. **Create content calendar** - Plan posts in advance
3. **Monitor analytics** - Track engagement and conversions
4. **Optimize content** - Adjust based on performance data
5. **Expand platforms** - Add Instagram, TikTok, LinkedIn

---

## API Reference

Full API documentation available at:
- `/server/modules/social-manager/README.md`
- `/docs/SOCIAL_MEDIA_POSTING_GUIDE.md`

---

## Support

For issues or questions:
1. Check audit logs for detailed error messages
2. Review server logs for diagnostic information
3. Verify all environment variables are set correctly
4. Ensure Facebook app is in Live mode
5. Contact Fixlo support if issues persist

---

**🎉 You're ready to automate Facebook Business posts!**

The system will now handle:
- ✅ AI-powered content generation
- ✅ Optimal scheduling
- ✅ Automatic publishing
- ✅ Performance tracking
- ✅ Token management
- ✅ Error handling and retries
