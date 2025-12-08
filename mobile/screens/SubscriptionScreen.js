import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { useIAP } from '../context/IAPContext';
import { PRODUCT_IDS } from '../utils/iapService';

export default function SubscriptionScreen({ navigation }) {
  const {
    products,
    isSubscribed,
    subscriptionStatus,
    loading,
    verifying,
    purchaseProduct,
    restorePurchases,
    getProduct,
  } = useIAP();

  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Get Pro Monthly product
  const proProduct = getProduct(PRODUCT_IDS.PRO_MONTHLY);

  /**
   * Handle purchase button press
   */
  const handlePurchase = async () => {
    try {
      setPurchasing(true);
      
      console.log('[SubscriptionScreen] Starting purchase flow...');
      const result = await purchaseProduct(PRODUCT_IDS.PRO_MONTHLY);
      
      if (result.success) {
        Alert.alert(
          '🎉 Welcome to Fixlo Pro!',
          'Your subscription has been activated. You now have access to unlimited job leads and all Pro features.',
          [
            {
              text: 'Get Started',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Purchase Failed', result.error || 'Unable to complete purchase. Please try again.');
      }
      
      setPurchasing(false);
    } catch (error) {
      console.error('[SubscriptionScreen] Purchase error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      setPurchasing(false);
    }
  };

  /**
   * Handle restore purchases button press
   */
  const handleRestore = async () => {
    try {
      setRestoring(true);
      
      console.log('[SubscriptionScreen] Restoring purchases...');
      const result = await restorePurchases();
      
      if (result.success) {
        Alert.alert(
          '✅ Subscription Restored',
          result.message,
          [
            {
              text: 'Continue',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('No Purchases Found', result.message);
      }
      
      setRestoring(false);
    } catch (error) {
      console.error('[SubscriptionScreen] Restore error:', error);
      Alert.alert('Error', 'Unable to restore purchases. Please try again.');
      setRestoring(false);
    }
  };

  /**
   * Open Apple subscription management
   */
  const handleManageSubscription = () => {
    Linking.openURL('https://apps.apple.com/account/subscriptions');
  };

  /**
   * Open privacy policy
   */
  const handlePrivacyPolicy = () => {
    Linking.openURL('https://fixloapp.com/privacy-policy.html');
  };

  /**
   * Open terms of service
   */
  const handleTerms = () => {
    Linking.openURL('https://fixloapp.com/terms.html');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading subscription info...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Fixlo Pro</Text>
        <Text style={styles.subtitle}>Grow Your Business</Text>
      </View>

      {/* Subscription Status */}
      {isSubscribed ? (
        <View style={styles.subscribedBanner}>
          <Text style={styles.subscribedIcon}>✅</Text>
          <Text style={styles.subscribedText}>You're a Fixlo Pro!</Text>
          <Text style={styles.subscribedSubtext}>
            {subscriptionStatus?.expiresDate
              ? `Active until ${new Date(subscriptionStatus.expiresDate).toLocaleDateString()}`
              : 'Your subscription is active'}
          </Text>
        </View>
      ) : (
        <View style={styles.unsubscribedBanner}>
          <Text style={styles.unsubscribedIcon}>🔒</Text>
          <Text style={styles.unsubscribedText}>Not Subscribed</Text>
          <Text style={styles.unsubscribedSubtext}>Subscribe to unlock all Pro features</Text>
        </View>
      )}

      {/* Features List */}
      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>What's Included:</Text>
        
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>📋</Text>
          <Text style={styles.featureText}>Unlimited Job Leads</Text>
        </View>
        
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>📞</Text>
          <Text style={styles.featureText}>Direct Client Contact</Text>
        </View>
        
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>🔔</Text>
          <Text style={styles.featureText}>Instant SMS Notifications</Text>
        </View>
        
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>⭐</Text>
          <Text style={styles.featureText}>Professional Profile</Text>
        </View>
        
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>💬</Text>
          <Text style={styles.featureText}>In-App Messaging</Text>
        </View>
        
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>📊</Text>
          <Text style={styles.featureText}>Job Analytics</Text>
        </View>
      </View>

      {/* Pricing */}
      {proProduct && !isSubscribed && (
        <View style={styles.pricingContainer}>
          <Text style={styles.priceLabel}>Monthly Subscription</Text>
          <Text style={styles.price}>{proProduct.priceString}/month</Text>
          <Text style={styles.priceSubtext}>
            Billed monthly • Cancel anytime
          </Text>
        </View>
      )}

      {/* Subscribe Button */}
      {!isSubscribed && (
        <TouchableOpacity
          style={[styles.subscribeButton, (purchasing || verifying) && styles.disabledButton]}
          onPress={handlePurchase}
          disabled={purchasing || verifying || !proProduct}
        >
          {purchasing || verifying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.subscribeButtonText}>
                {proProduct ? 'Subscribe Now' : 'Loading...'}
              </Text>
              {proProduct && (
                <Text style={styles.subscribeButtonSubtext}>
                  {proProduct.priceString}/month
                </Text>
              )}
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Restore Purchases Button */}
      <TouchableOpacity
        style={styles.restoreButton}
        onPress={handleRestore}
        disabled={restoring || verifying}
      >
        {restoring ? (
          <ActivityIndicator color="#007AFF" />
        ) : (
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        )}
      </TouchableOpacity>

      {/* Manage Subscription (for subscribed users) */}
      {isSubscribed && (
        <TouchableOpacity
          style={styles.manageButton}
          onPress={handleManageSubscription}
        >
          <Text style={styles.manageButtonText}>Manage Subscription</Text>
        </TouchableOpacity>
      )}

      {/* Legal Links */}
      <View style={styles.legalContainer}>
        <Text style={styles.legalText}>
          By subscribing, you agree to our{' '}
          <Text style={styles.legalLink} onPress={handleTerms}>
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text style={styles.legalLink} onPress={handlePrivacyPolicy}>
            Privacy Policy
          </Text>
          .
        </Text>
        
        <Text style={styles.legalText}>
          Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
          Your account will be charged for renewal within 24 hours prior to the end of the current period.
        </Text>
      </View>

      {/* Debug Info (only in development) */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Info:</Text>
          <Text style={styles.debugText}>Product ID: {PRODUCT_IDS.PRO_MONTHLY}</Text>
          <Text style={styles.debugText}>Products loaded: {products.length}</Text>
          <Text style={styles.debugText}>
            Is Subscribed: {isSubscribed ? 'Yes' : 'No'}
          </Text>
          {subscriptionStatus && (
            <>
              <Text style={styles.debugText}>Status: {subscriptionStatus.status}</Text>
              <Text style={styles.debugText}>
                Transaction ID: {subscriptionStatus.transactionId}
              </Text>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  subscribedBanner: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  subscribedIcon: {
    fontSize: 50,
    marginBottom: 10,
  },
  subscribedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 5,
  },
  subscribedSubtext: {
    fontSize: 14,
    color: '#558B2F',
  },
  unsubscribedBanner: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  unsubscribedIcon: {
    fontSize: 50,
    marginBottom: 10,
  },
  unsubscribedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 5,
  },
  unsubscribedSubtext: {
    fontSize: 14,
    color: '#F57C00',
  },
  featuresContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
    width: 30,
  },
  featureText: {
    fontSize: 16,
    color: '#555',
    flex: 1,
  },
  pricingContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  priceSubtext: {
    fontSize: 14,
    color: '#999',
  },
  subscribeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subscribeButtonSubtext: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
    opacity: 0.9,
  },
  restoreButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  restoreButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  manageButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#666',
  },
  manageButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  legalContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  legalText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 10,
  },
  legalLink: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  debugContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});
