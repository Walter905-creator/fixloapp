// client/src/utils/config.js

// Safe environment variable access with fallbacks
const getEnv = (key, fallback = null) => {
  try {
    return (import.meta && import.meta.env && import.meta.env[key]) || 
           (typeof window !== 'undefined' && window[`__${key}__`]) || 
           fallback;
  } catch (error) {
    console.warn(`Environment variable ${key} access failed, using fallback:`, fallback);
    return fallback;
  }
};

// API Base URL with safe fallback
export const API_BASE = getEnv('VITE_API_URL') || 
                       getEnv('VITE_API_BASE') || 
                       'https://fixloapp.onrender.com';

// Cloudinary configuration
export const CLOUDINARY_CLOUD_NAME = getEnv('VITE_CLOUDINARY_CLOUD_NAME');
export const CLOUDINARY_UPLOAD_PRESET = getEnv('VITE_CLOUDINARY_UPLOAD_PRESET');

// Stripe configuration with validation
const stripePublishableKey = getEnv('VITE_STRIPE_PUBLISHABLE_KEY');
const nodeEnv = getEnv('NODE_ENV');

// Enforce Live Mode in production
if (nodeEnv === 'production') {
  if (!stripePublishableKey) {
    console.error('❌ SECURITY ERROR: VITE_STRIPE_PUBLISHABLE_KEY required in production');
    throw new Error('Stripe LIVE publishable key required in production');
  }
  if (!stripePublishableKey.startsWith('pk_live_')) {
    console.error('❌ SECURITY ERROR: Stripe LIVE publishable key required in production');
    throw new Error('Stripe LIVE publishable key required in production. Use pk_live_ keys only.');
  }
}

// Validate test mode in non-production (warning only in development, not blocking)
// Only show warnings in actual development, not in production builds
if (stripePublishableKey && nodeEnv !== 'production' && !stripePublishableKey.startsWith('pk_test_')) {
  // Only log in true development environment (not during build)
  if (typeof window !== 'undefined' && nodeEnv === 'development') {
    console.warn('⚠️ WARNING: Using a non-test Stripe key in non-production environment');
    console.warn('⚠️ For security, consider using pk_test_ keys in development/test environments');
  }
  // Note: Not throwing an error to allow the app to run without Stripe in development
}

export const STRIPE_PUBLISHABLE_KEY = stripePublishableKey;
export const STRIPE_CHECKOUT_URL = getEnv('VITE_STRIPE_CHECKOUT_URL');

// Seasonal configuration - set to true during holiday season (Nov-Jan)
export const IS_HOLIDAY_SEASON = true;