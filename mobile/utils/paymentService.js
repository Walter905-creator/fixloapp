/**
 * Payment Service for Fixlo Mobile App
 * Handles Apple Pay and Stripe payment processing
 */

import { Platform } from 'react-native';
import { buildApiUrl } from '../config/api';
import axios from 'axios';

/**
 * Initialize payment intent for Pro subscription
 * @param {Object} customerData - Customer information
 * @returns {Promise<Object>} Payment intent details
 */
export const createProSubscription = async (customerData) => {
  try {
    const apiUrl = buildApiUrl('/api/payments/create-subscription');
    
    const response = await axios.post(apiUrl, {
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      trade: customerData.trade,
      smsOptIn: customerData.smsOptIn,
      amount: 5999, // $59.99 in cents
      currency: 'usd',
      description: 'Fixlo Pro Monthly Subscription',
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      clientSecret: response.data.clientSecret,
      subscriptionId: response.data.subscriptionId,
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to create subscription'
    );
  }
};

/**
 * Process Apple Pay payment
 * @param {Object} paymentData - Payment data from Apple Pay
 * @param {string} clientSecret - Stripe client secret
 * @returns {Promise<Object>} Payment result
 */
export const processApplePayPayment = async (paymentData, clientSecret) => {
  try {
    const apiUrl = buildApiUrl('/api/payments/confirm-payment');
    
    const response = await axios.post(apiUrl, {
      paymentMethodId: paymentData.paymentMethodId,
      clientSecret: clientSecret,
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      paymentIntentId: response.data.paymentIntentId,
      status: response.data.status,
    };
  } catch (error) {
    console.error('Error processing Apple Pay payment:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to process payment'
    );
  }
};

/**
 * Check if Apple Pay is available on the device
 * @returns {Promise<boolean>}
 */
export const isApplePayAvailable = async () => {
  // Apple Pay is only available on iOS devices
  return Platform.OS === 'ios';
};

/**
 * Get merchant configuration for Apple Pay
 * @returns {Object} Merchant configuration
 */
export const getApplePayMerchantConfig = () => {
  return {
    merchantIdentifier: 'merchant.com.fixloapp.mobile',
    merchantDisplayName: 'Fixlo Home Services',
    countryCode: 'US',
    currencyCode: 'USD',
    supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
    merchantCapabilities: ['capability3DS', 'capabilityDebit', 'capabilityCredit'],
  };
};

/**
 * Format amount for display
 * @param {number} amount - Amount in cents
 * @returns {string} Formatted amount
 */
export const formatAmount = (amount) => {
  return `$${(amount / 100).toFixed(2)}`;
};

/**
 * Validate payment amount
 * @param {number} amount - Amount in cents
 * @returns {boolean}
 */
export const validatePaymentAmount = (amount) => {
  // Minimum $0.50, maximum $999,999.99
  return amount >= 50 && amount <= 99999999;
};

export default {
  createProSubscription,
  processApplePayPayment,
  isApplePayAvailable,
  getApplePayMerchantConfig,
  formatAmount,
  validatePaymentAmount,
};
