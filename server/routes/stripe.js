const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const Pro = require('../models/Pro');
const JobRequest = require('../models/JobRequest');
const Referral = require('../models/Referral');
const EarlyAccessSpots = require('../models/EarlyAccessSpots');
const { applyReferralFreeMonth, hasExistingReward } = require('../services/applyReferralFreeMonth');
const { sendSms } = require('../utils/twilio');

// Initialize Stripe with validation
let stripe;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    // Enforce Live Mode in production
    if (process.env.NODE_ENV === "production" && !process.env.STRIPE_SECRET_KEY.startsWith("sk_live_")) {
      console.error("❌ SECURITY ERROR: Stripe LIVE secret key required in production");
      throw new Error("Stripe LIVE secret key required in production. Use sk_live_ keys only.");
    }
    
    // Validate test mode in non-production
    if (process.env.NODE_ENV !== "production" && !process.env.STRIPE_SECRET_KEY.startsWith("sk_test_")) {
      console.error("❌ SECURITY ERROR: Live Stripe key detected in non-production environment");
      throw new Error("Stripe live key detected in non-production environment. Use sk_test_ keys only.");
    }
    
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });
    console.log('✅ Stripe initialized in', process.env.STRIPE_SECRET_KEY.startsWith("sk_test_") ? "TEST MODE" : "LIVE MODE");
  } else {
    console.log('⚠️ STRIPE_SECRET_KEY not found in environment variables');
  }
} catch (error) {
  console.error('❌ Error initializing Stripe:', error.message);
  throw error;
}

// Create SetupIntent for payment method authorization
router.post('/create-setup-intent', async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔔 Stripe setup intent requested');
    }
    
    const { email, userId, jobId, city } = req.body;
    
    if (!email) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Email is required'
      });
    }
    
    if (!stripe) {
      console.error('❌ Stripe not initialized - missing STRIPE_SECRET_KEY');
      return res.status(500).json({ 
        error: 'Payment system not configured',
        message: 'Stripe integration is not properly set up'
      });
    }

    // Get or create Stripe customer
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
      if (process.env.NODE_ENV !== 'production') {
        console.log(`♻️ Using existing customer: ${customer.id}`);
      }
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.log('🆕 Creating new Stripe customer');
      }
      customer = await stripe.customers.create({ 
        email,
        metadata: {
          userId: userId || '',
          jobId: jobId || '',
          city: city || '',
          source: 'fixlo-setup-intent'
        }
      });
      if (process.env.NODE_ENV !== 'production') {
        console.log(`✅ Customer created: ${customer.id}`);
      }
    }

    // Create Setup Intent
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      metadata: {
        userId: userId || '',
        jobId: jobId || '',
        city: city || '',
        source: 'fixlo-setup-intent',
        timestamp: new Date().toISOString()
      }
    });

    // Audit log
    console.log(`✅ Setup intent created: ${setupIntent.id} for customer ${customer.id}`);
    
    res.status(200).json({ 
      clientSecret: setupIntent.client_secret,
      customerId: customer.id
    });

  } catch (error) {
    console.error('❌ Error creating setup intent:', error.message);
    
    // Enhanced error handling for 401 and authentication issues
    if (error.statusCode === 401) {
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Invalid Stripe API key. Ensure you are using the correct mode key.',
        details: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create setup intent',
      message: error.message 
    });
  }
});

