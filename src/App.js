import { Analytics } from '@vercel/analytics/react';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import AnalyticsWrapper from './components/AnalyticsWrapper';
import UrgencyPopup from './components/UrgencyPopup';
import ExitIntentModal from './components/ExitIntentModal';
import StickyCTA from './components/StickyCTA';
import ServiceSelector from './components/ServiceSelector';
import LiveJobFeed from './components/LiveJobFeed';
import ReferralSystem from './components/ReferralSystem';
import DynamicLandingPageRoute from './components/DynamicLandingPageRoute';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';

import HomePage from './components/HomePage';
import Admin from './components/Admin';

// Cache busting - show build info in console
const buildId = process.env.REACT_APP_BUILD_ID || 'dev';
const deploymentForceRefresh = 'v1.0.1-fix-' + Date.now();
console.log(`🚀 Fixlo App loaded - Build: ${buildId} - Deploy: ${deploymentForceRefresh}`);

function App() {
  return (
    <Router>
      <>
        {/* Conversion & UI Enhancement Components */}
        <UrgencyPopup />
        <ExitIntentModal />
        <StickyCTA />
        <ReferralSystem />
        <LiveJobFeed />

        <Routes>
          {/* Homepage */}
          <Route
            path="/"
            element={
              <div className="app">
                <header className="header">
                  <img src="/assets/fixlo-logo.png" alt="Fixlo Logo" className="logo" />
                  <h1>Welcome to Fixlo</h1>
                  <p>Your one-stop hub for trusted professionals and home projects 🔧</p>
                </header>

                <section className="services">
                  <h2>Select a Service</h2>
                  <ServiceSelector />
                </section>

                <Features />
                <HowItWorks />
                <Footer />
              </div>
            }
          />

          {/* Admin Panel */}
          <Route path="/admin/*" element={<Admin />} />

          {/* Dynamic Landing Pages for SEO */}
          <Route path="/services/:serviceName-in-:cityName" element={<DynamicLandingPageRoute />} />
        </Routes>

        <AnalyticsWrapper />
        <Analytics />
      </>
    </Router>
  );
}

export default App;
