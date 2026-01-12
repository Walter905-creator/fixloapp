# Commission-Based Referral System Documentation

## Overview

The Commission-Based Referral System allows **anyone** (not just Pros) to earn cash commissions by referring new professionals to Fixlo. This is a separate system from the existing Pro-to-Pro referral rewards program.

## 🔐 Core Business Rules

1. **Unlimited referrals** - No cap on number of referrals
2. **Brand-new Pros only** - No existing emails, phones, or prior accounts qualify
3. **Pro requirements:**
   - Must pay full subscription (no free trials)
   - Must remain active for 30 days
   - No refunds or chargebacks
4. **Commission rewards:**
   - Country-based amount (~15-20% of Pro monthly price)
   - Stored in local currency (USD, CAD, GBP, AUD, etc.)
5. **Social verification required** - Must complete at least one public social media share before payouts
6. **Independent opportunity** - Commission-based, not employment

## ⚙️ Feature Flag

The system is **disabled by default** and controlled by the `REFERRALS_ENABLED` environment variable:

**Server (.env):**
```bash
REFERRALS_ENABLED=true  # Set to 'true' to enable
```

**Client (.env):**
```bash
VITE_REFERRALS_ENABLED=true  # Set to 'true' to enable
```

## 🗄️ Database Architecture

### Models

#### 1. CommissionReferrer
Tracks anyone who registers to earn commissions.

**Key Fields:**
- `email` - Unique email address
- `name` - Full name
- `referralCode` - Unique code (FIXLO-REF-XXXXXX)
- `referralUrl` - Full referral link
- `country` - For commission calculations
- `currency` - For payouts (USD, CAD, GBP, etc.)
- `status` - pending, active, suspended, banned
- `socialVerified` - Boolean, required for payouts
- `payoutMethod` - stripe_connect only
- Stats: `totalReferrals`, `approvedReferrals`, `totalEarned`, `availableBalance`

#### 2. CommissionReferral
Tracks individual referral relationships.

**Key Fields:**
- `referrerId` - Link to CommissionReferrer
- `proId` - Link to referred Pro
- `status` - pending, approved, rejected, paid, flagged
- `commissionAmount` - Calculated commission
- `verificationDueDate` - Date for 30-day check
- `verificationChecks` - Object with verification results
- `rejectionReason` - If rejected
- Fraud tracking: `signupIp`, `deviceFingerprint`, `fraudFlags`

**Lifecycle States:**
```
pending → (30 days) → [verification] → approved → paid
                                    ↓
                                  rejected
```

#### 3. CommissionSocialVerification
Tracks social media verification posts.

**Key Fields:**
- `referrerId` - Link to CommissionReferrer
- `platform` - facebook, instagram, twitter, linkedin, tiktok, youtube
- `postUrl` - Public post URL
- `status` - pending, approved, rejected
- `verifiedBy` - Admin who approved/rejected

#### 4. CommissionPayout
Tracks payout requests and transactions.

**Key Fields:**
- `referrerId` - Link to CommissionReferrer
- `referralIds` - Array of included referrals
- `amount` - Total payout amount
- `netAmount` - After fees
- `payoutMethod` - stripe_connect only
- `status` - pending, approved, processing, completed, failed, cancelled
- Stripe transaction IDs

## 🔌 API Endpoints

### Public Endpoints

#### POST `/api/commission-referrals/register`
Register as a new referrer.

**Request:**
```json
{
  "email": "referrer@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "country": "US",
  "currency": "USD"
}
```

**Response:**
```json
{
  "ok": true,
  "referrer": {
    "id": "...",
    "referralCode": "FIXLO-REF-ABC123",
    "referralUrl": "https://www.fixloapp.com/join?ref=FIXLO-REF-ABC123"
  }
}
```

#### GET `/api/commission-referrals/dashboard/:referrerId`
Get referrer dashboard data.

**Response:**
```json
{
  "ok": true,
  "referrer": {
    "totalReferrals": 10,
    "approvedReferrals": 5,
    "totalEarned": 100.00,
    "availableBalance": 50.00,
    "socialVerified": true
  },
  "referrals": [...],
  "pendingPayouts": [...]
}
```

