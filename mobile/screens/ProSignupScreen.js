import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';


// Product ID for the Pro subscription (should match App Store Connect configuration)
const PRO_SUBSCRIPTION_ID = Platform.select({
  ios: 'com.fixloapp.mobile.pro.monthly',
  android: 'com.fixloapp.mobile.pro.monthly'
});

export default function ProSignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [trade, setTrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [purchaseError, setPurchaseError] = useState(null);

  useEffect(() => {
    // Connect to the store and get available products
    const initializeIAP = async () => {
      try {
        await InAppPurchases.connectAsync();
        
        // Get available products
        const { results, responseCode } = await InAppPurchases.getProductsAsync([PRO_SUBSCRIPTION_ID]);
        
        if (responseCode === InAppPurchases.IAPResponseCode.OK) {
          setProducts(results);
          console.log('✅ Products loaded:', results);
        } else {
          console.log('⚠️ No products available or not in production environment');
        }
      } catch (error) {
        console.error('❌ Error initializing IAP:', error);
        setPurchaseError('In-App Purchase not available in development. Will be enabled in production.');
      }
    };

    initializeIAP();

    // Set up purchase listener
    const purchaseListener = InAppPurchases.setPurchaseListener(({ responseCode, results }) => {
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        results.forEach((purchase) => {
          if (!purchase.acknowledged) {
            console.log('✅ Purchase successful:', purchase);
            // Finish the transaction
            InAppPurchases.finishTransactionAsync(purchase, true);
            
            Alert.alert(
              '🎉 Welcome to Fixlo Pro!',
              'Your subscription is now active. You can start receiving job leads immediately!',
              [
                {
                  text: 'Get Started',
                  onPress: () => navigation.navigate('Pro')
                }
              ]
            );
          }
        });
      } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
        setPurchaseLoading(false);
        Alert.alert('Purchase Cancelled', 'You can subscribe at any time to start receiving leads.');
      } else {
        setPurchaseLoading(false);
        Alert.alert('Purchase Failed', 'Unable to complete purchase. Please try again.');
      }
    });

    return () => {
      // Cleanup
      purchaseListener.remove();
      InAppPurchases.disconnectAsync();
    };
  }, [navigation]);

  const handlePurchase = async () => {
    if (!name || !email || !phone || !trade) {
      Alert.alert("Missing Info", "Please fill out all fields before subscribing.");
      return;
    }

    setPurchaseLoading(true);
    setPurchaseError(null);

    try {
      // In development/testing, simulate the purchase
      if (__DEV__ || products.length === 0) {
        // Simulate purchase delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        Alert.alert(
          '🎉 Test Mode: Subscription Successful!',
          'In production, this will process real payments through Apple.\n\nYour Pro account is ready!',
          [
            {
              text: 'Continue',
              onPress: () => navigation.navigate('Pro')
            }
          ]
        );
        setPurchaseLoading(false);
        return;
      }

      // Production purchase
      await InAppPurchases.purchaseItemAsync(PRO_SUBSCRIPTION_ID);
      // Purchase listener will handle the result
    } catch (error) {
      console.error('❌ Purchase error:', error);
      setPurchaseLoading(false);
      
      if (error.code === 'E_USER_CANCELLED') {
        Alert.alert('Purchase Cancelled', 'You can subscribe at any time.');
      } else {
        Alert.alert(
          'Purchase Error',
          'Unable to process purchase. Please try again or contact support.'
        );
      }
    }
  };

  const getProductPrice = () => {
    if (products.length > 0 && products[0].price) {
      return products[0].localizedPrice || products[0].price;
    }
    return '$59.99'; // Default fallback
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>🚀 Join Fixlo Pro</Text>
        <Text style={styles.subtitle}>Get unlimited job leads and grow your business</Text>

        {purchaseError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>ℹ️ {purchaseError}</Text>
          </View>
        )}

        <View style={styles.pricingCard}>
          <Text style={styles.pricingTitle}>Pro Subscription</Text>
          <Text style={styles.pricingAmount}>{getProductPrice()}/month</Text>
          <Text style={styles.pricingNote}>Billed monthly through Apple</Text>
          
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitItem}>✅ Unlimited job leads</Text>
            <Text style={styles.benefitItem}>✅ Direct client contact</Text>
            <Text style={styles.benefitItem}>✅ Instant push notifications</Text>
            <Text style={styles.benefitItem}>✅ Professional profile</Text>
            <Text style={styles.benefitItem}>✅ Customer reviews</Text>
            <Text style={styles.benefitItem}>✅ Payment protection</Text>
            <Text style={styles.benefitItem}>✅ Cancel anytime</Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Your Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput 
              placeholder="Enter your full name" 
              style={styles.input} 
              value={name} 
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput 
              placeholder="your@email.com" 
              style={styles.input} 
              value={email} 
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput 
              placeholder="(555) 123-4567" 
              style={styles.input} 
              value={phone} 
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Trade/Specialty *</Text>
            <TextInput 
              placeholder="e.g., Plumber, Electrician, HVAC" 
              style={styles.input} 
              value={trade} 
              onChangeText={setTrade}
              autoCapitalize="words"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.subscribeButton, purchaseLoading && styles.buttonDisabled]}
          onPress={handlePurchase}
          disabled={purchaseLoading}
        >
          {purchaseLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.subscribeButtonText}>
              Subscribe Now - {getProductPrice()}/month
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By subscribing, you agree to our Terms of Service and Privacy Policy. 
          Subscription automatically renews unless cancelled at least 24 hours before 
          the end of the current period. Manage subscriptions in App Store settings.
        </Text>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Maybe Later</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9'
  },
  formContainer: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 50
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 18,
    color: '#475569',
    marginBottom: 25,
    textAlign: 'center'
  },
  errorBanner: {
    backgroundColor: '#fef3c7',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b'
  },
  errorText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20
  },
  pricingCard: {
    backgroundColor: '#ffffff',
    padding: 25,
    borderRadius: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#2563eb'
  },
  pricingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 10
  },
  pricingAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center',
    marginBottom: 5
  },
  pricingNote: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20
  },
  benefitsContainer: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0'
  },
  benefitItem: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
    paddingLeft: 5
  },
  formSection: {
    marginBottom: 25
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 15
  },
  inputContainer: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    fontSize: 16
  },
  subscribeButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  disclaimer: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
    fontStyle: 'italic'
  },
  cancelButton: {
    paddingVertical: 15,
    alignItems: 'center'
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600'
  }
});