// Create checkout session for subscription with 30-day free trial
router.post('/create-checkout-session', async (req, res) => {
  try {
    console.log('🔔 Stripe checkout session requested');
    
    // Get email, userId, tier, and optional customerId from request body
    const { email, userId, customerId, tier, useEarlyAccessPrice } = req.body;
    
    // Validate tier if provided
    if (tier && !['PRO', 'AI_PLUS'].includes(tier)) {
      return res.status(400).json({
        error: 'Invalid tier',
        message: 'Tier must be either "PRO" or "AI_PLUS"'
      });
    }
    
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
    
    // Determine subscription tier and price ID
    // tier can be: 'PRO' (default, $59.99 or $179.99) or 'AI_PLUS' ($99)
    const subscriptionTier = tier === 'AI_PLUS' ? 'AI_PLUS' : 'PRO';
    
    // Get price ID based on tier and early access availability
    let priceId;
    if (subscriptionTier === 'AI_PLUS') {
      priceId = process.env.STRIPE_AI_PLUS_PRICE_ID;
      if (!priceId) {
        console.error('❌ STRIPE_AI_PLUS_PRICE_ID not configured');
        return res.status(500).json({
          error: 'AI+ tier not configured',
          message: 'AI+ subscription is not available at this time. Please contact support.'
        });
      }
    } else {
      // For PRO tier, check if early access is available and requested
      if (useEarlyAccessPrice) {
        // Check early access availability
        const spotsInstance = await EarlyAccessSpots.getInstance();
        
        if (spotsInstance.isEarlyAccessAvailable()) {
          // Use early access price ($59.99)
          priceId = process.env.STRIPE_EARLY_ACCESS_PRICE_ID || process.env.STRIPE_PRICE_ID || 'prod_SaAyX0rd1VWGE0';
          console.log(`🎫 Using early access price: ${priceId} (${spotsInstance.spotsRemaining} spots remaining)`);
        } else {
          // Early access full, use standard price
          priceId = process.env.STRIPE_STANDARD_PRICE_ID;
          if (!priceId) {
            console.error('❌ STRIPE_STANDARD_PRICE_ID not configured');
            return res.status(500).json({
              error: 'Standard pricing not configured',
              message: 'Please contact support for pricing information.'
            });
          }
          console.log(`💰 Using standard price: ${priceId} (early access full)`);
        }
      } else {
        // Use standard price ($179.99)
        priceId = process.env.STRIPE_STANDARD_PRICE_ID;
        if (!priceId) {
          // Fallback to old price ID if standard not configured
          priceId = process.env.STRIPE_PRICE_ID || 'prod_SaAyX0rd1VWGE0';
          console.warn('⚠️ STRIPE_STANDARD_PRICE_ID not configured, using fallback');
        }
        console.log(`💰 Using standard price: ${priceId}`);
      }
    }
    
    console.log(`💰 Creating checkout session for tier: ${subscriptionTier} with price ID: ${priceId}`);
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

    // Create Stripe checkout session (NO FREE TRIAL - PAID SUBSCRIPTION STARTS IMMEDIATELY)
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
        metadata: {
          userId: userId || '',
          service: 'fixlo-pro-subscription',
          tier: subscriptionTier,
          timestamp: new Date().toISOString()
        }
      },
      metadata: {
        userId: userId || '',
        customerId: customerIdToUse,
        service: 'fixlo-pro-subscription',
        tier: subscriptionTier,
        timestamp: new Date().toISOString()
      },
      success_url: `${clientUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/cancel`,
    });

    console.log(`✅ Checkout session created: ${session.id}`);
    console.log(`💳 Paid subscription starts immediately (no trial)`);
    
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

    // Enforce webhook signature verification in production
    if (!endpointSecret && process.env.NODE_ENV === 'production') {
      console.error('❌ STRIPE_WEBHOOK_SECRET required in production');
      return res.status(500).send('Webhook secret not configured');
    }

    if (endpointSecret) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        console.log('✅ Webhook signature verified');
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
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log(`✅ PaymentIntent succeeded: ${paymentIntent.id}`);
        console.log(`👤 Customer: ${paymentIntent.customer}, Amount: $${(paymentIntent.amount / 100).toFixed(2)}`);
        
        // Audit log
        console.log(`📝 Audit: PaymentIntent ${paymentIntent.id} | Customer: ${paymentIntent.customer} | Amount: ${paymentIntent.amount} | Status: succeeded | Time: ${new Date().toISOString()}`);
        
        // Update job status if jobId in metadata
        const jobId = paymentIntent.metadata?.jobId;
        if (jobId) {
          try {
            const job = await JobRequest.findById(jobId);
            if (job) {
              job.stripePaymentIntentId = paymentIntent.id;
              job.paidAt = new Date();
              job.status = 'completed';
              await job.save();
              console.log(`✅ Job ${jobId} marked as completed and paid`);
            } else {
              console.warn(`⚠️ No job found with ID: ${jobId}`);
            }
          } catch (err) {
            console.error(`❌ Failed to update job ${jobId}:`, err.message);
          }
        }
        break;
      }
      
      case 'payment_intent.failed': {
        const paymentIntent = event.data.object;
        console.log(`❌ PaymentIntent failed: ${paymentIntent.id}`);
        console.log(`👤 Customer: ${paymentIntent.customer}, Reason: ${paymentIntent.last_payment_error?.message || 'Unknown'}`);
        
        // Audit log
        console.log(`📝 Audit: PaymentIntent ${paymentIntent.id} | Customer: ${paymentIntent.customer} | Status: failed | Reason: ${paymentIntent.last_payment_error?.message || 'Unknown'} | Time: ${new Date().toISOString()}`);
        
        // TODO: Notify customer and admin of payment failure
        break;
      }
      
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log(`✅ Checkout session completed: ${session.id}`);
        console.log(`👤 Customer: ${session.customer}, Subscription: ${session.subscription}`);
        
        // Audit log
        console.log(`📝 Audit: Session ${session.id} | Customer: ${session.customer} | Subscription: ${session.subscription} | Time: ${new Date().toISOString()}`);
        
        // Retrieve subscription to access product metadata
        let subscriptionTier = null;
        if (session.subscription) {
          try {
            const subscription = await stripe.subscriptions.retrieve(session.subscription, {
              expand: ['items.data.price.product']
            });
            
            // Check product metadata for tier information
            const product = subscription.items.data[0]?.price?.product;
            if (product && typeof product === 'object' && product.metadata) {
              subscriptionTier = product.metadata.tier;
              console.log(`📦 Product tier from metadata: ${subscriptionTier}`);
            }
          } catch (err) {
            console.error('❌ Failed to retrieve subscription product metadata:', err.message);
          }
        }
        
        // Determine Pro identity from session
        const userId = session.metadata?.userId;
        const sessionPhone = session.customer_details?.phone || session.metadata?.phone || null;
        
        try {
          let pro = null;
          
          if (userId) {
            // Find by userId from metadata
            pro = await Pro.findById(userId);
          } else if (sessionPhone) {
            // Find by phone number
            pro = await Pro.findOne({ phone: sessionPhone });
          }
          
          if (!pro && sessionPhone) {
            // Create temporary Pro record for subscription-first onboarding
            pro = new Pro({
              phone: sessionPhone,
              subscriptionActive: true,
              accountCreated: false
            });
            console.log(`🆕 Created temporary Pro record for phone ${sessionPhone}`);
          }
          
          if (!pro) {
            console.warn('⚠️ No userId or phone in session — cannot associate subscription with a Pro');
          } else {
            const updateData = {
              stripeCustomerId: session.customer,
              stripeSessionId: session.id,
              isActive: true
            };
            
            // Handle AI_HOME tier (Homeowner AI subscription)
            let isAiHomeSubscription = false;
            if (subscriptionTier === 'AI_HOME') {
              isAiHomeSubscription = true;
              updateData.aiSubscriptionId = session.subscription;
              updateData.aiSubscriptionStatus = 'active';
              updateData.aiSubscriptionStartDate = new Date();
              updateData.aiHomeAccess = true;
              console.log(`🏠 Setting AI Home Expert access for user ${pro._id}`);
            } else {
              // Handle PRO and AI_PLUS tiers (Professional subscriptions)
              updateData.stripeSubscriptionId = session.subscription;
              updateData.paymentStatus = session.subscription ? 'active' : 'pending';
              updateData.subscriptionActive = true;
              updateData.subscriptionStartDate = new Date();
              
              // Set subscription tier based on metadata or session metadata fallback
              const tierToUse = subscriptionTier || session.metadata?.tier;
              if (tierToUse === 'AI_PLUS') {
                updateData.subscriptionTier = 'ai_plus';
                console.log(`🌟 Setting AI+ tier for pro ${pro._id}`);
              } else {
                updateData.subscriptionTier = 'pro';
                console.log(`⭐ Setting PRO tier for pro ${pro._id}`);
              }
              
              // If there's a trial, set the subscription end date
              if (session.subscription) {
                try {
                  const sub = await stripe.subscriptions.retrieve(session.subscription);
                  if (sub.trial_end) {
                    updateData.subscriptionEndDate = new Date(sub.trial_end * 1000);
                    console.log(`🎁 Trial ends: ${new Date(sub.trial_end * 1000).toISOString()}`);
                  }
                } catch (subErr) {
                  console.error('❌ Failed to retrieve subscription trial info:', subErr.message);
                }
              }
            }
            
            // Apply updates to pro document
            Object.assign(pro, updateData);
            
            // Generate secure one-time account setup token (for non-AI_HOME PRO subscriptions)
            let setupToken = null;
            if (!isAiHomeSubscription && !pro.accountCreated) {
              setupToken = crypto.randomBytes(32).toString('hex');
              pro.accountSetupTokenHash = crypto.createHash('sha256').update(setupToken).digest('hex');
              pro.accountSetupExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            }
            
            await pro.save();
            console.log(`✅ Pro ${pro._id} updated with subscription details`);
            
            // Send Welcome SMS asynchronously (non-blocking)
            if (setupToken && sessionPhone) {
              const baseUrl = process.env.CLIENT_URL || 'https://fixloapp.com';
              const setupLink = `${baseUrl}/pro/setup-account/${setupToken}`;
              const smsBody = `🎉 Welcome to Fixlo Pro!\n\nYour subscription is now active.\n\nCreate your account here:\n${setupLink}\n\nThis link expires in 24 hours.\n\nLet's start getting you leads 🚀`;
              
              // Fire-and-forget: do not await, do not throw
              sendSms(sessionPhone, smsBody).catch((smsErr) => {
                console.error('❌ Failed to send Pro welcome SMS:', smsErr.message);
              });
            }
            
            // Check if this is an early access subscription ($59.99) and decrement spots
            // Only for PRO tier (not AI_PLUS or other tiers)
            if (session.subscription && subscriptionTier === 'PRO') {
              try {
                const subscription = await stripe.subscriptions.retrieve(session.subscription, {
                  expand: ['items.data.price']
                });
                
                const priceAmount = subscription.items.data[0]?.price?.unit_amount;
                const priceId = subscription.items.data[0]?.price?.id;
                
                // Check if this is the early access price ($59.99 = 5999 cents)
                // Also check for the early access price ID from environment
                const earlyAccessPriceId = process.env.STRIPE_EARLY_ACCESS_PRICE_ID;
                const isEarlyAccessPrice = (priceAmount === 5999) || (earlyAccessPriceId && priceId === earlyAccessPriceId);
                
                if (isEarlyAccessPrice) {
                  console.log(`🎫 New early access subscription detected, decrementing spots...`);
                  const spotsInstance = await EarlyAccessSpots.getInstance();
                  await spotsInstance.decrementSpots('subscription_created', {
                    subscriptionId: session.subscription,
                    userId: pro._id,
                    priceId: priceId,
                    amount: priceAmount
                  });
                  console.log(`✅ Early access spots decremented. ${spotsInstance.spotsRemaining} spots remaining.`);
                }
              } catch (spotErr) {
                console.error('❌ Failed to decrement early access spots:', spotErr.message);
                // Don't fail the webhook if spot decrement fails
              }
            }
            
            // Check if this pro was referred and complete the referral (PRO/AI_PLUS only)
            if (pro.referredByCode && session.subscription && subscriptionTier !== 'AI_HOME') {
              console.log(`🎁 Checking referral completion for pro ${pro._id}`);
              try {
                const apiUrl = process.env.API_URL || 'http://localhost:3001';
                
                // Get country from session metadata or default to US
                const country = session.metadata?.country || 'US';
                
                // Trigger referral completion
                await axios.post(`${apiUrl}/api/referrals/complete`, {
                  referralCode: pro.referredByCode,
                  referredUserId: pro._id,
                  referredSubscriptionId: session.subscription,
                  country: country
                });
                
                console.log(`✅ Referral completion triggered for code ${pro.referredByCode}`);
              } catch (referralErr) {
                console.error('❌ Failed to complete referral:', referralErr.message);
                // Don't fail the webhook if referral completion fails
              }
            }
          }
        } catch (err) {
          console.error(`❌ Failed to process checkout.session.completed:`, err.message);
        }
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log(`✅ Invoice payment succeeded: ${invoice.id}`);
        console.log(`👤 Customer: ${invoice.customer}, Subscription: ${invoice.subscription}`);
        
        // Audit log
        console.log(`📝 Audit: Invoice ${invoice.id} | Customer: ${invoice.customer} | Subscription: ${invoice.subscription} | Amount: ${invoice.amount_paid} | Time: ${new Date().toISOString()}`);
        
        // Retrieve subscription to access product metadata
        let subscriptionTier = null;
        if (invoice.subscription) {
          try {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription, {
              expand: ['items.data.price.product']
            });
            
            // Check product metadata for tier information
            const product = subscription.items.data[0]?.price?.product;
            if (product && typeof product === 'object' && product.metadata) {
              subscriptionTier = product.metadata.tier;
              console.log(`📦 Product tier from metadata: ${subscriptionTier}`);
            }
          } catch (err) {
            console.error('❌ Failed to retrieve subscription product metadata:', err.message);
          }
        }
        
        // Update Pro record payment status
        try {
          const pro = await Pro.findOne({ stripeCustomerId: invoice.customer });
          if (pro) {
            // Handle AI_HOME tier (Homeowner AI subscription)
            if (subscriptionTier === 'AI_HOME') {
              if (invoice.subscription) {
                const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
                pro.aiSubscriptionId = invoice.subscription;
                pro.aiSubscriptionStatus = 'active';
                pro.aiSubscriptionStartDate = new Date(subscription.current_period_start * 1000);
                pro.aiSubscriptionEndDate = new Date(subscription.current_period_end * 1000);
                pro.aiHomeAccess = true;
                console.log(`🏠 AI Home Expert subscription active for user ${pro._id}`);
              }
            } else {
              // Handle PRO and AI_PLUS tiers (Professional subscriptions)
              pro.paymentStatus = 'active';
              pro.isActive = true;
              
              // Update subscription dates
              if (invoice.subscription) {
                const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
                pro.subscriptionStartDate = new Date(subscription.current_period_start * 1000);
                pro.subscriptionEndDate = new Date(subscription.current_period_end * 1000);
                
                // Update subscription tier from product metadata or subscription metadata fallback
                const tierToUse = subscriptionTier || subscription.metadata?.tier;
                if (tierToUse === 'AI_PLUS') {
                  pro.subscriptionTier = 'ai_plus';
                  console.log(`🌟 Maintaining AI+ tier for pro ${pro._id}`);
                } else if (tierToUse === 'PRO') {
                  pro.subscriptionTier = 'pro';
                  console.log(`⭐ Maintaining PRO tier for pro ${pro._id}`);
                } else {
                  // Default to PRO tier for paid subscriptions without metadata
                  pro.subscriptionTier = 'pro';
                  console.log(`⭐ Maintaining PRO tier (default) for pro ${pro._id}`);
                }
              }
            }
            
            await pro.save();
            console.log(`✅ Pro ${pro._id} payment status updated to active`);
            
            // Check if this is a referred user completing their first PAID invoice (PRO/AI_PLUS only)
            // Only process if this is NOT a $0 invoice (i.e., after trial period)
            if (pro.referredByCode && invoice.amount_paid > 0 && subscriptionTier !== 'AI_HOME') {
              console.log(`🎁 Referred user ${pro._id} completed first paid invoice`);
              console.log(`   Amount paid: $${(invoice.amount_paid / 100).toFixed(2)}`);
              console.log(`   Referred by code: ${pro.referredByCode}`);
              
              try {
                // Find the referrer who should receive the reward
                const referrer = await Pro.findOne({ 
                  referralCode: pro.referredByCode.toUpperCase() 
                });
                
                if (referrer && referrer.stripeCustomerId) {
                  console.log(`👤 Found referrer: ${referrer.name} (${referrer._id})`);
                  console.log(`   Referrer Stripe Customer: ${referrer.stripeCustomerId}`);
                  
                  // Check if referrer already has a pending reward (prevent stacking)
                  const hasPendingReward = await hasExistingReward(referrer.stripeCustomerId);
                  if (hasPendingReward) {
                    console.log(`⚠️ Referrer already has pending reward - skipping to prevent stacking`);
                  } else {
                    // Check if reward was already issued for this specific referral
                    const existingReferral = await Referral.findOne({
                      referralCode: pro.referredByCode.toUpperCase(),
                      referredUserId: pro._id,
                      rewardStatus: 'issued'
                    });
                    
                    if (existingReferral) {
                      console.log(`⚠️ Reward already issued for this referral - skipping`);
                    } else {
                      // Apply the referral reward to the referrer
                      console.log(`🚀 Applying referral reward to referrer...`);
                      const rewardResult = await applyReferralFreeMonth({
                        stripeCustomerId: referrer.stripeCustomerId,
                        referralCode: pro.referredByCode,
                        referredUserId: pro._id.toString()
                      });
                      
                      if (rewardResult.success) {
                        console.log(`✅ Referral reward applied successfully!`);
                        console.log(`   Promo Code: ${rewardResult.promoCode}`);
                        console.log(`   Coupon ID: ${rewardResult.couponId}`);
                        
                        // Update or create the referral record with reward details
                        await Referral.findOneAndUpdate(
                          {
                            referralCode: pro.referredByCode.toUpperCase(),
                            referredUserId: pro._id
                          },
                          {
                            $set: {
                              referrerId: referrer._id,
                              referredSubscriptionId: invoice.subscription,
                              subscriptionStatus: 'completed',
                              rewardStatus: 'issued',
                              promoCode: rewardResult.promoCode,
                              stripeCouponId: rewardResult.couponId,
                              stripePromoCodeId: rewardResult.promoCodeId,
                              rewardIssuedAt: new Date(),
                              subscribedAt: new Date(),
                              referredUserPhone: pro.phone,
                              referredUserEmail: pro.email,
                              metadata: {
                                firstPaidInvoiceId: invoice.id,
                                firstPaidAmount: invoice.amount_paid,
                                rewardAppliedVia: 'webhook_invoice_payment_succeeded'
                              }
                            }
                          },
                          { upsert: true, new: true }
                        );
                        
                        // Update referrer stats
                        await Pro.findByIdAndUpdate(referrer._id, {
                          $inc: {
                            completedReferrals: 1,
                            freeMonthsEarned: 1
                          }
                        });
                        
                        console.log(`📊 Referrer stats updated`);
                      } else {
                        console.error(`❌ Failed to apply referral reward: ${rewardResult.error}`);
                        
                        // Update referral record with failure
                        await Referral.findOneAndUpdate(
                          {
                            referralCode: pro.referredByCode.toUpperCase(),
                            referredUserId: pro._id
                          },
                          {
                            $set: {
                              rewardStatus: 'failed',
                              metadata: {
                                errorMessage: rewardResult.error,
                                failedAt: new Date().toISOString()
                              }
                            }
                          },
                          { upsert: true }
                        );
                      }
                    }
                  }
                } else if (referrer) {
                  console.warn(`⚠️ Referrer found but no Stripe customer ID - cannot apply reward`);
                } else {
                  console.warn(`⚠️ No referrer found with code: ${pro.referredByCode}`);
                }
              } catch (referralErr) {
                console.error('❌ Error processing referral reward:', referralErr.message);
                // Don't fail the webhook if referral processing fails
              }
            }
            
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
        
        // Audit log
        console.log(`📝 Audit: Invoice ${invoice.id} | Customer: ${invoice.customer} | Status: failed | Time: ${new Date().toISOString()}`);
        
        // Retrieve subscription to access product metadata
        let subscriptionTier = null;
        if (invoice.subscription) {
          try {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription, {
              expand: ['items.data.price.product']
            });
            
            // Check product metadata for tier information
            const product = subscription.items.data[0]?.price?.product;
            if (product && typeof product === 'object' && product.metadata) {
              subscriptionTier = product.metadata.tier;
              console.log(`📦 Product tier from metadata: ${subscriptionTier}`);
            }
          } catch (err) {
            console.error('❌ Failed to retrieve subscription product metadata:', err.message);
          }
        }
        
        // Update Pro record and notify
        try {
          const pro = await Pro.findOne({ stripeCustomerId: invoice.customer });
          if (pro) {
            // Handle AI_HOME tier failure
            if (subscriptionTier === 'AI_HOME') {
              pro.aiSubscriptionStatus = 'cancelled';
              pro.aiHomeAccess = false;
              console.log(`⚠️ AI Home Expert subscription deactivated for user ${pro._id}`);
            } else {
              // Handle PRO and AI_PLUS tier failure
              pro.paymentStatus = 'failed';
              pro.isActive = false;
            }
            
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
        
        // Retrieve subscription to access product metadata
        let subscriptionTier = null;
        try {
          const expandedSub = await stripe.subscriptions.retrieve(subscription.id, {
            expand: ['items.data.price.product']
          });
          
          // Check product metadata for tier information
          const product = expandedSub.items.data[0]?.price?.product;
          if (product && typeof product === 'object' && product.metadata) {
            subscriptionTier = product.metadata.tier;
            console.log(`📦 Product tier from metadata: ${subscriptionTier}`);
          }
        } catch (err) {
          console.error('❌ Failed to retrieve subscription product metadata:', err.message);
        }
        
        // Update Pro record
        try {
          const pro = await Pro.findOne({ stripeCustomerId: subscription.customer });
          if (pro) {
            // Handle AI_HOME tier cancellation
            if (subscriptionTier === 'AI_HOME') {
              pro.aiSubscriptionStatus = 'cancelled';
              pro.aiHomeAccess = false;
              console.log(`✅ AI Home Expert subscription cancelled for user ${pro._id}`);
            } else {
              // Handle PRO and AI_PLUS tier cancellation
              pro.paymentStatus = 'cancelled';
              pro.isActive = false;
              pro.subscriptionActive = false;
            }
            
            await pro.save();
            console.log(`✅ Pro ${pro._id} subscription cancelled`);
          }
        } catch (err) {
          console.error('❌ Failed to update cancelled subscription:', err.message);
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log(`🔄 Subscription updated: ${subscription.id}`);
        console.log(`👤 Customer: ${subscription.customer}, Status: ${subscription.status}`);
        
        // Retrieve subscription to access product metadata
        let subscriptionTier = null;
        try {
          const expandedSub = await stripe.subscriptions.retrieve(subscription.id, {
            expand: ['items.data.price.product']
          });
          
          // Check product metadata for tier information
          const product = expandedSub.items.data[0]?.price?.product;
          if (product && typeof product === 'object' && product.metadata) {
            subscriptionTier = product.metadata.tier;
            console.log(`📦 Product tier from metadata: ${subscriptionTier}`);
          }
        } catch (err) {
          console.error('❌ Failed to retrieve subscription product metadata:', err.message);
        }
        
        // Update Pro record based on subscription status
        try {
          const pro = await Pro.findOne({ stripeCustomerId: subscription.customer });
          if (pro) {
            // Handle AI_HOME tier updates
            if (subscriptionTier === 'AI_HOME') {
              if (subscription.status === 'active') {
                pro.aiSubscriptionId = subscription.id;
                pro.aiSubscriptionStatus = 'active';
                pro.aiSubscriptionStartDate = new Date(subscription.current_period_start * 1000);
                pro.aiSubscriptionEndDate = new Date(subscription.current_period_end * 1000);
                pro.aiHomeAccess = true;
                console.log(`✅ AI Home Expert subscription updated to active for user ${pro._id}`);
              } else if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
                pro.aiSubscriptionStatus = 'cancelled';
                pro.aiHomeAccess = false;
                console.log(`✅ AI Home Expert subscription cancelled for user ${pro._id}`);
              } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
                pro.aiSubscriptionStatus = 'pending';
                pro.aiHomeAccess = false;
                console.log(`⚠️ AI Home Expert subscription payment issue for user ${pro._id}`);
              }
            } else {
              // Handle PRO and AI_PLUS tier updates
              if (subscription.status === 'active') {
                pro.paymentStatus = 'active';
                pro.isActive = true;
                pro.subscriptionStartDate = new Date(subscription.current_period_start * 1000);
                pro.subscriptionEndDate = new Date(subscription.current_period_end * 1000);
                console.log(`✅ Pro subscription updated to active for user ${pro._id}`);
              } else if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
                pro.paymentStatus = 'cancelled';
                pro.isActive = false;
                console.log(`✅ Pro subscription cancelled for user ${pro._id}`);
              } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
                pro.paymentStatus = 'failed';
                pro.isActive = false;
                console.log(`⚠️ Pro subscription payment issue for user ${pro._id}`);
              }
            }
            
            await pro.save();
            console.log(`✅ Pro ${pro._id} subscription status updated`);
          } else {
            console.warn(`⚠️ No Pro found with customer ID: ${subscription.customer}`);
          }
        } catch (err) {
          console.error('❌ Failed to update subscription status:', err.message);
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
