const express = require('express');
const router = express.Router();
const axios = require('axios');
const Pro = require('../models/Pro');

// Apple Receipt Verification URLs
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';
const APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';

/**
 * Verify Apple IAP receipt with Apple servers
 */
async function verifyAppleReceipt(receiptData, isProduction = false) {
  const url = isProduction ? APPLE_PRODUCTION_URL : APPLE_SANDBOX_URL;
  
  try {
    console.log(`[IAP] Verifying receipt with Apple (${isProduction ? 'Production' : 'Sandbox'})...`);
    
    const response = await axios.post(url, {
      'receipt-data': receiptData,
      'password': process.env.APPLE_SHARED_SECRET || '', // Optional: App-specific shared secret
      'exclude-old-transactions': true,
    });
    
    const { status, receipt, latest_receipt_info } = response.data;
    
    console.log('[IAP] Apple verification status:', status);
    
    // Status codes:
    // 0 = Valid receipt
    // 21007 = Sandbox receipt sent to production (retry with sandbox)
    // 21008 = Production receipt sent to sandbox (retry with production)
    
    if (status === 21007 && isProduction) {
      // Retry with sandbox
      console.log('[IAP] Retrying with sandbox URL...');
      return verifyAppleReceipt(receiptData, false);
    } else if (status === 21008 && !isProduction) {
      // Retry with production
      console.log('[IAP] Retrying with production URL...');
      return verifyAppleReceipt(receiptData, true);
    } else if (status === 0) {
      // Valid receipt
      console.log('[IAP] ✅ Receipt is valid');
      return {
        isValid: true,
        receipt: receipt || {},
        latestReceiptInfo: latest_receipt_info || [],
        rawResponse: response.data,
      };
    } else {
      // Invalid receipt or other error
      console.error('[IAP] ❌ Receipt verification failed. Status:', status);
      return {
        isValid: false,
        status,
        message: getAppleStatusMessage(status),
      };
    }
  } catch (error) {
    console.error('[IAP] ❌ Error verifying receipt with Apple:', error.message);
    throw error;
  }
}

/**
 * Get human-readable message for Apple status codes
 */
function getAppleStatusMessage(status) {
  const messages = {
    21000: 'The App Store could not read the JSON object you provided.',
    21002: 'The data in the receipt-data property was malformed or missing.',
    21003: 'The receipt could not be authenticated.',
    21004: 'The shared secret you provided does not match the shared secret on file.',
    21005: 'The receipt server is not currently available.',
    21006: 'This receipt is valid but the subscription has expired.',
    21007: 'This receipt is from the test environment.',
    21008: 'This receipt is from the production environment.',
    21009: 'Internal data access error.',
    21010: 'The user account cannot be found or has been deleted.',
  };
  
  return messages[status] || `Unknown error (status ${status})`;
}

/**
 * Extract subscription data from Apple receipt
 */
function extractSubscriptionData(latestReceiptInfo) {
  if (!latestReceiptInfo || latestReceiptInfo.length === 0) {
    return null;
  }
  
  // Get the most recent transaction
  const latestTransaction = latestReceiptInfo[latestReceiptInfo.length - 1];
  
  return {
    productId: latestTransaction.product_id,
    transactionId: latestTransaction.transaction_id,
    originalTransactionId: latestTransaction.original_transaction_id,
    purchaseDate: new Date(parseInt(latestTransaction.purchase_date_ms)),
    expiresDate: new Date(parseInt(latestTransaction.expires_date_ms)),
    isTrialPeriod: latestTransaction.is_trial_period === 'true',
    isInIntroOfferPeriod: latestTransaction.is_in_intro_offer_period === 'true',
    cancellationDate: latestTransaction.cancellation_date_ms 
      ? new Date(parseInt(latestTransaction.cancellation_date_ms))
      : null,
  };
}

/**
 * Determine subscription status
 */
