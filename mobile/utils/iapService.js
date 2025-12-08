import * as InAppPurchases from 'expo-in-app-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Product ID matching App Store Connect configuration
export const PRODUCT_IDS = {
  PRO_MONTHLY: 'com.fixloapp.mobile.pro.monthly', // Must match EXACTLY in App Store Connect
};

// IAP Service for managing Apple In-App Purchases
class IAPService {
  constructor() {
    this.isInitialized = false;
    this.products = [];
    this.purchaseListener = null;
  }

  /**
   * Initialize IAP connection
   */
  async initialize() {
    try {
      console.log('[IAP] Initializing In-App Purchase service...');
      
      // Connect to App Store
      await InAppPurchases.connectAsync();
      this.isInitialized = true;
      
      console.log('[IAP] ✅ Successfully connected to App Store');
      return true;
    } catch (error) {
      console.error('[IAP] ❌ Failed to initialize IAP:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Fetch product information from App Store
   */
  async fetchProducts() {
    try {
      console.log('[IAP] Fetching product information...');
      
      if (!this.isInitialized) {
        await this.initialize();
      }

      const productIds = Object.values(PRODUCT_IDS);
      const { results, responseCode } = await InAppPurchases.getProductsAsync(productIds);

      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        this.products = results;
        console.log('[IAP] ✅ Products fetched successfully:', results.length);
        
        results.forEach(product => {
          console.log(`[IAP] Product: ${product.productId}`);
          console.log(`[IAP] Price: ${product.priceString}`);
          console.log(`[IAP] Title: ${product.title}`);
        });
        
        return results;
      } else {
        console.error('[IAP] ❌ Failed to fetch products. Response code:', responseCode);
        return [];
      }
    } catch (error) {
      console.error('[IAP] ❌ Error fetching products:', error);
      return [];
    }
  }

  /**
   * Get specific product by ID
   */
  getProduct(productId) {
    return this.products.find(p => p.productId === productId);
  }

  /**
   * Purchase a product (initiate native iOS purchase sheet)
   */
  async purchaseProduct(productId) {
    try {
      console.log(`[IAP] Initiating purchase for: ${productId}`);
      
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Start the purchase flow (opens native iOS payment sheet)
      await InAppPurchases.purchaseItemAsync(productId);
      
      console.log('[IAP] ✅ Purchase initiated successfully');
      return true;
    } catch (error) {
      console.error('[IAP] ❌ Purchase failed:', error);
      
      if (error.code === 'E_USER_CANCELLED') {
        console.log('[IAP] User cancelled the purchase');
        throw new Error('CANCELLED');
      } else if (error.code === 'E_ALREADY_OWNED') {
        console.log('[IAP] User already owns this product');
        throw new Error('ALREADY_OWNED');
      } else if (error.code === 'E_NETWORK_ERROR') {
        console.log('[IAP] Network error during purchase');
        throw new Error('NETWORK_ERROR');
      } else {
        throw new Error('PURCHASE_FAILED');
      }
    }
  }

  /**
   * Set up purchase update listener
   * This is called when a purchase completes (successful or failed)
   */
  setPurchaseListener(callback) {
    console.log('[IAP] Setting up purchase update listener...');
    
    this.purchaseListener = InAppPurchases.setPurchaseListener(({ responseCode, results, errorCode }) => {
      console.log('[IAP] Purchase update received');
      console.log('[IAP] Response code:', responseCode);
      console.log('[IAP] Error code:', errorCode);
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        console.log('[IAP] ✅ Purchase completed successfully');
        
        results.forEach((purchase) => {
          console.log('[IAP] Purchase details:');
          console.log('[IAP] - Product ID:', purchase.productId);
          console.log('[IAP] - Transaction ID:', purchase.transactionId);
          console.log('[IAP] - Purchase Time:', purchase.purchaseTime);
          console.log('[IAP] - Acknowledged:', purchase.acknowledged);
          
          // Call the callback with purchase details
          callback({
            success: true,
            purchase,
            productId: purchase.productId,
            transactionId: purchase.transactionId,
            transactionReceipt: purchase.transactionReceipt,
          });
        });
      } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
        console.log('[IAP] ⚠️ User cancelled the purchase');
        callback({ success: false, error: 'USER_CANCELLED' });
      } else if (responseCode === InAppPurchases.IAPResponseCode.ERROR) {
        console.error('[IAP] ❌ Purchase error:', errorCode);
        callback({ success: false, error: 'PURCHASE_ERROR', errorCode });
      } else {
        console.log('[IAP] ⚠️ Purchase deferred or pending');
        callback({ success: false, error: 'DEFERRED' });
      }
    });
  }

