import React from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Build stamp for production verification
console.log('FIXLO BUILD', {
  BUILD_ID: process.env.REACT_APP_BUILD_ID,
  COMMIT_SHA: process.env.REACT_APP_COMMIT_SHA
});

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