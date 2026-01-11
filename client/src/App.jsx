import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PromoBanner from './components/PromoBanner';
import ProBanner from './components/ProBanner';
import CookieConsent from './components/CookieConsent';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './routes/HomePage.jsx';
import ServicesPage from './routes/ServicesPage.jsx';
import HowItWorksPage from './routes/HowItWorksPage.jsx';
import AssistantPage from './routes/AssistantPage.jsx';
import ContactPage from './routes/ContactPage.jsx';
import PricingPage from './routes/PricingPage.jsx';
import ProSignInPage from './routes/ProSignInPage.jsx';
import ProForgotPasswordPage from './routes/ProForgotPasswordPage.jsx';
import ProResetPasswordPage from './routes/ProResetPasswordPage.jsx';
import AdminPage from './routes/AdminPage.jsx';
import AdminJobsPage from './routes/AdminJobsPage.jsx';
import AdminSocialMediaPage from './routes/AdminSocialMediaPage.jsx';
import ProDashboardPage from './routes/ProDashboardPage.jsx';
import ContractorDashboardPage from './routes/ContractorDashboardPage.jsx';
import JoinPage from './routes/JoinPage.jsx';
import ServicePage from './routes/ServicePage.jsx';
import JobManagementPage from './routes/JobManagementPage.jsx';
import CustomerPortalPage from './routes/CustomerPortalPage.jsx';
import CountryPage from './routes/CountryPage.jsx';
import Terms from './pages/Terms.jsx';
import Privacy from './pages/Privacy.jsx';
import PrivacySettings from './pages/PrivacySettings.jsx';
import Success from './pages/Success.jsx';
import SignupPage from './routes/SignupPage.jsx';
import ProSignupPage from './routes/ProSignupPage.jsx';
import AboutWalterArevaloPage from './routes/AboutWalterArevaloPage.jsx';
import AboutPage from './routes/AboutPage.jsx';
import TrendServicePage from './routes/TrendServicePage.jsx';
import CompetitorAlternativesPage from './routes/CompetitorAlternativesPage.jsx';
export default function App(){
  return (<>
    <PromoBanner />
    <ProBanner />
    <Navbar/>
    <Routes>
      <Route path="/" element={<HomePage/>}/>
      <Route path="/services" element={<ServicesPage/>}/>
      <Route path="/services/:service" element={<ServicePage/>}/>
      <Route path="/services/:service/:city" element={<ServicePage/>}/>
      
      {/* Trend-based SEO landing pages */}
      <Route path="/:trend/:service" element={<TrendServicePage/>}/>
      
      {/* Competitor alternatives pages */}
      <Route path="/alternatives-to-:competitor" element={<CompetitorAlternativesPage/>}/>
      <Route path="/:competitor-alternatives" element={<CompetitorAlternativesPage/>}/>
      <Route path="/:competitor-competitors" element={<CompetitorAlternativesPage/>}/>
      <Route path="/best-:competitor-alternative" element={<CompetitorAlternativesPage/>}/>
      
      <Route path="/how-it-works" element={<HowItWorksPage/>}/>
      <Route path="/assistant" element={<AssistantPage/>}/>
      <Route path="/contact" element={<ContactPage/>}/>
      <Route path="/pricing" element={<PricingPage/>}/>
      <Route path="/country/:countryCode" element={<CountryPage/>}/>
      <Route path="/signup" element={<SignupPage/>}/>
      <Route path="/pro/signup" element={<ProSignupPage/>}/>
      <Route path="/pro/sign-in" element={<ProSignInPage/>}/>
      <Route path="/pro/forgot-password" element={<ProForgotPasswordPage/>}/>
      <Route path="/pro/reset-password" element={<ProResetPasswordPage/>}/>
      <Route path="/admin" element={<AdminPage/>}/>
      <Route path="/admin/jobs" element={<AdminJobsPage/>}/>
      <Route path="/admin/social-media" element={<AdminSocialMediaPage/>}/>
      <Route path="/my-jobs" element={<CustomerPortalPage/>}/>
      <Route path="/pro/dashboard" element={
        <ProtectedRoute requiredRole="pro">
          <ProDashboardPage/>
        </ProtectedRoute>
      }/>
      <Route path="/contractor/dashboard" element={<ContractorDashboardPage/>}/>
      <Route path="/staff/jobs" element={<JobManagementPage/>}/>
      <Route path="/join" element={<JoinPage/>}/>
      <Route path="/for-professionals" element={<Navigate to="/join" replace/>}/>
      <Route path="/terms" element={<Terms/>}/>
      <Route path="/privacy" element={<Privacy/>}/>
      <Route path="/privacy-policy" element={<Privacy/>}/>
      <Route path="/privacy-settings" element={<PrivacySettings/>}/>
      <Route path="/success" element={<Success/>}/>
      <Route path="/about" element={<AboutPage/>}/>
      <Route path="/about-walter-arevalo" element={<AboutWalterArevaloPage/>}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
    <footer className="border-t border-slate-200 mt-8 bg-white">
      <div className="container-xl py-8">
        <div className="grid md:grid-cols-4 gap-8 mb-6">
          {/* About Column */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">About Fixlo</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li><a href="/about" className="hover:text-brand">About Us</a></li>
              <li><a href="/how-it-works" className="hover:text-brand">How It Works</a></li>
              <li><a href="/contact" className="hover:text-brand">Contact</a></li>
            </ul>
          </div>
          
          {/* For Professionals Column */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">For Professionals</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li><a href="/join" className="hover:text-brand">Join as a Pro</a></li>
              <li><a href="/pro/sign-in" className="hover:text-brand">Pro Sign In</a></li>
              <li><a href="/how-it-works" className="hover:text-brand">How Fixlo Works</a></li>
            </ul>
          </div>
          
          {/* Popular Services Column */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Popular Services</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li><a href="/services/plumbing" className="hover:text-brand">Plumbing</a></li>
              <li><a href="/services/electrical" className="hover:text-brand">Electrical</a></li>
              <li><a href="/services/hvac" className="hover:text-brand">HVAC</a></li>
              <li><a href="/services/cleaning" className="hover:text-brand">Cleaning</a></li>
              <li><a href="/services" className="hover:text-brand">View All Services</a></li>
            </ul>
          </div>
          
          {/* Legal Column */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li><a href="/terms" className="hover:text-brand">Terms of Service</a></li>
              <li><a href="/privacy-policy" className="hover:text-brand">Privacy Policy</a></li>
              <li><a href="/privacy-settings" className="hover:text-brand">Privacy Settings</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-6 border-t border-slate-200 text-sm text-slate-700 flex flex-col md:flex-row items-center justify-between gap-3">
          <div>© {new Date().getFullYear()} Fixlo. All rights reserved.</div>
          <div className="text-slate-600">
            Trusted home services marketplace serving the United States
          </div>
        </div>
      </div>
    </footer>
    <CookieConsent />
  </>);
}
