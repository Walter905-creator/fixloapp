import React from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

// Force visible on mount
document.documentElement.style.visibility = 'visible';
document.body.style.visibility = 'visible';
document.body.style.opacity = '1';

// Add logging to verify env vars are being read
console.log("FIXLO BUILD", {
  BUILD_ID: process.env.REACT_APP_BUILD_ID,
  COMMIT_SHA: process.env.REACT_APP_COMMIT_SHA
});

const root = createRoot(document.getElementById('root'));
root.render(
  <HelmetProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </HelmetProvider>
);

// after root.render(...)
if (typeof window !== 'undefined' && typeof window.__fixloReactMounted === 'function') {
  try { window.__fixloReactMounted(); } catch (e) {}
}