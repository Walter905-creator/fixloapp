const express = require('express');
const router = express.Router();
const axios = require('axios');
const Pro = require('../models/Pro');
const JobRequest = require('../models/JobRequest');
const Referral = require('../models/Referral');
const { applyReferralFreeMonth, hasExistingReward } = require('../services/applyReferralFreeMonth');

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
    const { email, userId, customerId, tier } = req.body;
    
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
    // tier can be: 'PRO' (default, $59.99) or 'AI_PLUS' ($99)
    const subscriptionTier = tier === 'AI_PLUS' ? 'AI_PLUS' : 'PRO';
    
    // Get price ID based on tier
    let priceId;
    if (subscriptionTier === 'AI_PLUS') {
      priceId = process.env.STRIPE_AI_PLUS_PRICE_ID || 'price_ai_plus_monthly';
    } else {
      priceId = process.env.STRIPE_PRICE_ID || 'prod_SaAyX0rd1VWGE0';
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
            
            // Set subscription tier based on metadata
            // tier metadata: 'AI_PLUS' or 'PRO' (default)
            if (session.metadata?.tier === 'AI_PLUS') {
              updateData.subscriptionTier = 'ai_plus';
              console.log(`🌟 Setting AI+ tier for pro ${userId}`);
            } else {
              updateData.subscriptionTier = 'pro';
              console.log(`⭐ Setting PRO tier for pro ${userId}`);
            }
            
            // If there's a trial, set the subscription end date
            if (session.subscription) {
              const subscription = await stripe.subscriptions.retrieve(session.subscription);
              if (subscription.trial_end) {
                updateData.subscriptionEndDate = new Date(subscription.trial_end * 1000);
                console.log(`🎁 Trial ends: ${new Date(subscription.trial_end * 1000).toISOString()}`);
              }
            }
            
            const pro = await Pro.findByIdAndUpdate(userId, updateData, { new: true });
            console.log(`✅ Pro ${userId} updated with subscription details`);
            
            // Check if this pro was referred and complete the referral
            if (pro && pro.referredByCode && session.subscription) {
              console.log(`🎁 Checking referral completion for pro ${userId}`);
              try {
                const apiUrl = process.env.API_URL || 'http://localhost:3001';
                
                // Get country from session metadata or default to US
                const country = session.metadata?.country || 'US';
                
                // Trigger referral completion
                await axios.post(`${apiUrl}/api/referrals/complete`, {
                  referralCode: pro.referredByCode,
                  referredUserId: userId,
                  referredSubscriptionId: session.subscription,
                  country: country
                });
                
                console.log(`✅ Referral completion triggered for code ${pro.referredByCode}`);
              } catch (referralErr) {
                console.error('❌ Failed to complete referral:', referralErr.message);
                // Don't fail the webhook if referral completion fails
              }
            }
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
        
        // Audit log
        console.log(`📝 Audit: Invoice ${invoice.id} | Customer: ${invoice.customer} | Subscription: ${invoice.subscription} | Amount: ${invoice.amount_paid} | Time: ${new Date().toISOString()}`);
        
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
              
              // Update subscription tier from metadata if available
              if (subscription.metadata?.tier === 'AI_PLUS') {
                pro.subscriptionTier = 'ai_plus';
                console.log(`🌟 Maintaining AI+ tier for pro ${pro._id}`);
              } else if (subscription.metadata?.tier === 'PRO') {
                pro.subscriptionTier = 'pro';
                console.log(`⭐ Maintaining PRO tier for pro ${pro._id}`);
              }
            }
            
            await pro.save();
            console.log(`✅ Pro ${pro._id} payment status updated to active`);
            
            // Check if this is a referred user completing their first PAID invoice
            // Only process if this is NOT a $0 invoice (i.e., after trial period)
            if (pro.referredByCode && invoice.amount_paid > 0) {
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
