# Referral Reward Auto-Apply Implementation

## Overview

This implementation adds backend logic that automatically grants referrers ONE FREE MONTH after a successful paid referral by creating and applying a Stripe coupon + promotion code.

## Implementation Details

### Key Components

1. **New Service: `server/services/applyReferralFreeMonth.js`**
   - Core function: `applyReferralFreeMonth({ stripeCustomerId, referralCode, referredUserId })`
   - Creates Stripe coupon with 100% discount, duration: 'once'
   - Creates promotion code linked to the coupon
   - Auto-applies the promotion code to the referrer's Stripe subscription
   - Includes safety checks to prevent stacking rewards

2. **Updated: `server/routes/stripe.js`**
   - Enhanced `invoice.payment_succeeded` webhook handler
   - Triggers reward when referred user completes first PAID invoice (amount > $0)
   - Finds referrer and applies reward automatically
   - Updates referral records in database
   - Fail-safe implementation (won't crash if reward fails)

3. **Updated: `server/.env.example`**
   - Added `FIXLO_PRO_PRODUCT_ID` environment variable documentation

### Workflow

```
1. Referred user signs up with referral code
   └─> Pro.referredByCode set to referral code

2. Referred user subscribes (enters trial)
   └─> checkout.session.completed webhook fires
   └─> Pro record updated with Stripe IDs

3. Referred user completes 30-day trial
   └─> First paid invoice generated (amount > $0)
   └─> invoice.payment_succeeded webhook fires

4. Webhook handler detects referred user
   └─> Checks if reward already issued
   └─> Checks if referrer has pending reward (prevent stacking)
   └─> Calls applyReferralFreeMonth()

5. applyReferralFreeMonth() executes:
   └─> Creates Stripe coupon (100% off, once)
   └─> Creates promotion code (e.g., FIXLO-ABC123)
   └─> Applies promotion code to referrer's subscription
   └─> Returns success with promo code details

6. Webhook handler updates database:
   └─> Updates Referral record (rewardStatus: 'issued')
   └─> Increments referrer's completedReferrals
   └─> Increments referrer's freeMonthsEarned

7. Next billing cycle for referrer:
   └─> Stripe automatically applies 100% discount
   └─> Referrer gets one free month
```

### Stripe Coupon Configuration

```javascript
{
  percent_off: 100,              // 100% discount
  duration: 'once',              // Applies to ONE invoice only
  applies_to: {
    products: [FIXLO_PRO_PRODUCT_ID]  // Restricted to Fixlo Pro
  },
  metadata: {
    type: 'referral_reward',
    referralCode: 'FIXLO-USER123',
    referredUserId: '...',
    createdBy: 'fixlo_referral_system'
  },
  max_redemptions: 1             // Can only be used once
}
```

### Promotion Code Configuration

```javascript
{
  coupon: couponId,
  code: 'FIXLO-ABC123',         // Human-readable format
  max_redemptions: 1,
  metadata: {
    type: 'referral_reward',
    referralCode: 'FIXLO-USER123',
    referredUserId: '...',
    customerId: 'cus_...',
    createdBy: 'fixlo_referral_system'
  }
}
```

### Auto-Apply Mechanism

The promotion code is applied to the referrer's subscription using:

```javascript
// Get active subscription for customer
const subscriptions = await stripe.subscriptions.list({
  customer: stripeCustomerId,
  status: 'active',
  limit: 1
});

// Apply promotion code to subscription
await stripe.subscriptions.update(subscription.id, {
  promotion_code: promotionCodeId,
  proration_behavior: 'none'  // Apply to next cycle, no immediate charge
});
```

Stripe then automatically:
1. Stores the promotion code on the subscription
2. Applies the 100% discount to the NEXT invoice
3. Charges $0 for that billing cycle
4. Resumes normal billing afterward (since duration is 'once')

## Environment Variables

### Required

```bash
STRIPE_SECRET_KEY=sk_live_...  # Stripe secret key (live mode in production)
```

### Optional

```bash
FIXLO_PRO_PRODUCT_ID=prod_...  # Stripe product ID to restrict coupon
STRIPE_PRICE_ID=price_...      # Fallback if FIXLO_PRO_PRODUCT_ID not set
```

## Safety Features

### 1. Prevents Duplicate Rewards
- Checks if reward already issued for this specific referral
- Checks referral record: `rewardStatus === 'issued'`

### 2. Prevents Stacking Rewards
- Checks if referrer has pending reward in last 35 days
- Checks customer metadata for recent `referral_reward_applied`
- Checks active subscription for existing referral discount

### 3. Fail-Safe Operation
- All errors caught and logged
- Returns `{ success: false, error: '...' }` on failure
- Webhook processing continues even if reward fails
- Updates referral record with failure status

### 4. Paid Subscription Requirement
- Only triggers on `invoice.payment_succeeded` with `amount_paid > 0`
- Skips trial invoices ($0 amount)
- Ensures referred user completed trial and paid

### 5. Comprehensive Logging
```
✅ Success logs
❌ Error logs
⚠️ Warning logs
🎁 Reward processing logs
📝 Audit logs with customer IDs and amounts
```

## Testing

### Manual Testing Checklist

1. **Create test referral:**
   ```bash
   # User A creates referral code
   # User B signs up with User A's code
   # User B subscribes (enters trial)
   ```

2. **Complete trial:**
   ```bash
   # Wait 30 days OR fast-forward subscription in Stripe Dashboard
   # First paid invoice generated
   # Webhook fires: invoice.payment_succeeded
   ```

3. **Verify reward:**
   ```bash
   # Check logs for "🎁 Referral reward applied successfully!"
   # Check Stripe Dashboard → User A's subscription
   # Should see promotion code attached
   # Check MongoDB → Referral record: rewardStatus = 'issued'
   # Check MongoDB → User A Pro record: completedReferrals +1
   ```

4. **Verify next billing:**
   ```bash
   # Wait for User A's next billing cycle
   # Invoice should show 100% discount
   # User A pays $0 for that month
   # Following month resumes normal billing
   ```

### Automated Tests

Run test suite:
```bash
cd server
node test-referral-reward-autoapply.js
```

Tests verify:
- ✅ Promo code generation format
- ✅ Promo code uniqueness
- ✅ Parameter validation
- ✅ Environment configuration

## Database Schema Updates

No schema changes required. Uses existing fields:

**Referral Model:**
- `rewardStatus`: 'issued' when reward applied
- `promoCode`: Stores generated promotion code
- `stripeCouponId`: Stores Stripe coupon ID
- `stripePromoCodeId`: Stores Stripe promotion code ID
- `rewardIssuedAt`: Timestamp when reward applied

**Pro Model:**
- `completedReferrals`: Incremented when reward issued
- `freeMonthsEarned`: Incremented when reward issued
- `referredByCode`: Used to identify referred users

## Compliance with Requirements

### ✅ CRITICAL NON-NEGOTIABLE RULES

1. **DO NOT enable free trials anywhere**
   - ✅ No changes to trial logic
   - ✅ Existing 30-day trial remains unchanged

2. **DO NOT change existing Stripe products, prices, or USA subscription behavior**
   - ✅ No product/price modifications
   - ✅ Only creates NEW coupons for rewards
   - ✅ Subscription flow unchanged

3. **DO NOT add manual promo code input fields to the UI**
   - ✅ No UI changes
   - ✅ Backend-only implementation

4. **Rewards must apply ONLY after referred user completes PAID subscription**
   - ✅ Triggers on `invoice.payment_succeeded` with `amount_paid > 0`
   - ✅ Skips trial period ($0 invoices)

5. **Free month must apply to NEXT billing cycle only**
   - ✅ Uses Stripe subscription update with `proration_behavior: 'none'`
   - ✅ Coupon duration: 'once' (applies to one invoice only)

6. **Additive changes only. No breaking changes**
   - ✅ Only adds new function
   - ✅ Only enhances existing webhook handler
   - ✅ All existing functionality preserved

### ✅ IMPLEMENTATION REQUIREMENTS

1. **Use Stripe API to create coupon**
   - ✅ percent_off: 100
   - ✅ duration: 'once'
   - ✅ applies_to: Fixlo Pro Membership product
   - ✅ metadata: { type: "referral_reward" }

2. **Create promotion code**
   - ✅ Linked to coupon
   - ✅ max_redemptions: 1
   - ✅ Human-readable code (FIXLO-XXXXXX)
   - ✅ Metadata includes referral code / referrer ID

3. **Auto-apply promotion code to referrer's Stripe customer**
   - ✅ Attaches promotion_code to Stripe subscription
   - ✅ Does NOT apply automatically at checkout
   - ✅ Stripe applies it to NEXT invoice

### ✅ ENVIRONMENT VARIABLES

- ✅ STRIPE_SECRET_KEY (required, already exists)
- ✅ FIXLO_PRO_PRODUCT_ID (optional, documented)

### ✅ CODE REQUIREMENTS

- ✅ Reusable function: `applyReferralFreeMonth()`
- ✅ Function input: stripeCustomerId, referralCode
- ✅ Function output: success boolean, promo code string
- ✅ Logs success and failures
- ✅ Fails safely without crashing

### ✅ CONSTRAINTS

- ✅ No email implementation
- ✅ No UI changes required
- ✅ No stacking multiple rewards (hasExistingReward check)
- ✅ No retroactive discounts
- ✅ Stripe remains source of truth

## Files Modified/Created

### Created
1. `server/services/applyReferralFreeMonth.js` - Core reward application logic
2. `server/test-referral-reward-autoapply.js` - Test suite

### Modified
1. `server/routes/stripe.js` - Enhanced webhook handler
2. `server/.env.example` - Added FIXLO_PRO_PRODUCT_ID documentation

## Deployment Checklist

### Before Deployment
- [ ] Verify STRIPE_SECRET_KEY is set in production environment
- [ ] Set FIXLO_PRO_PRODUCT_ID to actual Stripe product ID
- [ ] Test in staging with test Stripe keys
- [ ] Verify webhook endpoint is configured in Stripe Dashboard
- [ ] Ensure MongoDB connection is stable

### After Deployment
- [ ] Monitor logs for successful reward application
- [ ] Verify first reward in production Stripe Dashboard
- [ ] Check referral completion rates in analytics
- [ ] Monitor for any webhook failures

### Rollback Plan
- Revert changes to `server/routes/stripe.js`
- Remove import of `applyReferralFreeMonth`
- No database migrations needed (schema unchanged)
- All existing functionality will continue working

## Support and Troubleshooting

### Common Issues

**Issue: "Stripe is not initialized"**
- Solution: Set STRIPE_SECRET_KEY in environment variables

**Issue: "No active subscription found"**
- Solution: Verify referrer has active Stripe subscription
- Check Pro.stripeCustomerId is set correctly

**Issue: "Reward already issued"**
- Expected: Prevents duplicate rewards
- Check Referral record rewardStatus field

**Issue: Promotion code not applying**
- Verify subscription is active
- Check Stripe Dashboard → Subscription → Discounts
- Ensure promotion code is attached to subscription

### Monitoring

Key metrics to monitor:
- Number of rewards issued per day
- Reward success rate
- Failed reward attempts (check logs)
- Average time from referral to reward
- Stripe coupon usage statistics

### Logs to Watch

```bash
# Success indicators
"🎁 Starting referral reward for customer"
"✅ Created coupon:"
"✅ Created promotion code:"
"✅ Applied promotion code to subscription:"
"🎉 Referral reward successfully applied!"

# Error indicators
"❌ Error applying referral reward:"
"❌ Error processing referral reward:"
"⚠️ No active subscription found"
"⚠️ Referrer already has pending reward"
```

## Future Enhancements (Out of Scope)

- Email notification to referrer when reward is applied
- Admin dashboard to view reward statistics
- Manual reward adjustment interface
- Reward analytics and reporting
- Multi-tier referral rewards
- Batch processing of pending rewards

## Contact

For questions about this implementation:
- Review code comments in `applyReferralFreeMonth.js`
- Check webhook logs in production
- Review Stripe Dashboard for coupon/promo code details
- Consult this documentation
