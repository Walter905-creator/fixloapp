import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IAPService, { PRODUCT_IDS } from '../utils/iapService';

const IAPContext = createContext();

/**
 * IAP Context Provider
 * Manages global subscription state across the app
 */
export function IAPProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  // Get API URL from environment or use fallback
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://fixloapp.onrender.com';

  /**
   * Initialize IAP service and fetch products
   */
  useEffect(() => {
    initializeIAP();
    
    // Setup purchase listener
    IAPService.setPurchaseListener(handlePurchaseUpdate);
    
    // Cleanup on unmount
    return () => {
      IAPService.removePurchaseListener();
    };
  }, []);

  /**
   * Initialize IAP and load products
   */
  const initializeIAP = async () => {
    try {
      console.log('[IAPContext] Initializing IAP...');
      setLoading(true);
      
      // Initialize connection to App Store
      await IAPService.initialize();
      
      // Fetch available products
      const fetchedProducts = await IAPService.fetchProducts();
      setProducts(fetchedProducts);
      
      // Check cached subscription status
      const cachedStatus = await IAPService.getCachedSubscriptionStatus();
      if (cachedStatus) {
        setIsSubscribed(cachedStatus.isSubscribed);
        setSubscriptionStatus(cachedStatus);
        console.log('[IAPContext] ✅ Loaded cached subscription status');
      }
      
      // Optionally restore purchases to check current status
      await checkSubscriptionStatus();
      
      setLoading(false);
    } catch (error) {
      console.error('[IAPContext] ❌ Failed to initialize IAP:', error);
      setLoading(false);
    }
  };

  /**
   * Handle purchase updates from IAP service
   */
  const handlePurchaseUpdate = async (result) => {
    console.log('[IAPContext] Purchase update received:', result);
    
    if (result.success) {
      const { purchase, transactionReceipt, transactionId, productId } = result;
      
      // Verify purchase with backend
      await verifyPurchaseWithBackend({
        productId,
        transactionId,
        transactionReceipt,
      });
      
      // Finish the transaction
      await IAPService.finishTransaction(purchase);
    } else {
      console.log('[IAPContext] Purchase failed or cancelled:', result.error);
    }
  };

  /**
   * Verify purchase receipt with backend
   */
  const verifyPurchaseWithBackend = async ({ productId, transactionId, transactionReceipt }) => {
    try {
      console.log('[IAPContext] Verifying purchase with backend...');
      setVerifying(true);
      
      // Get user ID from storage
      const userId = await AsyncStorage.getItem('userId');
      const userEmail = await AsyncStorage.getItem('userEmail');
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Send receipt to backend for Apple verification
      const response = await axios.post(
        `${API_URL}/api/iap/verify`,
        {
          userId,
          userEmail,
          productId,
          transactionId,
          receiptData: transactionReceipt,
          platform: 'ios',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('[IAPContext] ✅ Backend verification successful:', response.data);
      
      // Update subscription status
      const { isValid, subscriptionData } = response.data;
      
      if (isValid) {
        const newStatus = {
          isSubscribed: true,
          productId,
          transactionId,
          expiresDate: subscriptionData?.expiresDate,
          purchaseDate: subscriptionData?.purchaseDate,
          status: 'active',
        };
        
        setIsSubscribed(true);
        setSubscriptionStatus(newStatus);
        
        // Cache the status
        await IAPService.cacheSubscriptionStatus(newStatus);
        
        console.log('[IAPContext] ✅ Subscription activated');
      } else {
        console.error('[IAPContext] ❌ Receipt verification failed');
        throw new Error('Receipt verification failed');
      }
      
      setVerifying(false);
      return response.data;
    } catch (error) {
      console.error('[IAPContext] ❌ Backend verification failed:', error);
      setVerifying(false);
      throw error;
    }
  };

  /**
   * Purchase a product
   */
  const purchaseProduct = async (productId) => {
    try {
      console.log(`[IAPContext] Initiating purchase for: ${productId}`);
      
      // Initiate the purchase (opens native iOS payment sheet)
      await IAPService.purchaseProduct(productId);
      
      // The handlePurchaseUpdate callback will handle the rest
      return { success: true };
    } catch (error) {
      console.error('[IAPContext] ❌ Purchase failed:', error);
      console.error('[IAPContext] Error message:', error.message);
      
      let errorMessage = 'Purchase failed. Please try again.';
      
      if (error.message === 'CANCELLED') {
        errorMessage = 'Purchase was cancelled.';
      } else if (error.message === 'ALREADY_OWNED') {
        errorMessage = 'You already own this subscription. Try restoring purchases.';
      } else if (error.message === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message === 'INITIALIZATION_FAILED') {
        errorMessage = 'Unable to connect to App Store. Please try again later.';
      } else if (error.message === 'PRODUCT_NOT_FOUND') {
        errorMessage = 'Subscription product not available. Please contact support.';
      } else if (error.message === 'PURCHASES_DISABLED') {
        errorMessage = 'In-app purchases are disabled on this device. Please check your device settings.';
      } else if (error.message === 'NOT_AVAILABLE') {
        errorMessage = 'In-app purchases are not available. Please try again later.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Restore previous purchases
   */
  const restorePurchases = async () => {
    try {
      console.log('[IAPContext] Restoring purchases...');
      setLoading(true);
      
      const purchases = await IAPService.restorePurchases();
      
      if (purchases.length === 0) {
        console.log('[IAPContext] No previous purchases found');
        setLoading(false);
        return { success: false, message: 'No previous purchases found.' };
      }
      
      // Find Pro subscription purchase
      const proSubscription = purchases.find(p => p.productId === PRODUCT_IDS.PRO_MONTHLY);
      
      if (proSubscription) {
        console.log('[IAPContext] Found Pro subscription, verifying...');
        
        // Verify with backend
        await verifyPurchaseWithBackend({
          productId: proSubscription.productId,
          transactionId: proSubscription.transactionId,
          transactionReceipt: proSubscription.transactionReceipt,
        });
        
        setLoading(false);
        return { success: true, message: 'Subscription restored successfully!' };
      } else {
        console.log('[IAPContext] No Pro subscription found in purchase history');
        setLoading(false);
        return { success: false, message: 'No active Pro subscription found.' };
      }
    } catch (error) {
      console.error('[IAPContext] ❌ Failed to restore purchases:', error);
      setLoading(false);
      return { success: false, message: 'Failed to restore purchases. Please try again.' };
    }
  };

  /**
   * Check current subscription status
   */
  const checkSubscriptionStatus = async () => {
    try {
      console.log('[IAPContext] Checking subscription status...');
      
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        console.log('[IAPContext] User not logged in, skipping status check');
        return;
      }
      
      // Query backend for current subscription status
      const response = await axios.get(`${API_URL}/api/iap/status/${userId}`);
      
      if (response.data.isSubscribed) {
        const status = {
          isSubscribed: true,
          productId: response.data.productId,
          expiresDate: response.data.expiresDate,
          status: response.data.status,
        };
        
        setIsSubscribed(true);
        setSubscriptionStatus(status);
        await IAPService.cacheSubscriptionStatus(status);
        
        console.log('[IAPContext] ✅ Active subscription found');
      } else {
        setIsSubscribed(false);
        setSubscriptionStatus(null);
        await IAPService.clearSubscriptionCache();
        
        console.log('[IAPContext] No active subscription');
      }
    } catch (error) {
      console.error('[IAPContext] ❌ Failed to check subscription status:', error);
    }
  };

  /**
   * Get specific product info
   */
  const getProduct = (productId) => {
    return products.find(p => p.productId === productId);
  };

  /**
   * Refresh subscription status
   */
  const refreshSubscriptionStatus = async () => {
    await checkSubscriptionStatus();
  };

  const value = {
    products,
    isSubscribed,
    subscriptionStatus,
    loading,
    verifying,
    purchaseProduct,
    restorePurchases,
    getProduct,
    refreshSubscriptionStatus,
    checkSubscriptionStatus,
  };

  return <IAPContext.Provider value={value}>{children}</IAPContext.Provider>;
}

/**
 * Hook to use IAP context
 */
export function useIAP() {
  const context = useContext(IAPContext);
  if (!context) {
    throw new Error('useIAP must be used within an IAPProvider');
  }
  return context;
}
