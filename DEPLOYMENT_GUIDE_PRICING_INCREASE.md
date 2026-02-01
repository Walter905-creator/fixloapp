# Fixlo Pro Pricing Increase - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Fixlo Pro pricing increase from $59.99 to $179.99 with an early access system.

## Pre-Deployment Checklist

### ✅ Code Changes
- [x] Backend infrastructure (EarlyAccessSpots model, API endpoints)
- [x] Frontend UI updates (PricingPage, ProSignupPage)
- [x] Stripe integration updates
- [x] Environment variable documentation
- [x] Code review completed and approved
- [x] Security scan passed (CodeQL: 0 vulnerabilities)

### ✅ Documentation
- [x] Stripe configuration guide (`STRIPE_PRICING_CONFIGURATION.md`)
- [x] Security summary (`PRICING_INCREASE_SECURITY_SUMMARY.md`)
- [x] Environment variables documented (`.env.example`)

## Deployment Steps

### Phase 1: Stripe Configuration (30 minutes)

**Important:** Complete this phase in BOTH test mode and live mode.

#### 1.1 Test Mode Setup (Development)

1. Log into Stripe Dashboard: https://dashboard.stripe.com/test/
2. Update existing $59.99 product:
   - Name: "Fixlo Pro (Early Access – Price Locked)"
   - Description: "Early access pricing for Fixlo Pro membership. Price locked for life while subscription remains active."
   - Copy Price ID → Save as `STRIPE_EARLY_ACCESS_PRICE_ID` (test)

3. Create new $179.99 product:
   - Name: "Fixlo Pro (Standard)"
   - Price: $179.99/month, recurring
   - Copy Price ID → Save as `STRIPE_STANDARD_PRICE_ID` (test)

4. Configure webhook (test mode):
   - URL: `https://your-staging-server.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `invoice.payment_succeeded`
   - Copy Signing Secret → Save as `STRIPE_WEBHOOK_SECRET` (test)

#### 1.2 Live Mode Setup (Production)

1. Switch to Live Mode: https://dashboard.stripe.com/
2. Repeat steps 1-4 from test mode with live products
3. **CRITICAL:** Verify existing $59.99 subscribers are not affected

**See `STRIPE_PRICING_CONFIGURATION.md` for detailed instructions.**

### Phase 2: Backend Deployment (15 minutes)

#### 2.1 Environment Variables

Add these to your production environment (Render):

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_EARLY_ACCESS_PRICE_ID=price_xxxxx  # $59.99 Live mode price ID
STRIPE_STANDARD_PRICE_ID=price_xxxxx      # $179.99 Live mode price ID

# Pricing API
PRICING_API_KEY=<generate_secure_32_char_key>
```

**Generate secure API key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 2.2 Deploy Backend

```bash
# On Render or your hosting platform
git pull origin copilot/update-fixlo-pro-price
npm install
npm run build  # if applicable
# Restart server
```

#### 2.3 Verify Backend

Test the API endpoints:

```bash
# Check pricing status
curl https://fixloapp.onrender.com/api/pricing-status

# Expected response:
{
  "success": true,
  "data": {
    "earlyAccessSpotsRemaining": 37,
    "earlyAccessAvailable": true,
    "currentPrice": 59.99,
    "nextPrice": 179.99,
    "currentPriceFormatted": "$59.99",
    "nextPriceFormatted": "$179.99",
    "currency": "USD",
    "message": "Only 37 early-access spots remain..."
  }
}
```

### Phase 3: Frontend Deployment (10 minutes)

#### 3.1 Deploy to Vercel

```bash
# Vercel automatically deploys on push to main
# Or trigger manual deployment:
vercel --prod
```

#### 3.2 Clear CDN Cache (if applicable)

If using Cloudflare or other CDN:
```bash
# Purge cache for pricing pages
# /pricing
# /pro/signup
```

#### 3.3 Verify Frontend

1. Visit https://www.fixloapp.com/pricing
   - ✅ Early access banner shows
   - ✅ Spot count displays: "37 spots remaining"
   - ✅ Price shows $59.99
   - ✅ "Price locked for life" badge visible

