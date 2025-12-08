import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useIAP } from '../context/IAPContext';
import { PRODUCT_IDS } from '../utils/iapService';

export default function SubscriptionScreen({ navigation }) {
  const { purchaseProduct, getProduct, verifying, restorePurchases } = useIAP();
  const proProduct = getProduct(PRODUCT_IDS.PRO_MONTHLY);

  const handleSubscribe = async () => {
    try {
      const result = await purchaseProduct(PRODUCT_IDS.PRO_MONTHLY);
      
      if (result.success) {
        Alert.alert(
          '🎉 Success!',
          'Your Fixlo Pro subscription is now active!',
          [
            {
              text: 'Go to Dashboard',
              onPress: () => navigation.replace('Pro')
            }
          ]
        );
      } else {
        Alert.alert('Purchase Failed', result.error || 'Unable to complete purchase. Please try again.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
      Alert.alert('Success', 'Purchases restored successfully!');
    } catch (error) {
      Alert.alert('Restore Failed', 'Unable to restore purchases. Please contact support if you believe you have an active subscription.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Fixlo Pro</Text>
          <Text style={styles.subtitle}>Unlimited job leads for your business</Text>
        </View>

        <View style={styles.pricingCard}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>POPULAR</Text>
          </View>
          
          <Text style={styles.planName}>Pro Monthly</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.currency}>$</Text>
            <Text style={styles.price}>{proProduct?.price || '29.99'}</Text>
            <Text style={styles.period}>/mo</Text>
          </View>
          
          <Text style={styles.billingNote}>Cancel anytime • No commitments</Text>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>What's Included:</Text>
          
          {[
            'Unlimited job leads in your area',
            'Direct messaging with homeowners',
            'Profile highlighting in search',
            'Background check verification badge',
            'Customer reviews and ratings',
            'SMS notifications for new leads',
            'Priority customer support',
            'Mobile and web dashboard access'
          ].map((feature, idx) => (
            <View key={idx} style={styles.feature}>
              <Text style={styles.featureIcon}>✅</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.subscribeButton}
          onPress={handleSubscribe}
          disabled={verifying}
        >
          <Text style={styles.subscribeButtonText}>
            {verifying ? 'Processing...' : 'Subscribe Now'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={verifying}
        >
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>

        <View style={styles.guaranteeBox}>
          <Text style={styles.guaranteeTitle}>💯 30-Day Money-Back Guarantee</Text>
          <Text style={styles.guaranteeText}>
            Not satisfied? Cancel within 30 days for a full refund, no questions asked.
          </Text>
        </View>

        <View style={styles.termsBox}>
          <Text style={styles.termsText}>
            By subscribing, you agree to our Terms of Service and Privacy Policy. 
            Subscription automatically renews unless cancelled at least 24 hours before the 
            end of the current period.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
  },
  pricingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#f97316',
  },
  badge: {
    backgroundColor: '#f97316',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  currency: {
    fontSize: 28,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 10,
  },
  price: {
    fontSize: 64,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 64,
  },
  period: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 20,
  },
  billingNote: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  featuresSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  subscribeButton: {
    backgroundColor: '#f97316',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#f97316',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  subscribeButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  restoreButtonText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  guaranteeBox: {
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  guaranteeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 8,
    textAlign: 'center',
  },
  guaranteeText: {
    fontSize: 14,
    color: '#166534',
    textAlign: 'center',
    lineHeight: 20,
  },
  termsBox: {
    padding: 16,
    marginBottom: 20,
  },
  termsText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
});
