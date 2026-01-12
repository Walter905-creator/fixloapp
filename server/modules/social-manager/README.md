# Fixlo Social Media Manager

**Production-grade automated social media management system running inside Fixlo backend**

Fully modular, OAuth-only, brand-safe, and designed for easy extraction into a standalone SaaS.

---

## 🎯 Key Features

- ✅ **OAuth-Only Authentication** - NEVER stores passwords or uses scraping
- ✅ **AES-256 Token Encryption** - Military-grade security for access tokens
- ✅ **Multi-Platform Support** - Instagram, Facebook, TikTok, X (Twitter), LinkedIn
- ✅ **AI Content Generation** - OpenAI-powered posts with Fixlo brand voice
- ✅ **Smart Scheduling** - Cron-based with optimal posting times per platform
- ✅ **Analytics & Attribution** - Track engagement, clicks, signups, conversions
- ✅ **Manual Approval Mode** - Optional human review before posting
- ✅ **Emergency Kill Switch** - Instant stop for all automated posting
- ✅ **Audit Logging** - Complete compliance trail for all actions

---

## 📁 Architecture

```
server/modules/social-manager/
├── models/               # MongoDB schemas
│   ├── SocialAccount.js        # Platform connections
│   ├── EncryptedToken.js       # AES-256 encrypted tokens
│   ├── ScheduledPost.js        # Posts awaiting publication
│   ├── PostMetric.js           # Engagement analytics
│   └── SocialAuditLog.js       # Compliance audit trail
├── oauth/                # OAuth 2.0 handlers
│   ├── metaHandler.js          # Instagram + Facebook
│   ├── tiktokHandler.js        # TikTok Business
│   ├── xHandler.js             # X (Twitter) API
│   └── linkedinHandler.js      # LinkedIn Company Pages
├── security/             # Encryption services
│   └── tokenEncryption.js      # AES-256-GCM encryption
├── content/              # AI content generation
│   └── contentGenerator.js     # OpenAI with Fixlo brand voice
├── posting/              # Platform adapters
│   ├── metaAdapter.js          # Meta Graph API
│   ├── tiktokAdapter.js        # TikTok Content API
│   ├── xAdapter.js             # X API v2
│   └── linkedinAdapter.js      # LinkedIn UGC API
├── scheduler/            # Cron-based automation
│   └── index.js                # Job scheduling & retry logic
├── analytics/            # Metrics & insights
│   └── index.js                # Engagement, attribution, ROI
├── admin/                # Administrative controls
│   └── index.js                # Settings, approvals, kill switch
└── routes/               # Express API routes
    └── index.js                # /api/social/* endpoints
```

---

## 🚀 Quick Start

### 1. Environment Setup

Add these variables to your `.env` file:

```bash
# REQUIRED: Encryption key (generate with command below)
SOCIAL_ENCRYPTION_KEY=your_32_byte_base64_key_here

# Meta (Instagram + Facebook)
SOCIAL_META_CLIENT_ID=your_meta_client_id
SOCIAL_META_CLIENT_SECRET=your_meta_client_secret
SOCIAL_META_REDIRECT_URI=https://fixloapp.com/api/social/oauth/meta/callback

# TikTok Business
SOCIAL_TIKTOK_CLIENT_ID=your_tiktok_client_key
SOCIAL_TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
SOCIAL_TIKTOK_REDIRECT_URI=https://fixloapp.com/api/social/oauth/tiktok/callback

# X (Twitter) - Requires paid tier
SOCIAL_X_CLIENT_ID=your_x_client_id
SOCIAL_X_CLIENT_SECRET=your_x_client_secret
SOCIAL_X_REDIRECT_URI=https://fixloapp.com/api/social/oauth/x/callback

# LinkedIn
SOCIAL_LINKEDIN_CLIENT_ID=your_linkedin_client_id
SOCIAL_LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
SOCIAL_LINKEDIN_REDIRECT_URI=https://fixloapp.com/api/social/oauth/linkedin/callback

# OpenAI (for content generation)
OPENAI_API_KEY=sk-your_openai_api_key
```

**Generate encryption key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Integration with Fixlo Backend

In your `server/index.js`:

```javascript
const socialManager = require('./modules/social-manager');

// Initialize after database connection
async function start() {
  await mongoose.connect(MONGO_URI);
  
  // Initialize social manager
  const social = await socialManager.initialize({
    startScheduler: true,     // Start automated posting
    requireApproval: true     // Require manual approval (safe default)
  });
  
  // Mount routes
  app.use('/api/social', social.routes);
  
  server.listen(PORT);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await socialManager.shutdown();
  process.exit(0);
});
```

---

## 🔐 OAuth Setup Guide

### Meta (Instagram + Facebook)

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app (Business type)
3. Add **Instagram Graph API** and **Pages API** products
4. Configure OAuth redirect: `https://fixloapp.com/api/social/oauth/meta/callback`
5. Request ONLY the following permission (no App Review needed):
   - `pages_show_list`
   
   **Note:** `pages_read_engagement` requires Advanced Access/App Review
   **Note:** Engagement data will be accessed via Page access token after OAuth
