import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import HowItWorks from "./pages/HowItWorks";
import Terms from "./pages/Terms";
import AdminDashboard from "./pages/AdminDashboard";
import ProDashboard from "./pages/ProDashboard";
import AIAssistant from "./pages/AIAssistant";
import Contact from "./pages/Contact";
import ProSignIn from "./pages/ProSignIn";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/assistant" element={<AIAssistant />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/pro/signin" element={<ProSignIn />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/pro/dashboard" element={<ProDashboard />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
