import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoUrl from '../assets/fixlo-logo.png';

const mainItems = [
  { to: '/', label: 'For Homeowners' },
  { to: '/pros', label: 'For Pros' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/services', label: 'Services' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact' }
];

const loginGroups = [
  {
    heading: 'Homeowner',
    items: [
      { to: '/login/homeowner', label: 'Login' },
      { to: '/signup/homeowner', label: 'Create Account' },
      { to: '/forgot-password', label: 'Forgot Password' }
    ]
  },
  {
    heading: 'Pro',
    items: [
      { to: '/pros/login', label: 'Login' },
      { to: '/signup/pro', label: 'Create Account' },
      { to: '/pros/forgot-password', label: 'Forgot Password' }
    ]
  },
  {
    heading: 'Recruiter',
    items: [
      { to: '/login/recruiter', label: 'Login' },
      { to: '/signup/recruiter', label: 'Create Account' },
      { to: '/recruiter/forgot-password', label: 'Forgot Password' }
    ]
  }
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const isPro = isAuthenticated && user?.role === 'pro';
  const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.isAdmin === true);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-amber-400/20 bg-black text-white shadow-xl">
      <div className="container-xl flex min-h-[84px] items-center justify-between gap-5 py-3">
        <Link to="/" className="flex shrink-0 items-center">
          <img src={logoUrl} alt="Fixlo logo" className="h-14 w-auto object-contain" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {mainItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `relative rounded-md px-3 py-3 text-sm font-semibold transition hover:text-amber-400 ${isActive ? 'text-white after:absolute after:bottom-1 after:left-3 after:right-3 after:h-0.5 after:bg-amber-400' : 'text-white/85'}`}
            >
              {item.label}
            </NavLink>
          ))}

          <div
            className="relative"
            onMouseEnter={() => setLoginOpen(true)}
            onMouseLeave={() => setLoginOpen(false)}
            onFocus={() => setLoginOpen(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setLoginOpen(false);
            }}
          >
            <button
              className="rounded-md px-3 py-3 text-sm font-semibold text-white/85 transition hover:text-amber-400"
              aria-haspopup="menu"
              aria-expanded={loginOpen}
              onClick={() => setLoginOpen((previous) => !previous)}
            >
              Login
            </button>
            <div className={`absolute right-0 top-full mt-1 w-56 rounded-xl border border-amber-400/20 bg-black p-2 shadow-2xl transition ${loginOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
              {loginGroups.map((group, groupIndex) => (
                <div key={group.heading}>
                  {groupIndex > 0 && <div className="mx-2 border-t border-white/10" />}
                  <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wider text-amber-400">{group.heading}</p>
                  {group.items.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setLoginOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {isPro && (
            <>
              <NavLink to="/pros/dashboard" className="rounded-md px-3 py-3 text-sm font-semibold text-white/85 hover:text-amber-400">Dashboard</NavLink>
              <button onClick={handleLogout} className="rounded-md px-3 py-3 text-sm font-semibold text-white/85 hover:text-amber-400">Logout</button>
            </>
          )}

          {isAdmin && (
            <>
              <NavLink to="/dashboard" className="rounded-md bg-white/10 px-3 py-3 text-sm font-semibold text-white hover:bg-white/20">Fixlo Dashboard</NavLink>
              <NavLink to="/admin" className="rounded-md px-3 py-3 text-sm font-semibold text-white/85 hover:text-amber-400">Admin</NavLink>
              <button onClick={handleLogout} className="rounded-md px-3 py-3 text-sm font-semibold text-white/85 hover:text-amber-400">Logout</button>
            </>
          )}

          <button
            onClick={() => navigate('/request')}
            className="ml-2 rounded-xl bg-amber-400 px-6 py-3 text-sm font-black text-black shadow-lg transition hover:bg-amber-300"
          >
            Request a Service
          </button>
        </nav>

        <button
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-amber-400/40 text-xl text-amber-400 transition hover:bg-white/10 lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[84px] z-40 overflow-y-auto border-t border-white/10 bg-black lg:hidden">
          <nav className="container-xl flex flex-col gap-2 py-5">
            {mainItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `rounded-lg px-4 py-3 text-base font-bold transition ${isActive ? 'bg-amber-400 text-black' : 'text-white hover:bg-white/10'}`}
              >
                {item.label}
              </NavLink>
            ))}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/request');
              }}
              className="mt-2 rounded-xl bg-amber-400 px-5 py-4 text-base font-black text-black"
            >
              Request a Service
            </button>

            <div className="mt-3 border-t border-white/10 pt-3">
              {loginGroups.map((group) => (
                <div key={group.heading} className="mb-2">
                  <p className="px-4 pb-1 pt-2 text-xs font-bold uppercase tracking-wider text-amber-400">{group.heading}</p>
                  {group.items.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-lg px-4 py-3 text-base font-semibold text-white/85 hover:bg-white/10"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>

            {isPro && (
              <>
                <NavLink to="/pros/dashboard" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-3 text-base font-semibold text-white hover:bg-white/10">Dashboard</NavLink>
                <button onClick={handleLogout} className="rounded-lg px-4 py-3 text-left text-base font-semibold text-white hover:bg-white/10">Logout</button>
              </>
            )}

            {isAdmin && (
              <>
                <NavLink to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-white/10 px-4 py-3 text-base font-semibold text-white">Fixlo Dashboard</NavLink>
                <NavLink to="/admin" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-3 text-base font-semibold text-white hover:bg-white/10">Admin</NavLink>
                <button onClick={handleLogout} className="rounded-lg px-4 py-3 text-left text-base font-semibold text-white hover:bg-white/10">Logout</button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
