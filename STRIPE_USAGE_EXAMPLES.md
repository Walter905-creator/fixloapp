# Stripe Checkout Usage Examples

## Quick Start Guide

### 1. Basic Frontend Integration

```javascript
// Example: React Component
import React, { useState } from 'react';

function SubscribeButton({ userEmail, userId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          userId: userId,
        }),
      });

      const data = await response.json();

      if (data.sessionUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.sessionUrl;
      } else {
        setError('Failed to create checkout session');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handleSubscribe} 
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Start 30-Day Free Trial'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default SubscribeButton;
```

### 2. Plain JavaScript Example

```javascript
// Example: Vanilla JavaScript
document.getElementById('subscribe-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const userId = getCurrentUserId(); // Your function to get user ID

  try {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, userId }),
    });

    const data = await response.json();

    if (data.sessionUrl) {
      // Redirect to Stripe Checkout
      window.location.href = data.sessionUrl;
    } else {
      alert('Failed to create checkout session');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
  }
});
```

### 3. Success Page Handler

```javascript
// Example: Handle successful checkout
// This runs on your success page (e.g., /success?session_id=cs_xxxxx)

const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('session_id');

if (sessionId) {
  // Optionally verify the session status
  fetch(`/api/stripe/subscription-status/${sessionId}`)
    .then(response => response.json())
    .then(data => {
      console.log('Payment status:', data.status);
      console.log('Customer email:', data.customer_email);
      
      // Show success message
      document.getElementById('success-message').innerHTML = `
        <h2>Welcome to Fixlo Pro! 🎉</h2>
        <p>Your 30-day free trial has started.</p>
        <p>You won't be charged until ${getTrialEndDate()}.</p>
      `;
    })
    .catch(error => console.error('Error:', error));
}

function getTrialEndDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toLocaleDateString();
}
```

## Backend Examples

### 4. cURL Command Line Examples

```bash
# Create checkout session
curl -X POST http://localhost:3001/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "email": "professional@example.com",
    "userId": "507f1f77bcf86cd799439011"
  }'

# Response:
# {
#   "sessionUrl": "https://checkout.stripe.com/c/pay/cs_xxxxx",
#   "sessionId": "cs_xxxxx",
#   "customerId": "cus_xxxxx"
# }
```

```bash
# Check subscription status
curl http://localhost:3001/api/stripe/subscription-status/cs_xxxxx
```

### 5. Node.js Backend Example

```javascript
// Example: Create checkout from another backend service
const axios = require('axios');

async function createSubscriptionCheckout(email, userId) {
  try {
    const response = await axios.post(
      'https://api.fixloapp.com/api/stripe/create-checkout-session',
      {
        email: email,
        userId: userId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error creating checkout:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
createSubscriptionCheckout('pro@example.com', '507f1f77bcf86cd799439011')
  .then(data => {
    console.log('Checkout URL:', data.sessionUrl);
    console.log('Customer ID:', data.customerId);
  })
  .catch(error => {
    console.error('Failed to create checkout');
  });
```

### 6. Python Backend Example

```python
# Example: Create checkout from Python backend
import requests

def create_subscription_checkout(email, user_id):
    url = 'https://api.fixloapp.com/api/stripe/create-checkout-session'
    
    payload = {
        'email': email,
        'userId': user_id
    }
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Error creating checkout: {e}')
        raise

# Usage
result = create_subscription_checkout('pro@example.com', '507f1f77bcf86cd799439011')
print(f"Checkout URL: {result['sessionUrl']}")
print(f"Customer ID: {result['customerId']}")
```

## Advanced Examples

### 7. Reuse Existing Customer

```javascript
// When a user already has a Stripe customer ID
async function createCheckoutForExistingCustomer(email, userId, customerId) {
  const response = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      userId: userId,
      customerId: customerId, // Reuse existing customer
    }),
  });

  const data = await response.json();
  return data;
}
```

### 8. Error Handling Example

```javascript
async function createCheckoutWithErrorHandling(email, userId) {
  try {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle specific error cases
      if (response.status === 400) {
        throw new Error(`Validation error: ${errorData.message}`);
      } else if (response.status === 500) {
        throw new Error(`Server error: ${errorData.message}`);
      } else {
        throw new Error('An unexpected error occurred');
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Checkout creation failed:', error);
    
    // Show user-friendly error message
    if (error.message.includes('Payment system not configured')) {
      alert('Payment system is currently unavailable. Please try again later.');
    } else if (error.message.includes('Email is required')) {
      alert('Please provide a valid email address.');
    } else {
      alert('An error occurred. Please try again or contact support.');
    }
    
    throw error;
  }
}
```

### 9. React Hook Example

