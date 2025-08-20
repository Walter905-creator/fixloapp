import React from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { forceUnhide } from './utils/forceUnhide';

const rootEl = document.getElementById('root');
if (!rootEl) {
  console.error('[Fixlo] #root not found — index.html must have <div id="root"></div>');
}
const root = createRoot(rootEl);

forceUnhide(); // ensure nothing hides the shell

console.log('Fixlo LIVE build OK', {
  BUILD_ID: process.env.REACT_APP_BUILD_ID,
  COMMIT_SHA: process.env.REACT_APP_COMMIT_SHA
});

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);

// No serviceWorker; ensure nothing unregisters after mount