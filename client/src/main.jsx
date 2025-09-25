import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Analytics } from '@vercel/analytics/react';
import App from './App';
import './index.css';

// Clean URL parameters client-side for better SEO
if (typeof window !== 'undefined' && window.location.search) {
  const urlParams = new URLSearchParams(window.location.search);
  const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'ref', 'campaign'];
  let hasTrackingParams = false;
  
  trackingParams.forEach(param => {
    if (urlParams.has(param)) {
      hasTrackingParams = true;
    }
  });
  
  if (hasTrackingParams) {
    window.history.replaceState({}, '', window.location.pathname);
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
        <Analytics /> {/* Vercel Web Analytics */}
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
