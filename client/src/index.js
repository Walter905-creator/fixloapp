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

// Add a loading fallback with progress indicator
const LoadingFallback = () => {
  const [loadingMessage, setLoadingMessage] = React.useState('Loading...');
  const [dots, setDots] = React.useState('');

  // Add animated loading dots
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Update loading message after a delay
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingMessage('Almost ready...');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
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
        <p style={{ color: '#666' }}>{loadingMessage}{dots}</p>
        <div style={{ 
          marginTop: '1rem',
          fontSize: '0.875rem',
          color: '#888'
        }}>
          Book Trusted Home Services Near You
        </div>
      </div>
    </div>
  );
};

// Enhanced initialization with timeout protection
const initializeApp = () => {
  let initTimeout;
  let isAppRendered = false;
  
  try {
    // Set a maximum time for app initialization
    initTimeout = setTimeout(() => {
      if (!isAppRendered) {
        console.warn('App initialization taking too long, showing fallback UI');
        root.render(<LoadingFallback />);
      }
    }, 5000); // Reduced to 5 second timeout for faster fallback

    // Render the app
    root.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );

    // Mark as successfully rendered and clear timeout
    isAppRendered = true;
    if (initTimeout) {
      clearTimeout(initTimeout);
    }
    
    console.log('✅ Fixlo app successfully initialized');
  } catch (error) {
    console.error('Failed to render React app:', error);
    if (initTimeout) {
      clearTimeout(initTimeout);
    }
    // Fallback to basic HTML if React fails
    root.render(<LoadingFallback />);
  }
};

// Initialize with retry mechanism and improved error handling
const maxRetries = 2; // Reduced from 3 for faster recovery
let retryCount = 0;
let globalRetryTimeout;

const tryInitialize = () => {
  try {
    initializeApp();
    console.log(`🎉 Fixlo initialized successfully on attempt ${retryCount + 1}`);
  } catch (error) {
    console.error(`App initialization failed (attempt ${retryCount + 1}):`, error);
    retryCount++;
    
    if (retryCount < maxRetries) {
      console.log(`🔄 Retrying initialization in 1 second...`);
      globalRetryTimeout = setTimeout(tryInitialize, 1000); // Reduced from 2 seconds
    } else {
      console.error('❌ Max retries reached, showing fallback UI');
      root.render(<LoadingFallback />);
      
      // Attempt final recovery after a longer delay
      setTimeout(() => {
        console.log('🔧 Attempting final recovery...');
        try {
          root.render(<LoadingFallback />);
        } catch (finalError) {
          console.error('Final recovery failed:', finalError);
        }
      }, 5000);
    }
  }
};

// Cleanup function for page unload
window.addEventListener('beforeunload', () => {
  if (globalRetryTimeout) {
    clearTimeout(globalRetryTimeout);
  }
});

tryInitialize();