#### POST `/api/commission-referrals/track-click`
Track referral link clicks.

#### POST `/api/commission-referrals/validate`
Validate referral code before signup.

#### POST `/api/commission-referrals/social-verify`
Submit social media verification.

**Request:**
```json
{
  "referrerId": "...",
  "platform": "facebook",
  "postUrl": "https://facebook.com/..."
}
```

#### POST `/api/commission-referrals/request-payout`
Request a payout (requires social verification).

**Request:**
```json
{
  "referrerId": "...",
  "amount": 50.00,
  "payoutMethod": "stripe_connect"
}
```

### Admin Endpoints

All admin endpoints require admin authentication and are under `/api/admin/commission-referrals/`.

#### GET `/referrers`
List all referrers (paginated).

#### GET `/referrals`
List all referrals (paginated, filterable).

#### POST `/referral/:id/review`
Manually approve/reject a referral.

**Request:**
```json
{
  "action": "approve",  // or "reject"
  "reason": "Optional reason",
  "adminEmail": "admin@fixloapp.com"
}
```

#### GET `/social-verifications`
List pending social verifications.

#### POST `/social-verification/:id/review`
Approve/reject social verification.

#### GET `/payouts`
List payout queue.

#### POST `/payout/:id/review`
Approve/reject payout request.

#### GET `/export`
Export referrals to CSV.

#### POST `/verify-now`
Manually trigger 30-day verification job.

#### GET `/stats`
Get system-wide statistics.

## ⏰ Cron Jobs

### 30-Day Verification Job
**Schedule:** Daily at 2:00 AM UTC  
**Function:** `runDailyVerification()`

**Process:**
1. Find all referrals with `status: 'pending'` and `verificationDueDate <= now`
2. For each referral:
   - Check if Pro is still active
   - Check if subscription is active
   - Check for refunds/chargebacks
   - Check for fraud flags
3. If all checks pass:
   - Calculate commission (15-20% based on country)
   - Set status to 'approved'
   - Update referrer stats
4. If checks fail:
   - Set status to 'rejected' with reason
   - Update referrer stats

## 💳 Payout Methods

### Stripe Connect (Primary)
- Express accounts for simplified onboarding
- Supports bank transfers worldwide
- Fee: 0.25% per payout (min $0.25, max $2.00)
- Referrer pays all fees

## 🛡️ Fraud Protection

### Detection Flags
The system passively flags suspicious patterns:
- `same_ip_as_referrer` - Same IP as referrer
- `same_device_as_referrer` - Same device fingerprint
- `same_payment_method` - Same payment method detected
- `rapid_signup` - Multiple signups in short time
- `duplicate_email` - Email used before
- `duplicate_phone` - Phone used before

**Note:** Flagged referrals are NOT auto-banned. They require manual admin review.

### Anti-Fraud Rules
1. **No duplicate Pro emails/phones** - Each email/phone can only be referred once
2. **No self-referrals** - Referrer cannot refer themselves
3. **IP rate limiting** - Max 3 referrals per IP per 24 hours (configurable)
4. **30-day verification** - Must verify Pro is still active and paying

## 🎨 Frontend Components

### CommissionReferralDashboard
Main component for referrers located at `/earn`.

**Features:**
- Registration form for new referrers
- Dashboard with stats (referrals, earnings, balance)
- Copyable referral link
- Social sharing buttons (Facebook, Twitter, LinkedIn, WhatsApp)
- Social verification submission
- Payout request form
- Recent referrals table

**Usage:**
```jsx
import CommissionReferralDashboard from '../components/CommissionReferralDashboard';

// In route
<Route path="/earn" element={<CommissionReferralPage/>}/>
```

## 📱 Mobile Integration (Phase 8 - Not Yet Implemented)

Future implementation will include:
- Mobile referral dashboard
- Native share functionality
- Social verification from mobile
- Payout management

## 🧪 Testing Requirements

### Unit Tests (To Do)
1. Test referrer registration
2. Test duplicate detection
3. Test 30-day verification logic
4. Test commission calculations by country
5. Test social verification workflow
6. Test payout request validation
7. Test fraud flag detection

