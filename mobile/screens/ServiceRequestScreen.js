import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

const SERVICE_TYPES = [
  'General Repairs',
  'Electrical',
  'Plumbing',
  'Drywall',
  'Painting',
  'Flooring',
  'Carpentry',
  'Other'
];

/**
 * Service Request Screen
 * Mirrors website behavior exactly, but uses Apple Pay instead of Stripe
 */
export default function ServiceRequestScreen({ navigation }) {
  const [formData, setFormData] = useState({
    serviceType: '',
    otherServiceType: '',
    fullName: '',
    phone: '',
    city: '',
    state: 'NC',
    details: '',
    smsConsent: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState(null);

  // Update form field
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.serviceType) {
      newErrors.serviceType = 'Please select a service type';
    }
    if (formData.serviceType === 'Other' && !formData.otherServiceType) {
      newErrors.otherServiceType = 'Please specify the service type';
    }
    if (!formData.fullName || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name is required';
    }
    if (!formData.phone || !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Valid phone number is required';
    }
    if (!formData.city || formData.city.trim().length < 2) {
      newErrors.city = 'City is required';
    }
    if (!formData.state || formData.state.trim().length !== 2) {
      newErrors.state = 'Valid 2-letter state code is required';
    }
    if (!formData.details || formData.details.trim().length < 20) {
      newErrors.details = 'Description must be at least 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // PHASE 1: Create service request (identical to website)
  const createServiceRequest = async () => {
    console.log('📱 App payload:', formData);

    const payload = {
      serviceType: formData.serviceType === 'Other' ? formData.otherServiceType : formData.serviceType,
      fullName: formData.fullName.trim(),
      phone: formData.phone.replace(/[^\d+]/g, ''),
      city: formData.city.trim(),
      state: formData.state.trim(),
      smsConsent: formData.smsConsent,
      details: formData.details.trim(),
      paymentProvider: 'apple_pay', // Platform-specific identifier
    };

    try {
      const apiUrl = buildApiUrl(API_ENDPOINTS.REQUESTS_CREATE);
      console.log('🚀 Creating service request:', payload);

      const response = await axios.post(apiUrl, payload, {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.data.ok || !response.data.requestId) {
        throw new Error('Request was not created properly');
      }

      const { requestId } = response.data;
      console.log('✅ Service request created:', requestId);
      return requestId;

    } catch (error) {
      console.error('❌ Error creating request:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create request');
    }
  };

  // PHASE 2: Authorize payment with Apple Pay (platform-specific)
  const authorizeApplePayment = async (requestId) => {
    console.log('🍎 Initiating Apple Pay authorization for:', requestId);

    // TODO: Implement actual Apple Pay integration
    // For now, we'll simulate the authorization
    // In production, this would use expo-apple-pay or similar library

    try {
      // Simulate Apple Pay sheet
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In real implementation, this would be:
      // const { paymentToken, transactionId } = await ApplePay.requestPayment({
      //   merchantIdentifier: 'merchant.com.fixloapp',
      //   merchantCapabilities: ['3DS', 'debit', 'credit'],
      //   supportedNetworks: ['visa', 'mastercard', 'amex', 'discover'],
      //   countryCode: 'US',
      //   currencyCode: 'USD',
      //   paymentSummaryItems: [{
      //     label: 'Fixlo Visit Fee Authorization',
      //     amount: '150.00'
      //   }]
      // });

      // For development: simulate successful authorization
      const mockPaymentToken = 'applepay_mock_' + Date.now();
      const mockTransactionId = 'txn_' + Date.now();

      console.log('🍎 Apple Pay authorized:', { mockPaymentToken, mockTransactionId });

      // Attach Apple Pay authorization to request
      const apiUrl = buildApiUrl(`/api/requests/${requestId}/apple-pay`);
      await axios.post(apiUrl, {
        applePayToken: mockPaymentToken,
        applePayTransactionId: mockTransactionId,
      }, {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('✅ Apple Pay authorization attached to request');
      return { success: true, paymentToken: mockPaymentToken };

    } catch (error) {
      console.error('❌ Apple Pay authorization failed:', error);
      throw error;
    }
  };

  // Main submission handler
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }

    setLoading(true);

    try {
      // PHASE 1: Create service request
      const createdRequestId = await createServiceRequest();
      setRequestId(createdRequestId);

      // PHASE 2: Apple Pay authorization (AFTER request exists)
      await authorizeApplePayment(createdRequestId);

      // Success!
      console.log('✅ Request submitted and payment authorized');
      
      Alert.alert(
        '✅ Success!',
        'Your service request has been submitted and payment authorized successfully!\n\nYour card has NOT been charged - only authorized for the visit fee.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear form
              setFormData({
                serviceType: '',
                otherServiceType: '',
                fullName: '',
                phone: '',
                city: '',
                state: 'NC',
                details: '',
                smsConsent: false,
              });
              setRequestId(null);
              // Navigate back or to dashboard
              navigation.goBack();
            },
          },
        ]
      );

    } catch (error) {
      console.error('❌ Submission error:', error);
      Alert.alert(
        '❌ Error',
        error.message || 'Failed to submit request. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>🏠 Service Request</Text>
        <Text style={styles.subtitle}>Get connected with verified professionals</Text>

        {/* Service Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Type *</Text>
          <View style={styles.serviceTypeGrid}>
            {SERVICE_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.serviceTypeButton,
                  formData.serviceType === type && styles.serviceTypeButtonSelected,
                ]}
                onPress={() => handleInputChange('serviceType', type)}
              >
                <Text
                  style={[
                    styles.serviceTypeText,
                    formData.serviceType === type && styles.serviceTypeTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {formData.serviceType === 'Other' && (
            <TextInput
              style={styles.input}
              placeholder="Please specify service type..."
              value={formData.otherServiceType}
              onChangeText={(value) => handleInputChange('otherServiceType', value)}
            />
          )}
          {errors.serviceType && <Text style={styles.errorText}>{errors.serviceType}</Text>}
          {errors.otherServiceType && <Text style={styles.errorText}>{errors.otherServiceType}</Text>}
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your project in detail... (min 20 characters)"
            value={formData.details}
            onChangeText={(value) => handleInputChange('details', value)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{formData.details.length}/20 characters minimum</Text>
          {errors.details && <Text style={styles.errorText}>{errors.details}</Text>}
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Full Name *"
            value={formData.fullName}
            onChangeText={(value) => handleInputChange('fullName', value)}
          />
          {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Phone Number *"
            value={formData.phone}
            onChangeText={(value) => handleInputChange('phone', value)}
            keyboardType="phone-pad"
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Location</Text>
          
          <TextInput
            style={styles.input}
            placeholder="City *"
            value={formData.city}
            onChangeText={(value) => handleInputChange('city', value)}
          />
          {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}

          <TextInput
            style={styles.input}
            placeholder="State * (2-letter code, e.g., NC)"
            value={formData.state}
            onChangeText={(value) => handleInputChange('state', value.toUpperCase())}
            maxLength={2}
            autoCapitalize="characters"
          />
          {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
        </View>

        {/* SMS Consent */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => handleInputChange('smsConsent', !formData.smsConsent)}
          >
            <View style={[styles.checkbox, formData.smsConsent && styles.checkboxChecked]}>
              {formData.smsConsent && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
            <View style={styles.checkboxLabel}>
              <Text style={styles.checkboxTitle}>Receive SMS updates (optional)</Text>
              <Text style={styles.checkboxDescription}>
                Get text notifications when your service is scheduled, when technician arrives, and when work is complete. Reply STOP to opt out anytime.
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Payment Info */}
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>💳 Payment Information</Text>
          <View style={styles.paymentDetails}>
            <Text style={styles.paymentText}>• Your card will NOT be charged now</Text>
            <Text style={styles.paymentText}>• $150 visit fee is authorized only</Text>
            <Text style={styles.paymentText}>• Fee is waived if you approve the job</Text>
            <Text style={styles.paymentText}>• Final charges calculated after completion</Text>
          </View>
          {Platform.OS === 'ios' && (
            <Text style={styles.applePayNote}>🍎 Using Apple Pay</Text>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>
              {Platform.OS === 'ios' ? 'Authorize with Apple Pay & Submit' : 'Submit Request'}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By submitting, you agree to be contacted by professionals and to Fixlo's pricing terms.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  serviceTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  serviceTypeButton: {
    width: '48%',
    padding: 14,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: 'white',
  },
  serviceTypeButtonSelected: {
    borderColor: '#f97316',
    backgroundColor: '#fff7ed',
  },
  serviceTypeText: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
  },
  serviceTypeTextSelected: {
    color: '#f97316',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 10,
    color: '#1e293b',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: -5,
    marginBottom: 5,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    marginTop: -5,
    marginBottom: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#94a3b8',
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  checkboxChecked: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  checkboxCheck: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
  },
  checkboxTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  checkboxDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  paymentInfo: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 10,
  },
  paymentDetails: {
    marginBottom: 10,
  },
  paymentText: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 6,
  },
  applePayNote: {
    fontSize: 15,
    fontWeight: '600',
    color: '#059669',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#f97316',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
