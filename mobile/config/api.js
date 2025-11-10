/**
 * API Configuration for Fixlo Mobile App
 * 
 * Centralizes API URL configuration with proper fallback handling.
 * Ensures app always has a valid API endpoint even if environment variables fail to load.
 */

// Primary: Use environment variable if available
// Fallback: Production API URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://fixloapp.onrender.com';

/**
 * Get the configured API base URL
 * @returns {string} The API base URL
 */
export const getApiUrl = () => {
  return API_BASE_URL;
};

/**
 * Build a full API endpoint URL
 * @param {string} endpoint - The API endpoint path (e.g., '/api/auth/login')
 * @returns {string} The full API URL
 */
export const buildApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

/**
 * API endpoint paths
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  
  // Job Requests / Leads
  LEADS_LIST: '/api/leads',
  LEADS_DETAIL: (id) => `/api/leads/${id}`,
  REQUESTS_CREATE: '/api/requests',
  
  // Pro Routes
  PRO_AUTH_LOGIN: '/api/pro-auth/login',
  PRO_JOBS: '/api/pro/jobs',
};

/**
 * Common request configuration
 */
export const API_CONFIG = {
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};

// Log the API configuration on module load (helpful for debugging)
console.log('📡 API Configuration:', {
  baseUrl: API_BASE_URL,
  source: process.env.EXPO_PUBLIC_API_URL ? 'environment variable' : 'fallback (production)',
});

export default {
  getApiUrl,
  buildApiUrl,
  API_ENDPOINTS,
  API_CONFIG,
};
