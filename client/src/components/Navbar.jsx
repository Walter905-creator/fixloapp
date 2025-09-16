import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import logoUrl from '../assets/fixlo-logo.png';

const items = [
  { to: '/services', label: 'Services' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/assistant', label: 'AI Assistant' },
  { to: '/contact', label: 'Contact' },
  { to: '/pro/sign-in', label: 'Pro Sign In' },
  { to: '/pro/dashboard', label: 'Pro Dashboard' },
  { to: '/join', label: 'Join Now' }
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="container-xl flex items-center justify-between py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoUrl} alt="Fixlo logo" className="h-8 w-auto rounded-md" />
        </Link>
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
          <div className="ml-auto hidden sm:block">
            <a href="/services" className="btn-primary">Find a Pro</a>
          </div>
        </nav>
      </div>
    </header>
  );
}
