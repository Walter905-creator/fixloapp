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
            <div className="flex items-center gap-3">
              {/* Make sure this path exists in public/ */}
              <img src="/assets/brand/fixlo-logo.svg" alt="Fixlo" className="h-8" />
              <span className="sr-only">Fixlo</span>
            </div>
            <nav className="flex items-center gap-6 text-sm">
              <a href="#services" className="hover:underline">Services</a>
              <a href="#how-it-works" className="hover:underline">How It Works</a>
              <a href="#ai-assistant" className="hover:underline">AI Assistant</a>
              <a href="#contact" className="hover:underline">Contact</a>
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
                <li><a href="#plumbing" className="hover:underline">Plumbing</a></li>
                <li><a href="#electrical" className="hover:underline">Electrical</a></li>
                <li><a href="#hvac" className="hover:underline">HVAC</a></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-2">Company</div>
              <ul className="space-y-1">
                <li><a href="#how-it-works" className="hover:underline">How It Works</a></li>
                <li><a href="#contact" className="hover:underline">Contact</a></li>
                <li><a href="#terms" className="hover:underline">Terms</a></li>
                <li><a href="#privacy" className="hover:underline">Privacy</a></li>
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