### Integration Tests (To Do)
1. Full referral flow: register → share → signup → verify → approve → payout
2. Feature flag toggle
3. Admin approval workflows

## 🚀 Deployment Checklist

### Prerequisites
1. Set `REFERRALS_ENABLED=false` in production initially
2. Ensure MongoDB indexes are created (automatic on first run)
3. Configure Stripe Connect credentials
4. Set up admin user accounts

### Rollout Steps
1. Deploy backend with feature flag OFF
2. Deploy frontend with feature flag OFF
3. Test in staging environment
4. Enable feature flag in production: `REFERRALS_ENABLED=true`
5. Monitor for first 24-48 hours
6. Set up daily cron job monitoring

### Environment Variables

**Server:**
```bash
REFERRALS_ENABLED=true
```

**Client:**
```bash
VITE_REFERRALS_ENABLED=true
```

## 📊 Commission Rates by Country

| Country | Rate | Example (on $100/month) |
|---------|------|------------------------|
| US      | 20%  | $20.00                 |
| CA      | 20%  | CAD 20.00              |
| GB      | 18%  | £18.00                 |
| AU      | 18%  | AUD 18.00              |
| NZ      | 18%  | NZD 18.00              |
| Others  | 15%  | 15% of monthly price   |

## 🔒 Security Considerations

1. **Feature Flag Protection** - All endpoints check `REFERRALS_ENABLED`
2. **Admin Authentication** - Admin routes require authentication (existing middleware)
3. **Rate Limiting** - General rate limiting applied to all routes
4. **Input Validation** - All inputs validated before processing
5. **SQL Injection** - Protected via Mongoose ORM
6. **XSS Protection** - Input sanitization middleware applied
7. **No Auto-Payouts** - All payouts require manual admin approval

## 📝 Admin Operations

### Daily Tasks
1. Review pending social verifications
2. Approve/reject payout requests
3. Monitor fraud flags

### Weekly Tasks
1. Review system statistics
2. Export referral data for analysis
3. Check for unusual patterns

### Monthly Tasks
1. Financial reconciliation
2. Update commission rates if needed
3. Review and ban fraudulent referrers

## 🆘 Troubleshooting

### Referral not tracking
- Check if `REFERRALS_ENABLED=true`
- Verify referral code exists and referrer is active
- Check browser console for API errors

### 30-day verification not running
- Check cron job is active
- Manually trigger: `POST /api/admin/commission-referrals/verify-now`
- Check server logs for errors

### Payout request failing
- Verify social verification is approved
- Check available balance > requested amount
- Ensure payout method is configured

## 📞 Support

For issues or questions:
1. Check server logs: `/home/runner/work/fixloapp/fixloapp/server/logs/`
2. Review database records in MongoDB
3. Contact development team

## 🔄 Future Enhancements

1. **Automatic Stripe Connect onboarding** - Direct integration with Stripe Connect Express
2. **Referral analytics** - Detailed analytics dashboard
3. **Mobile app integration** - Native mobile experience
4. **Multi-tier commissions** - Different rates based on performance
5. **Referral leaderboard** - Gamification elements
6. **Automated fraud detection** - ML-based fraud detection
7. **Email notifications** - Automated email notifications for referrers
8. **API webhooks** - Webhook notifications for key events

## 📜 Compliance

This system implements:
- Clear disclosure that this is a commission-based opportunity (not employment)
- No income guarantees or misleading claims
- Social verification requirement to prevent fake accounts
- Manual admin approval for all payouts
- Comprehensive fraud detection
- All fees paid by referrer (transparent pricing)

## 🎯 Success Metrics

Track these KPIs:
- Total referrers registered
- Active referrers (with at least 1 referral)
- Total referrals created
- Referral conversion rate (signup → active Pro)
- Average commission per referral
- Total commissions paid
- Fraud rate (flagged / total referrals)
- Social verification approval rate
- Payout request approval rate

---

**Last Updated:** January 2026  
**Version:** 1.0.0  
**Status:** Production Ready (Feature-Flagged)
