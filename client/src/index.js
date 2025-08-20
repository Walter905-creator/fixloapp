import React from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

// Unregister any service workers that might cache old content
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations?.().then(rs => rs.forEach(r => r.unregister()));
}

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

// After root.render(...)
(function forceUnhide() {
  try {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    ['loading','app-loading','app-hidden','preload','invisible','is-hidden']
      .forEach((c) => { html.classList.remove(c); body.classList.remove(c); });
    [html, body].forEach(el => {
      el.style.opacity = '1';
      el.style.visibility = 'visible';
      el.removeAttribute('hidden');
    });
    if (root) {
      root.style.display = 'block';
      root.removeAttribute('hidden');
    }
  } catch(e) {
    // no-op
  }
})();

// after the app renders, ensure reveal again
setTimeout(() => {
  if (typeof window !== 'undefined' && typeof window.__fixloReveal === 'function') {
    window.__fixloReveal();
  }
}, 0);