2. Visit https://www.fixloapp.com/pro/signup
   - ✅ Early access pricing banner shows
   - ✅ Price comparison displayed ($59.99 vs $179.99)
   - ✅ Spot count visible

### Phase 4: Database Initialization (5 minutes)

#### 4.1 Initialize Early Access Spots

The `EarlyAccessSpots` model will auto-initialize on first API call, but you can manually verify:

**Option A: Let it auto-initialize**
- First call to `/api/pricing-status` will create the record

**Option B: Manual initialization via MongoDB**
```javascript
// Connect to MongoDB
db.earlyaccessspots.insertOne({
  spotsRemaining: 37,
  history: [{
    previousCount: 0,
    newCount: 37,
    reason: 'initial_setup',
    timestamp: new ISODate()
  }],
  lastDailyDecrement: null,
  singleton: 'only',
  createdAt: new ISODate(),
  updatedAt: new ISODate()
});
```

#### 4.2 Verify Database

```javascript
// Query to verify
db.earlyaccessspots.findOne({ singleton: 'only' })

// Expected result:
{
  _id: ObjectId("..."),
  spotsRemaining: 37,
  history: [ /* ... */ ],
  singleton: 'only',
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

### Phase 5: Cron Job Setup (10 minutes)

Set up a daily cron job to automatically decrement spots.

#### 5.1 Using Render Cron Jobs

1. In Render Dashboard → Your Service → Cron Jobs
2. Add new cron job:
   - **Name:** Daily Early Access Spot Decrement
   - **Schedule:** `0 0 * * *` (daily at midnight UTC)
   - **Command:** 
     ```bash
     curl -X POST https://fixloapp.onrender.com/api/pricing-status/daily-decrement \
       -H "X-API-Key: ${PRICING_API_KEY}"
     ```

#### 5.2 Alternative: External Cron Service

Use cron-job.org, EasyCron, or similar:

1. Create new job
2. URL: `https://fixloapp.onrender.com/api/pricing-status/daily-decrement`
3. Method: POST
4. Headers: `X-API-Key: <your_key>`
5. Schedule: Daily at midnight

#### 5.3 Test Cron Job

```bash
# Manual test
curl -X POST https://fixloapp.onrender.com/api/pricing-status/daily-decrement \
  -H "X-API-Key: <your_key>" \
  -H "Content-Type: application/json"

# Expected response:
{
  "success": true,
  "data": {
    "decremented": true,
    "spotsRemaining": 36,
    "message": "Daily decrement performed. 36 spots remaining."
  }
}
```

### Phase 6: Testing & Validation (30 minutes)

#### 6.1 End-to-End Test (Test Mode)

1. **Visit pricing page** → Verify early access displays correctly
2. **Click "Get Started"** → Verify signup page shows correct pricing
3. **Complete test checkout** with test card `4242 4242 4242 4242`
4. **Verify webhook** processes and decrements spots
5. **Check database** → `spotsRemaining` should be 36 (if started at 37)
6. **Check server logs** for confirmation messages

#### 6.2 Production Smoke Test

1. **Visit live site** → Verify pricing displays correctly
2. **Do NOT complete real checkout** unless testing with immediate refund
3. **Monitor Stripe Dashboard** → Webhooks tab for any errors
4. **Monitor server logs** for unexpected errors

### Phase 7: Monitoring Setup (15 minutes)

#### 7.1 Set Up Alerts

**Spot Count Alerts:**
```bash
# Alert when spots reach critical levels
# Configure in your monitoring tool (e.g., Datadog, New Relic)
- spots_remaining == 10
- spots_remaining == 5  
- spots_remaining == 1
- spots_remaining == 0
```

**Webhook Monitoring:**
```bash
# Monitor webhook success rate
# Alert on repeated failures
- webhook_failure_rate > 10%
- webhook_signature_verification_failures > 0
```

#### 7.2 Dashboard Setup

Create monitoring dashboard to track:
- Current spot count
- Daily spot decrements
- Early access subscription volume
- Webhook delivery status
- API response times for `/api/pricing-status`

