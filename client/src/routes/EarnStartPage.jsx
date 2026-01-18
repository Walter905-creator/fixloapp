import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../utils/config';
import HelmetSEO from '../seo/HelmetSEO';
import { useReferralAuth } from '../context/ReferralAuthContext';

/**
 * EarnStartPage - Non-Pro Referral Registration
 * 
 * CRITICAL: This is NOT Pro authentication
 * - Phone verification only (SMS/WhatsApp)
 * - No email/password required
 * - Creates CommissionReferrer account
 * - Redirects to /earn after successful registration
 */

export default function EarnStartPage() {
  const navigate = useNavigate();
  const { loginReferral } = useReferralAuth();
  const [step, setStep] = useState('phone'); // 'phone' or 'verify'
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('sms'); // 'sms' or 'whatsapp'

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

      // Create referrer account via backend
      const response = await fetch(`${API_BASE}/api/commission-referrals/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Generate unique temporary email using timestamp and random string
          email: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@fixlo.temp`,
          name: name || 'Fixlo Referrer',
          phone: phone,
          country: 'US'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create referral account');
      }

      if (data.ok && data.referrer) {
        // Store referrer session using ReferralAuthContext
        loginReferral({
          referrerId: data.referrer.referrerId,
          referralCode: data.referrer.referralCode,
          email: data.referrer.email,
          phone: phone,
          name: name || 'Fixlo Referrer'
        });

        setSuccess('Account created! Redirecting...');
        
        // Redirect to /earn (referral page)
        setTimeout(() => {
          navigate('/earn');
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
        title="Get Your Referral Link | Fixlo Earn" 
        canonicalPathname="/earn/start"
        description="Start earning by referring professionals to Fixlo. Get your unique referral link in minutes."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
        <div className="container-xl">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">
                Get Your Referral Link
              </h1>
              <p className="text-lg text-slate-600">
                Enter your phone number to get your personal referral link and start earning.
              </p>
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
                      Your Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                      disabled={loading}
                    />
                  </div>

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
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Verification Method
                    </label>
                    <div className="flex gap-4">
                      <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer transition-all hover:border-brand">
                        <input
                          type="radio"
                          name="method"
                          value="sms"
                          checked={verificationMethod === 'sms'}
                          onChange={(e) => setVerificationMethod(e.target.value)}
                          className="w-4 h-4"
                        />
                        <span className="font-medium text-slate-700">SMS</span>
                      </label>
                      <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer transition-all hover:border-brand">
                        <input
                          type="radio"
                          name="method"
                          value="whatsapp"
                          checked={verificationMethod === 'whatsapp'}
                          onChange={(e) => setVerificationMethod(e.target.value)}
                          className="w-4 h-4"
                        />
                        <span className="font-medium text-slate-700">WhatsApp</span>
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
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => navigate('/earn')}
                        className="text-brand hover:underline font-medium"
                      >
                        Back to Earn
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
                    {loading ? 'Verifying...' : 'Verify & Continue'}
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
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <p className="font-medium mb-1">⚡ Quick & Easy</p>
              <p>No email or password required. Just verify your phone and start earning!</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
