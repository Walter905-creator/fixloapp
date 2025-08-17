import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Home from './pages/Home';
import Signup from './pages/Signup';
import HowItWorks from './pages/HowItWorks';
import Contact from './pages/Contact';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import ServiceCityPage from './pages/ServiceCityPage';
import ProSignup from './pages/ProSignup';
import ProProfile from './pages/ProProfile';
import ReviewCapture from './pages/ReviewCapture';
import ReviewPublic from './pages/ReviewPublic';
import NotFound from './pages/NotFound';
import Header from './components/Header';
import AnalyticsWrapper from './components/AnalyticsWrapper';
import { BUILD_INFO } from './buildInfo';

export default function App() {
  return (
    <>
      <Helmet>
        <meta name="fixlo-build-id" content={BUILD_INFO.BUILD_ID} />
        <meta name="fixlo-commit-sha" content={BUILD_INFO.COMMIT_SHA} />
      </Helmet>
      <AnalyticsWrapper />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:service" element={<ServiceDetail />} />
        <Route path="/services/:service/:city" element={<ServiceCityPage />} />
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