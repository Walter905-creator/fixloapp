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
      <Route path="/my-jobs" element={<CustomerPortalPage/>}/>
      <Route path="/pro/dashboard" element={
        <ProtectedRoute requiredRole="pro">
          <ProDashboardPage/>
        </ProtectedRoute>
      }/>
      <Route path="/contractor/dashboard" element={<ContractorDashboardPage/>}/>
      <Route path="/staff/jobs" element={<JobManagementPage/>}/>
      <Route path="/join" element={<JoinPage/>}/>
      <Route path="/terms" element={<Terms/>}/>
      <Route path="/privacy" element={<Privacy/>}/>
      <Route path="/privacy-policy" element={<Privacy/>}/>
      <Route path="/privacy-settings" element={<PrivacySettings/>}/>
      <Route path="/success" element={<Success/>}/>
      <Route path="/about-walter-arevalo" element={<AboutWalterArevaloPage/>}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
    <footer className="border-t border-slate-200 mt-8">
      <div className="container-xl py-6 text-sm text-slate-700 flex flex-col md:flex-row items-center justify-between gap-3">
        <div>© {new Date().getFullYear()} Fixlo. All rights reserved.</div>
        <div className="flex items-center gap-4">
          {false && (
            <a href="/sitemap.xml">Sitemap</a>
          )}
          <a href="/terms">Terms</a>
          <a href="/privacy-policy">Privacy Policy</a>
          <a href="/privacy-settings">Privacy Settings</a>
        </div>
      </div>
    </footer>
    <CookieConsent />
  </>);
}
