# AI+ Priority Leads Subscription Tier

## Overview

The AI+ subscription tier is a premium offering that provides professionals with priority access to AI-qualified leads. This tier builds on top of the existing PRO subscription with enhanced lead delivery benefits.

## Subscription Tiers

| Tier | Price/Month | Lead Access | Features |
|------|-------------|-------------|----------|
| FREE | $0 | Standard leads only | Basic profile, limited lead access |
| PRO | $59.99 | All leads (standard priority) | Full platform access, notifications |
| AI+ | $99.00 | **Priority AI-qualified leads** | All PRO features + first access to AI leads |

## AI+ Priority Lead Delivery

### How It Works

When an AI-qualified lead is created through the AI diagnosis system:

1. **AI+ Exclusive Access**: The system first searches for available AI+ tier professionals
   - If AI+ pros are found, **only AI+ pros receive the lead**
   - Lead is not shown to PRO or FREE tier professionals

2. **PRO Tier Fallback**: If no AI+ professionals are available:
   - System falls back to PRO tier professionals
   - Lead is distributed to PRO tier subscribers

3. **FREE Tier Final Fallback**: If no PRO professionals are available:
   - System falls back to FREE tier professionals
   - Ensures lead is always matched when possible

### Technical Implementation

#### Stripe Integration

**Checkout Session Creation** (`/api/stripe/create-checkout-session`):
```javascript
POST /api/stripe/create-checkout-session
{
  "email": "pro@example.com",
  "userId": "mongodb_user_id",
  "tier": "AI_PLUS"  // or "PRO" for standard subscription
}
```

**Metadata Storage**:
- Tier information is stored in Stripe subscription and session metadata
- Field: `metadata.tier` = `"AI_PLUS"` or `"PRO"`
- Environment variables:
  - `STRIPE_PRICE_ID`: Price ID for PRO tier ($59.99/month)
  - `STRIPE_AI_PLUS_PRICE_ID`: Price ID for AI+ tier ($99.00/month)

#### Webhook Handling

**checkout.session.completed**:
- Extracts `session.metadata.tier`
- Sets `Pro.subscriptionTier` to `"ai_plus"` or `"pro"`

**invoice.payment_succeeded**:
- Retrieves subscription metadata
- Maintains tier assignment on recurring payments

#### Lead Matching Service

**Function**: `matchPros({ trade, coordinates, maxDistance, prioritizeAIPlus })`

**Parameters**:
- `prioritizeAIPlus: true` - Enables AI+ priority logic (used for AI-qualified leads)
- `prioritizeAIPlus: false` - Standard scoring (used for regular leads)

**Logic Flow**:
```javascript
if (prioritizeAIPlus) {
  // Step 1: Filter pros by tier
  const aiPlusPros = pros.filter(p => p.subscriptionTier === 'ai_plus');
  const proPros = pros.filter(p => p.subscriptionTier === 'pro');
  const freePros = pros.filter(p => p.subscriptionTier === 'free');
  
  // Step 2: Return based on availability
  if (aiPlusPros.length > 0) return scoreAndSortPros(aiPlusPros);
  if (proPros.length > 0) return scoreAndSortPros(proPros);
  return scoreAndSortPros(freePros);
}
```

## Security & Privacy

### Internal Priority Rules

- Priority logic is **server-side only**
- Tier information is **not exposed** in client responses
- `formatProsForClient()` strips subscription tier data
- Clients receive only: name, distance, rating, reviews, jobs completed

### Response Format (Client-Safe)

```javascript
{
  "id": "pro_id",
  "name": "Pro Name",
  "distance": 5.2,
  "rating": 4.8,
  "reviewCount": 45,
  "completedJobs": 23,
  "isVerified": true,
  "availability": "Available"
  // subscriptionTier NOT included
}
```

## Configuration

### Environment Variables

Add to `.env`:
```bash
# Stripe Price IDs
STRIPE_PRICE_ID=price_pro_monthly          # PRO tier: $59.99/month
STRIPE_AI_PLUS_PRICE_ID=price_ai_plus_monthly  # AI+ tier: $99.00/month
```

