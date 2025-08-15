import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Signup from './pages/Signup';
import HowItWorks from './pages/HowItWorks';
import Contact from './pages/Contact';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import ProSignup from './pages/ProSignup';
import ProProfile from './pages/ProProfile';
import ReviewCapture from './pages/ReviewCapture';
import ReviewPublic from './pages/ReviewPublic';
import NotFound from './pages/NotFound';
import Header from './components/Header';

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:service" element={<ServiceDetail />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pro/signup" element={<ProSignup />} />
        <Route path="/pro/:slug" element={<ProProfile />} />
        <Route path="/review/:token" element={<ReviewCapture />} />
        <Route path="/review/public/:reviewId" element={<ReviewPublic />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}