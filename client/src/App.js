import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import HowItWorks from "./pages/HowItWorks";
import Terms from "./pages/Terms";
import AdminDashboard from "./pages/AdminDashboard";
import ProDashboard from "./pages/ProDashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/pro/dashboard" element={<ProDashboard />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