### Phase 8: Communication Plan

#### 8.1 Internal Team Communication

**Notify:**
- Engineering team (deployment complete)
- Customer support (new pricing structure, how to answer questions)
- Sales team (early access positioning)
- Marketing team (ready for promotion)

**Share:**
- This deployment guide
- Stripe configuration guide
- Support FAQ (to be created)

#### 8.2 Customer Communication

**Existing Subscribers:**
- ✅ No communication needed (price locked automatically)
- ✅ Verify no billing changes in next cycle

**New Signups:**
- ✅ Automatic via website pricing display
- ✅ Early access messaging clearly visible
- ✅ "Price locked for life" assurance prominent

## Post-Deployment Checklist

### Immediate (First Hour)
- [ ] Verify frontend displays correct pricing
- [ ] Test API endpoints respond correctly
- [ ] Check Stripe webhooks are processing
- [ ] Monitor server logs for errors
- [ ] Verify spot count initialized to 37
- [ ] Test one checkout in production (with refund)

### First 24 Hours
- [ ] Monitor spot decrements (cron job)
- [ ] Track early access subscription volume
- [ ] Review webhook delivery success rate
- [ ] Check customer support tickets for confusion
- [ ] Verify existing subscribers unaffected
- [ ] Monitor API response times

### First Week
- [ ] Weekly spot count report
- [ ] Review conversion rates (early access vs standard)
- [ ] Analyze customer feedback
- [ ] Adjust messaging if needed
- [ ] Document any issues encountered
- [ ] Plan for "spots running low" marketing push

## Rollback Plan

### If Critical Issue Detected:

#### Option 1: Emergency Rollback (Backend)
```bash
# Revert to previous version
git revert <commit_hash>
git push origin main

# Or redeploy previous version
git checkout <previous_commit>
# Deploy to production
```

#### Option 2: Disable Early Access (Quick Fix)
```javascript
// Manually set spots to 0 in database
db.earlyaccessspots.updateOne(
  { singleton: 'only' },
  { 
    $set: { spotsRemaining: 0 },
    $push: { 
      history: {
        previousCount: <current>,
        newCount: 0,
        reason: 'manual_adjustment',
        metadata: { note: 'Emergency disable' },
        timestamp: new Date()
      }
    }
  }
)
```

This will force all new signups to $179.99 standard price.

#### Option 3: Pause New Signups
- Update Stripe products to "Archived" status
- Display maintenance message on pricing pages
- Investigate and fix issue
- Re-enable when resolved

## Support & Troubleshooting

### Common Issues

**Issue: Spots not decrementing**
- Check cron job is running
- Verify API key is correct
- Check webhook signature
- Review server logs

**See `STRIPE_PRICING_CONFIGURATION.md` for detailed troubleshooting.**

### Emergency Contacts

- **Technical Issues:** engineering@fixloapp.com
- **Stripe Issues:** https://support.stripe.com
- **Urgent:** [Your escalation process]

## Success Criteria

Deployment is successful when:
- ✅ Frontend displays correct pricing for all users
- ✅ Early access spots initialized to 37
- ✅ API endpoints responding correctly
- ✅ Webhooks processing successfully
- ✅ Existing subscribers unaffected
- ✅ No increase in support tickets
- ✅ Cron job running daily
- ✅ Monitoring and alerts active
- ✅ Team trained and informed

## Timeline

**Total Estimated Time:** 2-3 hours

- Phase 1 (Stripe): 30 min
- Phase 2 (Backend): 15 min
- Phase 3 (Frontend): 10 min
- Phase 4 (Database): 5 min
- Phase 5 (Cron): 10 min
- Phase 6 (Testing): 30 min
- Phase 7 (Monitoring): 15 min
- Phase 8 (Communication): 15 min
- Buffer: 30 min

**Recommended Deployment Window:**
- Low-traffic period (e.g., Sunday 2-4 AM PST)
- Have engineering on-call for 24h post-deployment
- Avoid holidays or major events

---

**Prepared by:** GitHub Copilot  
**Last Updated:** 2026-02-01  
**Version:** 1.0
