# Production Stripe Configuration Guide

## Overview
This document explains the Stripe configuration setup for production payment processing on Fixlo.

## Changes Made

### 1. Removed Development Warnings from Production Builds
**File**: `client/src/utils/config.js`

The configuration has been updated to:
- ✅ **Suppress development warnings in production builds** - No more console warnings about Stripe keys appearing in production
- ✅ **Enforce live Stripe keys in production** - Application will throw an error if production doesn't have a `pk_live_` key
- ✅ **Remove debug logging in production** - The "🔧 Configuration loaded" message no longer appears in production
- ✅ **Conditional development warnings** - Warnings about non-test keys only appear during actual development (not during build process)

### 2. Production Validation

The configuration now enforces these rules:

#### Production Environment (NODE_ENV === 'production')
- **REQUIRED**: `VITE_STRIPE_PUBLISHABLE_KEY` must be set
- **REQUIRED**: Key must start with `pk_live_`
- **BEHAVIOR**: Application throws an error and refuses to start if requirements not met
- **LOGGING**: No development warnings or debug logs in console

#### Development Environment (NODE_ENV !== 'production')  
- **RECOMMENDED**: Use `pk_test_` keys for development/testing
- **BEHAVIOR**: Warning shown only in browser console during active development
- **LOGGING**: Warnings suppressed during build process to avoid confusion

## Deployment Checklist

### Required Environment Variables for Production

#### Frontend (Vercel)
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_live_key_here
NODE_ENV=production
```

#### Backend (Render)
```bash
STRIPE_SECRET_KEY=sk_live_your_actual_live_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
NODE_ENV=production
```

## Verification Steps

### 1. Build Verification
```bash
cd client
NODE_ENV=production npm run build
```

Expected result:
- ✅ Build completes successfully
- ✅ No Stripe warnings in build output
- ✅ No "Configuration loaded" messages

### 2. Production Console Check
After deploying to production:

1. Open browser console on https://www.fixloapp.com
2. Check for console messages
3. Expected result:
   - ✅ No "WARNING: Using a non-test Stripe key" messages
   - ✅ No "Configuration loaded" debug logs
   - ✅ No development-related console output

### 3. Stripe Payment Flow Test
1. Navigate to payment page
2. Enter test card (if still in test mode) or real card (if live)
3. Complete payment
4. Verify:
   - ✅ Payment processes successfully
   - ✅ Webhook events received on backend
   - ✅ No console errors

## Security Features

### Enforced Live Keys in Production
```javascript
// Production requires pk_live_ keys
if (nodeEnv === 'production') {
  if (!stripePublishableKey.startsWith('pk_live_')) {
    throw new Error('Stripe LIVE publishable key required in production. Use pk_live_ keys only.');
  }
}
```

### Development Safety
```javascript
// Warnings only shown in actual development, not during builds
if (stripePublishableKey && nodeEnv !== 'production' && !stripePublishableKey.startsWith('pk_test_')) {
  if (typeof window !== 'undefined' && nodeEnv === 'development') {
    console.warn('⚠️ WARNING: Using a non-test Stripe key in non-production environment');
  }
}
```

## Troubleshooting

### Error: "Stripe LIVE publishable key required in production"
**Cause**: Production environment doesn't have a valid Stripe live key set

**Solution**:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Set `VITE_STRIPE_PUBLISHABLE_KEY` to your `pk_live_...` key from Stripe Dashboard
3. Redeploy the application

### Warnings Still Appearing in Production
**Check**:
1. Verify `NODE_ENV=production` is set in deployment environment
2. Clear browser cache and hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
3. Verify you're testing on the production domain, not a preview deployment

### Payments Not Processing
**Check**:
1. Verify Stripe webhook is configured and pointing to production backend
2. Check backend logs for Stripe API errors
3. Ensure backend `STRIPE_SECRET_KEY` matches the environment (test vs live) of frontend key
4. Verify Stripe account is fully activated and not in test mode

## Key Differences: Test vs Live Mode

| Aspect | Test Mode | Live Mode |
|--------|-----------|-----------|
| Frontend Key | `pk_test_...` | `pk_live_...` |
| Backend Key | `sk_test_...` | `sk_live_...` |
| Test Cards | ✅ Works | ❌ Rejected |
| Real Cards | ❌ Rejected | ✅ Works |
| Money Moved | ❌ No | ✅ Yes |
| Webhooks | Separate endpoint | Separate endpoint |

## Going Live Checklist

- [ ] Stripe account activated and verified
- [ ] Live mode enabled in Stripe Dashboard
- [ ] `pk_live_...` key set in Vercel (frontend)
- [ ] `sk_live_...` key set in Render (backend)
- [ ] Webhook endpoint configured for production URL
- [ ] Webhook signing secret updated in backend
- [ ] SSL certificate valid on production domain
- [ ] Test payment flow with real card
- [ ] Verify webhook events received
- [ ] Monitor Stripe Dashboard for errors
- [ ] Set up Stripe email notifications
- [ ] Review Stripe fraud/radar settings

## Support

For issues:
1. Check Stripe Dashboard → Logs for API errors
2. Check backend logs on Render
3. Check browser console for frontend errors
4. Contact Stripe Support if payment processing issues persist

## References

- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Stripe API Keys](https://stripe.com/docs/keys)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)
