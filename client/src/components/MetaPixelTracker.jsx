import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * MetaPixelTracker Component
 * Handles SPA route changes for Meta Pixel PageView tracking
 * 
 * Requirements:
 * - Track PageView on every route change
 * - Respect cookie consent (marketing cookies)
 * - No duplicate events
 * - Production-safe
 */
const MetaPixelTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Check if Meta Pixel is initialized
    if (typeof window.fbq !== 'function') {
      return;
    }

    // Check cookie consent for marketing cookies
    const consentData = localStorage.getItem('fixlo_cookie_consent');
    let hasMarketingConsent = false;

    if (consentData) {
      try {
        const consent = JSON.parse(consentData);
        hasMarketingConsent = consent.marketing === true;
      } catch (e) {
        // If consent data is invalid, default to no consent
        hasMarketingConsent = false;
      }
    }

    // Only fire pixel if marketing consent is granted
    if (hasMarketingConsent) {
      window.fbq('track', 'PageView');
    }
  }, [location.pathname, location.search]);

  return null; // This component doesn't render anything
};

export default MetaPixelTracker;
