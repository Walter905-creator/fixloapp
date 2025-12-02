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
  Linking,
  Platform
} from 'react-native';
import { 
  isApplePayAvailable, 
  createProSubscription, 
  formatAmount 
} from '../utils/paymentService';

export default function ProSignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [trade, setTrade] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [applePayAvailable, setApplePayAvailable] = useState(false);

  useEffect(() => {
    checkApplePayAvailability();
  }, []);

  const checkApplePayAvailability = async () => {
    const available = await isApplePayAvailable();
    setApplePayAvailable(available);
  };

  const handleApplePaySubscribe = async () => {
    if (!name || !email || !phone || !trade) {
      Alert.alert("Missing Info", "Please fill out all fields before continuing.");
      return;
    }

    if (!smsOptIn) {
      Alert.alert("SMS Consent Required", "Please agree to receive SMS notifications to continue.");
      return;
    }

    setLoading(true);

    try {
      // Create subscription intent
      const paymentIntent = await createProSubscription({
        name,
        email,
        phone,
        trade,
        smsOptIn: smsOptIn,
      });

      Alert.alert(
        '✅ Subscription Created!',
        'Your Fixlo Pro subscription has been set up successfully. You will now receive job leads directly to your device.',
        [
          {
            text: 'Get Started',
            onPress: () => navigation.replace('Pro')
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Payment Error',
        error.message || 'Failed to process payment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleWebSubscribe = async () => {
    if (!name || !email || !phone || !trade) {
      Alert.alert("Missing Info", "Please fill out all fields before continuing.");
      return;
    }

    if (!smsOptIn) {
      Alert.alert("SMS Consent Required", "Please agree to receive SMS notifications to continue.");
      return;
    }

    setLoading(true);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    Alert.alert(
      '✅ Information Saved!',
      'Thank you for your interest in Fixlo Pro. To complete your subscription and start receiving job leads, please visit our website to set up billing.\n\nYou will receive an email with next steps.',
      [
        {
          text: 'Visit Website',
          onPress: () => {
            Linking.openURL('https://www.fixloapp.com/pro-signup');
          }
        },
        {
          text: 'Maybe Later',
          style: 'cancel',
          onPress: () => navigation.goBack()
        }
      ]
    );
    
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>🚀 Join Fixlo Pro</Text>
        <Text style={styles.subtitle}>Get unlimited job leads and grow your business</Text>

        <View style={styles.pricingCard}>
          <Text style={styles.pricingTitle}>Pro Subscription</Text>
          <Text style={styles.pricingAmount}>$59.99/month</Text>
          <Text style={styles.pricingNote}>Subscribe online to get started</Text>
          
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

          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setSmsOptIn(!smsOptIn)}
            activeOpacity={0.7}
          >
            <View style={styles.checkbox}>
              {smsOptIn && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              I agree to receive SMS notifications about job leads and account updates. 
              Message and data rates may apply. Reply STOP to opt out.
            </Text>
          </TouchableOpacity>
        </View>

        {applePayAvailable && (
          <TouchableOpacity
            style={[styles.applePayButton, loading && styles.buttonDisabled]}
            onPress={handleApplePaySubscribe}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.applePayIcon}>  </Text>
                <Text style={styles.applePayButtonText}>
                  Subscribe with Apple Pay
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.subscribeButton, loading && styles.buttonDisabled]}
          onPress={handleWebSubscribe}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.subscribeButtonText}>
              {applePayAvailable ? 'Continue Online' : 'Continue to Subscribe - $59.99/month'}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          {applePayAvailable 
            ? 'Subscribe securely with Apple Pay or continue online to complete your subscription setup.' 
            : 'You\'ll be directed to our website to complete your subscription setup and billing.'
          } By subscribing, you agree to our Terms of Service and Privacy Policy.
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
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    paddingHorizontal: 5
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#2563eb',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    flexShrink: 0
  },
  checkmark: {
    color: '#2563eb',
    fontSize: 18,
    fontWeight: 'bold'
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18
  },
  applePayButton: {
    backgroundColor: '#000000',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  applePayIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  applePayButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
