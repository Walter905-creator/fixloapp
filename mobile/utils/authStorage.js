/**
 * Authentication Storage Utility
 * Handles secure storage of authentication tokens and user session data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  TOKEN: '@fixlo_auth_token',
  USER: '@fixlo_user_data',
  USER_TYPE: '@fixlo_user_type',
  TOKEN_EXPIRY: '@fixlo_token_expiry',
  REFRESH_TOKEN: '@fixlo_refresh_token',
};

/**
 * Save authentication token with expiry
 * @param {string} token - JWT token
 * @param {number} expiresIn - Token expiry time in seconds (default: 7 days)
 * @returns {Promise<boolean>} Success status
 */
export const saveAuthToken = async (token, expiresIn = 604800) => {
  try {
    const expiryTime = Date.now() + (expiresIn * 1000);
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.TOKEN, token],
      [STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString()],
    ]);
    console.log('✅ Auth token saved with expiry:', new Date(expiryTime).toISOString());
    return true;
  } catch (error) {
    if (__DEV__) {
    console.error('❌ Error saving auth token:', error);
    }
    return false;
  }
};

/**
 * Get authentication token
 * @returns {Promise<string|null>} Token or null
 */
export const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    return token;
  } catch (error) {
    if (__DEV__) {
    console.error('❌ Error getting auth token:', error);
    }
    return null;
  }
};

/**
 * Save user data
 * @param {Object} userData - User profile data
 * @returns {Promise<boolean>} Success status
 */
export const saveUserData = async (userData) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

    return true;
  } catch (error) {
    if (__DEV__) {
    console.error('❌ Error saving user data:', error);
    }
    return false;
  }
};

/**
 * Get user data
 * @returns {Promise<Object|null>} User data or null
 */
export const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    if (__DEV__) {
    console.error('❌ Error getting user data:', error);
    }
    return null;
  }
};

/**
 * Save user type (homeowner or pro)
 * @param {string} userType - 'homeowner' or 'pro'
 * @returns {Promise<boolean>} Success status
 */
export const saveUserType = async (userType) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_TYPE, userType);

    return true;
  } catch (error) {
    if (__DEV__) {
    console.error('❌ Error saving user type:', error);
    }
    return false;
  }
};

/**
 * Get user type
 * @returns {Promise<string|null>} User type or null
 */
export const getUserType = async () => {
  try {
    const userType = await AsyncStorage.getItem(STORAGE_KEYS.USER_TYPE);
    return userType;
  } catch (error) {
    if (__DEV__) {
    console.error('❌ Error getting user type:', error);
    }
    return null;
  }
};

/**
 * Save complete session (token, user data, and user type)
 * @param {string} token - JWT token
 * @param {Object} userData - User profile data
 * @param {string} userType - 'homeowner' or 'pro'
 * @param {string} refreshToken - Optional refresh token
 * @param {number} expiresIn - Token expiry time in seconds
 * @returns {Promise<boolean>} Success status
 */
export const saveSession = async (token, userData, userType, refreshToken = null, expiresIn = 604800) => {
  try {
    const promises = [
      saveAuthToken(token, expiresIn),
      saveUserData(userData),
      saveUserType(userType),
    ];
    
    if (refreshToken) {
      promises.push(saveRefreshToken(refreshToken));
    }
    
    await Promise.all(promises);

    return true;
  } catch (error) {
    if (__DEV__) {
    console.error('❌ Error saving session:', error);
    }
    return false;
  }
};

/**
 * Get complete session data
 * @returns {Promise<Object>} Session data with token, user, and userType
 */
export const getSession = async () => {
  try {
    const [token, userData, userType] = await Promise.all([
      getAuthToken(),
      getUserData(),
      getUserType(),
    ]);

    return {
      token,
      user: userData,
      userType,
      isAuthenticated: !!token && !!userType,
    };
  } catch (error) {
    if (__DEV__) {
    console.error('❌ Error getting session:', error);
    }
    return {
      token: null,
      user: null,
      userType: null,
      isAuthenticated: false,
    };
  }
};

/**
 * Clear all authentication data (logout)
 * @returns {Promise<boolean>} Success status
 */
export const clearSession = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.USER,
      STORAGE_KEYS.USER_TYPE,
      STORAGE_KEYS.TOKEN_EXPIRY,
      STORAGE_KEYS.REFRESH_TOKEN,
    ]);

    return true;
  } catch (error) {
    if (__DEV__) {
    console.error('❌ Error clearing session:', error);
    }
    return false;
  }
};

/**
 * Save refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<boolean>} Success status
 */
export const saveRefreshToken = async (refreshToken) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

    return true;
  } catch (error) {
    if (__DEV__) {
    console.error('❌ Error saving refresh token:', error);
    }
    return false;
  }
};

/**
 * Get refresh token
 * @returns {Promise<string|null>} Refresh token or null
 */
export const getRefreshToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    return refreshToken;
  } catch (error) {
    if (__DEV__) {
    console.error('❌ Error getting refresh token:', error);
    }
    return null;
  }
};

/**
 * Get token expiry time
 * @returns {Promise<number|null>} Expiry timestamp or null
 */
export const getTokenExpiry = async () => {
  try {
    const expiry = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    return expiry ? parseInt(expiry, 10) : null;
  } catch (error) {
    if (__DEV__) {
    console.error('❌ Error getting token expiry:', error);
    }
    return null;
  }
};

/**
 * Check if token is expired or will expire soon
 * @param {number} bufferMinutes - Buffer time in minutes before expiry (default: 5 minutes)
 * @returns {Promise<boolean>} True if token needs refresh
 */
export const shouldRefreshToken = async (bufferMinutes = 5) => {
  try {
    const expiry = await getTokenExpiry();
    if (!expiry) return false;
    
    const bufferTime = bufferMinutes * 60 * 1000;
    const shouldRefresh = Date.now() >= (expiry - bufferTime);
    
    if (shouldRefresh) {
      console.log('⏰ Token needs refresh (expires at:', new Date(expiry).toISOString(), ')');
    }
    
    return shouldRefresh;
  } catch (error) {
    if (__DEV__) {
    console.error('❌ Error checking token expiry:', error);
    }
    return false;
  }
};

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} Authentication status
 */
export const isAuthenticated = async () => {
  try {
    const token = await getAuthToken();
    const userType = await getUserType();
    const expiry = await getTokenExpiry();
    
    // Check if token exists and is not expired
    const isValid = !!token && !!userType && (!expiry || Date.now() < expiry);
    
    if (!isValid && token) {

    }
    
    return isValid;
  } catch (error) {
    if (__DEV__) {
    console.error('❌ Error checking authentication:', error);
    }
    return false;
  }
};
