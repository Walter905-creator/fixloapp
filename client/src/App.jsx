import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import Contact from './pages/Contact';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Signup from './pages/Signup';
import ProSignup from './pages/ProSignup';
import ProGallery from './pages/ProGallery';
import AdminLogin from './pages/AdminLogin';
import Admin from './pages/Admin';
import ProLogin from './pages/ProLogin';
import ProDashboard from './pages/ProDashboard';

export default function App(){
  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src="/assets/brand/fixlo-logo.svg" alt="Fixlo" className="fixlo-logo" />
              {/* Optional wordmark text on larger screens only */}
              <span className="hidden sm:inline text-slate-800 text-sm">Fixlo</span>
            </Link>

            {/* Right-side actions */}
            <nav className="flex items-center gap-2 sm:gap-3">
              <Link to="/services" className="text-xs sm:text-sm text-slate-700">Services</Link>
              <Link to="/how-it-works" className="text-xs sm:text-sm text-slate-700">How It Works</Link>
              <Link to="/ai-assistant" className="text-xs sm:text-sm text-slate-700">AI Assistant</Link>
              <Link to="/contact" className="text-xs sm:text-sm text-slate-700">Contact</Link>
              <Link to="/pro/signup" className="hidden sm:inline-flex text-xs sm:text-sm text-slate-700">Pro signup</Link>

              {/* Primary CTA shrinks gracefully on phones */}
              <Link
                to="/pro/signup"
                className="inline-flex items-center justify-center rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium bg-indigo-600 text-white"
              >
                Join Now
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/how-it-works" element={<HowItWorks/>}/>
          <Route path="/contact" element={<Contact/>}/>
          <Route path="/services" element={<Services/>}/>
          <Route path="/services/:service" element={<ServiceDetail/>}/>
          <Route path="/signup" element={<Signup/>}/>
          <Route path="/pro/signup" element={<ProSignup/>}/>
          <Route path="/pro/login" element={<ProLogin/>}/>
          <Route path="/pro/dashboard" element={<ProDashboard/>}/>
          <Route path="/pro/gallery" element={<ProGallery/>}/>
          <Route path="/admin/login" element={<AdminLogin/>}/>
          <Route path="/admin" element={<Admin/>}/>
          <Route path="*" element={
            <div className="max-w-4xl mx-auto p-10">
              <h1 className="text-3xl font-bold mb-2">404</h1>
              <p className="text-slate-600 mb-6">Page not found.</p>
              <Link to="/" className="text-blue-600 underline">Go Home</Link>
            </div>
          }/>
        </Routes>
      </main>

      <footer className="border-t text-sm text-slate-600">
        <div className="max-w-6xl mx-auto p-6 grid gap-3 md:grid-cols-4">
          <div>
            <div className="font-semibold mb-2">Fixlo</div>
            <p>Connecting homeowners with trusted professionals.</p>
          </div>
          <div>
            <div className="font-semibold mb-2">Services</div>
            <ul className="space-y-1">
              <li><Link to="/services/plumbing" className="hover:underline">Plumbing</Link></li>
              <li><Link to="/services/electrical" className="hover:underline">Electrical</Link></li>
              <li><Link to="/services/hvac" className="hover:underline">HVAC</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Company</div>
            <ul className="space-y-1">
              <li><Link to="/how-it-works" className="hover:underline">How It Works</Link></li>
              <li><Link to="/contact" className="hover:underline">Contact</Link></li>
              <li><Link to="/terms" className="hover:underline">Terms</Link></li>
              <li><Link to="/privacy" className="hover:underline">Privacy</Link></li>
              <li><a href="/admin" className="hover:underline">Admin</a></li>
            </ul>
          </div>
          <div className="text-slate-500">&copy; {new Date().getFullYear()} Fixlo. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
