import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

console.log('Fixlo LIVE build OK', { BUILD_ID: process.env.REACT_APP_BUILD_ID, COMMIT_SHA: process.env.REACT_APP_COMMIT_SHA });

const root = document.getElementById('root');
if (root) {
  root.style.opacity='1';
  root.style.visibility='visible';
  const r = createRoot(root);
  r.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
} else {
  console.error('Root element not found');
}
