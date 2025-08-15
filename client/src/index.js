import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingFallback from "./components/LoadingFallback";

// Enhanced build info logging
const buildId = process.env.REACT_APP_BUILD_ID || 'dev';
const buildTimestamp = process.env.REACT_APP_BUILD_TIMESTAMP || Date.now();
const deploymentForceRefresh = 'v1.0.2-enhanced-' + Date.now();

console.log(`🚀 Fixlo App initialization started - Build: ${buildId} - Timestamp: ${buildTimestamp} - Deploy: ${deploymentForceRefresh}`);

// Mark React as loaded immediately when the script starts executing
// This prevents the HTML timeout from triggering prematurely
if (window.markReactLoaded) {
  window.markReactLoaded();
  console.log('✅ React script execution started, initial timeout cleared');
}

// Enhanced cache management
const lastBuildId = localStorage.getItem('fixlo_build_id');
if (lastBuildId && lastBuildId !== buildId) {
  console.log('🔄 New build detected, clearing cache...');
  try {
    localStorage.clear();
    sessionStorage.clear();
    // Clear service worker cache if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
  } catch (error) {
    console.warn('⚠️ Cache clearing failed:', error);
  }
}
localStorage.setItem('fixlo_build_id', buildId);

// Enhanced app initialization with timeout and retry mechanisms
let initializationComplete = false;
let retryCount = 0;
const MAX_RETRIES = 3;
const INITIALIZATION_TIMEOUT = 8000; // 8 seconds - gives enough time before HTML timeout

function initializeApp() {
  const startTime = Date.now();
  console.log(`🚀 Attempting Fixlo initialization (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);

  try {
    // Get root element with validation
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error("Root element not found");
    }

    const root = ReactDOM.createRoot(rootElement);
    let loadingFallbackTimer;
    let initializationTimer;

    // Show loading fallback initially
    root.render(
      <ErrorBoundary>
        <LoadingFallback 
          onTimeout={() => {
            console.warn('⏰ Loading timeout reached, attempting recovery...');
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              setTimeout(() => initializeApp(), 1000); // 1 second retry delay
            } else {
              console.error('❌ Max retries reached, showing error state');
              root.render(
                <ErrorBoundary>
                  <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f8fafc',
                    fontFamily: 'system-ui, sans-serif',
                    textAlign: 'center',
                    padding: '2rem'
                  }}>
                    <div>
                      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
                      <h2 style={{ color: '#e53e3e', marginBottom: '1rem' }}>Unable to Load Application</h2>
                      <p style={{ color: '#718096', marginBottom: '1.5rem' }}>
                        Fixlo is experiencing technical difficulties. Please try refreshing the page.
                      </p>
                      <button 
                        onClick={() => window.location.reload()} 
                        style={{
                          backgroundColor: '#667eea',
                          color: 'white',
                          border: 'none',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          fontWeight: '500'
                        }}
                      >
                        Refresh Page
                      </button>
                    </div>
                  </div>
                </ErrorBoundary>
              );
            }
          }}
          timeoutDuration={INITIALIZATION_TIMEOUT}
        />
      </ErrorBoundary>
    );

    // Simulate proper app loading with validation
    setTimeout(() => {
      try {
        // Render the actual app
        root.render(
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        );

        const endTime = Date.now();
        const loadTime = endTime - startTime;
        
        initializationComplete = true;
        console.log(`✅ Fixlo app successfully initialized in ${loadTime}ms`);
        console.log(`🎉 Fixlo initialized successfully on attempt ${retryCount + 1}`);
        
        // Mark React as loaded for the initial loader
        if (window.markReactLoaded) {
          window.markReactLoaded();
        }
        
        // Clear any pending timers
        if (loadingFallbackTimer) clearTimeout(loadingFallbackTimer);
        if (initializationTimer) clearTimeout(initializationTimer);
        
      } catch (error) {
        console.error('❌ App rendering failed:', error);
        throw error;
      }
    }, 100); // Small delay to ensure smooth transition

    // Fallback timeout for edge cases
    initializationTimer = setTimeout(() => {
      if (!initializationComplete) {
        console.warn('⏰ Initialization timeout, forcing app render...');
        try {
          root.render(
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          );
          initializationComplete = true;
          console.log('✅ Fixlo app initialized via fallback mechanism');
          
          // Mark React as loaded for the initial loader
          if (window.markReactLoaded) {
            window.markReactLoaded();
          }
        } catch (error) {
          console.error('❌ Fallback rendering failed:', error);
        }
      }
    }, INITIALIZATION_TIMEOUT);

  } catch (error) {
    console.error(`❌ Initialization failed (attempt ${retryCount + 1}):`, error);
    
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`🔄 Retrying initialization in 1 second... (${retryCount}/${MAX_RETRIES})`);
      setTimeout(() => initializeApp(), 1000);
    } else {
      console.error('❌ Max initialization retries reached');
      // Final fallback - try basic render
      try {
        const rootElement = document.getElementById("root");
        if (rootElement) {
          const root = ReactDOM.createRoot(rootElement);
          root.render(
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          );
          
          // Mark React as loaded for the initial loader
          if (window.markReactLoaded) {
            window.markReactLoaded();
          }
        }
      } catch (finalError) {
        console.error('❌ Final fallback failed:', finalError);
      }
    }
  }
}

// Enhanced cleanup for page visibility changes (replaces deprecated unload events)
function cleanup() {
  console.log('🧹 Cleaning up Fixlo app resources...');
  initializationComplete = false;
  retryCount = 0;
  
  // Clear any timers or intervals that might be running
  try {
    // Clear localStorage if needed
    const shouldClearOnExit = localStorage.getItem('fixlo_clear_on_exit');
    if (shouldClearOnExit === 'true') {
      localStorage.removeItem('fixlo_clear_on_exit');
    }
  } catch (error) {
    console.warn('⚠️ Cleanup warning:', error);
  }
}

// Modern alternative to deprecated unload events - use visibilitychange and beforeunload
// Only use beforeunload for critical cleanup (data loss prevention)
window.addEventListener('beforeunload', (event) => {
  // Only prevent default if there's unsaved data
  const hasUnsavedData = localStorage.getItem('fixlo_has_unsaved_data');
  if (hasUnsavedData === 'true') {
    // This will show browser's default confirmation dialog
    event.preventDefault();
    return '';
  }
});

// Use visibilitychange for cleanup instead of deprecated unload event
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    // Page is becoming hidden - perform cleanup
    cleanup();
  }
});

// Enhanced error handling for uncaught errors
window.addEventListener('error', (event) => {
  console.error('🧨 Uncaught error:', event.error);
  // Don't reload automatically, let ErrorBoundary handle it
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🧨 Unhandled promise rejection:', event.reason);
  // Don't reload automatically, let ErrorBoundary handle it
});

// Start the enhanced initialization process
console.log('🎯 Starting enhanced Fixlo initialization...');
initializeApp();
