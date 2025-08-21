import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Signup from './pages/Signup';
import ProSignup from './pages/ProSignup';
import ProGallery from './pages/ProGallery';

export default function App(){
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
          <Link to="/" className="flex items-center gap-3">
            {/* Make sure this path exists in public/ */}
            <img src="/assets/brand/fixlo-logo.svg" alt="Fixlo" className="h-8" />
            <span className="sr-only">Fixlo</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/services" className="hover:underline">Services</Link>
            <Link to="/how-it-works" className="hover:underline">How It Works</Link>
            <Link to="/ai-assistant" className="hover:underline">AI Assistant</Link>
            <Link to="/contact" className="hover:underline">Contact</Link>
            <Link to="/pro/signup" className="px-3 py-1 rounded bg-black text-white">Join Now</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/signup" element={<Signup/>}/>
          <Route path="/pro/signup" element={<ProSignup/>}/>
          <Route path="/pro/gallery" element={<ProGallery/>}/>
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
    </BrowserRouter>
  );
}
