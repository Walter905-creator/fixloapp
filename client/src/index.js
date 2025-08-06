import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";

// Simple build info logging
const buildId = process.env.REACT_APP_BUILD_ID || 'dev';
const buildTimestamp = process.env.REACT_APP_BUILD_TIMESTAMP || Date.now();
console.log(`🚀 Fixlo App loaded - Build: ${buildId} - Timestamp: ${buildTimestamp}`);

// Simple cache management - only clear if build changes
const lastBuildId = localStorage.getItem('fixlo_build_id');
if (lastBuildId && lastBuildId !== buildId) {
  console.log('🔄 New build detected, clearing cache...');
  localStorage.clear();
}
localStorage.setItem('fixlo_build_id', buildId);

// Get root element and render app
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
