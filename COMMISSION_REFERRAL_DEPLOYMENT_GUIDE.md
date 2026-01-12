# Commission Referral System - Deployment Guide

## Pre-Deployment Checklist

### ✅ Backend Requirements
- [ ] All new models created and committed
- [ ] All new routes registered in `server/index.js`
- [ ] Cron job added to `scheduledTasks.js`
- [ ] Feature flag `REFERRALS_ENABLED=false` set in production `.env`
- [ ] MongoDB connection confirmed

### ✅ Frontend Requirements
- [ ] New components created and committed
- [ ] Routes added to `App.jsx`
- [ ] Feature flag `VITE_REFERRALS_ENABLED=false` set in production `.env`
- [ ] Build tested locally

### ✅ Environment Variables

**Server (.env):**
```bash
# Commission Referral System
REFERRALS_ENABLED=false  # Start with false, enable after testing
```

**Client (.env):**
```bash
# Commission Referral System
VITE_REFERRALS_ENABLED=false  # Start with false, enable after testing
```

## Deployment Steps

### Step 1: Deploy Backend (Render)

1. **Commit and push changes:**
```bash
git add .
git commit -m "Add commission-based referral system"
git push origin main
```

2. **Deploy to Render:**
   - Render will auto-deploy from GitHub
   - Or manually trigger deployment in Render dashboard

3. **Update environment variables in Render:**
   - Go to Render Dashboard → fixloapp-server
   - Environment → Add Variable
   - Key: `REFERRALS_ENABLED`, Value: `false`
   - Save and restart

4. **Verify deployment:**
```bash
curl https://fixloapp.onrender.com/api/commission-referrals/health

# Expected response:
{
  "ok": true,
  "service": "commission-referrals",
  "enabled": false
}
```

### Step 2: Deploy Frontend (Vercel)

1. **Build client locally (test):**
```bash
cd client
npm install
npm run build
```

2. **Push changes to trigger Vercel deployment:**
```bash
git push origin main
```

3. **Update environment variables in Vercel:**
   - Go to Vercel Dashboard → fixloapp
   - Settings → Environment Variables
   - Add: `VITE_REFERRALS_ENABLED` = `false`
   - Redeploy

4. **Verify deployment:**
   - Visit https://www.fixloapp.com/earn
   - Should show "Referral system is not currently available" message

### Step 3: Database Verification

1. **Connect to MongoDB:**
```bash
mongo "your_mongodb_uri"
```

2. **Verify collections created (after first API call):**
```javascript
show collections
// Should see:
// - commissionreferrers
// - commissionreferrals
// - commissionsocialverifications
// - commissionpayouts
```

3. **Verify indexes:**
```javascript
db.commissionreferrers.getIndexes()
db.commissionreferrals.getIndexes()
```

### Step 4: Test in Production (Feature Disabled)

1. **Verify feature is disabled:**
```bash
# Backend
curl https://fixloapp.onrender.com/api/commission-referrals/health

# Frontend
# Visit https://www.fixloapp.com/earn
# Should show error message
```

2. **Verify existing functionality unchanged:**
   - Test Pro signup flow
   - Test Pro dashboard
   - Test existing Pro-to-Pro referral system
   - Test Stripe checkout

### Step 5: Enable Feature (When Ready)

1. **Update backend environment:**
   - Render Dashboard → Environment Variables
   - Set `REFERRALS_ENABLED=true`
   - Restart server

2. **Update frontend environment:**
   - Vercel Dashboard → Environment Variables
   - Set `VITE_REFERRALS_ENABLED=true`
   - Redeploy

3. **Verify feature is enabled:**
```bash
curl https://fixloapp.onrender.com/api/commission-referrals/health
# Should return: "enabled": true
```

4. **Test full flow:**
   - Visit https://www.fixloapp.com/earn
   - Register as referrer
   - Get referral link
   - Share on social media
   - Submit social verification
   - (As admin) Approve social verification
   - Test referral signup flow
   - Wait 30 days or manually trigger verification
   - Request payout
   - (As admin) Approve payout

## Rollback Plan

If issues occur, immediately disable the feature:

### Quick Rollback

1. **Disable backend:**
```bash
# In Render dashboard
REFERRALS_ENABLED=false
# Restart server
```

2. **Disable frontend:**
```bash
# In Vercel dashboard
VITE_REFERRALS_ENABLED=false
# Redeploy
```

3. **Verify rollback:**
   - Test /earn page (should show disabled message)
   - Test existing features (should work normally)

### Full Rollback (if needed)

1. **Revert git commits:**
```bash
git revert HEAD~3  # Revert last 3 commits (adjust number)
git push origin main
```

2. **Clear browser caches:**
   - Vercel will auto-clear on redeploy
   - Users may need to hard refresh

## Post-Deployment Monitoring

### First 24 Hours

Monitor these metrics:
1. **API Health:**
   ```bash
   curl https://fixloapp.onrender.com/api/commission-referrals/health
   ```

2. **Server Logs:**
   - Check Render logs for errors
   - Look for commission referral related messages

3. **Database Growth:**
   ```javascript
   db.commissionreferrers.count()
   db.commissionreferrals.count()
   ```

4. **Cron Job Execution:**
   - Check logs for "Starting daily referral verification job"
   - Verify it runs at 2 AM UTC

