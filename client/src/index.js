import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';                // <-- loads Tailwind
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const rootEl = document.getElementById("root");
const root = ReactDOM.createRoot(rootEl);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
