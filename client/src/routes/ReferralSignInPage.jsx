import React, { useState, useEffect, useRef } from 'react';
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

// Constants
const MAX_POLL_ATTEMPTS = 10; // Poll for 10 seconds (10 attempts x 1 second)
const POLL_INTERVAL_MS = 1000; // Poll every 1 second

export default function ReferralSignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginReferral } = useReferralAuth();
  const [step, setStep] = useState('phone'); // 'phone', 'verify', or 'ready'
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [channelUsed, setChannelUsed] = useState(''); // Track which channel delivered the code
  const [messageSid, setMessageSid] = useState(''); // Track message SID for delivery polling
  const [deliveryStatus, setDeliveryStatus] = useState(''); // Track delivery status
  const [selectedMethod, setSelectedMethod] = useState('whatsapp'); // Default to WhatsApp

  // Ref to store polling interval for cleanup
  const pollIntervalRef = useRef(null);

  // Get redirect path from query params or default to /earn
  const from = location.state?.from?.pathname || '/earn';

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setDeliveryStatus('sending');

    try {
      // Validate phone number format (basic validation)
      const phoneRegex = /^[\d\s\-\(\)\+]+$/;
      if (!phoneRegex.test(phone)) {
        setError('Please enter a valid phone number');
        setLoading(false);
        setDeliveryStatus('');
        return;
      }

      // Send verification code via selected method
      setSuccess(`Sending verification code via ${selectedMethod.toUpperCase()}...`);
      
      const response = await fetch(`${API_BASE}/api/referrals/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, method: selectedMethod })
      });
      
      const data = await response.json();
      
      // Handle failure responses
      if (!data.success) {
        // WhatsApp failed - show SMS option
        if (data.channel === 'whatsapp' && data.suggestion === 'Try SMS instead') {
          setError(data.message || 'WhatsApp could not deliver the message.');
          setSelectedMethod('sms'); // Auto-select SMS for retry
          setLoading(false);
          setDeliveryStatus('failed');
          return;
        }
        
        // Both methods failed or other error
        throw new Error(data.message || 'Failed to send verification code');
      }
      
      // Message SEND accepted - now wait for delivery confirmation
      const channel = data.channelUsed || 'SMS';
      const sid = data.messageSid;
      
      setChannelUsed(channel);
      setMessageSid(sid);
      setDeliveryStatus('waiting');
      setSuccess(`Waiting for ${channel.toUpperCase()} delivery confirmation...`);
      
      // Poll for delivery status
      let pollAttempts = 0;
      
      // Clear any existing polling interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      
      pollIntervalRef.current = setInterval(async () => {
        pollAttempts++;
        
        try {
          const statusResponse = await fetch(`${API_BASE}/api/referrals/delivery-status/${sid}`);
          const statusData = await statusResponse.json();
          
          if (statusData.ok && statusData.isDelivered) {
            // SUCCESS: Message delivered
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            setDeliveryStatus('delivered');
            setSuccess(`✅ Code sent via ${channel.toUpperCase()}! Check your ${channel === 'whatsapp' ? 'WhatsApp' : 'text'} messages.`);
            setStep('verify');
            setLoading(false);
          } else if (statusData.ok && statusData.isFailed) {
            // FAILED: Message failed to deliver
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            setDeliveryStatus('failed');
            
            if (channel === 'whatsapp') {
              setError('WhatsApp could not deliver the message.');
              setSelectedMethod('sms'); // Auto-select SMS for retry
            } else {
              setError('SMS delivery failed. Please check your phone number and try again.');
            }
            
            setLoading(false);
          } else if (pollAttempts >= MAX_POLL_ATTEMPTS) {
            // TIMEOUT: No delivery confirmation within timeout period
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            setDeliveryStatus('timeout');
            
            if (channel === 'whatsapp') {
              setError('WhatsApp delivery timed out. The message may not have been delivered.');
              setSelectedMethod('sms'); // Auto-select SMS for retry
            } else {
              setError('SMS delivery timed out. Please try again.');
            }
            
            setLoading(false);
          }
          
        } catch (pollError) {
          console.error('Delivery status poll error:', pollError);
          // Continue polling - don't fail on single poll error
        }
      }, POLL_INTERVAL_MS);
      
    } catch (err) {
      console.error('Phone submission error:', err);
      setError(err.message || 'Failed to send verification code. Please try again.');
      setLoading(false);
      setDeliveryStatus('');
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

      // Backend returns success, verified, referralCode, referralLink, and deliveryChannel
      // Per requirements: UI must NEVER show delivery failure after verification success
      if (verifyData.success && verifyData.verified && verifyData.referralCode && verifyData.referralLink) {
        setReferralCode(verifyData.referralCode);
        setReferralLink(verifyData.referralLink);
        setStep('ready');
        // CRITICAL: Exact message per requirements - no mention of delivery status
        setSuccess('Verified! Your referral link has been sent by text message.');
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
                      {selectedMethod === 'whatsapp' 
                        ? 'We\'ll send your code via WhatsApp' 
                        : 'We\'ll send your code via SMS'}
                    </p>
                  </div>

                  {/* Method Selection (only show if WhatsApp failed) */}
                  {deliveryStatus === 'failed' && selectedMethod === 'sms' && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 mb-3">
                        <strong>⚠️ WhatsApp delivery failed.</strong> Click below to try SMS instead.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setError('');
                          setDeliveryStatus('');
                        }}
                        className="text-sm font-semibold text-brand hover:underline"
                      >
                        ← Try WhatsApp again
                      </button>
                    </div>
                  )}

                  {/* Delivery Status Info */}
                  {deliveryStatus === 'waiting' && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg animate-pulse">
                      <p className="text-sm text-blue-800">
                        <strong>⏳ Waiting for delivery confirmation...</strong>
                        <br />
                        Your code is on its way. This usually takes a few seconds.
                      </p>
                    </div>
                  )}

                  {/* Information about verification */}
                  {!deliveryStatus && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>📱 How it works:</strong> We'll send your verification code via {selectedMethod === 'whatsapp' ? 'WhatsApp' : 'SMS'}. You'll only see success when the message is confirmed delivered.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !phone}
                    className="w-full px-6 py-4 bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading 
                      ? `Sending via ${selectedMethod.toUpperCase()}...` 
                      : deliveryStatus === 'failed' && selectedMethod === 'sms'
                        ? 'Send via SMS Instead'
                        : `Send Code via ${selectedMethod === 'whatsapp' ? 'WhatsApp' : 'SMS'}`
                    }
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
                    We sent a verification code via {channelUsed === 'whatsapp' ? 'WhatsApp' : 'SMS'} to
                  </p>
                  <p className="font-semibold text-slate-900 mt-1">{phone}</p>
                  {channelUsed === 'whatsapp' && (
                    <p className="text-sm text-blue-600 mt-2">
                      Check your WhatsApp messages 📱
                    </p>
                  )}
                  {channelUsed === 'sms' && (
                    <p className="text-sm text-blue-600 mt-2">
                      Check your text messages 💬
                    </p>
                  )}
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

            {/* Ready Step - Show Referral Code */}
            {step === 'ready' && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    🎉 Welcome Back!
                  </h2>
                  <p className="text-slate-600">
                    Here's your referral code and link
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Referral Code Box */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Your Referral Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={referralCode}
                        readOnly
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-center text-lg font-bold text-brand"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(referralCode);
                          setSuccess('Referral code copied!');
                          setTimeout(() => setSuccess(''), 2000);
                        }}
                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                        title="Copy code"
                      >
                        📋
                      </button>
                    </div>
                  </div>

                  {/* Referral Link Box */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Your Referral Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={referralLink}
                        readOnly
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-sm text-slate-600"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(referralLink);
                          setSuccess('Referral link copied!');
                          setTimeout(() => setSuccess(''), 2000);
                        }}
                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                        title="Copy link"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                </div>

                {/* Share Buttons */}
                <div className="space-y-3 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      const text = `Join Fixlo and grow your business! Use my referral code: ${referralCode} or click here: ${referralLink}`;
                      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                    className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span>📱</span>
                    Share via WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const text = `Join Fixlo and grow your business! Use my referral code: ${referralCode} or visit: ${referralLink}`;
                      const smsUrl = `sms:?body=${encodeURIComponent(text)}`;
                      window.location.href = smsUrl;
                    }}
                    className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span>💬</span>
                    Share via SMS
                  </button>
                </div>

                <div className="text-center pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => navigate(from, { replace: true })}
                    className="text-brand hover:underline font-medium"
                  >
                    Go to Dashboard →
                  </button>
                </div>
              </div>
            )}

            {/* Info Notice */}
            {step !== 'ready' && (
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
                <p className="font-medium mb-1">✨ No Pro Account Required</p>
                <p>Referral accounts are free and separate from Fixlo Pro. Anyone can earn by referring professionals!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
