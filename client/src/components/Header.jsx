// client/src/components/Header.jsx
import React from "react";
import { Link } from "react-router-dom";
import { BUILD_STAMP } from "../utils/buildInfo";

export default function Header() {

  return (
    <header className="w-full border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={`/assets/brand/fixlo-logo-2025.svg?v=${BUILD_STAMP}`}
            alt="Fixlo"
            className="h-8 w-auto md:h-9"
            style={{ display: "block" }}
          />
          <span className="sr-only">Fixlo</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-slate-700">
          <Link to="/services">Services</Link>
          <Link to="/how-it-works">How It Works</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/pro/signup" className="font-semibold">Join Now</Link>
        </nav>

        {/* Mobile CTA (always visible) */}
        <Link
          to="/pro/signup"
          className="md:hidden inline-flex items-center rounded-lg border px-3 py-2 text-sm font-semibold"
          style={{ borderColor: "#e2e8f0" }}
        >
          Join
        </Link>
      </div>
    </header>
  );
}