// src/components/AnalyticsWrapper.js
import React, { useEffect, useState } from 'react';

// Enhanced analytics wrapper that prevents 405 errors completely
function AnalyticsWrapper() {
  const [AnalyticsComponent, setAnalyticsComponent] = useState(null);

  useEffect(() => {
    // IMMEDIATE blocking setup before any other logic
    // This prevents race conditions where analytics requests happen before blocking is in place
    const setupGlobalBlocking = () => {
      // Block fetch requests
      if (window.fetch && !window.fetch.__fixloBlocked) {
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
          const url = args[0];
          if (typeof url === 'string' && (
            url.includes('/_vercel/insights') || 
            url.includes('/_vercel/speed-insights') ||
            url.includes('/api/_vercel') ||
            url.includes('vercel.live')
          )) {
            console.log('[Fixlo Analytics] Globally blocked analytics request:', url);
            return Promise.resolve(new Response('{"success": true}', { 
              status: 200,
              statusText: 'OK',
              headers: { 'Content-Type': 'application/json' }
            }));
          }
          return originalFetch.apply(this, args);
        };
        window.fetch.__fixloBlocked = true;
        window.fetch.__originalFetch = originalFetch;
      }

      // Block XMLHttpRequest
      if (XMLHttpRequest.prototype.open && !XMLHttpRequest.prototype.__fixloBlocked) {
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
          if (typeof url === 'string' && (
            url.includes('/_vercel/insights') || 
            url.includes('/_vercel/speed-insights') ||
            url.includes('/api/_vercel') ||
            url.includes('vercel.live')
          )) {
            console.log('[Fixlo Analytics] Globally blocked XHR analytics request:', url);
            return originalXHROpen.call(this, method, 'data:application/json,{"success":true}', ...args);
          }
          return originalXHROpen.call(this, method, url, ...args);
        };
        XMLHttpRequest.prototype.__fixloBlocked = true;
        XMLHttpRequest.prototype.__originalOpen = originalXHROpen;
      }

      // Block sendBeacon
      if (navigator.sendBeacon && !navigator.sendBeacon.__fixloBlocked) {
        const originalSendBeacon = navigator.sendBeacon;
        navigator.sendBeacon = function(url, data) {
          if (typeof url === 'string' && (
            url.includes('/_vercel/insights') || 
            url.includes('/_vercel/speed-insights') ||
            url.includes('/api/_vercel') ||
            url.includes('vercel.live')
          )) {
            console.log('[Fixlo Analytics] Globally blocked sendBeacon analytics request:', url);
            return true; // Pretend it succeeded
          }
          return originalSendBeacon.call(this, url, data);
        };
        navigator.sendBeacon.__fixloBlocked = true;
        navigator.sendBeacon.__original = originalSendBeacon;
      }
    };

    // Set up blocking immediately
    setupGlobalBlocking();

    // Check environment and domain conditions
    const hostname = window.location.hostname;
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercelDomain = hostname.includes('vercel.app');
    const isFixloDomain = hostname === 'fixloapp.com' || hostname === 'www.fixloapp.com';
    const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
    const isExplicitlyEnabled = process.env.REACT_APP_ENABLE_ANALYTICS === 'true';
    
    // Determine if analytics should work - only enable on Vercel domains or when explicitly enabled in development
    // This prevents 405 errors on non-Vercel deployments like www.fixloapp.com
    // Analytics should NEVER load on production non-Vercel domains, even if explicitly enabled
    const shouldEnableAnalytics = (isProduction && isVercelDomain) || (isLocalhost && isExplicitlyEnabled);
    
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
        : 'Analytics disabled - only works on Vercel domains or when explicitly enabled in development'
    });
    
    // If analytics should NOT be enabled, ensure all blocking is active
    if (!shouldEnableAnalytics) {
      console.log('[Fixlo Analytics] Analytics disabled - ensuring all requests are blocked');
      setupGlobalBlocking(); // Ensure blocking is active
      
      // Also prevent any future analytics module loading by poisoning the import
      if (window.require && window.require.cache) {
        // Block CommonJS require for @vercel/analytics
        const originalRequire = window.require;
        window.require = function(id) {
          if (id.includes('@vercel/analytics')) {
            console.log('[Fixlo Analytics] Blocked require for:', id);
            return { Analytics: () => null };
          }
          return originalRequire.apply(this, arguments);
        };
      }
    }

    // Only dynamically import analytics if it should be enabled
    if (shouldEnableAnalytics) {
      console.log('[Fixlo Analytics] Loading analytics module...');
      import('@vercel/analytics/react')
        .then(({ Analytics }) => {
          console.log('[Fixlo Analytics] Analytics module loaded successfully');
          setAnalyticsComponent(() => () => <Analytics debug={process.env.NODE_ENV === 'development'} />);
        })
        .catch((error) => {
          console.warn('[Fixlo Analytics] Analytics module not available or failed to load:', error.message);
        });
    } else {
      console.log('[Fixlo Analytics] Analytics disabled - Vercel analytics only works on Vercel domains (.vercel.app) or when explicitly enabled in development mode via REACT_APP_ENABLE_ANALYTICS=true');
    }

    // Cleanup function
    return () => {
      // Restore original functions if they were overridden
      if (window.fetch && window.fetch.__originalFetch) {
        window.fetch = window.fetch.__originalFetch;
        delete window.fetch.__fixloBlocked;
        delete window.fetch.__originalFetch;
      }
      if (XMLHttpRequest.prototype.__originalOpen) {
        XMLHttpRequest.prototype.open = XMLHttpRequest.prototype.__originalOpen;
        delete XMLHttpRequest.prototype.__fixloBlocked;
        delete XMLHttpRequest.prototype.__originalOpen;
      }
      if (navigator.sendBeacon && navigator.sendBeacon.__original) {
        navigator.sendBeacon = navigator.sendBeacon.__original;
        delete navigator.sendBeacon.__fixloBlocked;
        delete navigator.sendBeacon.__original;
      }
    };
  }, []);

  // Render the analytics component if it was loaded
  return AnalyticsComponent ? <AnalyticsComponent /> : null;
}

export default AnalyticsWrapper;