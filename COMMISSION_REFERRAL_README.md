# 💰 Commission-Based Referral System

> **A complete, production-ready referral system where anyone can earn cash commissions by referring new professionals to Fixlo.**

## 🎯 Quick Start

### Enable the Feature

**Server:**
```bash
REFERRALS_ENABLED=true
```

**Client:**
```bash
VITE_REFERRALS_ENABLED=true
```

### Access the Dashboard

Visit: **https://www.fixloapp.com/earn**

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [System Documentation](./COMMISSION_REFERRAL_SYSTEM_DOCUMENTATION.md) | Complete technical documentation |
| [Deployment Guide](./COMMISSION_REFERRAL_DEPLOYMENT_GUIDE.md) | Step-by-step deployment instructions |
| [Implementation Summary](./COMMISSION_REFERRAL_IMPLEMENTATION_COMPLETE.md) | Executive summary and statistics |

---

## 🏗️ Architecture

### Database Models (4)
- **CommissionReferrer** - Anyone who wants to earn commissions
- **CommissionReferral** - Individual referral tracking with 30-day lifecycle
- **CommissionSocialVerification** - Social media proof requirement
- **CommissionPayout** - Payout requests and transactions

### API Endpoints (19)
- **7 Public endpoints** - Registration, tracking, validation, payouts
- **12 Admin endpoints** - Approval workflows, analytics, exports

### Features
- ✅ Commission-based rewards (15-20% of Pro subscription)
- ✅ Multi-currency support (USD, CAD, GBP, AUD, NZD)
- ✅ 30-day verification with automatic cron job
- ✅ Social media verification requirement
- ✅ Stripe Connect + PayPal payouts
- ✅ Comprehensive fraud detection
- ✅ Full admin control panel

---

## 🚀 Deployment

### Quick Deploy

```bash
# 1. Deploy with feature disabled
git push origin main

# 2. Set environment variables in Render/Vercel
REFERRALS_ENABLED=false
VITE_REFERRALS_ENABLED=false

# 3. Verify existing features work

# 4. When ready, enable the feature
REFERRALS_ENABLED=true
VITE_REFERRALS_ENABLED=true
```

### Rollback

```bash
# Instant rollback - disable feature flag
REFERRALS_ENABLED=false
VITE_REFERRALS_ENABLED=false
```

---

## 💡 How It Works

### For Referrers

1. **Register** at `/earn`
2. **Get unique referral link** (FIXLO-REF-XXXXXX)
3. **Share on social media** (Facebook, Twitter, LinkedIn, WhatsApp)
4. **Submit social verification** (required for payouts)
5. **Earn commissions** when referred Pros subscribe
6. **Wait 30 days** for automatic verification
7. **Request payout** via Stripe or PayPal

### For Admins

1. **Review social verifications** - Approve/reject posts
2. **Monitor referrals** - Track pending, approved, paid
3. **Approve payouts** - Manual approval required
4. **Review fraud flags** - Passive detection, manual review
5. **Export data** - CSV export for analysis

---

## 💰 Commission Rates

| Country | Rate | Example (on $100/month) |
|---------|------|------------------------|
| 🇺🇸 US   | 20%  | $20.00                 |
| 🇨🇦 CA   | 20%  | CAD 20.00              |
| 🇬🇧 GB   | 18%  | £18.00                 |
| 🇦🇺 AU   | 18%  | AUD 18.00              |
| 🇳🇿 NZ   | 18%  | NZD 18.00              |
| 🌍 Other | 15%  | 15% of monthly price   |

---

## 🧪 Testing

Run the test suite:

```bash
cd server
npm install
node test-commission-referrals.js
```

**Test Coverage:**
- ✓ Model loading
- ✓ Referral code generation
- ✓ Commission calculation
- ✓ 30-day verification
- ✓ Payout fee calculation
- ✓ Service and route loading
- ✓ Feature flag logic

---

## 🛡️ Safety Features

- ✅ **Feature flag** - Disabled by default
- ✅ **No breaking changes** - Completely isolated
- ✅ **Manual approvals** - All payouts require admin approval
- ✅ **Fraud detection** - Passive flags, no auto-bans
- ✅ **Easy rollback** - < 5 minutes to disable
- ✅ **Backward compatible** - Works with existing Pro-to-Pro referrals

---

## 📊 Admin Tools

Access admin endpoints at: `/api/admin/commission-referrals/`

**Available Actions:**
- List all referrers and referrals
- Approve/reject referrals manually
- Review and approve social verifications
- Approve/reject payout requests
- Export data to CSV
- View system statistics
- Manually trigger 30-day verification

---

## ⏰ Automated Jobs

**Daily at 2:00 AM UTC:**
- Checks all referrals at day 30
- Verifies Pro is still active
- Checks for refunds/chargebacks
- Moves from pending → approved
- Calculates commissions
- Updates referrer stats

---

## 🎓 Business Rules

✅ **Unlimited referrals** - No cap on number of referrals  
✅ **Brand-new Pros only** - Duplicate detection for email/phone  
✅ **Full subscription required** - No free trials accepted  
✅ **30-day waiting period** - Automatic verification  
✅ **Social verification required** - Must share publicly  
✅ **Manual payout approval** - Admin review required  
✅ **Referrer pays fees** - Transparent fee structure  
✅ **Independent opportunity** - Not an employment offer  

---

## 📁 File Structure

```
fixloapp/
├── server/
│   ├── models/
│   │   ├── CommissionReferrer.js
│   │   ├── CommissionReferral.js
│   │   ├── CommissionSocialVerification.js
│   │   └── CommissionPayout.js
│   ├── routes/
│   │   ├── commissionReferrals.js
│   │   └── commissionReferralsAdmin.js
│   ├── services/
│   │   └── commissionVerification.js
│   └── test-commission-referrals.js
├── client/
│   └── src/
│       ├── components/
│       │   └── CommissionReferralDashboard.jsx
│       └── routes/
│           └── CommissionReferralPage.jsx
└── Documentation/
    ├── COMMISSION_REFERRAL_SYSTEM_DOCUMENTATION.md
    ├── COMMISSION_REFERRAL_DEPLOYMENT_GUIDE.md
    └── COMMISSION_REFERRAL_IMPLEMENTATION_COMPLETE.md
```

---

## 🔗 Quick Links

- **Dashboard:** https://www.fixloapp.com/earn
- **API Health:** https://fixloapp.onrender.com/api/commission-referrals/health
- **Admin Panel:** https://www.fixloapp.com/admin (existing admin auth)

---

## 📞 Support

**Issues or Questions?**
1. Check the [System Documentation](./COMMISSION_REFERRAL_SYSTEM_DOCUMENTATION.md)
2. Review the [Deployment Guide](./COMMISSION_REFERRAL_DEPLOYMENT_GUIDE.md)
3. Check server logs in Render
4. Review database in MongoDB

---

## ✨ Status

**Implementation:** ✅ COMPLETE  
**Testing:** ✅ PASSED  
**Documentation:** ✅ COMPLETE  
**Deployment:** ✅ READY  

**Deploy with confidence!** 🚀

---

## 📝 License

Part of the Fixlo application. All rights reserved.

---

**Last Updated:** January 2026  
**Version:** 1.0.0  
**Status:** Production Ready
