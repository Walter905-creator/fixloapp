import React from "react";
import { Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

// Import new components
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";

// Import all pages
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import ServiceRequest from "./pages/ServiceRequest";
import ProSignup from "./pages/ProSignup";
import ProSignin from "./pages/ProSignin";
import ProLogin from "./pages/ProLogin";
import ProDashboard from "./pages/ProDashboard";
import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";
import ProGalleryPage from "./pages/ProGallery";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import HowItWorks from "./pages/HowItWorks";
import Contact from "./pages/Contact";
import AIAssistant from "./pages/AIAssistant";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Support from "./pages/Support";

// ---------- Layout (Header/Footer) ----------
function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

// ---------- 404 ----------
function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <h1 className="text-3xl font-bold mb-2">404</h1>
      <p className="mb-6 text-slate-600">Page not found.</p>
      <a href="/" className="rounded-xl px-4 py-2 bg-black text-white hover:opacity-90">
        Go Home
      </a>
    </div>
  );
}

// ---------- App ----------
export default function App() {
  console.log("[Fixlo] Router is rendering");
  return (
    <HelmetProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/request-service" element={<ServiceRequest />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:service" element={<ServiceDetail />} />
          <Route path="/services/:service/:city" element={<div className="p-8"><h2>Service by City Page</h2></div>} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/pro/signup" element={<ProSignup />} />
          <Route path="/pro/signin" element={<ProSignin />} />
          <Route path="/pro/login" element={<ProLogin />} />
          <Route path="/pro/dashboard" element={<ProDashboard />} />
          <Route path="/pro/gallery" element={<ProGalleryPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/support" element={<Support />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </HelmetProvider>
  );
}
