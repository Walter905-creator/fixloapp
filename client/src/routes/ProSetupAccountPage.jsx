import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';
import { API_BASE } from '../utils/config';

const TRADES = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'junk_removal', label: 'Junk Removal' },
  { value: 'handyman', label: 'Handyman' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'painting', label: 'Painting' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'appliance_repair', label: 'Appliance Repair' },
];

export default function ProSetupAccountPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const api = API_BASE;

  const [tokenValid, setTokenValid] = useState(null); // null = loading, true/false = result
  const [name, setName] = useState('');
  const [trade, setTrade] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }

    async function validateToken() {
      try {
        const res = await fetch(`${api}/pro/setup-account/${token}`);
        if (res.ok) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
        }
      } catch {
        setTokenValid(false);
      }
    }

    validateToken();
  }, [token, api]);

  // Check password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength('');
      return;
    }
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    if (strength <= 2) setPasswordStrength('weak');
    else if (strength <= 3) setPasswordStrength('medium');
    else setPasswordStrength('strong');
  }, [password]);

  const getStrengthColor = () => {
    if (passwordStrength === 'weak') return 'text-red-600';
    if (passwordStrength === 'medium') return 'text-yellow-600';
    if (passwordStrength === 'strong') return 'text-green-600';
    return '';
  };

  const getStrengthBarWidth = () => {
    if (passwordStrength === 'weak') return 'w-1/3';
    if (passwordStrength === 'medium') return 'w-2/3';
    if (passwordStrength === 'strong') return 'w-full';
    return 'w-0';
  };

  const getStrengthBarColor = () => {
    if (passwordStrength === 'weak') return 'bg-red-500';
    if (passwordStrength === 'medium') return 'bg-yellow-500';
    if (passwordStrength === 'strong') return 'bg-green-500';
    return 'bg-slate-300';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${api}/api/pro/complete-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, trade, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage('Account created! Redirecting to sign in...');
        setTimeout(() => {
          navigate('/pro/login');
        }, 2000);
      } else {
        setError(data.error || 'Failed to complete account setup. Please try again.');
      }
    } catch {
      setError('Could not reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state while validating token
  if (tokenValid === null) {
    return (
      <>
        <HelmetSEO
          title="Set Up Your Account | Fixlo Pro"
          canonicalPathname="/pro/setup-account"
          robots="noindex, nofollow"
        />
        <div className="container-xl py-16 text-center">
          <p className="text-slate-600">Validating your setup link...</p>
        </div>
      </>
    );
  }

  // Invalid or expired token
  if (tokenValid === false) {
    return (
      <>
        <HelmetSEO
          title="Link Expired | Fixlo Pro"
          canonicalPathname="/pro/setup-account"
          robots="noindex, nofollow"
        />
        <div className="container-xl py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="text-5xl mb-4">⏰</div>
            <h1 className="text-2xl font-extrabold mb-3 text-slate-900">
              This link has expired
            </h1>
            <p className="text-slate-600 mb-6">
              Your account setup link is invalid or has expired. Setup links are valid for 24 hours.
              Please contact support for assistance.
            </p>
            <a
              href="mailto:support@fixloapp.com"
              className="btn-primary inline-block"
            >
              Contact Support
            </a>
          </div>
        </div>
      </>
    );
  }

  // Valid token — show setup form
  return (
    <>
      <HelmetSEO
        title="Set Up Your Account | Fixlo Pro"
        canonicalPathname="/pro/setup-account"
        robots="noindex, nofollow"
      />
      <div className="container-xl py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🎉</div>
            <h1 className="text-2xl font-extrabold mb-2 text-slate-900">
              Welcome to Fixlo Pro!
            </h1>
            <p className="text-slate-600">
              Your subscription is active. Complete your account setup to start receiving leads.
            </p>
          </div>

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
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your full name"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  Trade / Service
                </label>
                <select
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                  disabled={loading}
                >
                  <option value="">Select your trade</option>
                  {TRADES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Create a password"
                  required
                  disabled={loading}
                />
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600">Password strength:</span>
                      <span className={`text-xs font-medium ${getStrengthColor()}`}>
                        {passwordStrength}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getStrengthBarWidth()} ${getStrengthBarColor()}`}
                      ></div>
                    </div>
                  </div>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  Use at least 8 characters with a mix of letters, numbers, and symbols
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm your password"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Complete Setup'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
