import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';
import { API_BASE } from '../utils/config';

export default function ProForgotPasswordPage() {
  const api = API_BASE;
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const url = `${api}/api/pro-auth/request-password-reset`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect to reset password page with phone number preserved in state
        navigate('/pro/reset-password', { state: { phone } });
      } else {
        setError(data.error || 'Failed to request password reset');
      }
    } catch (err) {
      console.error('Password reset request error:', err);
      setError('Could not reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <HelmetSEO 
        title="Forgot Password | Fixlo Pro" 
        canonicalPathname="/pro/forgot-password"
        robots="noindex, nofollow"
      />
      <div className="container-xl py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-extrabold mb-2">Forgot Password</h1>
          <p className="text-slate-600 mb-6">
            Enter your phone number to receive a reset code via SMS.
          </p>

          {message && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          <div className="card p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(555) 123-4567"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/pro/sign-in')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
