import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import axios from "axios";

import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Subscribe from "./pages/Subscribe";
import Terms from "./pages/Terms";
import TermsOfService from "./pages/TermsOfService";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import DownloadApp from "./pages/DownloadApp";
import HowItWorks from "./pages/HowItWorks";
import Support from "./pages/Support";
import Pricing from "./pages/Pricing";
import PricingPage from "./pages/PricingPage";
import SignUp from "./pages/SignUp";
import ProSupport from "./pages/ProSupport";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ContactSupport from "./pages/ContactSupport";
import PaymentSuccess from "./pages/PaymentSuccess";

// 🚀 New conversion-focused components
import GeoHeader from "./components/GeoHeader";
import UrgencyPopup from "./components/UrgencyPopup";
import LiveJobFeed from "./components/LiveJobFeed";
import ExitIntentModal from "./components/ExitIntentModal";
import StickySignupBar from "./components/StickySignupBar";
import StickyMobileCTA from "./components/StickyMobileCTA";

// 🛡️ Import Fixlo Shield client-side security
import './shield/guard';

function App() {
  useEffect(() => {
    console.log("🔥 LIVE DEPLOY: Fixlo main loaded");
    const API_URL = process.env.REACT_APP_API_URL || 'https://fixloapp.onrender.com';
    
    axios
      .get(`${API_URL}/api`)
      .then((res) => console.log('Backend connected:', res.data.message))
      .catch(() => console.log("Error connecting to backend"));
  }, []);

  return (
    <Router>
      <div style={{ fontFamily: "sans-serif" }}>
        <Navbar />
        
        {/* 🚀 Conversion-focused UX components */}
        <GeoHeader />
        <UrgencyPopup />
        <LiveJobFeed />
        <ExitIntentModal />
        <StickySignupBar />
        <StickyMobileCTA />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/download" element={<DownloadApp />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/support" element={<Support />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/pro-pricing" element={<PricingPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/pro-support" element={<ProSupport />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/contact" element={<ContactSupport />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/subscribe" element={<Subscribe />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
