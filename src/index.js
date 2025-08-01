import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Force cache invalidation on app load
const buildTimestamp = process.env.REACT_APP_BUILD_TIMESTAMP || Date.now();
const buildId = process.env.REACT_APP_BUILD_ID || 'dev';

// Log deployment info for debugging
console.log(`🚀 Fixlo Deployment Info:`, {
  buildId,
  buildTimestamp,
  deployTime: new Date(parseInt(buildTimestamp) * 1000).toISOString()
});

// Clear any stale caches when new build is detected
const lastBuildId = localStorage.getItem('fixlo_build_id');
if (lastBuildId && lastBuildId !== buildId) {
  console.log('🔄 New build detected, clearing caches...');
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
  localStorage.clear();
  sessionStorage.clear();
}
localStorage.setItem('fixlo_build_id', buildId);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
