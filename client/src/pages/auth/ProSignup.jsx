import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../utils/config';
import logoUrl from '../../assets/fixlo-logo.png';

const TRADES = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'painting', label: 'Painting' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'cleaning', label: 'House Cleaning' },
  { value: 'junk_removal', label: 'Junk Removal' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'handyman', label: 'Handyman' },
  { value: 'appliance_repair', label: 'Appliance Repair' }
];

export default function ProSignup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: '',
    trade: '',
    location: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: ''
  });
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteStatus, setInviteStatus] = useState(null); // null | 'valid' | 'invalid'
  const [inviteValidating, setInviteValidating] = useState(false);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    // Reset invite status when code changes
    if (e.target.name === 'inviteCode') {
      setInviteStatus(null);
    }
  };

  const handleValidateInviteCode = async () => {
    const code = form.inviteCode.trim();
    if (!code) return;
    setInviteValidating(true);
    setInviteStatus(null);
    try {
      const res = await fetch(`${API_BASE}/api/invite-codes/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      setInviteStatus(data.valid ? 'valid' : 'invalid');
    } catch {
      setInviteStatus('invalid');
    } finally {
      setInviteValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    // If an invite code is entered but not yet validated (or was invalid), block submit
    if (form.inviteCode.trim() && inviteStatus !== 'valid') {
      setError('Please validate your invitation code before continuing.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup/pro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          trade: form.trade,
          location: form.location,
          phone: form.phone,
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
          smsOptIn,
          inviteCode: form.inviteCode.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Signup failed'); return; }
      login(data.token, {
        role: 'pro',
        id: data.pro.id,
        name: data.pro.name,
        email: data.pro.email,
        trade: data.pro.trade,
        phone: data.pro.phone
      });
      // Redirect to pricing if subscription is required
      navigate(data.pro.requiresSubscription ? '/pricing' : '/dashboard/pro');
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
          <h1 className="text-3xl font-extrabold text-white">Join as a Pro</h1>
          <p className="text-blue-200 mt-2">Create your professional account</p>
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
              <label className="block text-blue-100 text-sm font-medium mb-1">Trade / Service</label>
              <select
                name="trade"
                value={form.trade}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="" className="bg-slate-900">Select your trade…</option>
                {TRADES.map(t => (
                  <option key={t.value} value={t.value} className="bg-slate-900">{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-blue-100 text-sm font-medium mb-1">Location</label>
              <input
                name="location"
                type="text"
                value={form.location}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="City, State"
              />
            </div>
            <div>
              <label className="block text-blue-100 text-sm font-medium mb-1">Phone Number</label>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                required
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

            {/* Invitation Code */}
            <div>
              <label className="block text-blue-100 text-sm font-medium mb-1">
                Invitation Code <span className="text-blue-300/70 font-normal">(optional)</span>
              </label>
              <div className="flex gap-2">
                <input
                  name="inviteCode"
                  type="text"
                  value={form.inviteCode}
                  onChange={handleChange}
                  disabled={loading}
                  className={`flex-1 bg-white/10 border rounded-lg px-4 py-2.5 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase tracking-wider ${
                    inviteStatus === 'valid'
                      ? 'border-green-400/60'
                      : inviteStatus === 'invalid'
                      ? 'border-red-400/60'
                      : 'border-white/20'
                  }`}
                  placeholder="Enter your one-time Fixlo code"
                  autoComplete="off"
                />
                {form.inviteCode.trim() && inviteStatus !== 'valid' && (
                  <button
                    type="button"
                    onClick={handleValidateInviteCode}
                    disabled={inviteValidating || loading}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap"
                  >
                    {inviteValidating ? '…' : 'Apply'}
                  </button>
                )}
              </div>
              {inviteStatus === 'valid' && (
                <p className="mt-1.5 text-green-400 text-xs font-medium">
                  ✓ Invitation code accepted. Your extended free membership has been applied.
                </p>
              )}
              {inviteStatus === 'invalid' && (
                <p className="mt-1.5 text-red-400 text-xs">
                  This invitation code is invalid, expired, or already used.
                </p>
              )}
              {!inviteStatus && (
                <p className="mt-1.5 text-blue-300/60 text-xs">
                  Have an invitation code? Enter it here to extend your free trial.
                </p>
              )}
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
                  I agree to receive SMS notifications from Fixlo about job leads and account updates. Reply STOP to unsubscribe.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? 'Creating Account…' : 'Create Pro Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-blue-200 text-sm">
              Already have an account?{' '}
              <Link to="/login/pro" className="text-blue-400 hover:text-blue-300 font-semibold">
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