  /**
   * Remove purchase listener
   */
  removePurchaseListener() {
    if (this.purchaseListener) {
      this.purchaseListener.remove();
      this.purchaseListener = null;
      console.log('[IAP] Purchase listener removed');
    }
  }

  /**
   * Finish/acknowledge a transaction (required after successful purchase)
   */
  async finishTransaction(purchase) {
    try {
      console.log(`[IAP] Finishing transaction: ${purchase.transactionId}`);
      await InAppPurchases.finishTransactionAsync(purchase, true);
      console.log('[IAP] ✅ Transaction finished successfully');
    } catch (error) {
      console.error('[IAP] ❌ Failed to finish transaction:', error);
    }
  }

  /**
   * Restore previous purchases
   * This is required by Apple for subscription apps
   */
  async restorePurchases() {
    try {
      console.log('[IAP] Restoring previous purchases...');
      
      if (!this.isInitialized) {
        await this.initialize();
      }

      const { results, responseCode } = await InAppPurchases.getPurchaseHistoryAsync();

      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        console.log(`[IAP] ✅ Found ${results.length} previous purchase(s)`);
        
        results.forEach(purchase => {
          console.log('[IAP] Restored purchase:');
          console.log('[IAP] - Product ID:', purchase.productId);
          console.log('[IAP] - Transaction ID:', purchase.transactionId);
          console.log('[IAP] - Purchase Time:', purchase.purchaseTime);
        });
        
        return results;
      } else {
        console.error('[IAP] ❌ Failed to restore purchases. Response code:', responseCode);
        return [];
      }
    } catch (error) {
      console.error('[IAP] ❌ Error restoring purchases:', error);
      return [];
    }
  }

  /**
   * Get current purchase history
   */
  async getPurchaseHistory() {
    try {
      console.log('[IAP] Fetching purchase history...');
      
      if (!this.isInitialized) {
        await this.initialize();
      }

      const { results } = await InAppPurchases.getPurchaseHistoryAsync();
      return results || [];
    } catch (error) {
      console.error('[IAP] ❌ Error fetching purchase history:', error);
      return [];
    }
  }

  /**
   * Cache subscription status locally
   */
  async cacheSubscriptionStatus(status) {
    try {
      await AsyncStorage.setItem('subscription_status', JSON.stringify(status));
      console.log('[IAP] ✅ Subscription status cached:', status);
    } catch (error) {
      console.error('[IAP] ❌ Failed to cache subscription status:', error);
    }
  }

  /**
   * Get cached subscription status
   */
  async getCachedSubscriptionStatus() {
    try {
      const status = await AsyncStorage.getItem('subscription_status');
      return status ? JSON.parse(status) : null;
    } catch (error) {
      console.error('[IAP] ❌ Failed to get cached subscription status:', error);
      return null;
    }
  }

  /**
   * Clear cached subscription status
   */
  async clearSubscriptionCache() {
    try {
      await AsyncStorage.removeItem('subscription_status');
      console.log('[IAP] ✅ Subscription cache cleared');
    } catch (error) {
      console.error('[IAP] ❌ Failed to clear subscription cache:', error);
    }
  }

  /**
   * Disconnect from IAP service
   */
  async disconnect() {
    try {
      if (this.isInitialized) {
        this.removePurchaseListener();
        await InAppPurchases.disconnectAsync();
        this.isInitialized = false;
        console.log('[IAP] ✅ Disconnected from IAP service');
      }
    } catch (error) {
      console.error('[IAP] ❌ Error disconnecting from IAP:', error);
    }
  }
}

// Export singleton instance
export default new IAPService();
