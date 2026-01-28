# AI Home Expert Subscription Implementation

## Overview

This document describes the implementation of the AI Home Expert subscription tier ($19.99/month) for homeowners. The implementation reads tier information from Stripe product metadata and gates access to the AI diagnosis endpoint.

## Stripe Product Configuration

The following product should be created in the Stripe Dashboard:

```
Product Name: Fixlo AI Home Expert
Price: $19.99/month (recurring)
Product Metadata:
  - tier: AI_HOME
  - role: HOMEOWNER
```

**Important:** The implementation reads the `tier` metadata value to determine subscription type. No product IDs or prices are hardcoded in the application.

## Database Schema Changes

### Pro Model (`server/models/Pro.js`)

Added new field:

```javascript
aiHomeAccess: {
  type: Boolean,
  default: false
}
```

**Purpose:** Primary flag indicating whether user has active AI Home Expert access. Set to `true` when user has an active subscription with `tier === "AI_HOME"`.

## Webhook Handling

All webhook handlers retrieve subscription data with expanded product metadata:

```javascript
const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
  expand: ['items.data.price.product']
});

const product = subscription.items.data[0]?.price?.product;
const subscriptionTier = product?.metadata?.tier;
```

### checkout.session.completed

**Purpose:** Initial subscription setup

**AI_HOME Tier Handling:**
```javascript
if (subscriptionTier === 'AI_HOME') {
  updateData.aiSubscriptionId = session.subscription;
  updateData.aiSubscriptionStatus = 'active';
  updateData.aiSubscriptionStartDate = new Date();
  updateData.aiHomeAccess = true;
}
```

**Notes:**
- AI_HOME subscriptions are excluded from referral program
- Uses separate AI-specific fields from PRO subscriptions

### invoice.payment_succeeded

**Purpose:** Handle successful recurring payments

**AI_HOME Tier Handling:**
```javascript
if (subscriptionTier === 'AI_HOME') {
  pro.aiSubscriptionId = invoice.subscription;
  pro.aiSubscriptionStatus = 'active';
  pro.aiSubscriptionStartDate = new Date(subscription.current_period_start * 1000);
  pro.aiSubscriptionEndDate = new Date(subscription.current_period_end * 1000);
  pro.aiHomeAccess = true;
}
```

**Notes:**
- Updates subscription period dates
- Maintains aiHomeAccess = true for active subscriptions
- Excluded from referral rewards

### invoice.payment_failed

**Purpose:** Handle failed payment attempts

**AI_HOME Tier Handling:**
```javascript
if (subscriptionTier === 'AI_HOME') {
  pro.aiSubscriptionStatus = 'cancelled';
  pro.aiHomeAccess = false;
}
```

**Notes:**
- Immediately revokes AI Home Expert access
- User will receive 403 error on /api/ai/diagnose requests

### customer.subscription.deleted

**Purpose:** Handle subscription cancellations

**AI_HOME Tier Handling:**
```javascript
if (subscriptionTier === 'AI_HOME') {
  pro.aiSubscriptionStatus = 'cancelled';
  pro.aiHomeAccess = false;
}
```

**Notes:**
- Revokes access immediately upon cancellation
- Subscription data retained for historical records

### customer.subscription.updated (NEW)

**Purpose:** Handle real-time subscription status changes

**AI_HOME Tier Handling:**
```javascript
if (subscriptionTier === 'AI_HOME') {
  if (subscription.status === 'active') {
    pro.aiSubscriptionStatus = 'active';
    pro.aiHomeAccess = true;
  } else if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
    pro.aiSubscriptionStatus = 'cancelled';
    pro.aiHomeAccess = false;
  } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
    pro.aiSubscriptionStatus = 'pending';
    pro.aiHomeAccess = false;
  }
}
```

**Notes:**
- Handles all subscription status transitions
- Ensures aiHomeAccess reflects current subscription state

## Access Control

### Middleware: requireAISubscription

**Location:** `server/middleware/requireAISubscription.js`

**Purpose:** Gate /api/ai/diagnose endpoint to users with active AI Home Expert access

