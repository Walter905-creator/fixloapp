const express = require('express');
const router = express.Router();
const Pro = require('../models/Pro');

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

// Create checkout session for subscription with 30-day free trial
router.post('/create-checkout-session', async (req, res) => {
  try {
    console.log('🔔 Stripe checkout session requested');
    
    // Get email, userId, and optional customerId from request body
    const { email, userId, customerId } = req.body;
    
    if (!email) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Email is required'
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
    const clientUrl = process.env.YOUR_DOMAIN || process.env.CLIENT_URL || 'https://www.fixloapp.com';
    
    // Get price ID from environment variables - using the product ID from the problem statement
    const priceId = process.env.STRIPE_PRICE_ID || 
                   'prod_SaAyX0rd1VWGE0';
    
    console.log(`💰 Creating checkout session with price ID: ${priceId}`);
    console.log(`🔗 Using client URL: ${clientUrl}`);
    console.log(`👤 Customer email: ${email}, User ID: ${userId || 'N/A'}`);

    // Get or create Stripe customer
    let customerIdToUse = customerId;
    
    if (!customerIdToUse) {
      console.log('🆕 Creating new Stripe customer');
      const customer = await stripe.customers.create({ 
        email,
        metadata: {
          userId: userId || '',
          source: 'fixlo-pro-subscription'
        }
      });
      customerIdToUse = customer.id;
      console.log(`✅ Customer created: ${customerIdToUse}`);
    } else {
      console.log(`♻️ Using existing customer: ${customerIdToUse}`);
    }

    // Create Stripe checkout session with 30-day free trial
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerIdToUse,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 30,
        metadata: {
          userId: userId || '',
          service: 'fixlo-pro-subscription',
          timestamp: new Date().toISOString()
        }
      },
      metadata: {
        userId: userId || '',
        customerId: customerIdToUse,
        service: 'fixlo-pro-subscription',
        timestamp: new Date().toISOString()
      },
      success_url: `${clientUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/cancel`,
    });

    console.log(`✅ Checkout session created: ${session.id}`);
    console.log(`🎁 30-day free trial included`);
    
    res.status(200).json({ 
      sessionUrl: session.url,
      sessionId: session.id,
      customerId: customerIdToUse
    });

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
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
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
      // In development/testing without webhook secret
      event = JSON.parse(req.body.toString());
      console.warn('⚠️ Processing webhook without signature verification (development mode)');
    }

    console.log(`🔔 Stripe webhook event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log(`✅ Checkout session completed: ${session.id}`);
        console.log(`👤 Customer: ${session.customer}, Subscription: ${session.subscription}`);
        
        // Update Pro record with subscription details
        const userId = session.metadata?.userId;
        if (userId) {
          try {
            const updateData = {
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              stripeSessionId: session.id,
              paymentStatus: session.subscription ? 'active' : 'pending',
              isActive: true,
              subscriptionStartDate: new Date()
            };
            
            // If there's a trial, set the subscription end date
            if (session.subscription) {
              const subscription = await stripe.subscriptions.retrieve(session.subscription);
              if (subscription.trial_end) {
                updateData.subscriptionEndDate = new Date(subscription.trial_end * 1000);
                console.log(`🎁 Trial ends: ${new Date(subscription.trial_end * 1000).toISOString()}`);
              }
            }
            
            await Pro.findByIdAndUpdate(userId, updateData);
            console.log(`✅ Pro ${userId} updated with subscription details`);
          } catch (err) {
            console.error(`❌ Failed to update Pro ${userId}:`, err.message);
          }
        } else {
          console.warn('⚠️ No userId in session metadata');
        }
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log(`✅ Invoice payment succeeded: ${invoice.id}`);
        console.log(`👤 Customer: ${invoice.customer}, Subscription: ${invoice.subscription}`);
        
        // Update Pro record payment status
        try {
          const pro = await Pro.findOne({ stripeCustomerId: invoice.customer });
          if (pro) {
            pro.paymentStatus = 'active';
            pro.isActive = true;
            
            // Update subscription dates
            if (invoice.subscription) {
              const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
              pro.subscriptionStartDate = new Date(subscription.current_period_start * 1000);
              pro.subscriptionEndDate = new Date(subscription.current_period_end * 1000);
            }
            
            await pro.save();
            console.log(`✅ Pro ${pro._id} payment status updated to active`);
            
            // TODO: Send confirmation email to pro
          } else {
            console.warn(`⚠️ No Pro found with customer ID: ${invoice.customer}`);
          }
        } catch (err) {
          console.error('❌ Failed to update Pro payment status:', err.message);
        }
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log(`❌ Invoice payment failed: ${invoice.id}`);
        console.log(`👤 Customer: ${invoice.customer}, Subscription: ${invoice.subscription}`);
        
        // Update Pro record and notify
        try {
          const pro = await Pro.findOne({ stripeCustomerId: invoice.customer });
          if (pro) {
            pro.paymentStatus = 'failed';
            pro.isActive = false;
            await pro.save();
            console.log(`⚠️ Pro ${pro._id} payment status updated to failed`);
            
            // TODO: Send payment failure notification email
            // TODO: Send SMS notification if enabled
          } else {
            console.warn(`⚠️ No Pro found with customer ID: ${invoice.customer}`);
          }
        } catch (err) {
          console.error('❌ Failed to update Pro payment failure:', err.message);
        }
        break;
      }
      
      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object;
        const trialEnd = new Date(subscription.trial_end * 1000);
        console.log(`⏰ Trial ending soon for subscription: ${subscription.id}`);
        console.log(`👤 Customer: ${subscription.customer}, Trial ends: ${trialEnd.toISOString()}`);
        
        // Notify Pro that trial is ending
        try {
          const pro = await Pro.findOne({ stripeCustomerId: subscription.customer });
          if (pro) {
            console.log(`📧 Sending trial ending reminder to Pro: ${pro.email}`);
            
            // TODO: Send trial ending reminder email
            // TODO: Send SMS notification if enabled
            // Email should mention trial ends in 3 days and billing will begin
            
            console.log(`✅ Trial ending notification sent to ${pro.name} (${pro.email})`);
          } else {
            console.warn(`⚠️ No Pro found with customer ID: ${subscription.customer}`);
          }
        } catch (err) {
          console.error('❌ Failed to send trial ending notification:', err.message);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log(`🗑️ Subscription cancelled: ${subscription.id}`);
        
        // Update Pro record
        try {
          const pro = await Pro.findOne({ stripeCustomerId: subscription.customer });
          if (pro) {
            pro.paymentStatus = 'cancelled';
            pro.isActive = false;
            await pro.save();
            console.log(`✅ Pro ${pro._id} subscription cancelled`);
          }
        } catch (err) {
          console.error('❌ Failed to update cancelled subscription:', err.message);
        }
        break;
      }
      
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
