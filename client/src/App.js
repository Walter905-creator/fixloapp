import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';

import ErrorBoundary from './components/ErrorBoundary';
import AnalyticsWrapper from './components/AnalyticsWrapper';
import UrgencyPopup from './components/UrgencyPopup';
import ExitIntentModal from './components/ExitIntentModal';
import StickyCTA from './components/StickyCTA';
import ServiceSelector from './components/ServiceSelector';
import LiveJobFeed from './components/LiveJobFeed';
import ReferralSystem from './components/ReferralSystem';
import DynamicLandingPageRoute from './components/DynamicLandingPageRoute';
import SEOHead from './components/SEOHead';

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
import FixloLogo from './components/FixloLogo';
import NotFound from './components/NotFound';
import URLRedirectHandler from './components/URLRedirectHandler';

import PublicProfileWrapper from './pages/PublicProfileWrapper';
=======
import PublicProfileWrapper from './pages/profiles/PublicProfileWrapper';
 main

// Cache busting - show build info in console
const buildId = process.env.REACT_APP_BUILD_ID || 'dev';
const buildTimestamp = process.env.REACT_APP_BUILD_TIMESTAMP || 'dev';
const deploymentForceRefresh = 'v1.0.1-fix-' + Date.now();
console.log(`🚀 Fixlo App loaded - Build: ${buildId} - Timestamp: ${buildTimestamp} - Deploy: ${deploymentForceRefresh}`);

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <Router>
        <div className="min-h-screen flex flex-col">
          {/* URL Redirect Handler */}
          <URLRedirectHandler />
          
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
                  <>
                    <SEOHead 
                      title="Fixlo – Book Trusted Home Services Near You"
                      description="Fixlo connects homeowners with trusted pros for plumbing, electrical, junk removal & more. Fast, easy, nationwide."
                      url="https://www.fixloapp.com/"
                    />
                    <div className="app">
                    <header className="header bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 px-4">
                      <div className="max-w-4xl mx-auto text-center">
                        <div className="text-center my-6">
                          <FixloLogo />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Fixlo</h1>
                        <p className="text-xl text-blue-100">Your one-stop hub for trusted professionals and home projects 🔧</p>
                      </div>
                    </header>

                    <section className="services py-16 px-4">
                      <div className="max-w-6xl mx-auto">
                        <h2 className="text-3xl font-bold text-center mb-12">Select a Service</h2>
                        <ServiceSelector />
                        
                        {/* Homepage CTA to signup */}
                        <div className="text-center mt-12">
                          <a 
                            href="/signup" 
                            className="inline-block bg-orange-500 text-white py-3 px-6 rounded-lg text-lg font-semibold shadow-lg hover:bg-orange-600 transition"
                          >
                            🧰 Join Fixlo Now – Claim Your Area
                          </a>
                        </div>
                        
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
                  </>
                }
              />

              {/* Dynamic landing pages for city + service combinations */}
              <Route path="/services/:service" element={<DynamicLandingPageRoute />} />
              <Route path="/services/:service/:city" element={<DynamicLandingPageRoute />} />

              {/* Admin dashboard route - noindex for security */}
              <Route path="/admin" element={
                <>
                  <Helmet>
                    <meta name="robots" content="noindex, nofollow" />
                    <title>Admin Dashboard - Fixlo</title>
                  </Helmet>
                  <Admin />
                </>
              } />

              {/* Professional dashboard route - noindex for privacy */}
              <Route path="/pro-dashboard" element={
                <>
                  <Helmet>
                    <meta name="robots" content="noindex, nofollow" />
                    <title>Professional Dashboard - Fixlo</title>
                  </Helmet>
                  <ProDashboard />
                </>
              } />

              {/* Professional routes with SEO */}
              <Route path="/pro/:slug" element={
                <>
                  <SEOHead 
                    title="Professional Profile - Fixlo"
                    description="View professional profile and reviews on Fixlo. Book trusted home service professionals in your area."
                    url="https://www.fixloapp.com/pro/"
                  />
                  <PublicProfileWrapper />
                </>
              } />
              <Route path="/signup" element={
                <>
                  <SEOHead 
                    title="Join Fixlo as a Professional - Start Getting Customers Today"
                    description="Join Fixlo's network of trusted home service professionals. Get connected with customers in your area for plumbing, electrical, and more."
                    url="https://www.fixloapp.com/signup"
                  />
                  <ProSignup />
                </>
              } />
              <Route path="/pro/signin" element={
                <>
                  <SEOHead 
                    title="Professional Sign In - Fixlo"
                    description="Sign in to your Fixlo professional account to manage bookings and connect with customers."
                    url="https://www.fixloapp.com/pro/signin"
                  />
                  <ProSignin />
                </>
              } />
              <Route path="/pro/signup" element={
                <>
                  <SEOHead 
                    title="Professional Signup - Fixlo"
                    description="Sign up as a professional on Fixlo and start connecting with customers who need your services."
                    url="https://www.fixloapp.com/pro/signup"
                  />
                  <ProSignup />
                </>
              } />
              <Route path="/pro/dashboard" element={
                <>
                  <SEOHead 
                    title="Professional Dashboard - Fixlo"
                    description="Manage your Fixlo professional account, view bookings, and connect with customers."
                    url="https://www.fixloapp.com/pro/dashboard"
                  />
                  <ProDashboard />
                </>
              } />

              {/* Contact route with SEO */}
              <Route path="/contact" element={
                <>
                  <SEOHead 
                    title="Contact Fixlo - Get Support for Home Services"
                    description="Contact Fixlo for support with home service bookings, professional inquiries, or technical assistance. Available 24/7."
                    url="https://www.fixloapp.com/contact"
                  />
                  <ContactUs />
                </>
              } />
              
              {/* Terms route with SEO */}
              <Route path="/terms" element={
                <>
                  <SEOHead 
                    title="Terms of Service - Fixlo"
                    description="Read Fixlo's terms of service for home service professionals and homeowners."
                    url="https://www.fixloapp.com/terms"
                  />
                  <TermsOfService />
                </>
              } />
              
              {/* How it works route with SEO */}
              <Route path="/how-it-works" element={
                <>
                  <SEOHead 
                    title="How Fixlo Works - Connect with Trusted Home Service Pros"
                    description="Learn how Fixlo connects homeowners with verified professionals for plumbing, electrical, and other home services."
                    url="https://www.fixloapp.com/how-it-works"
                  />
                  <HowItWorks />
                </>
              } />
              <Route path="/ai-assistant" element={
                <>
                  <SEOHead 
                    title="AI Home Improvement Assistant - Get Expert Advice | Fixlo"
                    description="Get free expert advice for your home improvement projects with Fixlo's AI assistant. Ask questions about plumbing, electrical, and more."
                    url="https://www.fixloapp.com/ai-assistant"
                  />
                  <div className="min-h-screen bg-gray-50 py-12 px-4">
                    <div className="max-w-4xl mx-auto">
                      <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">AI Home Improvement Assistant</h1>
                        <p className="text-lg text-gray-600">Get expert advice for your home projects</p>
                      </div>
                      <AIAssistant />
                    </div>
                  </div>
                </>
              } />
              <Route path="/chat" element={
                <>
                  <SEOHead 
                    title="Project Chat - Connect with Professionals | Fixlo"
                    description="Chat with home service professionals on Fixlo. Get real-time answers to your project questions."
                    url="https://www.fixloapp.com/chat"
                  />
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
                </>
              } />

              {/* Public Profile Pages */}
              <Route path="/pro/:slug" element={
                <>
                  <PublicProfileWrapper />
                </>
              } />
              
              {/* Catch all route for 404 errors */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          {/* Footer */}
          <Footer />

          {/* Google Ads + GA4 analytics, etc */}
          <AnalyticsWrapper />
        </div>
      </Router>
    </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
