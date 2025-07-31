// src/components/AnalyticsWrapper.js
import React, { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';

function AnalyticsWrapper() {
  useEffect(() => {
    // Log analytics status for debugging
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercelDomain = window.location.hostname.includes('vercel.app') || 
                          window.location.hostname.includes('fixloapp.com');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Fixlo Analytics] Development mode - Analytics may not collect data');
      console.log('[Fixlo Analytics] For full analytics testing, deploy to production');
    }
    
    if (!isVercelDomain && isProduction) {
      console.warn('[Fixlo Analytics] Not on expected domain - analytics may not work properly');
    }
    
    // Listen for analytics script loading errors
    const originalError = console.error;
    console.error = function(...args) {
      if (args[0] && args[0].includes && args[0].includes('vercel-scripts.com')) {
        console.warn('[Fixlo Analytics] Analytics script blocked - this is common with ad blockers');
        console.warn('[Fixlo Analytics] To test analytics, disable content blockers and visit: https://fixloapp.vercel.app');
      }
      originalError.apply(console, args);
    };
    
    return () => {
      console.error = originalError;
    };
  }, []);

  // Only render Analytics in production or when explicitly enabled
  const shouldRenderAnalytics = 
    process.env.NODE_ENV === 'production' || 
    process.env.REACT_APP_ENABLE_ANALYTICS === 'true';

  if (!shouldRenderAnalytics) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Fixlo Analytics] Skipping analytics in development. Set REACT_APP_ENABLE_ANALYTICS=true to enable.');
    }
    return null;
  }

  return <Analytics debug={process.env.NODE_ENV === 'development'} />;
}

export default AnalyticsWrapper;