### Creating Stripe Products

1. **Create AI+ Product in Stripe Dashboard**:
   - Product Name: "Fixlo Pro AI+"
   - Price: $99.00/month (recurring)
   - Copy the Price ID

2. **Add Metadata to Product**:
   - Key: `tier`
   - Value: `AI_PLUS`

3. **Update Environment Variable**:
   ```bash
   STRIPE_AI_PLUS_PRICE_ID=price_xxxxxxxxxxxxx
   ```

## Testing

Run the comprehensive test suite:

```bash
cd server
node test-ai-plus-tier.js
```

**Test Coverage**:
- ✅ Checkout session creation for AI+ tier
- ✅ Checkout session creation for PRO tier
- ✅ Tier metadata storage in Stripe
- ✅ AI+ priority lead matching
- ✅ Fallback to PRO tier when no AI+ available
- ✅ Fallback to FREE tier when no PRO available
- ✅ Client data privacy (tier not exposed)

## Usage Example

### Backend: Create AI+ Subscription

```javascript
const axios = require('axios');

// Create AI+ subscription checkout
const response = await axios.post('http://localhost:3001/api/stripe/create-checkout-session', {
  email: 'pro@example.com',
  userId: '507f1f77bcf86cd799439011',
  tier: 'AI_PLUS'  // Specify AI+ tier
});

// Redirect user to Stripe checkout
window.location.href = response.data.sessionUrl;
```

### Backend: Match AI-Qualified Lead

```javascript
const { matchPros } = require('./services/proMatching');

// AI-qualified lead matching
const matchedPros = await matchPros({
  trade: 'plumbing',
  coordinates: [-122.4194, 37.7749],
  maxDistance: 30,
  prioritizeAIPlus: true  // Enable AI+ priority
});

// Only AI+ pros are returned (if available)
// Falls back to PRO, then FREE automatically
```

## Monitoring & Logging

The system logs tier-based decisions:

```
🔍 Matching pros: trade=plumbing, location=[...], prioritizeAIPlus=true
📊 Tier breakdown: AI+ (3), PRO (12), FREE (8)
🌟 AI+ pros available - returning 3 AI+ pros only
```

Or when falling back:

```
📊 Tier breakdown: AI+ (0), PRO (12), FREE (8)
⭐ No AI+ pros available - falling back to 12 PRO tier pros
```

## Database Schema

### Pro Model (`subscriptionTier` field)

```javascript
subscriptionTier: {
  type: String,
  enum: ['free', 'pro', 'ai_plus'],
  default: 'free'
}
```

**Values**:
- `'free'`: Free tier (default)
- `'pro'`: PRO subscription ($59.99/month)
- `'ai_plus'`: AI+ subscription ($99.00/month)

## Files Modified

1. **server/config/pricing.js**
   - Added `aiPlusMonthlySubscription: 99.00`

2. **server/routes/stripe.js**
   - Updated checkout session to accept `tier` parameter
   - Added tier metadata to Stripe objects
   - Updated webhooks to set `subscriptionTier` from metadata

3. **server/services/proMatching.js**
   - Enhanced `matchPros()` with strict tier prioritization
   - Added `scoreAndSortPros()` helper function
   - Implemented AI+ → PRO → FREE fallback logic

4. **server/test-ai-plus-tier.js** (NEW)
   - Comprehensive test suite for AI+ functionality

## Maintenance Notes

- **Pricing Updates**: Update `server/config/pricing.js` and Stripe dashboard
- **Tier Changes**: Only modify via Stripe webhooks (maintain single source of truth)
- **Monitoring**: Watch tier distribution logs to ensure proper lead allocation
- **Support**: Tier information visible in admin panel for support purposes

## Future Enhancements

Potential additions:
- Annual AI+ subscription ($999/year = 2 months free)
- Analytics dashboard showing AI+ lead conversion rates
- AI+ tier benefits (advanced analytics, priority support)
- Upgrade/downgrade flow between tiers
