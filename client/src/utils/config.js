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

// Stripe configuration
export const STRIPE_CHECKOUT_URL = getEnv('VITE_STRIPE_CHECKOUT_URL');

// Seasonal configuration - set to true during holiday season (Nov-Jan)
export const IS_HOLIDAY_SEASON = true;

// Log configuration in development
if (getEnv('NODE_ENV') !== 'production') {
  console.log('🔧 Configuration loaded:', {
    API_BASE,
    CLOUDINARY_CLOUD_NAME: CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing',
    CLOUDINARY_UPLOAD_PRESET: CLOUDINARY_UPLOAD_PRESET ? '✅ Set' : '❌ Missing',
    STRIPE_CHECKOUT_URL: STRIPE_CHECKOUT_URL ? '✅ Set' : '❌ Missing',
    IS_HOLIDAY_SEASON: IS_HOLIDAY_SEASON ? '🎄 Active' : '❌ Inactive'
  });
}