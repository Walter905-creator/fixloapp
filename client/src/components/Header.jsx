import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-200"
      style={{
        paddingTop: "env(safe-area-inset-top)",   // iOS notch
      }}
    >
      <nav className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          {/* Left: Brand */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src="/assets/brand/fixlo-logo-2025.svg?v=2025-08-20"
              onError={(e) => { e.currentTarget.src = "/assets/brand/fixlo-logo-2025.png?v=2025-08-20"; }}
              alt="Fixlo"
              className="header-logo h-7 md:h-8 w-auto block"
              fetchPriority="high"
            />
            <span className="font-semibold text-slate-900 hidden sm:inline">
              Fixlo
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/services" className="text-slate-700 hover:text-slate-900">
              Services
            </NavLink>
            <NavLink to="/how-it-works" className="text-slate-700 hover:text-slate-900">
              How It Works
            </NavLink>
            <NavLink to="/ai-assistant" className="text-slate-700 hover:text-slate-900">
              AI Assistant
            </NavLink>
            <NavLink to="/contact" className="text-slate-700 hover:text-slate-900">
              Contact
            </NavLink>

            {/* Desktop primary CTA */}
            <Link
              to="/pro/signup"
              className="ml-2 rounded-xl px-4 py-2 bg-slate-900 text-white hover:bg-slate-800"
            >
              Join Now
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden inline-flex items-center justify-center rounded-xl border border-slate-300 px-3 py-2"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col gap-2">
              <NavLink to="/services" onClick={() => setOpen(false)} className="py-2">
                Services
              </NavLink>
              <NavLink to="/how-it-works" onClick={() => setOpen(false)} className="py-2">
                How It Works
              </NavLink>
              <NavLink to="/ai-assistant" onClick={() => setOpen(false)} className="py-2">
                AI Assistant
              </NavLink>
              <NavLink to="/contact" onClick={() => setOpen(false)} className="py-2">
                Contact
              </NavLink>

              {/* Mobile primary CTA (visible & tappable) */}
              <Link
                to="/pro/signup"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-xl px-4 py-3 text-center bg-slate-900 text-white hover:bg-slate-800"
              >
                Join Now
              </Link>
              {/* Optional secondary */}
              <Link
                to="/signup"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-center border border-slate-300"
              >
                Sign up (Homeowner)
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}