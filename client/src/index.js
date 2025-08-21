import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';                // <-- loads Tailwind
import AppFixed from './AppFixed';

const rootEl = document.getElementById("root");
const root = ReactDOM.createRoot(rootEl);
root.render(
  <React.StrictMode>
    <AppFixed />
  </React.StrictMode>
);
