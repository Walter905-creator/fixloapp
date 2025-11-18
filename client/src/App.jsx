import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PromoBanner from './components/PromoBanner';
import ProBanner from './components/ProBanner';
import FreeTrialBanner from './components/FreeTrialBanner';
import CookieConsent from './components/CookieConsent';
import Navbar from './components/Navbar';
import HomePage from './routes/HomePage.jsx';
import ServicesPage from './routes/ServicesPage.jsx';
import HowItWorksPage from './routes/HowItWorksPage.jsx';
import AssistantPage from './routes/AssistantPage.jsx';
import ContactPage from './routes/ContactPage.jsx';
import PricingPage from './routes/PricingPage.jsx';
import ProSignInPage from './routes/ProSignInPage.jsx';
import AdminPage from './routes/AdminPage.jsx';
import ProDashboardPage from './routes/ProDashboardPage.jsx';
import JoinPage from './routes/JoinPage.jsx';
import ServicePage from './routes/ServicePage.jsx';
import SEOPageLoader from './routes/SEOPageLoader.jsx';
import Terms from './pages/Terms.jsx';
import Privacy from './pages/Privacy.jsx';
import PrivacySettings from './pages/PrivacySettings.jsx';
import Success from './pages/Success.jsx';
import SignupPage from './routes/SignupPage.jsx';
import ProSignupPage from './routes/ProSignupPage.jsx';
export default function App(){
  return (<>
    <PromoBanner />
    <ProBanner />
    <FreeTrialBanner />
    <Navbar/>
    <Routes>
      <Route path="/" element={<HomePage/>}/>
      <Route path="/services" element={<ServicesPage/>}/>
      <Route path="/services/:service" element={<ServicePage/>}/>
      <Route path="/services/:service/:city" element={<SEOPageLoader/>}/>
      <Route path="/services/:service/:city/es" element={<SEOPageLoader lang="es"/>}/>
      <Route path="/how-it-works" element={<HowItWorksPage/>}/>
      <Route path="/assistant" element={<AssistantPage/>}/>
      <Route path="/contact" element={<ContactPage/>}/>
      <Route path="/pricing" element={<PricingPage/>}/>
      <Route path="/signup" element={<SignupPage/>}/>
      <Route path="/pro/signup" element={<ProSignupPage/>}/>
      <Route path="/pro/sign-in" element={<ProSignInPage/>}/>
      <Route path="/admin" element={<AdminPage/>}/>
      <Route path="/pro/dashboard" element={<ProDashboardPage/>}/>
      <Route path="/join" element={<JoinPage/>}/>
      <Route path="/terms" element={<Terms/>}/>
      <Route path="/privacy" element={<Privacy/>}/>
      <Route path="/privacy-policy" element={<Privacy/>}/>
      <Route path="/privacy-settings" element={<PrivacySettings/>}/>
      <Route path="/success" element={<Success/>}/>
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
