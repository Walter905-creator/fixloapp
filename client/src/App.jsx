// client/src/App.jsx
import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import ProSignup from "./pages/ProSignup";
import ProGallery from "./pages/ProGallery";
import HowItWorks from "./pages/HowItWorks";
import Contact from "./pages/Contact";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function App() {
  console.log("[Fixlo] Router is rendering");
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <React.Suspense fallback={
        <div style={{ padding: "2rem" }}>Loading…</div>
      }>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:service" element={<ServiceDetail />} />
          <Route path="/pro/signup" element={<ProSignup />} />
          <Route path="/pro/gallery" element={<ProGallery />} />
          <Route
            path="*"
            element={
              <div className="container" style={{ padding: "5rem 0" }}>
                <h1 className="text-3xl font-bold mb-4">404</h1>
                <p className="mb-6">Page not found.</p>
                <Link to="/" className="btn btn-primary">Go Home</Link>
              </div>
            }
          />
        </Routes>
      </React.Suspense>
      <Footer />
    </div>
  );
}
