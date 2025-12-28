# Fixlo Referral System Documentation

## Overview

The Fixlo Referral System enables pros to earn FREE months of Fixlo membership by referring friends who join and activate paid subscriptions. The system is built with strict compliance requirements and robust anti-fraud mechanisms.

## ⚠️ CRITICAL COMPLIANCE RULES

### Non-Negotiable Requirements

1. **NO free trials or automatic discounts** anywhere in the system
2. **NO modifications** to existing USA pricing or Stripe subscriptions
3. Rewards are **ONLY earned** after referred user completes a **PAID subscription**
4. Notifications **MUST use**:
   - SMS via Twilio for USA
   - WhatsApp via Twilio for non-USA countries
5. **NO EMAIL service** exists — do not reference or implement email
6. All changes are **ADDITIVE ONLY** — USA behavior remains unchanged

## System Architecture

### Backend Components

#### 1. Models (`server/models/`)

**Referral Model** (`Referral.js`)
- Tracks all referral relationships
- Stores anti-fraud data (IP, device fingerprint, phone, email)
- Monitors referral status (pending, active, completed, failed)
- Tracks promo code generation and notification delivery

**Pro Model** (`Pro.js`) - Extended with:
- `referralCode`: Unique code (format: `FIXLO-XXXXXX`)
- `referralUrl`: Full referral link
- `totalReferrals`: Count of all referrals made
- `completedReferrals`: Count of successful referrals
- `freeMonthsEarned`: Number of free months earned
- `referredBy`: Reference to referring pro
- `referredByCode`: Code used during signup

#### 2. Services (`server/services/`)

**Referral Promo Code Service** (`referralPromoCode.js`)
- Creates Stripe coupons (100% off, 1 month duration)
- Generates unique promo codes
- Validates promo codes
- Ensures one-time use per coupon

**Referral Notification Service** (`referralNotification.js`)
- Sends SMS notifications (USA)
- Sends WhatsApp messages (international)
- Supports 3 languages: English, Spanish, Portuguese
- Respects SMS consent preferences
- Auto-detects language based on country code

#### 3. Routes (`server/routes/`)

**Referral API** (`referrals.js`)

Endpoints:
- `GET /api/referrals/info/:proId` - Get referral code and stats
- `POST /api/referrals/track-click` - Track referral link clicks
- `POST /api/referrals/validate` - Validate referral code and check fraud
- `POST /api/referrals/complete` - Complete referral and issue reward

**Stripe Webhook** (`stripe.js`)
- Listens for `checkout.session.completed` events
- Automatically triggers referral completion when subscription activated

#### 4. Utilities (`server/utils/`)

**Twilio Integration** (`twilio.js`)
- `sendSms()` - Send SMS messages
- `sendWhatsApp()` - Send WhatsApp messages
- `normalizeE164()` - Format phone numbers

### Frontend Components

#### 1. Components (`client/src/components/`)

**ReferralSection** (`ReferralSection.jsx`)
- Displays referral code and stats
- Shows free months earned
- Provides share buttons (context-aware: SMS for USA, WhatsApp for others)
- Copy referral link functionality
- Beautiful gradient design with compliance disclaimer

#### 2. Pages (`client/src/routes/`)

**Pro Dashboard** (`ProDashboardPage.jsx`)
- Prominently displays ReferralSection for all active pros
- Shows referral performance metrics

**Pro Signup** (`ProSignupPage.jsx`)
- Captures referral code from URL (`?ref=FIXLO-XXXXXX`)
- Validates referral code in real-time
- Shows referral banner when valid code detected
- Tracks referral click events

## Referral Flow

### 1. Referrer Gets Code

When a pro becomes active with a paid subscription:
```javascript
// Automatic code generation in Pro model pre-save hook
if (!this.referralCode && this.isActive && this.stripeCustomerId) {
  this.referralCode = this.generateReferralCode(); // FIXLO-XXXXXX
  this.referralUrl = this.getReferralUrl(); // https://www.fixloapp.com/join?ref=FIXLO-XXXXXX
}
```

### 2. Referrer Shares Link

