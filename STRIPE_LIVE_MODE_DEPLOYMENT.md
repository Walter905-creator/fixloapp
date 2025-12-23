# 🚀 Stripe Live Mode - Quick Deployment Guide

## Pre-Deployment Checklist

### 1. Stripe Dashboard Setup
- [ ] Switch to Live Mode in Stripe Dashboard (toggle in top right)
- [ ] Copy Live Secret Key: `sk_live_...`
- [ ] Copy Live Publishable Key: `pk_live_...`
- [ ] Create webhook endpoint: `https://fixloapp.onrender.com/api/stripe/webhook`
- [ ] Enable webhook events:
  - `payment_intent.succeeded`
  - `payment_intent.failed`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `checkout.session.completed`
  - `customer.subscription.trial_will_end`
  - `customer.subscription.deleted`
- [ ] Copy Webhook Signing Secret: `whsec_...`

### 2. Backend Deployment (Render)
```bash
# Set these environment variables in Render dashboard:
STRIPE_SECRET_KEY=sk_live_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
NODE_ENV=production
```

- [ ] Navigate to Render dashboard
- [ ] Select fixloapp backend service
- [ ] Go to Environment tab
- [ ] Add/update the three variables above
- [ ] Click "Save Changes"
- [ ] Backend will auto-redeploy

### 3. Frontend Deployment (Vercel)
```bash
# Set these environment variables in Vercel dashboard:
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE
NODE_ENV=production
```

- [ ] Navigate to Vercel dashboard
- [ ] Select fixloapp project
- [ ] Go to Settings > Environment Variables
- [ ] Add/update the two variables above
- [ ] Click "Save"
- [ ] Redeploy: Deployments tab > click "..." > "Redeploy"

## Post-Deployment Verification

### 1. Check Backend Logs (Render)
Look for this line on startup:
```
✅ Stripe initialized in LIVE MODE
```

If you see this, it's working:
```
❌ SECURITY ERROR: Stripe LIVE secret key required in production
```
Then your key is wrong or missing.

### 2. Check Frontend Console (Browser)
Open https://www.fixloapp.com
Open browser DevTools > Console
Look for:
```
🔧 Configuration loaded: {
  STRIPE_PUBLISHABLE_KEY: '✅ Set (LIVE MODE)'
}
```

### 3. Test Webhook (Stripe Dashboard)
- [ ] Go to Stripe Dashboard > Developers > Webhooks
- [ ] Click on your webhook endpoint
- [ ] Click "Send test webhook"
- [ ] Select "payment_intent.succeeded"
- [ ] Check Render logs for: `🔔 Stripe webhook event: payment_intent.succeeded`
- [ ] Verify: `✅ Webhook signature verified`

### 4. Test Service Request Flow (Optional)
**⚠️ WARNING: This will create real Stripe records**

1. Go to https://www.fixloapp.com
2. Click "Request Service" (if available)
3. Fill out the form
4. Enter a test card (only in Stripe test mode - don't do this in live mode yet!)
5. Check Stripe Dashboard > Payments for the SetupIntent

## Troubleshooting

### Error: "Stripe LIVE secret key required in production"
**Solution:** Your backend has a test key (`sk_test_...`) in production
- Update `STRIPE_SECRET_KEY` in Render to use `sk_live_...`
- Redeploy backend

### Error: "Stripe LIVE publishable key required in production"
**Solution:** Your frontend has a test key (`pk_test_...`) in production
- Update `VITE_STRIPE_PUBLISHABLE_KEY` in Vercel to use `pk_live_...`
- Redeploy frontend

### Error: "Webhook signature verification failed"
**Solution:** Webhook secret is missing or incorrect
- Copy signing secret from Stripe Dashboard > Webhooks > [your endpoint]
- Update `STRIPE_WEBHOOK_SECRET` in Render
- Redeploy backend

### Webhooks not being received
**Solution:** Check webhook URL and events
- Verify webhook URL is exactly: `https://fixloapp.onrender.com/api/stripe/webhook`
- Ensure all required events are enabled
- Check "Recent deliveries" in Stripe Dashboard webhook page

### Frontend shows "Stripe not configured"
**Solution:** Frontend can't load Stripe
- Check browser console for errors
- Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set in Vercel
- Verify key starts with `pk_live_` in production
- Clear browser cache and hard reload (Ctrl+Shift+R)

## Testing in Development

### Local Backend
```bash
cd server
export NODE_ENV=development
export STRIPE_SECRET_KEY=sk_test_YOUR_KEY
export STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
npm start
```

### Local Frontend
```bash
cd client
export NODE_ENV=development
export VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
npm run dev
```

## Security Reminders

✅ **DO:**
- Use `sk_live_` keys in production only
- Use `pk_live_` keys in production only
- Keep webhook secrets secure
- Monitor Stripe Dashboard for suspicious activity

❌ **DON'T:**
- Never commit API keys to git
- Never use test keys in production
- Never use live keys in development
- Never share webhook signing secrets
- Never log full card details

## Support

If you encounter issues:
1. Check Render logs (Backend)
2. Check Vercel logs (Frontend)
3. Check Stripe Dashboard > Logs
4. Review STRIPE_LIVE_MODE_IMPLEMENTATION.md for details

---

**✅ You're ready to accept real payments!**