6. Copy **App ID** → `SOCIAL_META_CLIENT_ID`
7. Copy **App Secret** → `SOCIAL_META_CLIENT_SECRET`

**Note:** Requires Instagram Business Account connected to Facebook Page

### TikTok Business

1. Go to [TikTok Developers](https://developers.tiktok.com/)
2. Create a TikTok for Business app
3. Request permissions:
   - `user.info.basic`
   - `video.list`
   - `video.upload`
4. Configure redirect: `https://fixloapp.com/api/social/oauth/tiktok/callback`
5. Submit for app verification
6. Copy **Client Key** → `SOCIAL_TIKTOK_CLIENT_ID`
7. Copy **Client Secret** → `SOCIAL_TIKTOK_CLIENT_SECRET`

### X (Twitter)

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Apply for **paid tier** access (Basic, Pro, or Enterprise)
3. Create a project and app
4. Enable OAuth 2.0 with write permissions
5. Configure redirect: `https://fixloapp.com/api/social/oauth/x/callback`
6. Copy **Client ID** → `SOCIAL_X_CLIENT_ID`
7. Copy **Client Secret** → `SOCIAL_X_CLIENT_SECRET`

**Note:** Free tier does not support write access

### LinkedIn Company Pages

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Create a new app
3. Enable products:
   - **Sign In with LinkedIn**
   - **Share on LinkedIn**
4. Request permissions:
   - `w_member_social`
   - `r_organization_social`
5. Add redirect: `https://fixloapp.com/api/social/oauth/linkedin/callback`
6. Get verified for Organization permissions
7. Copy **Client ID** → `SOCIAL_LINKEDIN_CLIENT_ID`
8. Copy **Client Secret** → `SOCIAL_LINKEDIN_CLIENT_SECRET`

---

## 📡 API Reference

### Base URL
All endpoints are prefixed with `/api/social`

### Authentication
All routes require admin authentication (use Fixlo's existing auth middleware)

### Endpoints

#### **Platform Management**

```http
GET /api/social/platforms
```
Get list of configured platforms

```http
GET /api/social/connect/:platform/url
```
Get OAuth authorization URL for platform

```http
POST /api/social/connect/:platform
Body: { code: "oauth_code", accountType: "instagram" }
```
Complete OAuth connection

```http
POST /api/social/disconnect/:platform
Body: { accountId: "account_id" }
```
Disconnect platform account

---

#### **Content & Posting**

```http
POST /api/social/generate-content
Body: {
  platform: "meta_instagram",
  contentType: "service-specific",
  service: "plumbing",
  city: "New York"
}
```
Generate AI content with Fixlo brand voice

```http
POST /api/social/post
Body: {
  accountId: "account_id",
  content: "Your post content",
  mediaUrls: ["https://..."],
  scheduledFor: "2024-01-15T14:00:00Z",
  requiresApproval: true
}
```
Schedule a new post

```http
POST /api/social/post/:postId/approve
```
Approve a pending post

```http
POST /api/social/post/:postId/cancel
Body: { reason: "Content needs revision" }
```
Cancel a scheduled post

---

#### **Status & Analytics**

```http
GET /api/social/status
```
Get system status, connected accounts, and schedule

```http
GET /api/social/metrics
Query: ?startDate=2024-01-01&endDate=2024-01-31
```
Get analytics overview and attribution data

```http
GET /api/social/metrics/top-posts
Query: ?limit=10&sortBy=engagementRate
```
Get top performing posts

---

#### **Admin Controls**

```http
POST /api/social/admin/emergency-stop
Body: { activate: true, reason: "Content review needed" }
```
Activate/deactivate emergency stop

```http
POST /api/social/admin/approval-mode
Body: { requiresApproval: true }
```
Set manual approval requirement

```http
GET /api/social/admin/audit-logs
Query: ?action=publish_post&platform=meta_instagram
```
Get audit logs

```http
GET /api/social/admin/configuration
```
Get system configuration and platform status

---

## 🎨 AI Content Generation

The content generator uses OpenAI with a carefully crafted Fixlo brand voice:

### Brand Guidelines
- **Tone:** Professional, trustworthy, solution-oriented
- **Style:** Premium quality without pretentiousness
- **Focus:** Helping homeowners, showcasing verified pros
- **Avoid:** Cartoonish language, excessive emojis, unrealistic guarantees

### Content Types
- **General:** Platform updates, tips, trust-building
- **Service-Specific:** Plumbing, electrical, HVAC, landscaping
- **Seasonal:** Winter prep, spring cleaning, summer maintenance
- **Testimonials:** Success stories and project celebrations

### Example Usage

```javascript
const { contentGenerator } = require('./modules/social-manager');

const result = await contentGenerator.generatePost({
  platform: 'meta_instagram',
  contentType: 'service-specific',
  service: 'plumbing',
  city: 'New York',
  season: 'winter',
  includeHashtags: true,
  includeCallToAction: true
});

console.log(result.content);
// "❄️ Winter in NYC means frozen pipes are a real threat..."

// Validate content
const validation = contentGenerator.validateContent(result.content);
console.log(validation.isValid); // true
```

---

## 📊 Analytics & Attribution

Track the complete funnel from social media to Fixlo conversions:

### Metrics Collected
- **Engagement:** Impressions, reach, likes, comments, shares, saves
- **Click-through:** Links clicked to Fixlo website
- **Signups:** New user registrations attributed to posts
- **Conversions:** Paid subscriptions from social traffic

### Attribution Tracking
Use UTM parameters to track conversions:
```
https://fixloapp.com/?utm_source=instagram&utm_medium=social&utm_campaign=plumbing_winter
```

### Example Analytics Query

```javascript
const { analyticsService } = require('./modules/social-manager');

const overview = await analyticsService.getOverview({
  ownerId: 'admin',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31')
});

console.log(overview.totals);
// { posts: 45, impressions: 125000, likes: 3200, ... }

console.log(overview.conversionRates);
// { clickThroughRate: 1.2, signupConversionRate: 8.5, ... }
```

---

## ⏱️ Smart Scheduling

Posts are automatically scheduled during optimal engagement windows:

### Optimal Times (EST)
- **Instagram:** 9am-1pm weekdays
- **Facebook:** 9am-11am, 3pm-4pm weekdays
- **TikTok:** 2pm-6pm all days
- **X (Twitter):** 8am-10am, 1pm-2pm weekdays
- **LinkedIn:** 10am-1pm weekdays (business hours)

### Scheduler Features
- ✅ Runs every 15 minutes
- ✅ Rate limit compliance per platform
- ✅ Auto-retry failed posts (max 3 attempts)
- ✅ Token refresh before posting
- ✅ Metrics collection (daily at 2 AM)

---

## 🔒 Security

### Token Encryption
All OAuth tokens are encrypted using **AES-256-GCM**:
- Unique IV per encryption
- Authentication tag validation
- Secure key storage via environment variable
- Automatic rotation support

### Audit Logging
Every action is logged for compliance:
- OAuth connections/disconnections
- Post publications
- Token refreshes
- Admin actions
- Emergency stops

### Privacy Compliance
- Tokens auto-expire after 90 days
- No passwords ever stored
- Audit logs include retention policies
- Sensitive data excluded from logs

---

## 🚨 Emergency Controls

### Kill Switch
Instantly stop all automated posting:

```javascript
const { adminService } = require('./modules/social-manager');

await adminService.activateEmergencyStop({
  reason: 'Content review needed',
  actorId: 'admin'
});
```

### Manual Approval Mode
Require human approval before any post goes live:

```javascript
await adminService.setApprovalMode({
  ownerId: 'admin',
  requiresApproval: true,
  actorId: 'admin'
});
```

---

## 🔄 Future SaaS Extraction

This module is designed for easy extraction:

### Clean Separation
- ✅ No hard dependencies on Fixlo core
- ✅ All interactions via well-defined interfaces
- ✅ Self-contained database models
- ✅ Independent environment variables

### Extraction Steps
1. Copy `/server/modules/social-manager` to new repo
2. Replace authentication middleware with your own
3. Adjust database connection (MongoDB URI)
4. Add billing/subscription layer
5. Deploy as standalone service

### SaaS Features Ready
- Multi-tenant support (via `ownerId`)
- Usage tracking (posts, metrics)
- Audit trail for compliance
- API-first design
- Platform scalability

---

## 📝 Development Notes

### Rate Limits (per hour)
- Instagram: 25 posts
- Facebook: 50 posts
- TikTok: 10 videos
- X (Twitter): 300 tweets
- LinkedIn: 20 posts

### Token Lifetimes
- Meta: 60 days (auto-refresh)
- TikTok: 24 hours (refresh token: 1 year)
- X: 2 hours (refresh token: 6 months)
- LinkedIn: 60 days (no refresh - requires re-auth)

### Platform Limitations
- Instagram requires Business Account + Facebook Page
- TikTok requires Business Account
- X requires paid API tier ($100/month minimum)
- LinkedIn requires verified Organization access

---

## 🐛 Troubleshooting

### "SOCIAL_ENCRYPTION_KEY not configured"
Generate and add encryption key to `.env`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### "No platforms configured"
Add at least one platform's OAuth credentials to `.env`

### "Account token is invalid"
User needs to re-authorize. Check `/api/social/status` for reauth alerts

### "Rate limit reached"
Post will be automatically deferred by 1 hour. Check platform-specific limits

### "Failed to publish post"
Check audit logs: `GET /api/social/admin/audit-logs?action=publish_post&status=failure`

---

## 📄 License

This module is part of Fixlo and follows the same license.
Designed for internal use and potential future standalone SaaS extraction.

---

## 🤝 Support

For questions or issues:
1. Check audit logs for error details
2. Review platform-specific OAuth documentation
3. Verify environment variables are set correctly
4. Ensure app verification is complete for each platform

---

**Built with ❤️ for Fixlo** | Production-Ready | Extraction-Ready | Brand-Safe
