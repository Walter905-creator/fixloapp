import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

import ErrorBoundary from './components/ErrorBoundary';
import AnalyticsWrapper from './components/AnalyticsWrapper';
import UrgencyPopup from './components/UrgencyPopup';
import ExitIntentModal from './components/ExitIntentModal';
import StickyCTA from './components/StickyCTA';
import ServiceSelector from './components/ServiceSelector';
import LiveJobFeed from './components/LiveJobFeed';
import ReferralSystem from './components/ReferralSystem';
import DynamicLandingPageRoute from './components/DynamicLandingPageRoute';

import HomePage from './components/HomePage';
import Admin from './components/Admin';
import ProSignin from './components/ProSignin';
import ProSignup from './components/ProSignup';
import ProDashboard from './components/ProDashboard';
import ContactUs from './components/ContactUs';
import TermsOfService from './components/TermsOfService';
import HowItWorks from './components/HowItWorks';
import AIAssistant from './components/AIAssistant';
import ChatComponent from './components/ChatComponent';
import Navigation from './components/Navigation';
import Footer from './components/Footer';

// Cache busting - show build info in console
const buildId = process.env.REACT_APP_BUILD_ID || 'dev';
const buildTimestamp = process.env.REACT_APP_BUILD_TIMESTAMP || 'dev';
const deploymentForceRefresh = 'v1.0.1-fix-' + Date.now();
console.log(`🚀 Fixlo App loaded - Build: ${buildId} - Timestamp: ${buildTimestamp} - Deploy: ${deploymentForceRefresh}`);

function App() {
  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen flex flex-col">
          {/* Navigation */}
          <Navigation />
          
          {/* Conversion & UI Enhancement Components */}
          <UrgencyPopup />
          <ExitIntentModal />
          <StickyCTA />

          {/* Main Content */}
          <main className="flex-1">
            <Routes>
              {/* Homepage with full layout */}
              <Route
                path="/"
                element={
                  <div className="app">
                    <header className="header bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 px-4">
                      <div className="max-w-4xl mx-auto text-center">
                        <img src="./assets/fixlo-logo.png" alt="Fixlo Logo" className="logo mx-auto mb-4 h-16" />
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Fixlo</h1>
                        <p className="text-xl text-blue-100">Your one-stop hub for trusted professionals and home projects 🔧</p>
                      </div>
                    </header>

                    <section className="services py-16 px-4">
                      <div className="max-w-6xl mx-auto">
                        <h2 className="text-3xl font-bold text-center mb-12">Select a Service</h2>
                        <ServiceSelector />
                        
                        {/* Live Job Feed for conversion */}
                        <div className="mt-12">
                          <LiveJobFeed />
                        </div>
                        
                        {/* Referral System */}
                        <div className="mt-12 text-center">
                          <ReferralSystem />
                        </div>
                      </div>
                    </section>
                  </div>
                }
              />

              {/* Dynamic landing pages for city + service combinations */}
              <Route path="/services/:service" element={<DynamicLandingPageRoute />} />
              <Route path="/services/:service/:city" element={<DynamicLandingPageRoute />} />

              {/* Admin dashboard route */}
              <Route path="/admin" element={<Admin />} />

              {/* Professional dashboard route */}
              <Route path="/pro-dashboard" element={<ProDashboard />} />

              {/* Professional routes */}
              <Route path="/signup" element={<ProSignup />} />
              <Route path="/pro/signin" element={<ProSignin />} />
              <Route path="/pro/signup" element={<ProSignup />} />
              <Route path="/pro/dashboard" element={<ProDashboard />} />

              {/* New pages */}
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/ai-assistant" element={
                <div className="min-h-screen bg-gray-50 py-12 px-4">
                  <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                      <h1 className="text-3xl font-bold text-gray-900 mb-4">AI Home Improvement Assistant</h1>
                      <p className="text-lg text-gray-600">Get expert advice for your home projects</p>
                    </div>
                    <AIAssistant />
                  </div>
                </div>
              } />
              <Route path="/chat" element={
                <div className="min-h-screen bg-gray-50 py-12 px-4">
                  <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-center mb-8">Project Chat</h1>
                    <ChatComponent 
                      userId="demo-user" 
                      userName="Demo User" 
                      chatType="general" 
                    />
                  </div>
                </div>
              } />
            </Routes>
          </main>

          {/* Footer */}
          <Footer />

          {/* Google Ads + GA4 analytics, etc */}
          <AnalyticsWrapper />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