function getSubscriptionStatus(subscriptionData) {
  if (!subscriptionData) {
    return 'inactive';
  }
  
  const now = new Date();
  const expiresDate = subscriptionData.expiresDate;
  
  if (subscriptionData.cancellationDate) {
    return 'refunded';
  } else if (expiresDate > now) {
    return 'active';
  } else {
    // Check if within grace period (7 days)
    const gracePeriodEnd = new Date(expiresDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (now < gracePeriodEnd) {
      return 'grace_period';
    } else {
      return 'expired';
    }
  }
}

/**
 * POST /api/iap/verify
 * Verify Apple IAP receipt and update user subscription status
 */
router.post('/verify', async (req, res) => {
  try {
    const { userId, userEmail, productId, transactionId, receiptData, platform } = req.body;
    
    console.log('[IAP] Receipt verification request received');
    console.log('[IAP] User ID:', userId);
    console.log('[IAP] User Email:', userEmail);
    console.log('[IAP] Product ID:', productId);
    console.log('[IAP] Transaction ID:', transactionId);
    console.log('[IAP] Platform:', platform);
    
    // Validate required fields
    if (!receiptData || !productId || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: receiptData, productId, or transactionId',
      });
    }
    
    // Verify receipt with Apple
    const verificationResult = await verifyAppleReceipt(receiptData, true);
    
    if (!verificationResult.isValid) {
      return res.status(400).json({
        success: false,
        isValid: false,
        message: verificationResult.message || 'Receipt verification failed',
      });
    }
    
    // Extract subscription data
    const subscriptionData = extractSubscriptionData(verificationResult.latestReceiptInfo);
    
    if (!subscriptionData) {
      return res.status(400).json({
        success: false,
        isValid: false,
        message: 'No subscription data found in receipt',
      });
    }
    
    // Determine subscription status
    const subscriptionStatus = getSubscriptionStatus(subscriptionData);
    
    console.log('[IAP] Subscription status:', subscriptionStatus);
    console.log('[IAP] Expires:', subscriptionData.expiresDate);
    
    // Update or create Pro user record
    let pro;
    
    if (userId) {
      // Update existing user
      pro = await Pro.findById(userId);
      
      if (pro) {
        console.log('[IAP] Updating existing Pro user:', userId);
      }
    }
    
    if (!pro && userEmail) {
      // Find by email
      pro = await Pro.findOne({ email: userEmail });
      
      if (pro) {
        console.log('[IAP] Found Pro user by email:', userEmail);
      }
    }
    
    if (!pro) {
      // Get pending signup data (from ProSignupScreen)
      console.log('[IAP] No existing Pro found, checking for pending signup...');
      
      // For now, return success but indicate user needs to complete signup
      return res.json({
        success: true,
        isValid: true,
        subscriptionData,
        subscriptionStatus,
        message: 'Receipt verified. Please complete your profile setup.',
        pendingSetup: true,
      });
    }
    
    // Update Pro subscription fields
    pro.subscription = {
      status: subscriptionStatus,
      productId: subscriptionData.productId,
      transactionId: subscriptionData.transactionId,
      originalTransactionId: subscriptionData.originalTransactionId,
      purchaseDate: subscriptionData.purchaseDate,
      expiresDate: subscriptionData.expiresDate,
      isTrialPeriod: subscriptionData.isTrialPeriod,
      platform: 'ios',
      lastVerified: new Date(),
    };
    
    // Mark as subscribed if active
    if (subscriptionStatus === 'active' || subscriptionStatus === 'grace_period') {
      pro.isSubscribed = true;
      pro.subscriptionTier = 'pro';
    } else {
      pro.isSubscribed = false;
      pro.subscriptionTier = 'free';
    }
    
    await pro.save();
    
    console.log('[IAP] ✅ Pro subscription updated successfully');
    
    res.json({
      success: true,
      isValid: true,
      subscriptionData,
      subscriptionStatus,
      message: 'Subscription verified and activated',
      pro: {
        id: pro._id,
        email: pro.email,
        name: pro.name,
        isSubscribed: pro.isSubscribed,
        subscriptionTier: pro.subscriptionTier,
      },
    });
  } catch (error) {
    console.error('[IAP] ❌ Error verifying receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during receipt verification',
      error: error.message,
    });
  }
});

