import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../utils/config';
import HelmetSEO from '../seo/HelmetSEO';

export default function RecruiterForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/recruiter-auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) { setSuccess(true); }
      else { const d = await res.json(); setError(d.error || 'Request failed'); }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <HelmetSEO title="Reset Recruiter Password | Fixlo" canonicalPathname="/recruiter/forgot-password" description="Reset your Fixlo recruiter account password" />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/fixlo-logo.png" alt="Fixlo" className="h-10 mx-auto mb-4" />
            <h1 className="text-3xl font-extrabold text-white">Reset Password</h1>
            <p className="text-blue-200 mt-2">We'll send a reset link to your phone</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
            {success ? (
              <div className="text-center">
                <div className="text-4xl mb-4">📱</div>
                <p className="text-white font-semibold mb-2">Check your messages!</p>
                <p className="text-blue-200 text-sm">If that email is registered, you'll receive an SMS with a reset link.</p>
                <Link to="/recruiter/login" className="mt-4 inline-block text-blue-400 hover:text-blue-300 text-sm">Back to Sign In</Link>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 bg-red-500/20 border border-red-400/40 rounded-lg p-3 text-red-200 text-sm">{error}</div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-blue-100 text-sm font-medium mb-1">Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="you@example.com" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60">
                    {loading ? 'Sending…' : 'Send Reset Link'}
                  </button>
                </form>
                <div className="mt-4 text-center">
                  <Link to="/recruiter/login" className="text-blue-400 text-sm hover:text-blue-300">Back to Sign In</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
