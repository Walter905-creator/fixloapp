import React from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { BUILD_INFO } from './buildInfo';

if (typeof window !== 'undefined') {
  // One clear, consistent log - guard in production unless debug is enabled
  if (process.env.NODE_ENV !== 'production' || window.location.search.includes('debug')) {
    // eslint-disable-next-line no-console
    console.log('FIXLO BUILD', BUILD_INFO);
  }
}

// Safe SW kill-switch (no behavior change for your buttons)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations?.().then(list => {
    list.forEach(reg => reg.unregister());
  });
}

const root = createRoot(document.getElementById('root'));
root.render(
  <HelmetProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </HelmetProvider>
);