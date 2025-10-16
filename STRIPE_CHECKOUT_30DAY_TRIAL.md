# Stripe Checkout with 30-Day Free Trial Implementation

## Overview

This implementation adds comprehensive Stripe Checkout functionality with a 30-day free trial for Fixlo Pro subscriptions. The system automatically creates or retrieves Stripe customers, manages subscription trials, and handles all relevant webhook events.

## Features

### 1. Checkout Session Creation

**Endpoint:** `POST /api/stripe/create-checkout-session`

**Request Body:**
```json
{
  "email": "pro@example.com",
  "userId": "mongodb_object_id",
  "customerId": "cus_xxxxx" // Optional - will create if not provided
}
```

**Response:**
```json
{
  "sessionUrl": "https://checkout.stripe.com/c/pay/cs_xxxxx",
  "sessionId": "cs_xxxxx",
  "customerId": "cus_xxxxx"
}
```

**Features:**
- ✅ Automatically creates Stripe customer if not provided
- ✅ Reuses existing customer if `customerId` is provided
- ✅ Configures 30-day free trial
- ✅ Uses `STRIPE_PRICE_ID` or defaults to `prod_SaAyX0rd1VWGE0`
- ✅ Redirects to success/cancel URLs on completion

### 2. Webhook Event Handlers

The system handles five critical Stripe webhook events:

#### A. `checkout.session.completed`
**Purpose:** Handle successful checkout completion

**Actions:**
- Updates Pro record with subscription details
- Stores `stripeCustomerId`, `stripeSubscriptionId`, `stripeSessionId`
- Sets `paymentStatus` to 'active'
- Activates Pro account (`isActive = true`)
- Records trial end date in `subscriptionEndDate`

**Pro Model Updates:**
```javascript
{
  stripeCustomerId: "cus_xxxxx",
  stripeSubscriptionId: "sub_xxxxx",
  stripeSessionId: "cs_xxxxx",
  paymentStatus: "active",
  isActive: true,
  subscriptionStartDate: Date,
  subscriptionEndDate: Date  // Trial end date
}
```

#### B. `invoice.payment_succeeded`
**Purpose:** Handle successful payment (after trial or recurring)

**Actions:**
- Updates Pro `paymentStatus` to 'active'
- Ensures Pro account is active
- Updates subscription period dates
- TODO: Send confirmation email

#### C. `invoice.payment_failed`
**Purpose:** Handle failed payment attempts

**Actions:**
- Updates Pro `paymentStatus` to 'failed'
- Deactivates Pro account (`isActive = false`)
- TODO: Send payment failure notification email
- TODO: Send SMS notification if enabled

#### D. `customer.subscription.trial_will_end`
**Purpose:** Notify Pro 3 days before trial ends

**Actions:**
- Finds Pro by `stripeCustomerId`
- Logs trial end date and time
- TODO: Send trial ending reminder email
- TODO: Send SMS notification if enabled
- Email should mention trial ends in 3 days and billing will begin

**Recommended Email Content:**
- Subject: "Your Fixlo Pro trial ends in 3 days"
- Body: Remind Pro that billing will begin after trial
- Include pricing information
- Provide cancellation instructions if needed

#### E. `customer.subscription.deleted`
**Purpose:** Handle subscription cancellation

**Actions:**
- Updates Pro `paymentStatus` to 'cancelled'
- Deactivates Pro account
- Removes access to Pro features

### 3. Environment Configuration

**Required Environment Variables:**

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxx              # Required for all Stripe operations
STRIPE_WEBHOOK_SECRET=whsec_xxxxx            # Required for webhook signature verification
STRIPE_PRICE_ID=prod_SaAyX0rd1VWGE0         # Your Stripe price/product ID

# Domain Configuration
YOUR_DOMAIN=https://www.fixloapp.com         # Primary domain for redirects
CLIENT_URL=https://www.fixloapp.com          # Fallback domain
```

**Optional Environment Variables:**
```bash
STRIPE_MONTHLY_PRICE_ID=price_xxxxx          # Alternative price ID (fallback)
```

### 4. Pro Model Integration

The implementation uses existing fields in the Pro model:

```javascript
{
  stripeCustomerId: String,        // Stripe customer ID
  stripeSubscriptionId: String,    // Stripe subscription ID
  stripeSessionId: String,         // Checkout session ID
  paymentStatus: String,           // 'pending', 'active', 'cancelled', 'failed'
  isActive: Boolean,               // Whether Pro can access features
  subscriptionStartDate: Date,     // When subscription/trial started
  subscriptionEndDate: Date        // When trial/period ends
}
```

## Installation & Setup

### 1. Install Dependencies

Dependencies are already included in `package.json`:
- `stripe`: ^12.0.0
- `express`: ^4.18.2

```bash
cd server
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and add your Stripe credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```bash
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
STRIPE_PRICE_ID=prod_SaAyX0rd1VWGE0
YOUR_DOMAIN=https://www.fixloapp.com
```

### 3. Set Up Stripe Webhook

**Important:** There are two webhook endpoints available:
- `/webhook/stripe` - Legacy minimal handler (in index.js)
- `/api/stripe/webhook` - **Recommended** - Full featured handler with all event processing

