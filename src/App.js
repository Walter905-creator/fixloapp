import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import AnalyticsWrapper from './components/AnalyticsWrapper';
import UrgencyPopup from './components/UrgencyPopup';
import ExitIntentModal from './components/ExitIntentModal';
import StickyCTA from './components/StickyCTA';
import ServiceSelector from './components/ServiceSelector';

import HomePage from './components/HomePage';
import Admin from './components/Admin';

// Cache busting - show build info in console
const buildId = process.env.REACT_APP_BUILD_ID || 'dev';
console.log(`🚀 Fixlo App loaded - Build: ${buildId}`);

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <>
        {/* Conversion & UI Enhancement Components */}
        <UrgencyPopup />
        <ExitIntentModal />
        <StickyCTA />

        <Routes>
          {/* Homepage with full layout */}
          <Route
            path="/"
            element={
              <div className="app">
                <header className="header">
                  <img src="/assets/fixlo-logo.png" alt="Fixlo Logo" className="logo" />
                  <h1>Welcome to Fixlo</h1>
                  <p>Your one-stop hub for trusted professionals and home projects</p>
                </header>

                <section className="services">
                  <h2>Select a Service</h2>
                  <ServiceSelector />
                </section>

                <footer className="footer">
                  <p>&copy; {new Date().getFullYear()} Fixlo. All rights reserved.</p>
                  {/* Debug info for cache busting */}
                  {process.env.NODE_ENV === 'development' && (
                    <p style={{fontSize: '0.8em', opacity: 0.7}}>Build: {buildId}</p>
                  )}
                </footer>
              </div>
            }
          />

          {/* Admin dashboard route */}
          <Route path="/admin" element={<Admin />} />
        </Routes>

        {/* Google Ads + GA4 analytics, etc */}
        <AnalyticsWrapper />
      </>
    </Router>
  );
}

export default App;