```javascript
// Custom React Hook for Stripe Checkout
import { useState, useCallback } from 'react';

function useStripeCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);

  const createCheckout = useCallback(async (email, userId, customerId = null) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          userId,
          ...(customerId && { customerId }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create checkout');
      }

      const data = await response.json();
      setCheckoutData(data);
      
      // Automatically redirect to checkout
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      }
      
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Checkout error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createCheckout, loading, error, checkoutData };
}

// Usage in component
function SubscriptionPage() {
  const { createCheckout, loading, error } = useStripeCheckout();
  const userEmail = 'user@example.com';
  const userId = '123';

  const handleSubscribe = () => {
    createCheckout(userEmail, userId);
  };

  return (
    <div>
      <h1>Start Your 30-Day Free Trial</h1>
      <button onClick={handleSubscribe} disabled={loading}>
        {loading ? 'Creating checkout...' : 'Subscribe Now'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

### 10. Webhook Testing Example

```javascript
// Example: Testing webhook handler locally with Stripe CLI
// Run this command in terminal:
// stripe listen --forward-to localhost:3001/api/stripe/webhook

// Then trigger events:
// stripe trigger checkout.session.completed
// stripe trigger invoice.payment_succeeded
// stripe trigger customer.subscription.trial_will_end

// Or use this script to simulate webhook events (development only)
const axios = require('axios');

async function simulateWebhook(eventType) {
  const events = {
    'checkout.session.completed': {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          customer: 'cus_test_123',
          subscription: 'sub_test_123',
          metadata: {
            userId: '507f1f77bcf86cd799439011',
          },
        },
      },
    },
    'invoice.payment_succeeded': {
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: 'in_test_123',
          customer: 'cus_test_123',
          subscription: 'sub_test_123',
        },
      },
    },
  };

  const event = events[eventType];
  if (!event) {
    console.error('Unknown event type:', eventType);
    return;
  }

  try {
    // Note: This only works in development without webhook secret
    const response = await axios.post(
      'http://localhost:3001/api/stripe/webhook',
      event,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Webhook response:', response.data);
  } catch (error) {
    console.error('Webhook error:', error.message);
  }
}

// Usage
simulateWebhook('checkout.session.completed');
```

## Environment Setup Examples

### 11. .env Configuration

```bash
# Development
STRIPE_SECRET_KEY=sk_test_51xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_ID=price_xxxxx
YOUR_DOMAIN=http://localhost:3000
CLIENT_URL=http://localhost:3000

# Production
STRIPE_SECRET_KEY=sk_live_51xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_ID=prod_SaAyX0rd1VWGE0
YOUR_DOMAIN=https://www.fixloapp.com
CLIENT_URL=https://www.fixloapp.com
```

### 12. Testing Checklist

```bash
# 1. Start server
npm start

# 2. Test health endpoint
curl http://localhost:3001/api/health

# 3. Test checkout creation (expect error without Stripe key)
curl -X POST http://localhost:3001/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "userId": "123"}'

# 4. Add Stripe credentials to .env

# 5. Restart server and test again
npm start

# 6. Test with real checkout
curl -X POST http://localhost:3001/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "userId": "507f1f77bcf86cd799439011"}'

# 7. Test webhook with Stripe CLI
stripe listen --forward-to localhost:3001/api/stripe/webhook
stripe trigger checkout.session.completed
```

## Common Use Cases

### 13. Pro Sign-up Flow

```javascript
// Complete flow from Pro signup to subscription
async function proSignupWithSubscription(proData) {
  try {
    // Step 1: Create Pro account
    const signupResponse = await fetch('/api/pro-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proData),
    });
    
    const { proId } = await signupResponse.json();
    
    // Step 2: Create Stripe checkout
    const checkoutResponse = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: proData.email,
        userId: proId,
      }),
    });
    
    const { sessionUrl } = await checkoutResponse.json();
    
    // Step 3: Redirect to Stripe
    window.location.href = sessionUrl;
  } catch (error) {
    console.error('Signup flow error:', error);
    throw error;
  }
}
```

### 14. Subscription Management

```javascript
// Check Pro subscription status
async function getProSubscriptionStatus(proId) {
  try {
    const response = await fetch(`/api/pros/${proId}`);
    const pro = await response.json();
    
    return {
      hasActiveSubscription: pro.isActive,
      paymentStatus: pro.paymentStatus,
      trialEndsAt: pro.subscriptionEndDate,
      isInTrial: isDateInFuture(pro.subscriptionEndDate),
    };
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    throw error;
  }
}

function isDateInFuture(dateString) {
  return new Date(dateString) > new Date();
}
```

## Summary

These examples cover:
- ✅ Frontend integration (React, Vanilla JS)
- ✅ Backend integration (Node.js, Python)
- ✅ Error handling
- ✅ Success page handling
- ✅ Webhook testing
- ✅ Custom React hooks
- ✅ Complete Pro signup flow
- ✅ Subscription management

For more details, see:
- `STRIPE_CHECKOUT_30DAY_TRIAL.md` - Full documentation
- `IMPLEMENTATION_SUMMARY_STRIPE_TRIAL.md` - Implementation details
- `server/test-stripe-checkout.js` - Test script