**Use the recommended endpoint:**

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook` (recommended)
3. Select events to send:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
   - `customer.subscription.deleted`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

**Note:** The `/api/stripe/webhook` endpoint includes comprehensive event handling and Pro model updates.

### 4. Test the Implementation

Start the server:
```bash
npm start
```

Run the test script:
```bash
node test-stripe-checkout.js
```

## Usage Examples

### Frontend Integration

#### React/JavaScript Example

```javascript
async function createCheckoutSession(email, userId) {
  try {
    const response = await fetch('https://api.fixloapp.com/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        userId: userId,
      }),
    });
    
    const data = await response.json();
    
    if (data.sessionUrl) {
      // Redirect to Stripe Checkout
      window.location.href = data.sessionUrl;
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
  }
}
```

#### With Existing Customer

```javascript
async function createCheckoutSessionExisting(email, userId, customerId) {
  const response = await fetch('https://api.fixloapp.com/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      userId: userId,
      customerId: customerId  // Reuse existing Stripe customer
    }),
  });
  
  const data = await response.json();
  window.location.href = data.sessionUrl;
}
```

### cURL Examples

#### Create New Checkout Session
```bash
curl -X POST http://localhost:3001/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pro@example.com",
    "userId": "507f1f77bcf86cd799439011"
  }'
```

#### With Existing Customer
```bash
curl -X POST http://localhost:3001/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pro@example.com",
    "userId": "507f1f77bcf86cd799439011",
    "customerId": "cus_xxxxx"
  }'
```

## Testing

### Manual Testing

1. **Test Checkout Session Creation:**
   ```bash
   node test-stripe-checkout.js
   ```

2. **Test Webhook Events:**
   - Use Stripe CLI for local testing:
   ```bash
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   stripe trigger checkout.session.completed
   stripe trigger invoice.payment_succeeded
   stripe trigger customer.subscription.trial_will_end
   ```

3. **Test End-to-End Flow:**
   - Create checkout session via API
   - Complete checkout in Stripe (use test card: 4242 4242 4242 4242)
   - Verify webhook updates Pro record
   - Check Pro model in database

### Test Cards

Use these Stripe test cards:

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Decline |
| 4000 0025 0000 3155 | Requires authentication |

## Error Handling

### Common Errors

1. **Stripe not initialized**
   - Ensure `STRIPE_SECRET_KEY` is set in `.env`
   - Check server logs for initialization errors

2. **Webhook signature verification failed**
   - Ensure `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
   - Check webhook endpoint URL is correct

3. **No price ID found**
   - Set `STRIPE_PRICE_ID` in `.env`
   - Or provide price ID in request

4. **Pro not found in webhook**
   - Ensure `userId` is passed in checkout session metadata
   - Check Pro exists in database with matching `stripeCustomerId`

## TODO: Future Enhancements

### Email Notifications
- [ ] Send welcome email on successful checkout
- [ ] Send payment confirmation emails
- [ ] Send trial ending reminder (3 days before)
- [ ] Send payment failure notifications
- [ ] Send subscription cancelled confirmation

### SMS Notifications
- [ ] Send trial ending reminder via SMS
- [ ] Send payment failure alerts via SMS
- [ ] Check Pro `smsConsent` before sending

### Dashboard Features
- [ ] Display trial status in Pro dashboard
- [ ] Show days remaining in trial
- [ ] Subscription management interface
- [ ] Payment history view

### Analytics
- [ ] Track trial conversion rate
- [ ] Monitor payment success/failure rates
- [ ] Dashboard for subscription metrics

## Security Considerations

1. **Webhook Signature Verification**
   - Always verify webhook signatures in production
   - Use `STRIPE_WEBHOOK_SECRET` for verification
   - Never skip verification in production

2. **Customer Data**
   - Store only necessary Stripe IDs
   - Don't store credit card information
   - Use Stripe's customer portal for payment method updates

3. **Error Logging**
   - Log webhook events for debugging
   - Don't log sensitive customer information
   - Monitor failed webhook deliveries

## Production Checklist

- [ ] Set production Stripe keys in environment
- [ ] Configure webhook endpoint in Stripe dashboard
- [ ] Set correct `YOUR_DOMAIN` for redirects
- [ ] Test webhook signature verification
- [ ] Implement email notification system
- [ ] Set up monitoring for webhook failures
- [ ] Test trial-to-paid conversion flow
- [ ] Document cancellation process for customers
- [ ] Set up customer support workflows

## Support & Troubleshooting

### Logs

All Stripe operations are logged with emoji prefixes:
- 🔔 Webhook events
- ✅ Successful operations
- ❌ Errors
- ⚠️ Warnings
- 💰 Payment operations
- 🎁 Trial-related events

### Common Issues

1. **Checkout session not creating**
   - Check Stripe API key is valid
   - Verify price ID exists in Stripe
   - Check server logs for errors

2. **Webhooks not firing**
   - Verify webhook endpoint is accessible
   - Check webhook signing secret
   - Use Stripe dashboard to view webhook attempts

3. **Pro not activating**
   - Check `userId` is correct in request
   - Verify webhook handler is updating Pro model
   - Check database connection is working

## References

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Subscriptions with Trials](https://stripe.com/docs/billing/subscriptions/trials)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

## License

This implementation is part of the Fixlo application and follows the same license terms.