**Implementation:**
```javascript
// Step 1: Validate JWT token
const token = req.headers.authorization?.replace('Bearer ', '');
const user = verify(token);

// Step 2: Look up user in database
const pro = await Pro.findOne({ email: user.email });

// Step 3: Verify AI Home Expert access flag
if (!pro.aiHomeAccess) {
  return res.status(403).json({ error: 'AI subscription required' });
}

// Step 4: Verify subscription hasn't expired
if (pro.aiSubscriptionEndDate && new Date() > pro.aiSubscriptionEndDate) {
  return res.status(403).json({ error: 'AI subscription required' });
}

// Allow access
next();
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: No active AI subscription or subscription expired
- `500 Internal Server Error`: Database or processing error

## API Endpoints

### /api/ai/diagnose

**Method:** POST  
**Authentication:** Required (JWT Bearer token)  
**Authorization:** Requires `aiHomeAccess === true`

**Request:**
```json
{
  "description": "Water dripping from kitchen faucet",
  "images": ["base64_or_url_1", "base64_or_url_2"]
}
```

**Response (403 - No Subscription):**
```json
{
  "error": "AI subscription required"
}
```

**Response (200 - Success):**
```json
{
  "issue": "Leaking kitchen faucet",
  "difficulty": 3,
  "riskLevel": "LOW",
  "diyAllowed": true,
  "steps": [...],
  "stopConditions": [...]
}
```

## Testing

### Manual Testing

Run the logic validation test:
```bash
cd server
node test-ai-home-logic.js
```

**Expected Output:**
- All 7 tests should pass
- Validates field logic, payment failure handling, reactivation, expiration checks, middleware logic, and tier differentiation

### Test Stripe Webhooks

Use Stripe CLI to test webhooks locally:

```bash
# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.deleted
stripe trigger customer.subscription.updated
```

**Verify:**
1. Check console logs for tier detection: "📦 Product tier from metadata: AI_HOME"
2. Check database for aiHomeAccess flag changes
3. Test /api/ai/diagnose endpoint access

## Migration Notes

### Existing Users

No migration needed. Existing users:
- Continue with their current PRO or AI_PLUS subscriptions unchanged
- Can purchase AI Home Expert subscription separately
- AI Home Expert is independent of professional subscriptions

### Database Impact

- New field `aiHomeAccess` defaults to `false` for all existing users
- No data migration required
- Existing AI subscription fields (aiSubscriptionStatus, aiSubscriptionId) are reused

## Security Considerations

1. **Authentication:** All requests require valid JWT token
2. **Authorization:** Access controlled by server-side flag (aiHomeAccess)
3. **Webhook Security:** Signature verification enabled in production
4. **No Client Control:** Clients cannot set aiHomeAccess flag directly
5. **Expiration Checks:** Both status and date are validated
6. **Error Messages:** Generic error messages don't leak subscription details

## Monitoring

### Logs to Watch

**Successful AI_HOME subscription:**
```
✅ Checkout session completed: cs_xxx
📦 Product tier from metadata: AI_HOME
🏠 Setting AI Home Expert access for user xxx
```

**Payment failure:**
```
❌ Invoice payment failed: in_xxx
📦 Product tier from metadata: AI_HOME
⚠️ AI Home Expert subscription deactivated for user xxx
```

**Access denied:**
```
❌ AI subscription check error: [details]
403 Forbidden: AI subscription required
```

## Troubleshooting

### User can't access /api/ai/diagnose

1. Check `aiHomeAccess` flag in database:
   ```javascript
   db.pros.findOne({ email: "user@example.com" }, { aiHomeAccess: 1, aiSubscriptionStatus: 1 })
   ```

2. Verify subscription status in Stripe dashboard

3. Check webhook delivery in Stripe dashboard

4. Verify product metadata includes `tier: "AI_HOME"`

### Webhook not setting aiHomeAccess

1. Check webhook endpoint secret is configured (`STRIPE_WEBHOOK_SECRET`)

2. Verify webhook signature validation passes

3. Check Stripe product metadata includes `tier: "AI_HOME"`

4. Review server logs for tier detection: "📦 Product tier from metadata"

### Wrong tier applied

1. Verify Stripe product metadata spelling: `tier` (lowercase)

2. Check metadata value is exactly: `AI_HOME` (uppercase with underscore)

3. Ensure product is properly attached to subscription price

## Future Enhancements

Potential improvements not included in this implementation:

1. **Separate User Model:** Create dedicated Homeowner model separate from Pro
2. **Usage Limits:** Track number of AI diagnoses per billing period
3. **Subscription Management UI:** Allow users to upgrade/downgrade/cancel
4. **Email Notifications:** Send subscription confirmation and expiration reminders
5. **Grace Period:** Allow access for X days after payment failure
6. **Family Plans:** Support multiple users under one subscription

## Support

For questions or issues with this implementation:

1. Review webhook logs in Stripe dashboard
2. Check server console logs for tier detection and access control
3. Verify JWT token is valid and not expired
4. Confirm Stripe product metadata is properly configured
