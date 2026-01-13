# Commission Referral System - GO-LIVE Guide

## 🚀 System Status: PRODUCTION READY

The commission referral system is now fully implemented and ready for public activation. All components have been tested and verified.

## 📋 Implementation Completed

### ✅ Backend Features
- [x] 30-day verification cron job (runs daily at 4 AM EST)
- [x] Stripe Connect Express onboarding
- [x] Admin payout approval workflow
- [x] Stripe Connect payout execution
- [x] Idempotency protection for payouts
- [x] Feature flag enforcement on all routes
- [x] $25 minimum payout validation
- [x] Health check endpoints

### ✅ Frontend Features
- [x] Public commission referral dashboard at `/earn`
- [x] Stripe Connect onboarding UI
- [x] Functional payout request with social media verification
- [x] $25 minimum payout enforcement
- [x] Stripe Connect account status display
- [x] 10-question FAQ section
- [x] Independent opportunity disclaimer
- [x] Feature flag enforcement (renders nothing when disabled)

### ✅ Security & Compliance
- [x] Admin routes protected with `adminAuth` middleware
- [x] No PayPal references (Stripe Connect only)
- [x] Feature flags disable system instantly
- [x] No breaking changes to existing systems
- [x] Commission rates properly enforced (15-20%)

## 🔧 Environment Configuration

### Required Server Environment Variables

Add to `/server/.env`:

```bash
# Commission Referral System
REFERRALS_ENABLED=false  # Set to 'true' to enable system

# Stripe Connect Processing Fees
STRIPE_PERCENTAGE_FEE=0.029  # 2.9% (review periodically)
STRIPE_FIXED_FEE_CENTS=30    # $0.30 in cents (review periodically)

# Required: Stripe Secret Key for payouts
STRIPE_SECRET_KEY=sk_live_your_key_here  # MUST use live key in production
```

### Required Client Environment Variables

Add to root `.env` (used by Vite):

```bash
# Commission Referral System (Frontend)
VITE_REFERRALS_ENABLED=false  # Set to 'true' to enable UI
```

**IMPORTANT**: After changing `VITE_REFERRALS_ENABLED`, you MUST rebuild the client:
```bash
cd client
npm run build
```

## 🎯 GO-LIVE Activation Steps

### Step 1: Pre-Activation Checks

1. **Verify Stripe is configured**:
   ```bash
   # Check server has Stripe key
   grep STRIPE_SECRET_KEY server/.env
   ```

2. **Verify database connection**:
   ```bash
   # Check MongoDB URI is set
   grep MONGODB_URI server/.env
   ```

3. **Test feature flags work**:
   ```bash
   cd server
   node test-commission-system.js
   ```

### Step 2: Enable Backend (Server)

1. Edit `/server/.env`:
   ```bash
   REFERRALS_ENABLED=true
   ```

2. Restart server:
   ```bash
   # On Render, trigger redeploy or restart service
   ```

3. Verify health endpoint:
   ```bash
   curl https://fixloapp.onrender.com/api/commission-referrals/health
   # Should return: { "ok": true, "enabled": true }
   ```

### Step 3: Enable Frontend (Client)

1. Edit root `.env`:
   ```bash
   VITE_REFERRALS_ENABLED=true
   ```

2. Rebuild and deploy client:
   ```bash
   cd client
   npm run build
   # Deploy to Vercel
   ```

3. Verify page loads:
   ```bash
   # Visit https://www.fixloapp.com/earn
   # Should show full referral dashboard
   ```

### Step 4: Verification Tests

Run these tests after activation:

#### Test 1: Feature Enabled
```bash
curl https://fixloapp.onrender.com/api/commission-referrals/health
# Expected: { "ok": true, "enabled": true }
```

#### Test 2: Minimum Payout Enforcement
```bash
curl https://fixloapp.onrender.com/api/payouts/health
# Expected: { "ok": true, "enabled": true, "minPayoutAmount": 25 }
```

#### Test 3: UI Loads
- Visit https://www.fixloapp.com/earn
- Verify "Earn Cash by Referring Professionals" page loads
- Verify FAQ section shows 10 questions
- Verify "Independent commission opportunity" disclaimer visible

#### Test 4: Registration Works
- Enter email and name
- Click "Create My Referral Link"
- Verify referral code is generated (format: EARN-XXXXXX)
- Verify referral URL is displayed

#### Test 5: Stripe Connect Onboarding
- With registered account, click "Connect Stripe Account"
- Verify redirect to Stripe Express onboarding
- Complete onboarding (or cancel)
- Verify status updates on return

## 🔒 Security Features

### Anti-Fraud Protections
- ✅ IP address tracking on signups
- ✅ Device fingerprinting
- ✅ Duplicate referral detection
- ✅ Self-referral prevention (via email)
- ✅ Rate limiting on all endpoints

### Admin Controls
- ✅ Manual approval required for all payouts
- ✅ Social media verification required
- ✅ Admin routes protected with JWT auth
- ✅ Fraud flagging system in place

