import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../../utils/config';
import logoUrl from '../../assets/fixlo-logo.png';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong'); return; }
      setSubmitted(true);
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
          <h1 className="text-3xl font-extrabold text-white">Forgot Password</h1>
          <p className="text-blue-200 mt-2">We&apos;ll send you reset instructions</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
          {submitted ? (
            <div className="text-center">
              <div className="text-5xl mb-4">✉️</div>
              <p className="text-white font-semibold text-lg mb-2">Check your inbox</p>
              <p className="text-blue-200 text-sm">
                If this account exists, password reset instructions will be sent.
              </p>
              <div className="mt-6">
                <Link to="/login/homeowner" className="text-blue-400 hover:text-blue-300 text-sm font-semibold">
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 bg-red-500/20 border border-red-400/40 rounded-lg p-3 text-red-200 text-sm">{error}</div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-blue-100 text-sm font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="you@example.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60"
                >
                  {loading ? 'Sending…' : 'Send Reset Instructions'}
                </button>
              </form>

              <div className="mt-6 text-center space-y-2">
                <p className="text-blue-200 text-sm">
                  <Link to="/login/homeowner" className="text-blue-400 hover:text-blue-300">
                    Back to Homeowner Login
                  </Link>
                </p>
                <p className="text-blue-200 text-sm">
                  <Link to="/login/pro" className="text-blue-400 hover:text-blue-300">
                    Pro Login
                  </Link>
                  {' · '}
                  <Link to="/login/recruiter" className="text-blue-400 hover:text-blue-300">
                    Recruiter Login
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
