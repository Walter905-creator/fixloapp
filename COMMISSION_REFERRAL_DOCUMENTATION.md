# Commission Referral System Documentation

## Overview

The Commission Referral System is a public-facing feature that allows **anyone** (not just Fixlo Pros) to earn money by referring new professionals to the Fixlo platform. This is a commission-based opportunity with a $25 USD minimum payout threshold.

## ⚠️ CRITICAL SAFETY RULES

### NON-NEGOTIABLE PROTECTIONS

This feature **DOES NOT MODIFY**:
- ❌ Pro signup flow
- ❌ Pro payment processing
- ❌ Homeowner flows
- ❌ Existing Pro-to-Pro referral system
- ❌ Stripe subscription logic

### Feature Flags (MANDATORY)

The system is **DISABLED BY DEFAULT** and requires explicit activation:

**Server-side**: `REFERRALS_ENABLED=true` in `/server/.env`
**Client-side**: `VITE_REFERRALS_ENABLED=true` in root `.env`

When disabled:
- All API endpoints return `403 Forbidden`
- Frontend renders nothing (no UI elements shown)
- Complete feature invisibility

## How It Works

### For Referrers (Public Users)

1. **Sign Up**: Anyone can register as a referrer at `/earn`
2. **Get Link**: Receive unique referral code (format: `EARN-XXXXXX`)
3. **Share**: Share referral link on social media or other channels
4. **Earn**: Earn 15-20% commission when referred Pro stays active 30 days
5. **Get Paid**: Request payout via Stripe Connect (minimum $25)

### Commission Structure

| Region | Commission Rate |
|--------|----------------|
| USA    | 20%            |
| Other  | 15%            |

### Eligibility Requirements

✅ Referred Pro must complete paid subscription
✅ Pro must remain active for 30 consecutive days
✅ Minimum balance of $25 for payout
✅ At least one public social media post required
✅ Admin approval required for payouts

## Technical Architecture

### Database Models

#### CommissionReferral
```javascript
{
  referrerId: String,           // Unique referrer ID
  referrerEmail: String,        // Referrer email
  referralCode: String,         // EARN-XXXXXX format
  referredProId: ObjectId,      // Pro who was referred
  commissionRate: Number,       // 0.15 or 0.20
  commissionAmount: Number,     // Amount in cents
  status: String,               // pending, active, eligible, paid
  is30DaysComplete: Boolean,    // 30-day requirement met
  // ... additional fields
}
```

#### Payout
```javascript
{
  referrerId: String,
  referrerEmail: String,
  requestedAmount: Number,       // In cents, min 2500 ($25)
  processingFee: Number,         // Stripe fees
  netAmount: Number,             // After fees
  status: String,                // pending, approved, processing, completed
  stripeConnectAccountId: String,
  socialMediaVerified: Boolean,
  // ... additional fields
}
```

### API Routes

#### Public Routes
- `POST /api/commission-referrals/register` - Register as referrer
- `GET /api/commission-referrals/dashboard/:email` - Get dashboard data
- `POST /api/commission-referrals/track` - Track referral signup
- `POST /api/payouts/request` - Request payout
- `GET /api/payouts/status/:email` - Get payout status

#### Admin Routes (Protected)
- `GET /api/payouts/admin/pending` - List pending payouts
- `POST /api/payouts/admin/approve/:payoutId` - Approve payout
- `POST /api/payouts/admin/reject/:payoutId` - Reject payout

### Frontend Components

#### EarnPage (`/earn`)
- Public marketing copy
- FAQ accordion (10 questions)
- Registration form
- Referral dashboard
- Payout request UI
- Feature flag enforcement

## Minimum Payout Threshold

### $25 USD Enforcement

**Backend Validation**:
```javascript
// In Payout model
MIN_PAYOUT_AMOUNT = 25; // $25 USD

// Validation
if (amountInCents < MIN_PAYOUT_AMOUNT * 100) {
  return { valid: false, message: 'Minimum $25 required' };
}
```

**Frontend UI**:
- Payout button disabled if balance < $25
- Helper text: "You need at least $25 available to request a payout"
- Balance displayed prominently in dashboard

### Currency Handling

