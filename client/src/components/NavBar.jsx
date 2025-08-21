import React from "react";
import { Link, NavLink } from "react-router-dom";

export default function NavBar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" aria-label="Fixlo — Home">
          <span
            aria-hidden="true"
            className="inline-block rounded-lg px-2 py-1 text-white"
            style={{
              background:
                "linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)",
            }}
          >
            FIXLO
          </span>
          <span className="sr-only">Fixlo</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4 text-sm">
          <NavLink
            to="/services"
            className={({ isActive }) =>
              `px-2 py-1 rounded ${isActive ? "font-semibold" : "text-slate-600"}`
            }
          >
            Services
          </NavLink>
          <NavLink
            to="/how-it-works"
            className={({ isActive }) =>
              `px-2 py-1 rounded ${isActive ? "font-semibold" : "text-slate-600"}`
            }
          >
            How It Works
          </NavLink>
          <NavLink
            to="/ai-assistant"
            className={({ isActive }) =>
              `px-2 py-1 rounded ${isActive ? "font-semibold" : "text-slate-600"}`
            }
          >
            AI Assistant
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `px-2 py-1 rounded ${isActive ? "font-semibold" : "text-slate-600"}`
            }
          >
            Contact
          </NavLink>
          <NavLink
            to="/pro/signin"
            className={({ isActive }) =>
              `px-2 py-1 rounded ${isActive ? "font-semibold" : "text-slate-600"}`
            }
          >
            Pro Sign In
          </NavLink>

          {/* Primary CTA */}
          <Link
            to="/pro/signup"
            className="ml-2 rounded-xl px-3 py-1.5 bg-black text-white hover:opacity-90"
          >
            Join Now
          </Link>
        </nav>
      </div>
    </header>
  );
}