From Pro Dashboard:
- Copy link button
- Share via SMS (USA)
- Share via WhatsApp (non-USA)

Share message format:
```
Join Fixlo and be your own boss.
Sign up using my link and grow your business:
https://www.fixloapp.com/join?ref=FIXLO-XXXXXX
```

### 3. Referee Clicks Link

```javascript
// Track click in ProSignupPage.jsx
useEffect(() => {
  const refCode = searchParams.get('ref');
  if (refCode) {
    validateReferralCode(refCode);
    trackReferralClick(refCode);
  }
}, [searchParams]);
```

### 4. Referee Signs Up

- Referral code captured from URL
- Stored during signup process
- Passed to Stripe checkout in metadata

### 5. Referee Completes Paid Subscription

Stripe webhook handler detects subscription completion:
```javascript
case 'checkout.session.completed': {
  // Update pro with subscription details
  const pro = await Pro.findByIdAndUpdate(userId, updateData, { new: true });
  
  // Check for referral
  if (pro.referredByCode && session.subscription) {
    // Trigger referral completion
    await axios.post('/api/referrals/complete', {
      referralCode: pro.referredByCode,
      referredUserId: userId,
      referredSubscriptionId: session.subscription,
      country: country
    });
  }
}
```

### 6. System Validates and Issues Reward

```javascript
// server/routes/referrals.js - POST /api/referrals/complete
// 1. Validate referrer and referee exist
// 2. Check for duplicate referrals (fraud prevention)
// 3. Prevent self-referrals
// 4. Generate Stripe coupon and promo code
// 5. Update referral record
// 6. Update referrer stats
// 7. Send notification
```

### 7. Referrer Receives Notification

**USA (SMS):**
```
🎉 You earned a FREE month on Fixlo!
Your referral just joined and activated their membership.
Use this promo code on your next billing cycle:
FIXLO-REF-ABC123
Reply STOP to opt out.
```

**International (WhatsApp):**
Same message in appropriate language (EN/ES/PT)

## Anti-Fraud Mechanisms

### 1. Duplicate Prevention

```javascript
// Check if phone/email already used for referral
const isDuplicate = await Referral.checkDuplicateReferral(phone, email);
```

### 2. Self-Referral Prevention

```javascript
// Block same user referring themselves
if (referrer._id.toString() === referredUserId.toString()) {
  return error('Self-referral not allowed');
}
```

### 3. IP Rate Limiting

```javascript
// Maximum 3 referrals per IP per 24 hours
const ANTI_FRAUD_CONFIG = {
  MAX_REFERRALS_PER_IP_PER_DAY: 3,
  RATE_LIMIT_WINDOW_HOURS: 24
};
```

### 4. Device Fingerprinting

Tracks `navigator.userAgent` to detect repeated device usage.

### 5. Audit Logging

All referral events logged with:
- Timestamps
- IP addresses
- Device information
- Validation results

## Multilingual Support

### Language Detection

```javascript
function detectLanguage(country) {
  // Spanish: ES, MX, AR, CO, CL, PE, VE, etc.
  // Portuguese: BR, PT, AO, MZ
  // Default: English
}
```

### Message Templates

**English (USA, UK, CA, etc.):**
```
🎉 You earned a FREE month on Fixlo!
Your referral just joined and activated their membership.
Use this promo code on your next billing cycle:
{{PROMO_CODE}}
```

**Spanish (MX, ES, LATAM):**
```
🎉 ¡Ganaste un mes GRATIS en Fixlo!
Tu referido se unió y activó su membresía.
Usa este código en tu próximo pago:
{{PROMO_CODE}}
```

**Portuguese (BR, PT):**
```
🎉 Você ganhou um mês GRÁTIS no Fixlo!
Seu indicado entrou e ativou a assinatura.
Use este código no próximo pagamento:
{{PROMO_CODE}}
```

## Configuration

### Environment Variables

