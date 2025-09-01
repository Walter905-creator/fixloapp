import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './routes/HomePage';
import ServicesPage from './routes/ServicesPage';
import HowItWorksPage from './routes/HowItWorksPage';
import AssistantPage from './routes/AssistantPage';
import ContactPage from './routes/ContactPage';
import PricingPage from './routes/PricingPage';
import ProSignInPage from './routes/ProSignInPage';
import AdminPage from './routes/AdminPage';
import ProDashboardPage from './routes/ProDashboardPage';
import JoinPage from './routes/JoinPage';
import ServicePage from './routes/ServicePage';
import TermsPage from './routes/TermsPage';
export default function App(){
  return (<>
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
      <Route path="/pro/sign-in" element={<ProSignInPage/>}/>
      <Route path="/admin" element={<AdminPage/>}/>
      <Route path="/pro/dashboard" element={<ProDashboardPage/>}/>
      <Route path="/join" element={<JoinPage/>}/>
      <Route path="/terms" element={<TermsPage/>}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
    <footer className="border-t border-white/10 mt-8">
      <div className="container-xl py-6 text-sm text-slate-400 flex flex-col md:flex-row items-center justify-between gap-3">
        <div>© {new Date().getFullYear()} Fixlo. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <a href="/sitemap.xml">Sitemap</a>
          <a href="/terms">Terms</a>
        </div>
      </div>
    </footer>
  </>);
}
