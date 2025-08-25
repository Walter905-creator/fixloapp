// client/src/App.jsx
import React, { useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { BUILD_STAMP } from "./utils/buildInfo";
import Header from "./components/Header";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import ProSignup from "./pages/ProSignup";
import ProGallery from "./pages/ProGallery";

export default function App() {
  useEffect(() => {
    console.log("Fixlo LIVE build OK", { BUILD_ID: BUILD_STAMP });
    // Force-unhide root (in case any legacy CSS tries to hide it)
    const root = document.getElementById("root");
    if (root) {
      root.style.opacity = "1";
      root.style.visibility = "visible";
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pro/signup" element={<ProSignup />} />
        <Route path="/pro/gallery" element={<ProGallery />} />
        <Route
          path="*"
          element={
            <div className="container" style={{ padding: "5rem 0" }}>
              <h1 className="text-3xl font-bold mb-4">404</h1>
              <p className="mb-6">Page not found.</p>
              <Link to="/" className="rounded-lg border px-4 py-2">
                Go Home
              </Link>
            </div>
          }
        />
      </Routes>
    </div>
  );
}
