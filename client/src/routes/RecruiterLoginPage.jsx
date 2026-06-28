import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../utils/config';
import { useRecruiterAuth } from '../context/RecruiterAuthContext';
import HelmetSEO from '../seo/HelmetSEO';

export default function RecruiterLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useRecruiterAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/recruiter/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/recruiter-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); return; }
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
      <HelmetSEO title="Recruiter Sign In | Fixlo" canonicalPathname="/recruiter/login" description="Sign in to your Fixlo recruiter dashboard" />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/fixlo-logo.png" alt="Fixlo" className="h-10 mx-auto mb-4" />
            <h1 className="text-3xl font-extrabold text-white">Recruiter Sign In</h1>
            <p className="text-blue-200 mt-2">Access your recruiter dashboard</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
            {error && (
              <div className="mb-4 bg-red-500/20 border border-red-400/40 rounded-lg p-3 text-red-200 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-blue-100 text-sm font-medium mb-1">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-blue-100 text-sm font-medium mb-1">Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Your password" />
              </div>

              <div className="text-right">
                <Link to="/recruiter/forgot-password" className="text-blue-400 text-sm hover:text-blue-300">Forgot password?</Link>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60">
                {loading ? 'Signing In…' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-blue-200 text-sm">
                Don't have an account?{' '}
                <Link to="/recruiter/signup" className="text-blue-400 hover:text-blue-300 font-semibold">Join as Recruiter</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
