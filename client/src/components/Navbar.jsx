import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoUrl from '../assets/fixlo-logo.png';

const baseItems = [
  { to: '/services', label: 'Services' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/earn', label: 'Earn' },
  // { to: '/assistant', label: 'AI Assistant' }, // Hidden per requirements
  { to: '/contact', label: 'Contact' }
  // Removed duplicate 'Pro Dashboard' and 'Join Now' from regular items to create as separate CTA button
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const isPro = isAuthenticated && user?.role === 'pro';
  const isAdmin = isAuthenticated && user?.role === 'admin';
  const firstName = user?.name?.split(' ')[0] || user?.name || user?.phone || 'User';
  const displayName = firstName;
  
  // Only show admin link to users with admin role
  const items = isAdmin 
    ? [...baseItems, { to: '/admin', label: 'Admin' }]
    : baseItems;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="container-xl flex items-center justify-between py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoUrl} alt="Fixlo logo" className="h-8 w-auto rounded-md" />
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          {items.map(i => (
            <NavLink
              key={i.to}
              to={i.to}
              className={({ isActive }) =>
                `px-3 py-1 rounded-lg text-sm font-semibold hover:text-brand ${
                  isActive ? 'text-brand' : 'text-slate-700'
                }`
              }
            >
              {i.label}
            </NavLink>
          ))}
          
          {/* Conditional Pro Links */}
          {isPro ? (
            <>
              <span className="px-3 py-1 text-sm font-semibold text-slate-700">
                Welcome back, {displayName}
              </span>
              <NavLink
                to="/pro/dashboard"
                className={({ isActive }) =>
                  `px-3 py-1 rounded-lg text-sm font-semibold hover:text-brand ${
                    isActive ? 'text-brand' : 'text-slate-700'
                  }`
                }
              >
                Pro Dashboard
              </NavLink>
              <button
                onClick={handleLogout}
                className="px-3 py-1 rounded-lg text-sm font-semibold text-slate-700 hover:text-brand"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/pro/sign-in"
                className={({ isActive }) =>
                  `px-3 py-1 rounded-lg text-sm font-semibold hover:text-brand ${
                    isActive ? 'text-brand' : 'text-slate-700'
                  }`
                }
              >
                Pro Sign In
              </NavLink>
            </>
          )}
          
          <div className="ml-auto hidden sm:flex items-center gap-3">
            <Link 
              to="/join"
              className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 transition join-now-pulse"
            >
              Join Now
            </Link>
            <a href="/services" className="btn-primary">Find a Pro</a>
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Popup */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] z-40 bg-white border-t border-slate-200">
          <nav className="container-xl py-4 flex flex-col gap-2">
            {items.map(i => (
              <NavLink
                key={i.to}
                to={i.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-lg text-base font-semibold hover:bg-slate-50 transition ${
                    isActive ? 'text-brand bg-brand/10' : 'text-slate-700'
                  }`
                }
              >
                {i.label}
              </NavLink>
            ))}
            
            {/* Conditional Pro Links */}
            {isPro ? (
              <>
                <div className="px-4 py-3 text-base font-semibold text-slate-700">
                  Welcome back, {displayName}
                </div>
                <NavLink
                  to="/pro/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-lg text-base font-semibold hover:bg-slate-50 transition ${
                      isActive ? 'text-brand bg-brand/10' : 'text-slate-700'
                    }`
                  }
                >
                  Pro Dashboard
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="px-4 py-3 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50 transition text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <NavLink
                to="/pro/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-lg text-base font-semibold hover:bg-slate-50 transition ${
                    isActive ? 'text-brand bg-brand/10' : 'text-slate-700'
                  }`
                }
              >
                Pro Sign In
              </NavLink>
            )}
            
            <div className="mt-4 flex flex-col gap-3 px-4">
              <Link 
                to="/join"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 transition text-center"
              >
                Join Now
              </Link>
              <a 
                href="/services"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary text-center"
              >
                Find a Pro
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