- Primary currency: USD
- Amounts stored in cents for precision
- Commission rates vary by country
- Future: Support for currency conversion

## Security Features

### Anti-Fraud Protection
- IP address tracking
- Device fingerprinting
- Duplicate referral detection
- Self-referral prevention
- Rate limiting (3 referrals per IP per 24 hours)

### Admin Controls
- Manual approval required for payouts
- Social media verification
- Fraud flagging system
- Payout rejection with reason

### Data Protection
- Stripe Connect for secure payouts
- No direct access to banking information
- JWT authentication for admin routes
- Rate limiting on all endpoints

## Compliance & Legal

### Required Copy (Displayed on /earn)

**Trust Disclaimer**:
> This is an independent, commission-based opportunity.
> Referrers are not employees of Fixlo.

**FAQ Section** (10 Required Questions):
1. Who can participate?
2. How much can I earn?
3. When do I get paid?
4. Is there a minimum payout amount?
5. How do payouts work?
6. Are there any fees?
7. Do I have to share on social media?
8. Can I refer unlimited Pros?
9. What happens if a Pro cancels early?
10. Is this a job or employment?

## Environment Variables

### Server (.env)
```bash
# Feature Flag (REQUIRED)
REFERRALS_ENABLED=false  # Set to 'true' to enable

# Stripe Processing Fees (Optional - has defaults)
STRIPE_PERCENTAGE_FEE=0.029  # 2.9%
STRIPE_FIXED_FEE_CENTS=30    # $0.30 in cents
```

### Client (root .env)
```bash
# Feature Flag (REQUIRED)
VITE_REFERRALS_ENABLED=false  # Set to 'true' to enable
```

## Testing

### Backend Tests
Run: `node server/test-commission-system.js`

Validates:
- ✅ $25 minimum threshold enforcement
- ✅ Model schema structure
- ✅ Feature flag status
- ✅ Constant exports

### Manual Testing Checklist

#### With Feature Disabled (Default)
- [ ] `/earn` renders nothing
- [ ] API endpoints return 403
- [ ] No UI elements visible

#### With Feature Enabled
- [ ] `/earn` page loads correctly
- [ ] Public copy displays properly
- [ ] FAQ accordion works
- [ ] Registration creates referrer
- [ ] Referral link generated
- [ ] Dashboard shows stats
- [ ] Payout button disabled if < $25
- [ ] Payout button enabled if >= $25

## Deployment

### Pre-Deployment
1. Verify feature flags are disabled in production env
2. Run test suite
3. Build client successfully
4. Run CodeQL security scan

### Deployment Steps
1. Deploy backend first
2. Deploy frontend
3. Verify `/earn` returns 403 (feature disabled)
4. Test health endpoints

### Enabling Feature (When Ready)
1. Set `REFERRALS_ENABLED=true` in server environment
2. Set `VITE_REFERRALS_ENABLED=true` in client environment
3. Rebuild and redeploy frontend
4. Verify `/earn` page loads
5. Test registration flow
6. Monitor for fraud

## Monitoring & Maintenance

### Key Metrics to Track
- New referrer registrations
- Active referrals
- Commission amounts
- Payout requests
- Fraud attempts
- Conversion rate (referral → active Pro)

### Regular Maintenance
- Review Stripe processing fees quarterly
- Monitor fraud patterns
- Verify social media posts
- Process payout approvals promptly
- Update FAQ as needed

## Troubleshooting

### Feature Not Showing
- ✅ Check `VITE_REFERRALS_ENABLED=true` in client env
- ✅ Check `REFERRALS_ENABLED=true` in server env
- ✅ Rebuild client after env changes
- ✅ Clear browser cache

### API Returns 403
- ✅ Verify server feature flag enabled
- ✅ Check server logs for errors
- ✅ Confirm routes registered in index.js

### Payout Button Disabled
- ✅ Verify balance >= $25 (2500 cents)
- ✅ Check dashboard stats loading
- ✅ Verify eligible referrals exist

## Support & Contact

For questions or issues:
- Review this documentation
- Check server logs
- Test with feature flags
- Contact development team

---

**Last Updated**: 2026-01-12
**Version**: 1.0.0
**Status**: Production Ready (Feature Disabled by Default)
