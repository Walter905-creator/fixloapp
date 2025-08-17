import React from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

// Build stamp for production verification - supports FIXLO BUILD format
const buildId = process.env.REACT_APP_BUILD_ID || process.env.FIXLO_BUILD_ID;
const commitSha = process.env.REACT_APP_COMMIT_SHA || process.env.FIXLO_COMMIT_SHA;

console.log("FIXLO BUILD", { BUILD_ID: new Date().toISOString(), COMMIT_SHA: process.env.REACT_APP_COMMIT_SHA });

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