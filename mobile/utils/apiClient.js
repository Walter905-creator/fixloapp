/**
 * API Client with Automatic Token Refresh
 * Handles API calls with automatic token refresh before expiration
 */

import axios from 'axios';
import { getApiUrl } from '../config/api';
import { 
  getAuthToken, 
  saveAuthToken, 
  getRefreshToken, 
  shouldRefreshToken,
  clearSession,
} from './authStorage';

// Create axios instance
const apiClient = axios.create({
  baseURL: getApiUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if refresh is in progress to avoid multiple simultaneous refresh requests
let isRefreshing = false;
let refreshSubscribers = [];

/**
 * Add subscriber to be notified when refresh completes
 */
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

/**
 * Notify all subscribers with new token
 */
const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

/**
 * Refresh the authentication token
 */
const refreshAuthToken = async () => {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await axios.post(`${getApiUrl()}/api/auth/refresh`, {
      refreshToken,
    });

    const { token, expiresIn } = response.data;
    await saveAuthToken(token, expiresIn);
    
    return token;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Token refresh failed:', error.message);
    }
    // Clear session on refresh failure (user needs to login again)
    await clearSession();
    throw error;
  }
};

/**
 * Request interceptor - Add auth token and handle auto-refresh
 */
apiClient.interceptors.request.use(
  async (config) => {
    // Check if token needs refresh (5 minutes before expiry)
    const needsRefresh = await shouldRefreshToken(5);
    
    if (needsRefresh) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await refreshAuthToken();
          isRefreshing = false;
          onTokenRefreshed(newToken);
          config.headers.Authorization = `Bearer ${newToken}`;
        } catch (error) {
          isRefreshing = false;
          throw error;
        }
      } else {
        // Wait for token refresh to complete
        const token = await new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            resolve(newToken);
          });
        });
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else {
      // Use existing token
      const token = await getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle token expiration errors
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If token expired (401) and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const newToken = await refreshAuthToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, user needs to login again
        if (__DEV__) {
          console.error('❌ Unable to refresh token, clearing session');
        }
        await clearSession();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
