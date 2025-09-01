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
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
    <footer>© {new Date().getFullYear()} Fixlo</footer>
  </>);
}
