import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";

// Force cache invalidation on app load
const buildTimestamp = process.env.REACT_APP_BUILD_TIMESTAMP || Date.now();
const buildId = process.env.REACT_APP_BUILD_ID || 'dev-v1.0.1';

// Log deployment info for debugging
console.log(`🚀 Fixlo Deployment Info:`, {
  buildId,
  buildTimestamp,
  deployTime: new Date(parseInt(buildTimestamp) * 1000).toISOString(),
  version: '1.0.1-force-refresh'
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

// Add a loading fallback in case the app fails to load
const LoadingFallback = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }}>
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔧</div>
      <h1 style={{ fontSize: '1.5rem', color: '#333', marginBottom: '0.5rem' }}>
        Fixlo
      </h1>
      <p style={{ color: '#666' }}>Loading...</p>
    </div>
  </div>
);

try {
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
} catch (error) {
  console.error('Failed to render React app:', error);
  // Fallback to basic HTML if React fails
  root.render(<LoadingFallback />);
}