/**
 * GET /api/iap/status/:userId
 * Get current subscription status for a user
 */
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('[IAP] Status check for user:', userId);
    
    const pro = await Pro.findById(userId);
    
    if (!pro) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    const subscription = pro.subscription || {};
    const isSubscribed = pro.isSubscribed || false;
    const expiresDate = subscription.expiresDate;
    
    // Check if subscription is still valid
    if (isSubscribed && expiresDate) {
      const now = new Date();
      if (expiresDate < now) {
        // Subscription expired
        pro.isSubscribed = false;
        pro.subscriptionTier = 'free';
        subscription.status = 'expired';
        await pro.save();
        
        console.log('[IAP] Subscription expired for user:', userId);
      }
    }
    
    res.json({
      success: true,
      isSubscribed: pro.isSubscribed,
      subscriptionTier: pro.subscriptionTier || 'free',
      productId: subscription.productId,
      status: subscription.status,
      expiresDate: subscription.expiresDate,
      purchaseDate: subscription.purchaseDate,
      platform: subscription.platform,
    });
  } catch (error) {
    console.error('[IAP] ❌ Error checking subscription status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking subscription status',
      error: error.message,
    });
  }
});

/**
 * POST /api/iap/webhook
 * Handle Apple Server-to-Server notifications
 * This endpoint receives automatic updates from Apple about subscription changes
 */
router.post('/webhook', async (req, res) => {
  try {
    console.log('[IAP Webhook] Received notification from Apple');
    console.log('[IAP Webhook] Body:', JSON.stringify(req.body, null, 2));
    
    const { notification_type, unified_receipt } = req.body;
    
    if (!unified_receipt || !unified_receipt.latest_receipt_info) {
      return res.status(400).json({ message: 'Invalid webhook payload' });
    }
    
    const latestReceiptInfo = unified_receipt.latest_receipt_info;
    const subscriptionData = extractSubscriptionData(latestReceiptInfo);
    
    if (!subscriptionData) {
      return res.status(400).json({ message: 'No subscription data in webhook' });
    }
    
    // Find Pro by original transaction ID
    const pro = await Pro.findOne({
      'subscription.originalTransactionId': subscriptionData.originalTransactionId,
    });
    
    if (!pro) {
      console.log('[IAP Webhook] No Pro found for transaction:', subscriptionData.originalTransactionId);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('[IAP Webhook] Processing notification type:', notification_type);
    
    // Update subscription based on notification type
    switch (notification_type) {
      case 'INITIAL_BUY':
      case 'DID_RENEW':
        pro.subscription.status = 'active';
        pro.subscription.expiresDate = subscriptionData.expiresDate;
        pro.isSubscribed = true;
        break;
        
      case 'DID_FAIL_TO_RENEW':
        pro.subscription.status = 'grace_period';
        break;
        
      case 'DID_CHANGE_RENEWAL_STATUS':
        // User turned off auto-renew or turned it back on
        break;
        
      case 'CANCEL':
      case 'REFUND':
        pro.subscription.status = 'refunded';
        pro.subscription.cancellationDate = new Date();
        pro.isSubscribed = false;
        pro.subscriptionTier = 'free';
        break;
        
      case 'EXPIRED':
        pro.subscription.status = 'expired';
        pro.isSubscribed = false;
        pro.subscriptionTier = 'free';
        break;
    }
    
    pro.subscription.lastVerified = new Date();
    await pro.save();
    
    console.log('[IAP Webhook] ✅ Subscription updated for user:', pro._id);
    
    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('[IAP Webhook] ❌ Error processing webhook:', error);
    res.status(500).json({ message: 'Webhook processing failed', error: error.message });
  }
});

module.exports = router;
