import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';
import { API_BASE } from '../utils/config';

export default function ProResetPasswordPage() {
  const api = API_BASE;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  const phoneFromUrl = searchParams.get('phone'); // For backward compatibility
  const phoneFromState = location.state?.phone; // Preferred: from navigation state

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const url = `${api}/api/pro-auth/reset-password`;
      const payload = {
        newPassword: password
      };
      
      // Use token from URL if available, otherwise use the code entered
      if (tokenFromUrl) {
        payload.token = tokenFromUrl;
      } else {
        payload.code = code;
      }
      
      // Include phone number if available (for logging/tracking purposes)
      const phone = phoneFromState || phoneFromUrl;
      if (phone) {
        payload.phone = phone;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Password reset successful! Redirecting to sign in...');
        // Clear form state after success
        setCode('');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          navigate('/pro/sign-in');
        }, 2000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Could not reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <>
      <HelmetSEO 
        title="Reset Password | Fixlo Pro" 
        canonicalPathname="/pro/reset-password"
        robots="noindex, nofollow"
      />
      <div className="container-xl py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-extrabold mb-2">Reset your password</h1>
          <p className="text-slate-600 mb-6">
            {tokenFromUrl 
              ? 'Enter your new password below.' 
              : 'Enter the code sent to your phone and choose a new password.'}
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
              {!tokenFromUrl && (
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Reset Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter 6-digit code"
                    maxLength="6"
                    required
                    disabled={loading}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Enter the 6-digit code sent to your phone
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
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
                      <div className={`h-full transition-all duration-300 ${getStrengthBarWidth()} ${getStrengthBarColor()}`}></div>
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
                  placeholder="Confirm new password"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Setting Password...' : 'Set New Password'}
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
