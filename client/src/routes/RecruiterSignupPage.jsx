import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { API_BASE } from '../utils/config';
import { useRecruiterAuth } from '../context/RecruiterAuthContext';
import HelmetSEO from '../seo/HelmetSEO';

export default function RecruiterSignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated } = useRecruiterAuth();

  const [form, setForm] = useState({ name: '', email: '', phoneNumber: '', password: '', confirmPassword: '' });
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [refCode, setRefCode] = useState('');
  const [refName, setRefName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/recruiter/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setRefCode(ref.toUpperCase());
      validateRef(ref.toUpperCase());
    }
  }, [searchParams]);

  const validateRef = async (code) => {
    try {
      const res = await fetch(`${API_BASE}/api/recruiter/validate/${code}?type=recruiter`);
      const data = await res.json();
      if (data.valid) setRefName(data.recruiterName || 'a recruiter');
    } catch { /* silent */ }
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    // Basic US phone validation
    const digitsOnly = form.phoneNumber.replace(/\D/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 11) {
      setError('Please enter a valid US phone number');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/recruiter-auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phoneNumber: form.phoneNumber,
          smsOptIn,
          password: form.password,
          refCode: refCode || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Signup failed'); return; }
      login(data.token, data.recruiter);
      navigate('/recruiter/dashboard');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <HelmetSEO title="Join as a Recruiter | Fixlo" canonicalPathname="/recruiter/signup" description="Join the Fixlo recruiter network and earn commissions" />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/fixlo-logo.png" alt="Fixlo" className="h-10 mx-auto mb-4" />
            <h1 className="text-3xl font-extrabold text-white">Join as a Recruiter</h1>
            <p className="text-blue-200 mt-2">Earn commissions by bringing professionals to Fixlo</p>
          </div>

          {refName && (
            <div className="mb-4 bg-blue-500/20 border border-blue-400/40 rounded-xl p-3 text-center text-blue-200 text-sm">
              🎉 You were referred by <strong>{refName}</strong>
            </div>
          )}

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
            {error && (
              <div className="mb-4 bg-red-500/20 border border-red-400/40 rounded-lg p-3 text-red-200 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-blue-100 text-sm font-medium mb-1">Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Your full name" />
              </div>
              <div>
                <label className="block text-blue-100 text-sm font-medium mb-1">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-blue-100 text-sm font-medium mb-1">Phone Number <span className="text-red-400">*</span></label>
                <input name="phoneNumber" type="tel" value={form.phoneNumber} onChange={handleChange} required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="+1 (555) 000-0000" />
                <p className="text-blue-300/60 text-xs mt-1">Required for SMS notifications</p>
              </div>
              <div>
                <label className="block text-blue-100 text-sm font-medium mb-1">Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={6}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="At least 6 characters" />
              </div>
              <div>
                <label className="block text-blue-100 text-sm font-medium mb-1">Confirm Password</label>
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Repeat password" />
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
                    I agree to receive SMS notifications regarding referrals, commissions, and account updates. Reply STOP to unsubscribe.
                  </span>
                </label>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60 mt-2">
                {loading ? 'Creating Account…' : 'Create Recruiter Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-blue-200 text-sm">
                Already have an account?{' '}
                <Link to="/recruiter/login" className="text-blue-400 hover:text-blue-300 font-semibold">Sign In</Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <p className="text-blue-300/60 text-xs">
                By signing up you agree to our{' '}
                <Link to="/terms" className="underline hover:text-blue-200">Terms of Service</Link>
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[['50%', 'Direct Commission'], ['10%', '2nd-Level Commission'], ['Weekly', 'Payouts']].map(([val, label]) => (
              <div key={label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-extrabold text-blue-400">{val}</div>
                <div className="text-blue-200 text-xs mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
