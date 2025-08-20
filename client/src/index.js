import React from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

// top of file (before ReactDOM render)
if (typeof window !== 'undefined' && typeof window.__fixloReveal === 'function') {
  window.__fixloReveal();
}

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

// after the app renders, ensure reveal again
setTimeout(() => {
  if (typeof window !== 'undefined' && typeof window.__fixloReveal === 'function') {
    window.__fixloReveal();
  }
}, 0);