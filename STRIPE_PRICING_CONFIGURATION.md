# Fixlo Pro Pricing Increase: Stripe Configuration Guide

## Overview

This guide explains how to configure Stripe products and prices for the new Fixlo Pro pricing structure:
- **Early Access Price**: $59.99/month (limited spots, price-locked for life)
- **Standard Price**: $179.99/month (default after early access ends)

## 🎯 Goals

1. Create a new Stripe product and recurring price at $179.99/month
2. Keep the existing $59.99 plan active but mark it as "Early Access – Price Locked"
3. Ensure existing subscribers remain on $59.99 with no changes
4. New checkouts must use the $179.99 price by default (or $59.99 if early access spots remain)

## 📋 Step-by-Step Configuration

### 1. Log into Stripe Dashboard

- Production: https://dashboard.stripe.com/
- Test Mode: https://dashboard.stripe.com/test/

**Important**: Perform these steps in BOTH test mode (for development) AND live mode (for production).

### 2. Update Existing $59.99 Product (Early Access)

Navigate to **Products** → Find your existing Fixlo Pro product

**Update Product Details:**
- **Name**: "Fixlo Pro (Early Access – Price Locked)"
- **Description**: "Early access pricing for Fixlo Pro membership. Price locked for life while subscription remains active. Limited availability."
- **Statement Descriptor**: "Fixlo Pro EA" (appears on customer's bank statement)

**Update the $59.99 Price:**
- Keep the existing price active
- **Description**: "Early Access Price - $59.99/month (Price Locked)"
- ⚠️ **Do NOT deactivate this price** - existing subscribers depend on it

**Copy the Price ID** (starts with `price_...`):
```
Test Mode: price_xxxxxxxxxxxxx
Live Mode: price_xxxxxxxxxxxxx
```

Save this as `STRIPE_EARLY_ACCESS_PRICE_ID` in your environment variables.

### 3. Create New $179.99 Product (Standard)

Click **+ Add Product**

**Product Details:**
- **Name**: "Fixlo Pro (Standard)"
- **Description**: "Standard Fixlo Pro membership for new subscribers. Unlimited job leads, professional dashboard, and platform access."
- **Statement Descriptor**: "Fixlo Pro Std"

**Pricing:**
- **Price Model**: Recurring
- **Amount**: $179.99 USD
- **Billing Period**: Monthly
- **Tax Behavior**: Exclusive (or Inclusive, based on your tax setup)

**Advanced Options:**
- Trial Period: None (no free trial)
- Lookup Key: `fixlo-pro-standard` (optional, for API reference)

**Metadata** (optional but recommended):
```
tier: PRO
plan_type: standard
price_locked: false
```

Click **Save Product**

**Copy the Price ID** (starts with `price_...`):
```
Test Mode: price_xxxxxxxxxxxxx
Live Mode: price_xxxxxxxxxxxxx
```

Save this as `STRIPE_STANDARD_PRICE_ID` in your environment variables.

### 4. Configure Environment Variables

Update your `.env` file (or production environment settings on Render):

#### Server Environment Variables

```bash
# Stripe Secret Keys (use test keys in development, live keys in production)
STRIPE_SECRET_KEY=sk_test_xxxxx  # or sk_live_xxxxx for production

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Early Access Price ($59.99/month)
STRIPE_EARLY_ACCESS_PRICE_ID=price_xxxxx

# Standard Price ($179.99/month)
STRIPE_STANDARD_PRICE_ID=price_xxxxx

# Legacy fallback (if not using new price IDs)
# STRIPE_PRICE_ID=prod_xxxxx

# API key for pricing-status daily decrement endpoint
PRICING_API_KEY=your_secure_random_key_here

# Fixlo Pro Product ID (for referral restrictions)
FIXLO_PRO_PRODUCT_ID=prod_xxxxx
```

#### Client Environment Variables

```bash
# Stripe Publishable Key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx  # or pk_live_xxxxx for production

# Stripe Checkout URL (optional, if using Payment Links)
VITE_STRIPE_CHECKOUT_URL=https://checkout.stripe.com/c/pay/cs_test_xxxxx
```

### 5. Set Up Webhooks

Navigate to **Developers** → **Webhooks** → **Add Endpoint**

**Endpoint URL:**
- Development: `https://your-dev-server.com/api/stripe/webhook`
- Production: `https://fixloapp.onrender.com/api/stripe/webhook`

**Events to Listen For:**
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**Webhook Signing Secret:**
Copy the signing secret (starts with `whsec_...`) and save it as `STRIPE_WEBHOOK_SECRET`.

### 6. Test the Configuration

#### Test Mode Verification

1. **Backend API Test:**
   ```bash
   curl https://your-server.com/api/pricing-status
   ```
   
   Should return:
   ```json
   {
     "success": true,
     "data": {
       "earlyAccessSpotsRemaining": 37,
       "earlyAccessAvailable": true,
       "currentPrice": 59.99,
       "nextPrice": 179.99,
       "currentPriceFormatted": "$59.99",
       "nextPriceFormatted": "$179.99"
     }
   }
   ```

2. **Frontend Test:**
   - Visit `/pricing` page
   - Verify early access banner shows correctly
   - Verify spot count displays
   - Visit `/pro/signup` page
   - Verify pricing information shows correctly

3. **Stripe Checkout Test:**
   - Use Stripe test card: `4242 4242 4242 4242`
   - Complete a test checkout
   - Verify webhook receives event
   - Check that early access spots decrement (check logs or database)

#### Live Mode Verification

1. Deploy to production with live keys
2. Verify pricing displays correctly on production site
3. Create a small test subscription (or refund immediately after)
4. Monitor Stripe Dashboard for events
5. Verify webhook processing in server logs

## 🔒 Security Considerations

1. **Environment Separation:**
   - ✅ Test keys (sk_test_, pk_test_) ONLY in development
   - ✅ Live keys (sk_live_, pk_live_) ONLY in production
   - ❌ The backend enforces this and will throw errors if mismatched

2. **Webhook Security:**
   - ✅ Always verify webhook signatures using STRIPE_WEBHOOK_SECRET
   - ✅ Required in production (enforced by backend)

3. **API Key Protection:**
   - ✅ Keep PRICING_API_KEY secret
   - ✅ Use strong random values (32+ characters)
   - ✅ Only call `/api/pricing-status/daily-decrement` from trusted cron jobs

4. **Early Access Spots:**
   - ✅ Spots can only decrease, never increase
   - ✅ Cannot go below zero
   - ✅ All changes are logged in database history

## 📊 Monitoring & Maintenance

### Check Early Access Spots

```bash
curl https://fixloapp.onrender.com/api/pricing-status
```

### Manual Daily Decrement (Cron Job)

Set up a daily cron job to automatically reduce spots:

```bash
curl -X POST https://fixloapp.onrender.com/api/pricing-status/daily-decrement \
  -H "X-API-Key: your_secret_key"
```

**Recommended Schedule:** Once per day at midnight UTC

### Monitor Stripe Events

- Check Stripe Dashboard → Developers → Events
- Monitor webhook delivery status
- Review failed webhook attempts and retry if needed

### Database Query (MongoDB)

Check early access spots directly:

```javascript
db.earlyaccessspots.findOne({ singleton: 'only' })
```

View spot history:

```javascript
db.earlyaccessspots.aggregate([
  { $match: { singleton: 'only' } },
  { $unwind: '$history' },
  { $sort: { 'history.timestamp': -1 } },
  { $limit: 20 }
])
```

## 🚨 Troubleshooting

### Issue: Early access spots not decrementing

**Check:**
1. Verify `STRIPE_EARLY_ACCESS_PRICE_ID` is correctly set
2. Check server logs for errors during webhook processing
3. Ensure webhook signature verification is passing
4. Verify MongoDB connection is working

**Solution:**
- Review webhook event in Stripe Dashboard
- Check if price ID in webhook matches `STRIPE_EARLY_ACCESS_PRICE_ID`
- Manually decrement if needed (see maintenance section)

### Issue: Users seeing wrong price

**Check:**
1. Browser cache (hard refresh with Ctrl+Shift+R)
2. API response from `/api/pricing-status`
3. Verify frontend is fetching latest data

**Solution:**
- Clear CDN cache if using Vercel
- Check API logs for errors
- Verify MongoDB has correct spot count

### Issue: Existing subscribers charged new price

**This should NEVER happen.** Stripe subscriptions are locked to their original price.

**Verify:**
1. Check customer's subscription in Stripe Dashboard
2. Verify price ID matches early access ID
3. If incorrect, immediately pause subscription and refund difference

## 📝 Post-Deployment Checklist

- [ ] Test mode configured and tested
- [ ] Live mode configured
- [ ] Environment variables set in production (Render)
- [ ] Webhooks set up and tested
- [ ] Early access spots initialized to 37
- [ ] Daily decrement cron job scheduled
- [ ] Frontend displays correct pricing
- [ ] Test checkout completed successfully
- [ ] Monitoring and alerts configured
- [ ] Documentation shared with team

## 🆘 Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Review Stripe Dashboard events
3. Verify all environment variables are set correctly
4. Contact Stripe support for payment-related issues

---

**Last Updated:** 2026-02-01
**Version:** 1.0
