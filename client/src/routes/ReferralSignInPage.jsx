import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../utils/config';
import HelmetSEO from '../seo/HelmetSEO';
import { useReferralAuth } from '../context/ReferralAuthContext';

/**
 * ReferralSignInPage - Sign in for returning referral users
 * 
 * CRITICAL: This is NOT Pro Sign In
 * - Phone verification only (SMS/WhatsApp)
 * - No email/password required
 * - Redirects to /earn after successful login
 * - Separate from Pro authentication flow
 */

export default function ReferralSignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginReferral } = useReferralAuth();
  const [step, setStep] = useState('phone'); // 'phone' or 'verify'
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('sms'); // 'sms' or 'whatsapp'

  // Get redirect path from query params or default to /earn
  const from = location.state?.from?.pathname || '/earn';

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate phone number format (basic validation)
      const phoneRegex = /^[\d\s\-\(\)\+]+$/;
      if (!phoneRegex.test(phone)) {
        setError('Please enter a valid phone number');
        setLoading(false);
        return;
      }

      // Send verification code via backend
      setSuccess('Sending verification code...');
      
      const response = await fetch(`${API_BASE}/api/referrals/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, method: verificationMethod })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }
      
      setSuccess('Check your phone for the verification code!');
      setStep('verify');
      
    } catch (err) {
      console.error('Phone submission error:', err);
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Verify code with backend
      const verifyResponse = await fetch(`${API_BASE}/api/referrals/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: verificationCode })
      });
      
      const verifyData = await verifyResponse.json();
      
      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || 'Invalid verification code');
      }

      // Fetch referral account by phone
      const response = await fetch(`${API_BASE}/api/commission-referrals/referrer/phone/${encodeURIComponent(phone)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Account not found. Please create a new referral account.');
      }

      if (data.ok && data.referrer) {
        // Store referrer session using ReferralAuthContext
        loginReferral({
          referrerId: data.referrer.referrerId,
          referralCode: data.referrer.referralCode,
          email: data.referrer.email,
          phone: phone,
          name: data.referrer.name || 'Fixlo Referrer'
        });

        setSuccess('Sign in successful! Redirecting...');
        
        // Redirect to original destination or /earn
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1500);
      } else {
        throw new Error('Invalid response from server');
      }

    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <HelmetSEO 
        title="Referral Sign In | Fixlo Earn" 
        canonicalPathname="/earn/sign-in"
        description="Sign in to your Fixlo referral account to manage your referral link and earnings."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
        <div className="container-xl">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">
                Referral Sign In
              </h1>
              <p className="text-lg text-slate-600">
                Enter your phone number to access your referral account
              </p>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <strong>Note:</strong> This is for referral accounts only. Not a Fixlo Pro?{' '}
                <a href="/pro/sign-in" className="text-blue-700 hover:underline font-semibold">
                  Sign in as a Pro here
                </a>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                {success}
              </div>
            )}

            {/* Phone Entry Step */}
            {step === 'phone' && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <form onSubmit={handlePhoneSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                      disabled={loading}
                    />
                    <p className="mt-2 text-sm text-slate-500">
                      We'll send you a verification code
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Choose how you'd like to receive your verification code
                    </label>
                    <div className="flex gap-4">
                      <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${verificationMethod === 'sms' ? 'border-brand bg-brand bg-opacity-5' : 'border-slate-300 hover:border-brand'}`}>
                        <input
                          type="radio"
                          name="method"
                          value="sms"
                          checked={verificationMethod === 'sms'}
                          onChange={(e) => setVerificationMethod(e.target.value)}
                          className="w-4 h-4"
                        />
                        <span className="font-medium text-slate-700">✅ SMS (default)</span>
                      </label>
                      <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${verificationMethod === 'whatsapp' ? 'border-brand bg-brand bg-opacity-5' : 'border-slate-300 hover:border-brand'}`}>
                        <input
                          type="radio"
                          name="method"
                          value="whatsapp"
                          checked={verificationMethod === 'whatsapp'}
                          onChange={(e) => setVerificationMethod(e.target.value)}
                          className="w-4 h-4"
                        />
                        <span className="font-medium text-slate-700">✅ WhatsApp (recommended)</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !phone}
                    className="w-full px-6 py-4 bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? 'Sending...' : 'Send Verification Code'}
                  </button>

                  <div className="text-center pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600">
                      Don't have a referral account?{' '}
                      <button
                        type="button"
                        onClick={() => navigate('/earn/start')}
                        className="text-brand hover:underline font-medium"
                      >
                        Create one now
                      </button>
                    </p>
                  </div>
                </form>
              </div>
            )}

            {/* Verification Code Step */}
            {step === 'verify' && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-600">
                    We sent a verification code to
                  </p>
                  <p className="font-semibold text-slate-900 mt-1">{phone}</p>
                </div>

                <form onSubmit={handleVerificationSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="123456"
                      required
                      maxLength={6}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-brand"
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !verificationCode}
                    className="w-full px-6 py-4 bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? 'Verifying...' : 'Sign In'}
                  </button>

                  <div className="text-center space-y-2">
                    <button
                      type="button"
                      onClick={() => setStep('phone')}
                      className="text-sm text-slate-600 hover:text-brand"
                      disabled={loading}
                    >
                      Change phone number
                    </button>
                    <p className="text-sm text-slate-600">
                      Didn't receive a code?{' '}
                      <button
                        type="button"
                        onClick={handlePhoneSubmit}
                        className="text-brand hover:underline font-medium"
                        disabled={loading}
                      >
                        Resend
                      </button>
                    </p>
                  </div>
                </form>
              </div>
            )}

            {/* Info Notice */}
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
              <p className="font-medium mb-1">✨ No Pro Account Required</p>
              <p>Referral accounts are free and separate from Fixlo Pro. Anyone can earn by referring professionals!</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