### Financial Safety
- ✅ $25 USD minimum payout
- ✅ Stripe Connect for secure transfers
- ✅ Processing fees deducted automatically
- ✅ Idempotency checks prevent duplicate payouts
- ✅ 30-day active requirement before eligibility

## 📊 Admin Operations

### View Pending Payouts
```bash
curl -X GET https://fixloapp.onrender.com/api/payouts/admin/pending \
  -H "Authorization: Bearer YOUR_ADMIN_JWT"
```

### Approve a Payout
```bash
curl -X POST https://fixloapp.onrender.com/api/payouts/admin/approve/{payoutId} \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"adminEmail": "admin@fixloapp.com", "notes": "Verified social post"}'
```

### Execute Approved Payout
```bash
curl -X POST https://fixloapp.onrender.com/api/payouts/admin/execute/{payoutId} \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"adminEmail": "admin@fixloapp.com"}'
```

### Reject a Payout
```bash
curl -X POST https://fixloapp.onrender.com/api/payouts/admin/reject/{payoutId} \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"adminEmail": "admin@fixloapp.com", "reason": "Social media post not verified"}'
```

## 🕐 Automated Tasks

### 30-Day Verification Cron
- **Schedule**: Daily at 4:00 AM EST
- **Purpose**: Check if referred Pros have stayed active for 30 days
- **Action**: Marks eligible referrals as "eligible" for payout
- **Feature Flag**: Only runs when `REFERRALS_ENABLED=true`

**Manual Trigger**:
```javascript
// In server console or admin panel
const { triggerTask } = require('./services/scheduledTasks');
await triggerTask('verify-30day-commission-referrals');
```

## 🔄 Rollback Procedure

If issues arise, the system can be disabled instantly:

### Emergency Disable

1. **Disable Backend**:
   ```bash
   # In server/.env
   REFERRALS_ENABLED=false
   # Restart server
   ```
   - All API endpoints immediately return 403
   - Cron job stops processing

2. **Disable Frontend**:
   ```bash
   # In root .env
   VITE_REFERRALS_ENABLED=false
   # Rebuild and redeploy client
   cd client && npm run build
   ```
   - `/earn` page renders nothing
   - No UI elements visible

3. **Verify Disable**:
   ```bash
   curl https://fixloapp.onrender.com/api/commission-referrals/health
   # Expected: { "ok": true, "enabled": false }
   ```

## 📈 Monitoring

### Key Metrics to Track
- New referrer registrations per day
- Referral conversion rate (referrals → active Pros)
- Commission amounts earned
- Payout requests per week
- Fraud attempts flagged
- 30-day retention rate for referred Pros

### Health Checks
- **Commission Service**: `GET /api/commission-referrals/health`
- **Payout Service**: `GET /api/payouts/health`
- **Scheduled Tasks**: Check server logs for cron execution

### Server Logs to Monitor
```bash
# Look for these patterns:
✅ New commission referrer registered
✅ Commission referral tracked
✅ Referral eligible
✅ Payout requested
✅ Payout approved
✅ Payout executed successfully
⚠️ Duplicate commission referral attempt
❌ Referral cancelled (Pro inactive)
```

## 🚨 Known Limitations

### Current Implementation
- No automatic Stripe Connect verification (admin must verify)
- Social media post URL is not automatically validated
- Processing fees are estimates (Stripe fees may vary)
- Single currency support (USD only)
- No referral reward stacking (one referral per Pro)

### Future Enhancements
- Multi-currency support
- Automated social media post verification
- Real-time Stripe fee calculation
- Referral analytics dashboard for admins
- Email notifications for payout status changes

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: `/earn` page shows nothing
- **Solution**: Check `VITE_REFERRALS_ENABLED=true` in root `.env` and rebuild client

**Issue**: API returns 403 Forbidden
- **Solution**: Check `REFERRALS_ENABLED=true` in `server/.env` and restart server

**Issue**: Payout button disabled
- **Solution**: Verify balance ≥ $25 and Stripe Connect is completed

**Issue**: Stripe Connect redirect fails
- **Solution**: Verify `STRIPE_SECRET_KEY` is set and using correct mode (test/live)

### Getting Help
- Review server logs for error messages
- Check feature flag settings
- Verify environment variables are set correctly
- Test with feature flags disabled/enabled

## ✅ Final Checklist

Before declaring GO-LIVE:

- [ ] `REFERRALS_ENABLED=true` in production server
- [ ] `VITE_REFERRALS_ENABLED=true` in production client
- [ ] Client rebuilt and deployed after env change
- [ ] Server restarted after env change
- [ ] Health endpoints return `enabled: true`
- [ ] `/earn` page loads correctly
- [ ] Test registration creates referral code
- [ ] Stripe Connect onboarding works
- [ ] $25 minimum enforced
- [ ] Admin can view pending payouts
- [ ] Cron job scheduled and running
- [ ] No PayPal references in code
- [ ] All admin routes protected
- [ ] Rollback procedure documented

## 🎉 GO-LIVE CONFIRMATION

**Date**: _____________
**Activated By**: _____________
**Version**: 1.0.0
**Status**: ✅ LIVE

---

**Last Updated**: 2026-01-13
**Documentation Version**: 1.0.0