5. **Error Monitoring:**
   - Check for any 500 errors
   - Monitor fraud flags
   - Review failed registrations

### First Week

1. **Review admin queue:**
   - Social verifications pending
   - Payout requests pending
   - Flagged referrals

2. **Financial Reconciliation:**
   - Total commissions approved
   - Total commissions paid
   - Pending payouts

3. **User Feedback:**
   - Monitor support requests
   - Check for confusion or issues

## Common Issues & Solutions

### Issue: Cron job not running

**Solution:**
```bash
# Manually trigger verification
curl -X POST https://fixloapp.onrender.com/api/admin/commission-referrals/verify-now \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Issue: Referrals not tracking

**Check:**
1. Is `REFERRALS_ENABLED=true` on both backend and frontend?
2. Are cookies enabled in browser?
3. Check browser console for API errors
4. Verify referral code is valid

### Issue: Payouts failing

**Check:**
1. Is social verification approved?
2. Is available balance sufficient?
3. Is Stripe Connect configured?
4. Check admin approval status

### Issue: High fraud detection

**Actions:**
1. Review fraud flags in admin dashboard
2. Adjust IP rate limit if needed: `MAX_REFERRALS_PER_IP`
3. Ban suspicious referrers manually
4. Export fraud data for analysis

## Performance Optimization

### Database Indexes

Ensure these indexes exist (created automatically):
```javascript
// CommissionReferrer
{ email: 1 }
{ referralCode: 1 }
{ country: 1, status: 1 }

// CommissionReferral
{ referrerId: 1, status: 1 }
{ proId: 1, status: 1 }
{ verificationDueDate: 1, status: 1 }
{ proEmail: 1, createdAt: -1 }
```

### Caching Strategy (Future)

Consider adding Redis for:
- Referrer dashboard data (5 min TTL)
- Referral stats (5 min TTL)
- Admin stats (10 min TTL)

## Security Hardening

### Rate Limiting

Current limits (in `server/middleware/rateLimiter.js`):
- General API: 100 requests per 15 minutes per IP
- Admin API: 50 requests per 15 minutes per IP

### Input Validation

All inputs are validated:
- Email format
- URL format for social posts
- Amount ranges for payouts
- Enum validation for statuses

### Admin Authentication

Admin routes require authentication via existing middleware.

## Backup & Recovery

### Database Backup

**Before enabling feature:**
```bash
mongodump --uri="your_mongodb_uri" --out=/backup/pre-referral-system
```

**Regular backups:**
- MongoDB Atlas auto-backups (if using Atlas)
- Or manual: `mongodump` weekly

### Restore if needed:
```bash
mongorestore --uri="your_mongodb_uri" /backup/pre-referral-system
```

## Scaling Considerations

### Current Limits

- MongoDB: Unlimited referrals and referrers
- Render: Auto-scaling enabled
- Vercel: Auto-scaling enabled

### If scaling needed:

1. **Database:**
   - Upgrade MongoDB plan
   - Add read replicas

2. **Backend:**
   - Upgrade Render plan
   - Add more instances

3. **Cron Jobs:**
   - Consider moving to dedicated worker
   - Use Queue system (Bull/Redis) for processing

## Legal & Compliance

### Required Disclosures

The system includes:
- "Independent commission-based opportunity (not employment)"
- Clear commission rates by country
- Fee disclosure (referrer pays all fees)
- Social verification requirement

### Terms & Conditions

Update legal pages:
- Add commission referral program terms to /terms
- Update privacy policy for referrer data
- Add payout terms and conditions

## Support Documentation

### For Referrers

Create support docs:
1. How to register as a referrer
2. How to share referral links
3. How social verification works
4. How payouts work
5. FAQ

### For Admins

Create admin guide:
1. How to approve social verifications
2. How to review fraud flags
3. How to approve payouts
4. How to export data
5. How to ban referrers

## Success Criteria

The deployment is successful when:
- [ ] Feature can be toggled ON/OFF without breaking existing features
- [ ] Referrers can register and get unique referral links
- [ ] Referral tracking works (clicks, signups, subscriptions)
- [ ] 30-day verification job runs daily without errors
- [ ] Social verification workflow functions end-to-end
- [ ] Payout requests can be submitted and approved
- [ ] Admin dashboard shows all pending actions
- [ ] No performance degradation on existing features
- [ ] No security vulnerabilities introduced
- [ ] All fraud detection flags work correctly

## Go-Live Timeline

### Day 0 (Deployment Day)
- Deploy with feature disabled
- Verify all systems operational
- Test admin access

### Day 1-7 (Soft Launch)
- Enable feature for internal testing
- Invite 5-10 test referrers
- Monitor closely for issues

### Day 8-14 (Limited Beta)
- Invite 50 referrers
- Process first payouts
- Gather feedback

### Day 15+ (Full Launch)
- Enable for all users
- Promote on homepage
- Monitor growth and fraud

## Contact & Support

**Development Team:**
- Backend issues: Check server logs
- Frontend issues: Check browser console
- Database issues: Check MongoDB Atlas

**Emergency Contacts:**
- System Down: Disable feature flag immediately
- Security Issue: Disable feature flag, investigate
- Financial Issue: Pause payout approvals

---

**Deployment Date:** TBD  
**Deployed By:** TBD  
**Version:** 1.0.0  
**Status:** Ready for Deployment
