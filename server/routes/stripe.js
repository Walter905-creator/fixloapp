const express = require('express');
const router = express.Router();

// Initialize Stripe
let stripe;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    console.log('✅ Stripe initialized successfully');
  } else {
    console.log('⚠️ STRIPE_SECRET_KEY not found in environment variables');
  }
} catch (error) {
  console.error('❌ Error initializing Stripe:', error.message);
}

// Create checkout session for subscription
router.post('/create-checkout-session', async (req, res) => {
  try {
    console.log('🔔 Stripe checkout session requested');
    
    // Get email and userId from request body
    const { email, userId } = req.body;
    
    if (!email || !userId) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Email and userId are required'
      });
    }
    
    // Verify Stripe is initialized
    if (!stripe) {
      console.error('❌ Stripe not initialized - missing STRIPE_SECRET_KEY');
      return res.status(500).json({ 
        error: 'Payment system not configured',
        message: 'Stripe integration is not properly set up'
      });
    }

    // Check required environment variables
    const clientUrl = process.env.CLIENT_URL || 'https://www.fixloapp.com';
    
    // Get price ID from environment variables
    const priceId = process.env.STRIPE_MONTHLY_PRICE_ID || 
                   process.env.STRIPE_FIRST_MONTH_PRICE_ID || 
                   process.env.STRIPE_PRICE_ID;
    
    if (!priceId) {
      console.error('❌ No Stripe price ID found in environment variables');
      return res.status(500).json({ 
        error: 'Payment configuration error',
        message: 'Subscription pricing not configured'
      });
    }

    console.log(`💰 Creating checkout session with price ID: ${priceId}`);
    console.log(`🔗 Using client URL: ${clientUrl}`);
    console.log(`👤 Customer email: ${email}, User ID: ${userId}`);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId,
        service: 'fixlo-pro-subscription',
        timestamp: new Date().toISOString()
      },
      success_url: `${clientUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/pricing`,
    });

    console.log(`✅ Checkout session created: ${session.id}`);
    res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('❌ Error creating checkout session:', error.message);
    res.status(500).json({ 
      error: 'Failed to create Stripe session',
      message: error.message 
    });
  }
});

// Get subscription status
router.get('/subscription-status/:sessionId', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not initialized' });
    }

    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    res.json({
      status: session.payment_status,
      customer_email: session.customer_details?.email
    });
  } catch (error) {
    console.error('❌ Error retrieving session:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Webhook for Stripe events
router.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).send('Stripe not initialized');
    }

    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    if (endpointSecret) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      event = req.body;
    }

    console.log(`🔔 Stripe webhook event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log(`✅ Payment successful for session: ${session.id}`);
        // Handle successful payment
        break;
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        console.log(`✅ Invoice payment succeeded: ${invoice.id}`);
        // Handle successful recurring payment
        break;
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        console.log(`❌ Invoice payment failed: ${failedInvoice.id}`);
        // Handle failed payment
        break;
      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    res.json({received: true});
  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
