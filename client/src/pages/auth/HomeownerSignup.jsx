import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../utils/config';
import logoUrl from '../../assets/fixlo-logo.png';

export default function HomeownerSignup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [invitationCode, setInvitationCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const supplied = params.get('invite');
    try { return (supplied || sessionStorage.getItem('fixlo_homeowner_invite') || '').trim().toUpperCase(); }
    catch { return (supplied || '').trim().toUpperCase(); }
  });
  const [invitationStatus, setInvitationStatus] = useState('');
  useEffect(() => {
    let active = true;
    try {
      if (invitationCode) sessionStorage.setItem('fixlo_homeowner_invite', invitationCode);
      else sessionStorage.removeItem('fixlo_homeowner_invite');
    } catch { /* Invitations still work without browser storage. */ }
    if (!invitationCode) { setInvitationStatus(''); return; }
    setInvitationStatus('Checking invitation…');
    const controller = new AbortController();
    fetch(`${API_BASE}/api/homeowner-referrals/invitation/${encodeURIComponent(invitationCode)}`, { signal: controller.signal })
      .then(async res => { const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Unable to check invitation.'); return data; })
      .then(() => { if (active) setInvitationStatus('Invitation found: verify your phone after signup to activate 10% off one project total.'); })
      .catch(err => { if (active && err.name !== 'AbortError') setInvitationStatus(err.message); });
    return () => { active = false; controller.abort(); };
  }, [invitationCode]);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup/homeowner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          confirmPassword: form.confirmPassword,
          smsOptIn,
          invitationCode
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Signup failed'); return; }
      login(data.token, {
        role: 'homeowner',
        id: data.homeowner.id,
        name: data.homeowner.name,
        email: data.homeowner.email,
        phone: data.homeowner.phone
      });
      try { sessionStorage.removeItem('fixlo_homeowner_invite'); } catch { /* No storage available. */ }
      navigate('/dashboard/homeowner');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logoUrl} alt="Fixlo" className="h-10 mx-auto mb-4" />
          <h1 className="text-3xl font-extrabold text-white">Create Account</h1>
          <p className="text-blue-200 mt-2">Join Fixlo as a homeowner</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
          {error && (
            <div className="mb-4 bg-red-500/20 border border-red-400/40 rounded-lg p-3 text-red-200 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-blue-100 text-sm font-medium mb-1">Full Name</label>
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-blue-100 text-sm font-medium mb-1">Phone Number</label>
              <input
                name="phone"
                type="tel"
                required={!!invitationCode}
                value={form.phone}
                onChange={handleChange}
                disabled={loading}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-blue-100 text-sm font-medium mb-1">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-blue-100 text-sm font-medium mb-1">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                disabled={loading}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label className="block text-blue-100 text-sm font-medium mb-1">Confirm Password</label>
              <input
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Repeat password"
              />
            </div>

            <div>
              <label htmlFor="homeowner-invitation" className="block text-blue-100 text-sm font-medium mb-1">Invitation code (optional)</label>
              <input id="homeowner-invitation" value={invitationCode} onChange={e => setInvitationCode(e.target.value.trim().toUpperCase())} maxLength={20} disabled={loading} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white" placeholder="Code from your invitation" />
              {invitationStatus && <p role="status" className="mt-2 text-sm text-blue-100">{invitationStatus}</p>}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smsOptIn}
                  onChange={e => setSmsOptIn(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/10 accent-blue-500 cursor-pointer flex-shrink-0"
                />
                <span className="text-blue-200 text-xs leading-relaxed">
                  I agree to receive SMS notifications from Fixlo about my service requests and account updates. Reply STOP to unsubscribe.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? 'Creating Account…' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-blue-200 text-sm">
              Already have an account?{' '}
              <Link to="/login/homeowner" className="text-blue-400 hover:text-blue-300 font-semibold">
                Sign In
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-blue-300/60 text-xs">
              By signing up you agree to our{' '}
              <Link to="/terms" className="underline hover:text-blue-200">Terms of Service</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