**Required:**
- `STRIPE_SECRET_KEY` - Stripe API key (live mode in production)
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_PHONE` - Twilio phone number

**Optional:**
- `TWILIO_WHATSAPP_FROM` - WhatsApp sender (default: `whatsapp:${TWILIO_PHONE}`)
- `MAX_REFERRALS_PER_IP` - IP rate limit (default: 3)
- `CLIENT_URL` - Frontend URL (default: https://www.fixloapp.com)
- `API_URL` - Backend URL (default: http://localhost:3001)

### Stripe Configuration

Promo codes created with:
- Duration: `repeating`
- Duration in months: `1`
- Percent off: `100`
- Max redemptions: `1` (one-time use)

## Testing

### Manual Testing

1. **Code Generation Test:**
```bash
cd server
node test-referral-system.js
```

2. **API Testing:**
```bash
# Get referral info
curl http://localhost:3001/api/referrals/info/{proId}

# Validate referral code
curl -X POST http://localhost:3001/api/referrals/validate \
  -H "Content-Type: application/json" \
  -d '{"referralCode":"FIXLO-ABC123","phone":"+1234567890","email":"test@example.com"}'

# Track click
curl -X POST http://localhost:3001/api/referrals/track-click \
  -H "Content-Type: application/json" \
  -d '{"referralCode":"FIXLO-ABC123","ip":"1.2.3.4"}'
```

3. **Frontend Testing:**
- Navigate to: https://www.fixloapp.com/join?ref=FIXLO-ABC123
- Verify referral banner appears
- Complete signup flow
- Check Pro Dashboard for referral section

### Automated Testing

```bash
cd server
npm test
```

## Monitoring

### Key Metrics to Track

1. **Referral Performance:**
   - Total referrals created
   - Referral completion rate
   - Average time to completion
   - Free months issued

2. **Fraud Detection:**
   - Blocked duplicate attempts
   - Self-referral attempts
   - IP rate limit triggers
   - Suspicious patterns

3. **Notification Delivery:**
   - SMS delivery success rate
   - WhatsApp delivery success rate
   - Language distribution

### Database Queries

```javascript
// Get top referrers
db.pros.find({ freeMonthsEarned: { $gt: 0 } })
  .sort({ freeMonthsEarned: -1 })
  .limit(10);

// Check fraud attempts
db.referrals.find({ isFraudulent: true });

// Notification success rate
db.referrals.aggregate([
  { $group: {
    _id: "$notificationStatus",
    count: { $sum: 1 }
  }}
]);
```

## Troubleshooting

### Common Issues

**1. Referral code not generating:**
- Ensure pro has `isActive: true` and `stripeCustomerId`
- Check MongoDB indexes are created
- Verify pre-save hook is running

**2. Notifications not sending:**
- Verify Twilio credentials in environment variables
- Check pro has `smsConsent: true`
- Confirm phone number is in E.164 format
- Review Twilio logs for delivery status

**3. Promo code not created:**
- Verify Stripe API key is valid
- Check Stripe account has proper permissions
- Review Stripe dashboard for coupon creation

**4. Referral not completing:**
- Confirm subscription is in 'active' status
- Verify webhook is being received
- Check for fraud detection flags
- Review server logs for errors

## Security Considerations

1. **No sensitive data in URLs** - Only referral codes (public)
2. **Rate limiting** on all API endpoints
3. **Input validation** on all user-provided data
4. **Stripe webhooks verified** with signature validation
5. **Anti-fraud checks** on all referral completions
6. **Audit logging** for all referral events

## Compliance Checklist

- ✅ NO free trials anywhere
- ✅ NO automatic discounts at signup
- ✅ Promo codes for NEXT billing cycle only
- ✅ Rewards only after PAID subscription
- ✅ SMS/WhatsApp opt-in respected
- ✅ No income guarantees in messaging
- ✅ USA pricing unchanged
- ✅ All changes additive only

## Support

For issues or questions:
1. Check server logs: `tail -f server/logs/app.log`
2. Review Stripe dashboard for subscription events
3. Check Twilio logs for notification delivery
4. Contact development team with specific error messages

## Changelog

### v1.0.0 (2025-12-28)
- Initial referral system implementation
- Referral code generation
- Promo code creation
- Multilingual notifications (EN/ES/PT)
- Anti-fraud mechanisms
- Frontend UI components
- Webhook integration

---

**Last Updated:** December 28, 2025
**Version:** 1.0.0
