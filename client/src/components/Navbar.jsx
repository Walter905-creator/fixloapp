import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoUrl from '../assets/fixlo-logo.png';

const mainItems = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/pros', label: 'For Pros' },
  { to: '/recruiter', label: 'For Recruiters' }
];

const loginItems = [
  { to: '/my-jobs', label: 'Homeowner Login' },
  { to: '/pros/login', label: 'Pro Login' },
  { to: '/recruiter/login', label: 'Recruiter Login' }
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
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="container-xl flex items-center justify-between py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoUrl} alt="Fixlo logo" className="h-8 w-auto rounded-md" />
        </Link>

        <nav className="hidden md:flex items-center gap-3">
          {mainItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `px-3 py-1 rounded-lg text-sm font-semibold hover:text-brand ${isActive ? 'text-brand' : 'text-slate-700'}`}
            >
              {item.label}
            </NavLink>
          ))}

          <div
            className="relative"
            onMouseEnter={() => setLoginOpen(true)}
            onMouseLeave={() => setLoginOpen(false)}
            onFocus={() => setLoginOpen(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) {
                setLoginOpen(false);
              }
            }}
          >
            <button
              className="px-3 py-1 rounded-lg text-sm font-semibold text-slate-700 hover:text-brand"
              aria-haspopup="menu"
              aria-expanded={loginOpen}
              onClick={() => setLoginOpen((prev) => !prev)}
            >
              Login
            </button>
            <div className={`absolute right-0 top-full mt-1 w-52 rounded-xl border border-slate-200 bg-white shadow-lg transition ${loginOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
              {loginItems.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setLoginOpen(false)} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {isPro && (
            <>
              <NavLink to="/pros/dashboard" className="px-3 py-1 rounded-lg text-sm font-semibold text-slate-700 hover:text-brand">Dashboard</NavLink>
              <button onClick={handleLogout} className="px-3 py-1 rounded-lg text-sm font-semibold text-slate-700 hover:text-brand">Logout</button>
            </>
          )}

          {isAdmin && (
            <NavLink to="/admin" className="px-3 py-1 rounded-lg text-sm font-semibold text-slate-700 hover:text-brand">Admin</NavLink>
          )}
        </nav>

        <button
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] z-40 bg-white border-t border-slate-200">
          <nav className="container-xl py-4 flex flex-col gap-2">
            {mainItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `px-4 py-3 rounded-lg text-base font-semibold hover:bg-slate-50 transition ${isActive ? 'text-brand bg-brand/10' : 'text-slate-700'}`}
              >
                {item.label}
              </NavLink>
            ))}

            <div className="pt-3 mt-2 border-t border-slate-200">
              <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Login</p>
              {loginItems.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50">
                  {item.label}
                </Link>
              ))}
            </div>

            {isPro && (
              <>
                <NavLink to="/pros/dashboard" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50">Dashboard</NavLink>
                <button onClick={handleLogout} className="px-4 py-3 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50 text-left">Logout</button>
              </>
            )}

            {isAdmin && (
              <NavLink to="/admin" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50">Admin</NavLink>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
