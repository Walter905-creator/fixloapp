// server/services/referralPromoCode.js
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

/**
 * COMPLIANCE: Creates a Stripe coupon and promo code for referral rewards
 * 
 * CRITICAL RULES:
 * - 100% off for 1 month only
 * - Applies ONLY to Fixlo Pro Membership
 * - Promo code is NOT auto-applied
 * - One promo code per successful referral
 * - Promo applies to NEXT billing cycle only
 */

/**
 * Create a Stripe coupon for referral reward (100% off for 1 month)
 * @param {string} referralId - Unique referral ID for naming/tracking
 * @returns {Promise<object>} - Stripe coupon object
 */
async function createReferralCoupon(referralId) {
  try {
    const coupon = await stripe.coupons.create({
      duration: 'repeating',
      duration_in_months: 1,
      percent_off: 100,
      name: `Referral Reward - ${referralId}`,
      metadata: {
        type: 'referral_reward',
        referralId: referralId,
        created_by: 'fixlo_referral_system'
      },
      // Ensure coupon can only be used once
      max_redemptions: 1
    });
    
    console.log(`✅ Created referral coupon: ${coupon.id}`);
    return coupon;
  } catch (error) {
    console.error('❌ Error creating referral coupon:', error.message);
    throw error;
  }
}

/**
 * Create a Stripe promo code linked to a coupon
 * @param {string} couponId - Stripe coupon ID
 * @param {string} customCode - Custom promo code string (optional)
 * @returns {Promise<object>} - Stripe promo code object
 */
async function createPromoCode(couponId, customCode = null) {
  try {
    const promoCodeData = {
      coupon: couponId,
      metadata: {
        type: 'referral_reward',
        created_by: 'fixlo_referral_system'
      }
    };
    
    // If custom code provided, use it (must be unique)
    if (customCode) {
      promoCodeData.code = customCode;
    }
    
    const promoCode = await stripe.promotionCodes.create(promoCodeData);
    
    console.log(`✅ Created promo code: ${promoCode.code}`);
    return promoCode;
  } catch (error) {
    console.error('❌ Error creating promo code:', error.message);
    throw error;
  }
}

/**
 * Generate a complete referral reward (coupon + promo code)
 * @param {string} referralId - Unique referral ID
 * @param {string} referrerId - ID of the pro who made the referral
 * @returns {Promise<object>} - Object containing coupon and promo code
 */
async function generateReferralReward(referralId, referrerId) {
  try {
    // Create the coupon first
    const coupon = await createReferralCoupon(referralId);
    
    // Generate custom promo code format: FIXLO-REF-XXXXXX
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const customCode = `FIXLO-REF-${randomPart}`;
    
    // Create promo code linked to coupon
    const promoCode = await createPromoCode(coupon.id, customCode);
    
    console.log(`🎁 Generated referral reward for referrer ${referrerId}`);
    console.log(`   Coupon ID: ${coupon.id}`);
    console.log(`   Promo Code: ${promoCode.code}`);
    
    return {
      couponId: coupon.id,
      promoCode: promoCode.code,
      promoCodeId: promoCode.id,
      couponDetails: coupon,
      promoCodeDetails: promoCode
    };
  } catch (error) {
    console.error('❌ Error generating referral reward:', error.message);
    throw error;
  }
}

/**
 * Check if a promo code exists and is valid
 * @param {string} code - Promo code to check
 * @returns {Promise<object|null>} - Promo code details or null
 */
async function validatePromoCode(code) {
  try {
    const promoCodes = await stripe.promotionCodes.list({
      code: code,
      limit: 1
    });
    
    if (promoCodes.data.length === 0) {
      return null;
    }
    
    const promoCode = promoCodes.data[0];
    
    // Check if promo code is active and not expired
    if (!promoCode.active) {
      return { valid: false, reason: 'Promo code is inactive' };
    }
    
    // Get coupon details
    const coupon = await stripe.coupons.retrieve(promoCode.coupon);
    
    // Check if coupon is valid
    if (!coupon.valid) {
      return { valid: false, reason: 'Coupon is no longer valid' };
    }
    
    // Check redemption limits
    if (coupon.max_redemptions && promoCode.times_redeemed >= coupon.max_redemptions) {
      return { valid: false, reason: 'Promo code has been fully redeemed' };
    }
    
    return {
      valid: true,
      promoCode: promoCode,
      coupon: coupon
    };
  } catch (error) {
    console.error('❌ Error validating promo code:', error.message);
    return { valid: false, reason: error.message };
  }
}

module.exports = {
  createReferralCoupon,
  createPromoCode,
  generateReferralReward,
  validatePromoCode
};
