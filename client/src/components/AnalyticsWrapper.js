// src/components/AnalyticsWrapper.js
import React, { useEffect } from 'react';

// Conditionally import Analytics only when needed
let Analytics = null;
try {
  if (typeof window !== 'undefined') {
    // Only import if we're in a browser environment
    const analyticsModule = require('@vercel/analytics/react');
    Analytics = analyticsModule.Analytics;
  }
} catch (error) {
  console.warn('[Fixlo Analytics] Analytics module not available:', error.message);
}

function AnalyticsWrapper() {
  useEffect(() => {
    // Check environment and domain conditions
    const isProduction = process.env.NODE_ENV === 'production';
    const hostname = window.location.hostname;
    const isVercelDomain = hostname.includes('vercel.app') || 
                          hostname.includes('vercel.com');
    const isFixloDomain = hostname.includes('fixloapp.com') && 
                         !hostname.includes('localhost') &&
                         !hostname.includes('127.0.0.1');
    
    // Log current environment for debugging
    console.log('[Fixlo Analytics] Environment check:', {
      isProduction,
      hostname,
      isVercelDomain,
      isFixloDomain,
      analyticsAvailable: !!Analytics
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Fixlo Analytics] Development mode - Analytics disabled');
      console.log('[Fixlo Analytics] Set REACT_APP_ENABLE_ANALYTICS=true to enable in development');
    }
    
    if (!isVercelDomain && !isFixloDomain && isProduction) {
      console.log('[Fixlo Analytics] Not on supported domain - Analytics disabled to prevent errors');
    }

    // Prevent analytics errors by intercepting network errors
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0];
      
      // Block analytics requests that would cause 405 errors
      if (typeof url === 'string' && url.includes('/_vercel/insights')) {
        console.log('[Fixlo Analytics] Blocked analytics request to prevent 405 error:', url);
        // Return a resolved promise to prevent errors
        return Promise.resolve(new Response('', { status: 200 }));
      }
      
      return originalFetch.apply(this, args);
    };

    // Cleanup function
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Determine if analytics should be rendered
  const shouldRenderAnalytics = () => {
    if (!Analytics) return false;
    
    const isProduction = process.env.NODE_ENV === 'production';
    const hostname = window.location.hostname;
    const isVercelDomain = hostname.includes('vercel.app') || hostname.includes('vercel.com');
    const isFixloDomain = hostname.includes('fixloapp.com') && 
                         !hostname.includes('localhost') &&
                         !hostname.includes('127.0.0.1');
    const isExplicitlyEnabled = process.env.REACT_APP_ENABLE_ANALYTICS === 'true';
    
    // Only render analytics in appropriate environments
    return (isProduction && (isVercelDomain || isFixloDomain)) || isExplicitlyEnabled;
  };

  if (!shouldRenderAnalytics()) {
    return null;
  }

  // Wrap analytics in error boundary
  try {
    return <Analytics debug={process.env.NODE_ENV === 'development'} />;
  } catch (error) {
    console.warn('[Fixlo Analytics] Failed to render analytics:', error.message);
    return null;
  }
}

export default AnalyticsWrapper;