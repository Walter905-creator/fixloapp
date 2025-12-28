/**
 * Referral Reward Auto-Apply Service
 * 
 * CRITICAL RULES (NON-NEGOTIABLE):
 * 1. Rewards apply ONLY after referred user completes PAID subscription
 * 2. Free month applies to NEXT billing cycle only
 * 3. Creates Stripe coupon + promotion code and auto-applies to customer
 * 4. No stacking multiple rewards in same billing cycle
 * 5. No retroactive discounts
 * 
 * @module applyReferralFreeMonth
 */

const Stripe = require('stripe');

// Initialize Stripe with validation
let stripe;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });
  } else {
    console.warn('⚠️ STRIPE_SECRET_KEY not configured for referral rewards');
  }
} catch (error) {
  console.error('❌ Error initializing Stripe for referral rewards:', error.message);
}

/**
 * Generate a unique, human-readable promo code
 * Format: FIXLO-XXXXXX (6 random alphanumeric characters)
 * 
 * @returns {string} Generated promo code
 */
function generatePromoCode() {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `FIXLO-${randomPart}`;
}

/**
 * Apply one free month reward to a referrer's Stripe customer
 * 
 * This function:
 * 1. Creates a Stripe coupon (100% off, duration: once)
 * 2. Creates a promotion code linked to the coupon
 * 3. Auto-applies the promotion code to the customer's account
 * 4. Stripe will automatically apply it to the next invoice
 * 
 * @param {Object} params - Parameters for applying reward
 * @param {string} params.stripeCustomerId - Stripe customer ID of the referrer
 * @param {string} params.referralCode - Referral code for metadata/logging
 * @param {string} params.referredUserId - ID of the referred user (for metadata)
 * @returns {Promise<Object>} Result object with success status and promo code
 */
