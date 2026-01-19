import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { hasMarketingConsent } from '../utils/metaPixel';

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

    // Only fire pixel if marketing consent is granted
    if (hasMarketingConsent()) {
      window.fbq('track', 'PageView');
    }
  }, [location.pathname, location.search]);

  return null; // This component doesn't render anything
};

export default MetaPixelTracker;
