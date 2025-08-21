import React from "react";
import { Routes, Route, Link, NavLink } from "react-router-dom";

// Page components you already have
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import ProSignup from "./pages/ProSignup";
import ProGallery from "./components/ProGallery";

// ---------- Layout (Header/Footer) ----------
function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
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

        <nav className="flex items-center gap-4 text-sm">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `px-2 py-1 rounded ${isActive ? "font-semibold" : "text-slate-600"}`
            }
            end
          >
            Home
          </NavLink>
          <NavLink
            to="/signup"
            className={({ isActive }) =>
              `px-2 py-1 rounded ${isActive ? "font-semibold" : "text-slate-600"}`
            }
          >
            Homeowner Signup
          </NavLink>
          <NavLink
            to="/pro/signup"
            className={({ isActive }) =>
              `px-2 py-1 rounded ${isActive ? "font-semibold" : "text-slate-600"}`
            }
          >
            Pro Sign Up
          </NavLink>
          <NavLink
            to="/pro/gallery"
            className={({ isActive }) =>
              `px-2 py-1 rounded ${isActive ? "font-semibold" : "text-slate-600"}`
            }
          >
            Pro Gallery
          </NavLink>

          <Link
            to="/signup"
            className="ml-2 rounded-xl px-3 py-1.5 bg-black text-white hover:opacity-90"
          >
            Join Now
          </Link>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-slate-600 grid gap-4 md:grid-cols-3">
        <div>
          <div className="font-semibold mb-2">Fixlo</div>
          <p>Connecting homeowners with trusted pros.</p>
        </div>
        <div>
          <div className="font-semibold mb-2">Company</div>
          <ul className="space-y-1">
            <li>
              <Link className="hover:underline" to="/contact">
                Contact
              </Link>
            </li>
            <li>
              <a className="hover:underline" href="/terms.html">
                Terms of Service
              </a>
            </li>
            <li>
              <a className="hover:underline" href="/privacy.html">
                Privacy Policy
              </a>
            </li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Platform</div>
          <ul className="space-y-1">
            <li>
              <Link className="hover:underline" to="/pro/signup">
                Become a Pro
              </Link>
            </li>
            <li>
              <Link className="hover:underline" to="/pro/gallery">
                Pro Gallery
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="text-center text-xs text-slate-500 py-4 border-t border-slate-100">
        © {new Date().getFullYear()} Fixlo. All rights reserved.
      </div>
    </footer>
  );
}

// ---------- 404 ----------
function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <h1 className="text-3xl font-bold mb-2">404</h1>
      <p className="mb-6 text-slate-600">Page not found.</p>
      <Link to="/" className="rounded-xl px-4 py-2 bg-black text-white hover:opacity-90">
        Go Home
      </Link>
    </div>
  );
}

// ---------- App ----------
export default function App() {
  console.log("[Fixlo] Router is rendering");
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pro/signup" element={<ProSignup />} />
        <Route path="/pro/gallery" element={<ProGallery />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
