/**
 * Referral Capture Utility
 * 
 * Handles capturing, validating, and persisting referral codes from URL parameters.
 * Used to auto-apply referral codes to professional signup flow.
 */

const REFERRAL_STORAGE_KEY = 'fixlo_referral_code';
const REFERRAL_TIMESTAMP_KEY = 'fixlo_referral_timestamp';
const REFERRAL_EXPIRY_DAYS = 30; // Referral code expires after 30 days

/**
 * Capture referral code from URL parameters and store it
 * @param {URLSearchParams} searchParams - URL search parameters
 * @returns {string|null} - Captured referral code or null
 */
export function captureReferralCode(searchParams) {
  const refCode = searchParams.get('ref');
  
  if (refCode && isValidReferralCode(refCode)) {
    const normalizedCode = refCode.trim().toUpperCase();
    
    try {
      // Store in localStorage for persistence across sessions
      localStorage.setItem(REFERRAL_STORAGE_KEY, normalizedCode);
      localStorage.setItem(REFERRAL_TIMESTAMP_KEY, Date.now().toString());
      
      console.log(`✅ Referral code captured: ${normalizedCode}`);
      return normalizedCode;
    } catch (error) {
      console.error('Failed to store referral code:', error);
      // Fallback to sessionStorage if localStorage fails
      try {
        sessionStorage.setItem(REFERRAL_STORAGE_KEY, normalizedCode);
        sessionStorage.setItem(REFERRAL_TIMESTAMP_KEY, Date.now().toString());
        return normalizedCode;
      } catch (sessionError) {
        console.error('Failed to store referral code in sessionStorage:', sessionError);
        return null;
      }
    }
  }
  
  return null;
}

/**
 * Retrieve stored referral code if it exists and hasn't expired
 * @returns {string|null} - Stored referral code or null
 */
export function getStoredReferralCode() {
  try {
    const code = localStorage.getItem(REFERRAL_STORAGE_KEY);
    const timestamp = localStorage.getItem(REFERRAL_TIMESTAMP_KEY);
    
    if (!code || !timestamp) {
      // Try sessionStorage as fallback
      const sessionCode = sessionStorage.getItem(REFERRAL_STORAGE_KEY);
      if (sessionCode) {
        return sessionCode;
      }
      return null;
    }
    
    // Check if referral code has expired
    const storedTime = parseInt(timestamp, 10);
    const expiryTime = storedTime + (REFERRAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const now = Date.now();
    
    if (now > expiryTime) {
      console.log('Referral code expired, clearing storage');
      clearReferralCode();
      return null;
    }
    
    return code;
  } catch (error) {
    console.error('Failed to retrieve referral code:', error);
    return null;
  }
}

/**
 * Clear stored referral code (e.g., after successful signup)
 */
export function clearReferralCode() {
  try {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
    localStorage.removeItem(REFERRAL_TIMESTAMP_KEY);
    sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
    sessionStorage.removeItem(REFERRAL_TIMESTAMP_KEY);
  } catch (error) {
    console.error('Failed to clear referral code:', error);
  }
}

/**
 * Validate referral code format
 * @param {string} code - Referral code to validate
 * @returns {boolean} - True if valid
 */
export function isValidReferralCode(code) {
  if (!code || typeof code !== 'string') {
    return false;
  }
  
  const trimmed = code.trim();
  
  // Must be non-empty string
  if (trimmed.length === 0) {
    return false;
  }
  
  // Should be reasonable length (3-20 characters)
  if (trimmed.length < 3 || trimmed.length > 20) {
    return false;
  }
  
  // Should only contain alphanumeric characters and hyphens
  const validPattern = /^[A-Z0-9-]+$/i;
  if (!validPattern.test(trimmed)) {
    return false;
  }
  
  return true;
}

/**
 * Check if there's a referral code currently stored
 * @returns {boolean} - True if referral code exists
 */
export function hasStoredReferralCode() {
  return getStoredReferralCode() !== null;
}
