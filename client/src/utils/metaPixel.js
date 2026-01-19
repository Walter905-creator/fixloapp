/**
 * Meta Pixel Event Tracking Utility
 * Provides consent-aware event tracking functions
 * 
 * Requirements:
 * - Check marketing consent before firing
 * - No duplicate events
 * - Production-safe
 * - No console logging in production
 */

/**
 * Check if user has consented to marketing cookies
 * @returns {boolean} True if marketing consent is granted
 */
export const hasMarketingConsent = () => {
  const consentData = localStorage.getItem('fixlo_cookie_consent');
  
  if (!consentData) {
    return false;
  }

  try {
    const consent = JSON.parse(consentData);
    return consent.marketing === true;
  } catch (e) {
    return false;
  }
};

/**
 * Track a Meta Pixel event
 * @param {string} eventName - The event name (e.g., 'Lead', 'CompleteRegistration', 'Subscribe')
 * @param {object} eventData - Optional event parameters
 */
export const trackMetaPixelEvent = (eventName, eventData = {}) => {
  // Check if fbq is available
  if (typeof window.fbq !== 'function') {
    return;
  }

  // Check marketing consent
  if (!hasMarketingConsent()) {
    return;
  }

  // Track the event
  window.fbq('track', eventName, eventData);
};

/**
 * Initialize Meta Pixel consent after user accepts marketing cookies
 */
export const initializeMetaPixelConsent = () => {
  if (typeof window.fbq !== 'function') {
    return;
  }

  // Re-initialize pixel after consent is granted
  if (hasMarketingConsent()) {
    window.fbq('track', 'PageView');
  }
};
