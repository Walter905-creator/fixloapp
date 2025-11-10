/**
 * Authentication Storage Utility
 * Handles secure storage of authentication tokens and user session data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  TOKEN: '@fixlo_auth_token',
  USER: '@fixlo_user_data',
  USER_TYPE: '@fixlo_user_type',
};

/**
 * Save authentication token
 * @param {string} token - JWT token
 * @returns {Promise<boolean>} Success status
 */
export const saveAuthToken = async (token) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    console.log('✅ Auth token saved');
    return true;
  } catch (error) {
    console.error('❌ Error saving auth token:', error);
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
    console.error('❌ Error getting auth token:', error);
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
    console.log('✅ User data saved');
    return true;
  } catch (error) {
    console.error('❌ Error saving user data:', error);
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
    console.error('❌ Error getting user data:', error);
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
    console.log('✅ User type saved:', userType);
    return true;
  } catch (error) {
    console.error('❌ Error saving user type:', error);
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
    console.error('❌ Error getting user type:', error);
    return null;
  }
};

/**
 * Save complete session (token, user data, and user type)
 * @param {string} token - JWT token
 * @param {Object} userData - User profile data
 * @param {string} userType - 'homeowner' or 'pro'
 * @returns {Promise<boolean>} Success status
 */
export const saveSession = async (token, userData, userType) => {
  try {
    await Promise.all([
      saveAuthToken(token),
      saveUserData(userData),
      saveUserType(userType),
    ]);
    console.log('✅ Session saved successfully');
    return true;
  } catch (error) {
    console.error('❌ Error saving session:', error);
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
    console.error('❌ Error getting session:', error);
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
    ]);
    console.log('✅ Session cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing session:', error);
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
    return !!token && !!userType;
  } catch (error) {
    console.error('❌ Error checking authentication:', error);
    return false;
  }
};