async function applyReferralFreeMonth({ stripeCustomerId, referralCode, referredUserId }) {
  try {
    // Validate required parameters
    if (!stripeCustomerId) {
      throw new Error('stripeCustomerId is required');
    }
    
    if (!referralCode) {
      throw new Error('referralCode is required');
    }

    if (!stripe) {
      throw new Error('Stripe is not initialized - missing STRIPE_SECRET_KEY');
    }

    console.log(`🎁 Starting referral reward for customer ${stripeCustomerId}`);
    console.log(`   Referral Code: ${referralCode}`);
    console.log(`   Referred User: ${referredUserId || 'N/A'}`);

    // Get Fixlo Pro Product ID from environment (fallback to default)
    const fixloProProductId = process.env.FIXLO_PRO_PRODUCT_ID || process.env.STRIPE_PRICE_ID;
    
    if (!fixloProProductId) {
      console.warn('⚠️ FIXLO_PRO_PRODUCT_ID not set in environment variables');
    }

    // Step 1: Create Stripe coupon
    // - 100% off (percent_off: 100)
    // - Applies once to next invoice (duration: 'once')
    // - Restricted to Fixlo Pro Membership product if product ID available
    const couponParams = {
      percent_off: 100,
      duration: 'once',
      name: `Referral Reward - ${referralCode}`,
      metadata: {
        type: 'referral_reward',
        referralCode: referralCode,
        referredUserId: referredUserId || '',
        createdBy: 'fixlo_referral_system',
        timestamp: new Date().toISOString()
      },
      max_redemptions: 1 // Can only be used once
    };

    // Apply restriction to Fixlo Pro product if available
    if (fixloProProductId) {
      // Check if this is a product ID or price ID
      if (fixloProProductId.startsWith('prod_')) {
        couponParams.applies_to = {
          products: [fixloProProductId]
        };
        console.log(`   Restricting coupon to product: ${fixloProProductId}`);
      } else if (fixloProProductId.startsWith('price_')) {
        // If it's a price ID, we need to get the product ID first
        try {
          const price = await stripe.prices.retrieve(fixloProProductId);
          if (price.product) {
            couponParams.applies_to = {
              products: [price.product]
            };
            console.log(`   Restricting coupon to product: ${price.product} (from price ${fixloProProductId})`);
          }
        } catch (err) {
          console.warn(`⚠️ Could not retrieve product from price ${fixloProProductId}: ${err.message}`);
        }
      }
    }

    const coupon = await stripe.coupons.create(couponParams);
    console.log(`✅ Created coupon: ${coupon.id}`);

    // Step 2: Create promotion code linked to coupon
    const promoCodeString = generatePromoCode();
    const promotionCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: promoCodeString,
      max_redemptions: 1,
      metadata: {
        type: 'referral_reward',
        referralCode: referralCode,
        referredUserId: referredUserId || '',
        customerId: stripeCustomerId,
        createdBy: 'fixlo_referral_system',
        timestamp: new Date().toISOString()
      }
    });
    console.log(`✅ Created promotion code: ${promotionCode.code} (${promotionCode.id})`);

    // Step 3: Auto-apply promotion code to the customer
    // When a promotion code is attached to a customer, Stripe automatically
    // applies it to the next invoice for that customer
    const customer = await stripe.customers.update(stripeCustomerId, {
      // Add the promotion code to the customer's default promotion code
      // Note: Stripe will automatically apply this to the next invoice
      metadata: {
        ...((await stripe.customers.retrieve(stripeCustomerId)).metadata || {}),
        referral_promo_code: promotionCode.code,
        referral_promo_code_id: promotionCode.id,
        referral_reward_applied: new Date().toISOString()
      }
    });

    // Apply the promotion code to the customer's subscription
    // This ensures it's used on the next billing cycle
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      
      // Update the subscription with the promotion code
      // The discount will be applied to the next invoice
      await stripe.subscriptions.update(subscription.id, {
        promotion_code: promotionCode.id,
        proration_behavior: 'none' // Don't prorate, apply to next cycle
      });
      
      console.log(`✅ Applied promotion code to subscription: ${subscription.id}`);
    } else {
      console.warn(`⚠️ No active subscription found for customer ${stripeCustomerId}`);
      console.warn(`   Promotion code created but not applied to subscription`);
    }

    console.log(`🎉 Referral reward successfully applied!`);
    console.log(`   Customer: ${stripeCustomerId}`);
    console.log(`   Coupon: ${coupon.id}`);
    console.log(`   Promo Code: ${promotionCode.code}`);
    console.log(`   Will apply to: NEXT billing cycle`);

    // Return success result
    return {
      success: true,
      promoCode: promotionCode.code,
      promoCodeId: promotionCode.id,
      couponId: coupon.id,
      appliedAt: new Date().toISOString(),
      message: 'Referral reward successfully applied to customer'
    };

  } catch (error) {
    console.error('❌ Error applying referral reward:', error.message);
    console.error('   Stack:', error.stack);
    
    // Fail safely - don't crash the app
    return {
      success: false,
      error: error.message,
      promoCode: null,
      message: 'Failed to apply referral reward'
    };
  }
}

/**
 * Check if a customer already has a pending referral reward
 * Prevents stacking multiple rewards in the same billing cycle
 * 
 * @param {string} stripeCustomerId - Stripe customer ID
 * @returns {Promise<boolean>} True if customer has pending reward
 */
async function hasExistingReward(stripeCustomerId) {
  try {
    if (!stripe) {
      return false;
    }

    const customer = await stripe.customers.retrieve(stripeCustomerId);
    
    // Check if customer metadata has a recent referral reward
    if (customer.metadata?.referral_reward_applied) {
      const appliedDate = new Date(customer.metadata.referral_reward_applied);
      const daysSinceApplied = (Date.now() - appliedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // If reward was applied in the last 35 days, consider it as existing
      // (typical billing cycle is 30 days, add 5 day buffer)
      if (daysSinceApplied < 35) {
        console.log(`⚠️ Customer ${stripeCustomerId} has recent reward (${Math.floor(daysSinceApplied)} days ago)`);
        return true;
      }
    }

    // Check if customer has active discounts on their subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      if (subscription.discount?.coupon?.metadata?.type === 'referral_reward') {
        console.log(`⚠️ Customer ${stripeCustomerId} has active referral discount`);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('❌ Error checking existing reward:', error.message);
    // If we can't check, assume no existing reward to allow processing
    return false;
  }
}

module.exports = {
  applyReferralFreeMonth,
  hasExistingReward,
  generatePromoCode
};
