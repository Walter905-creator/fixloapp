# Social Media Manager Setup Guide

This guide will walk you through setting up the Fixlo Social Media Manager from scratch.

## Prerequisites

- Node.js 18+ installed
- MongoDB connection string
- OpenAI API key (for content generation)
- Platform developer accounts (Meta, TikTok, X, LinkedIn)

## Step 1: Generate Encryption Key

The social media manager uses AES-256 encryption for storing OAuth tokens. Generate a secure encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and add to your `.env` file as `SOCIAL_ENCRYPTION_KEY`.

## Step 2: Configure Environment Variables

Add these variables to `/server/.env`:

```bash
# REQUIRED
SOCIAL_ENCRYPTION_KEY=your_generated_key_here

# Meta (Instagram + Facebook) - Optional
SOCIAL_META_CLIENT_ID=your_meta_app_id
SOCIAL_META_CLIENT_SECRET=your_meta_app_secret
SOCIAL_META_REDIRECT_URI=https://yourdomain.com/api/social/oauth/meta/callback

# TikTok - Optional
SOCIAL_TIKTOK_CLIENT_ID=your_tiktok_client_key
SOCIAL_TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
SOCIAL_TIKTOK_REDIRECT_URI=https://yourdomain.com/api/social/oauth/tiktok/callback

# X (Twitter) - Optional
SOCIAL_X_CLIENT_ID=your_x_client_id
SOCIAL_X_CLIENT_SECRET=your_x_client_secret
SOCIAL_X_REDIRECT_URI=https://yourdomain.com/api/social/oauth/x/callback

# LinkedIn - Optional
SOCIAL_LINKEDIN_CLIENT_ID=your_linkedin_client_id
SOCIAL_LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
SOCIAL_LINKEDIN_REDIRECT_URI=https://yourdomain.com/api/social/oauth/linkedin/callback

# OpenAI (already exists in your .env)
OPENAI_API_KEY=sk-your_openai_key
```

## Step 3: Register Platform Apps

### Meta (Instagram + Facebook)

1. Go to https://developers.facebook.com/
2. Click "My Apps" → "Create App"
3. Select "Business" type
4. Fill in app details
5. Add products:
   - Instagram Graph API
   - Pages API
6. Go to Settings → Basic
   - Copy App ID → `SOCIAL_META_CLIENT_ID`
   - Copy App Secret → `SOCIAL_META_CLIENT_SECRET`
7. Configure OAuth Redirect URIs:
   - Add `https://yourdomain.com/api/social/oauth/meta/callback`
8. Request permissions (App Review):
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
   - `pages_manage_posts`

**Important:** You must connect an Instagram Business Account to a Facebook Page for this to work.

### TikTok Business

1. Go to https://developers.tiktok.com/
2. Register as a developer
3. Create a new app (TikTok for Business)
4. Request permissions:
   - `user.info.basic`
   - `video.list`
   - `video.upload`
5. Configure OAuth:
   - Redirect URI: `https://yourdomain.com/api/social/oauth/tiktok/callback`
6. Copy credentials:
   - Client Key → `SOCIAL_TIKTOK_CLIENT_ID`
   - Client Secret → `SOCIAL_TIKTOK_CLIENT_SECRET`
7. Submit app for verification

### X (Twitter)

1. Go to https://developer.twitter.com/
2. Apply for API access
3. **Important:** Upgrade to a paid tier (Basic, Pro, or Enterprise)
   - Free tier does NOT support write access
4. Create a project and app
5. Enable OAuth 2.0 User Authentication
6. Request permissions:
   - `tweet.read`
   - `tweet.write`
   - `users.read`
   - `offline.access`
7. Configure callback URL:
   - `https://yourdomain.com/api/social/oauth/x/callback`
8. Copy credentials:
   - Client ID → `SOCIAL_X_CLIENT_ID`
   - Client Secret → `SOCIAL_X_CLIENT_SECRET`

### LinkedIn Company Pages

1. Go to https://www.linkedin.com/developers/apps
2. Create a new app
3. Fill in app details
4. Add products:
   - Sign In with LinkedIn
   - Share on LinkedIn
5. Request permissions:
   - `w_member_social`
   - `r_organization_social`
6. Configure OAuth:
   - Redirect URL: `https://yourdomain.com/api/social/oauth/linkedin/callback`
7. Copy credentials:
   - Client ID → `SOCIAL_LINKEDIN_CLIENT_ID`
   - Client Secret → `SOCIAL_LINKEDIN_CLIENT_SECRET`
8. **Important:** Must be admin of a LinkedIn Company Page

## Step 4: Start the Server

```bash
cd server
npm install
npm start
```

You should see:
```
✅ Social Media Manager initialized
📅 Starting social media scheduler...
✅ Scheduled 4 jobs
```

## Step 5: Connect Your First Platform

### Via API

1. Get authorization URL:
```bash
curl http://localhost:10000/api/social/connect/meta_instagram/url
```

2. Visit the returned URL and authorize
3. Copy the `code` parameter from the callback
4. Complete connection:
```bash
curl -X POST http://localhost:10000/api/social/connect/meta_instagram \
  -H "Content-Type: application/json" \
  -d '{"code": "YOUR_AUTH_CODE", "accountType": "instagram"}'
```

### Check Status

```bash
curl http://localhost:10000/api/social/status
```

## Step 6: Create Your First Post

### Generate AI Content

```bash
curl -X POST http://localhost:10000/api/social/generate-content \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "meta_instagram",
    "contentType": "service-specific",
    "service": "plumbing",
    "city": "New York"
  }'
```

### Schedule the Post

```bash
curl -X POST http://localhost:10000/api/social/post \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "YOUR_ACCOUNT_ID",
    "content": "Your generated content here",
    "scheduledFor": "2024-01-20T14:00:00Z",
    "requiresApproval": true
  }'
```

### Approve the Post

```bash
curl -X POST http://localhost:10000/api/social/post/POST_ID/approve
```

The post will be automatically published at the scheduled time!

## Step 7: Monitor Analytics

```bash
# Get overview metrics
curl http://localhost:10000/api/social/metrics

# Get top performing posts
curl http://localhost:10000/api/social/metrics/top-posts?limit=5

# Get audit logs
curl http://localhost:10000/api/social/admin/audit-logs?limit=20
```

## Troubleshooting

### "SOCIAL_ENCRYPTION_KEY not configured"
Run the key generation command and add to `.env`

### "No platforms configured"
Add at least one platform's OAuth credentials

### "Account token is invalid"
User needs to re-authorize. Check status endpoint for alerts.

### Posts not publishing
Check emergency stop status:
```bash
curl http://localhost:10000/api/social/status
```

If emergency stop is active, deactivate it:
```bash
curl -X POST http://localhost:10000/api/social/admin/emergency-stop \
  -H "Content-Type: application/json" \
  -d '{"activate": false}'
```

## Security Best Practices

1. **Never commit** your `.env` file
2. **Rotate** encryption key periodically
3. **Monitor** audit logs for suspicious activity
4. **Enable** manual approval mode in production
5. **Use** emergency stop if content issues arise
6. **Verify** all platform apps before going live

## Need Help?

- Check the [main README](./README.md) for detailed API documentation
- Review audit logs for error details
- Verify environment variables are set correctly
- Ensure platform apps are verified and have correct permissions

---

**Built for Fixlo** | Production-Ready | OAuth-Only | Brand-Safe
