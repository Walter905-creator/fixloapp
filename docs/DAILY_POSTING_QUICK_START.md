# Daily Automated Posting - Quick Start

## 🚀 Enable Daily Posts in 3 Steps

### Step 1: Configure (1 minute)

Add to `server/.env`:
```bash
SOCIAL_DAILY_POST_GENERATE_TIME="0 6 * * *"  # 6 AM daily
SOCIAL_DAILY_POST_PUBLISH_TIME="10:00"       # 10 AM daily
SOCIAL_DAILY_POST_CITY="Miami"               # Your city
SOCIAL_DAILY_POST_REQUIRE_APPROVAL=false     # Auto-publish
```

### Step 2: Start Daily Poster

```bash
curl -X POST https://fixloapp.com/api/social/daily-poster/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Step 3: Verify

```bash
curl https://fixloapp.com/api/social/daily-poster/status
```

✅ **Done!** Your Facebook page will now post daily at 10 AM.

---

## 📅 What Gets Posted

### Weekly Schedule

| Day | Content Type | Example |
|-----|--------------|---------|
| **Sun** | Trust/General | "Why homeowners trust Fixlo..." |
| **Mon** | Service (Plumbing) | "Expert plumbing in Miami..." |
| **Tue** | Tips | "5 signs you need HVAC repair..." |
| **Wed** | Service (Electrical) | "Professional electricians..." |
| **Thu** | Seasonal | "Winter home prep tips..." |
| **Fri** | Weekend | "Get your home weekend-ready..." |
| **Sat** | Stories | "This week's transformations..." |

Content automatically rotates and adapts to seasons!

---

## 🎯 Key Features

✅ **AI-Generated Content** - Professional posts tailored to home services
✅ **Auto-Scheduling** - Posts at optimal engagement times
✅ **Theme Rotation** - Different content each day
✅ **Seasonal Adaptation** - Winter prep, spring cleaning, etc.
✅ **City Localization** - Content specific to your city
✅ **Approval Mode** - Review before publishing (optional)
✅ **Analytics** - Track performance automatically

---

## 📡 Essential Commands

### Start/Stop Daily Posting
```bash
# Start
POST /api/social/daily-poster/start

# Stop
POST /api/social/daily-poster/stop

# Status
GET /api/social/daily-poster/status
```

### Generate Post Manually
```bash
POST /api/social/daily-poster/generate-now
Body: {"platform": "meta_facebook"}
```

### Update Settings
```bash
POST /api/social/daily-poster/config
Body: {
  "publishTime": "14:00",
  "requiresApproval": false,
  "defaultCity": "New York"
}
```

---

## ⚙️ Configuration Options

### Timing
- **generateTime**: When to create posts (cron format)
  - `"0 6 * * *"` = 6 AM daily
  - `"0 9 * * 1-5"` = 9 AM weekdays only
  - `"0 12 * * *"` = Noon daily

- **publishTime**: When to publish (HH:MM format)
  - `"10:00"` = 10 AM
  - `"14:00"` = 2 PM
  - `"09:30"` = 9:30 AM

### Approval Mode
- **requiresApproval: false** - Auto-publish (recommended after testing)
- **requiresApproval: true** - Manual approval required

### Platforms
Posts to Facebook by default, optionally Instagram too.

---

## 🛡️ Safety Features

### Start with Approval Mode
```bash
SOCIAL_DAILY_POST_REQUIRE_APPROVAL=true
```
Review first few posts, then disable for full automation.

### Emergency Stop
```bash
curl -X POST https://fixloapp.com/api/social/admin/emergency-stop \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"activate": true}'
```

### Audit Logs
```bash
GET /api/social/admin/audit-logs?action=daily_post_generation
```

---

## 🔧 Troubleshooting

### Posts not generating?
1. Check status: `GET /api/social/daily-poster/status`
2. Verify Facebook connected: `GET /api/social/force-status`
3. Ensure main scheduler running: `GET /api/social/scheduler/status`

### Posts stuck pending?
Approval mode is on. Either:
- Approve: `POST /api/social/post/{id}/approve`
- Or disable: `POST /api/social/daily-poster/config` with `requiresApproval: false`

### Need to test first?
Generate a test post:
```bash
POST /api/social/daily-poster/generate-now
```

---

## 📊 Best Practices

1. **Start with approval** - Review first week of content
2. **Set your city** - Makes content more relevant
3. **Choose optimal time** - 9-11 AM or 3-4 PM for Facebook
4. **Monitor weekly** - Check analytics for engagement
5. **Adjust as needed** - Update timing/content based on data

---

## 📚 Full Documentation

- **Complete Guide:** `/docs/DAILY_POSTING_GUIDE.md`
- **Setup Guide:** `/docs/FACEBOOK_BUSINESS_AUTOMATION_SETUP.md`
- **Quick Ref:** `/docs/FACEBOOK_AUTOMATION_QUICK_REFERENCE.md`
- **API Docs:** `/server/modules/social-manager/README.md`

---

## ✅ Complete Setup Checklist

- [ ] Facebook page connected
- [ ] Environment variables configured
- [ ] Main scheduler started
- [ ] Daily poster started
- [ ] Test post generated
- [ ] First post reviewed
- [ ] Approval mode adjusted
- [ ] Monitoring set up

---

**🎉 Your Facebook Business page is now fully automated!**

One fresh post every day, no manual work required.
