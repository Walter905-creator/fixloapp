// src/components/AnalyticsWrapper.js
import React, { useEffect } from 'react';

// Enhanced analytics wrapper that prevents 405 errors completely
function AnalyticsWrapper() {
  useEffect(() => {
    // Check environment and domain conditions
    const hostname = window.location.hostname;
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercelDomain = hostname.includes('vercel.app');
    const isFixloDomain = hostname === 'fixloapp.com' || hostname === 'www.fixloapp.com';
    const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
    const isExplicitlyEnabled = process.env.REACT_APP_ENABLE_ANALYTICS === 'true';
    
    // Determine if analytics should work - only enable on Vercel domains or when explicitly enabled
    // This prevents 405 errors on non-Vercel deployments like www.fixloapp.com
    const shouldEnableAnalytics = (isProduction && isVercelDomain) || isExplicitlyEnabled;
    
    // Log current environment for debugging
    console.log('[Fixlo Analytics] Environment check:', {
      hostname,
      isProduction,
      isVercelDomain,
      isFixloDomain,
      isLocalhost,
      isExplicitlyEnabled,
      shouldEnableAnalytics,
      reason: shouldEnableAnalytics 
        ? 'Analytics enabled' 
        : 'Analytics disabled - only works on Vercel domains or when explicitly enabled'
    });
    
    // Completely block analytics requests to prevent 405 errors
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0];
      
      // Block all Vercel analytics requests if analytics shouldn't work
      if (typeof url === 'string' && (
        url.includes('/_vercel/insights') || 
        url.includes('/_vercel/speed-insights') ||
        url.includes('/api/_vercel')
      )) {
        if (!shouldEnableAnalytics) {
          console.log('[Fixlo Analytics] Blocked analytics request to prevent 405 error:', url);
          // Return a successful mock response
          return Promise.resolve(new Response('{"success": true}', { 
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'application/json' }
          }));
        }
      }
      
      return originalFetch.apply(this, args);
    };

    // Also block XMLHttpRequest for analytics
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      if (typeof url === 'string' && (
        url.includes('/_vercel/insights') || 
        url.includes('/_vercel/speed-insights') ||
        url.includes('/api/_vercel')
      )) {
        if (!shouldEnableAnalytics) {
          console.log('[Fixlo Analytics] Blocked XHR analytics request:', url);
          // Override with a dummy request
          return originalXHROpen.call(this, method, 'data:application/json,{"success":true}', ...args);
        }
      }
      
      return originalXHROpen.call(this, method, url, ...args);
    };

    // Cleanup function
    return () => {
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXHROpen;
    };
  }, []);

  // Determine if analytics component should be rendered - only for Vercel domains or when explicitly enabled
  const shouldRenderAnalytics = () => {
    if (typeof window === 'undefined') return false;
    
    const hostname = window.location.hostname;
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercelDomain = hostname.includes('vercel.app');
    const isExplicitlyEnabled = process.env.REACT_APP_ENABLE_ANALYTICS === 'true';
    
    return (isProduction && isVercelDomain) || isExplicitlyEnabled;
  };

  // Only try to load and render analytics if it should work
  if (!shouldRenderAnalytics()) {
    console.log('[Fixlo Analytics] Analytics disabled - Vercel analytics only works on Vercel domains (.vercel.app) or when explicitly enabled via REACT_APP_ENABLE_ANALYTICS=true');
    return null;
  }

  // Dynamically import and render analytics only when appropriate
  try {
    // Only import when we actually need it
    const { Analytics } = require('@vercel/analytics/react');
    return <Analytics debug={process.env.NODE_ENV === 'development'} />;
  } catch (error) {
    console.warn('[Fixlo Analytics] Analytics module not available or failed to load:', error.message);
    return null;
  }
}

export default AnalyticsWrapper;