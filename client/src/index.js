import React from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

// --- make sure the UI is not hidden by any "preload" guard
const markAppVisible = () => {
  document.documentElement.classList.remove('preload');
  document.documentElement.setAttribute('data-app-ready', 'true');
  document.body.classList.remove('app-loading');
  const rootEl = document.getElementById('root');
  if (rootEl) rootEl.classList.add('ready');
  
  // Force visible styles as fallback
  document.documentElement.style.visibility = 'visible';
  document.body.style.visibility = 'visible';
  document.body.style.opacity = '1';
};

// Add logging to verify env vars are being read
console.log("Fixlo LIVE build OK", {
  BUILD_ID: process.env.REACT_APP_BUILD_ID,
  COMMIT_SHA: process.env.REACT_APP_COMMIT_SHA
});

console.log('[Fixlo] Router is rendering');

const root = createRoot(document.getElementById('root'));
root.render(
  <HelmetProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </HelmetProvider>
);

// flip the flags *immediately* after render
markAppVisible();

// Add verification logging
console.log('[Fixlo] UI visibility flags set:', {
  preloadRemoved: !document.documentElement.classList.contains('preload'),
  appReady: document.documentElement.getAttribute('data-app-ready'),
  loadingRemoved: !document.body.classList.contains('app-loading'),
  rootReady: document.getElementById('root')?.classList.contains('ready')
});

// after root.render(...)
if (typeof window !== 'undefined' && typeof window.__fixloReactMounted === 'function') {
  try { window.__fixloReactMounted(); } catch (e) {}
}