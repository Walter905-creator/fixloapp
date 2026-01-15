import React, { useState, useEffect } from 'react';
import { API_BASE } from '../utils/config';

/**
 * EarnPage - Public Commission Referral Page
 * 
 * COMPLIANCE RULES:
 * - Feature flag checked at runtime via backend /api/commission-referrals/health
 * - Anyone can participate (no Pro account required)
 * - Independent commission opportunity (NOT employment)
 * - Minimum payout: $25 USD
 * - Stripe Connect payouts only
 * - Social media post required
 */

export default function EarnPage() {
  const [featureEnabled, setFeatureEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [registered, setRegistered] = useState(false);
  const [referrerData, setReferrerData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stripeConnected, setStripeConnected] = useState(false);
  const [checkingStripeStatus, setCheckingStripeStatus] = useState(false);
  const [socialMediaUrl, setSocialMediaUrl] = useState('');
  const [payoutProcessing, setPayoutProcessing] = useState(false);
  const [guestReferralCode, setGuestReferralCode] = useState('');
  const [guestReferralUrl, setGuestReferralUrl] = useState('');

  // Generate guest referral code immediately on page load
  useEffect(() => {
    const generateGuestCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = 'GUEST-';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    // Check if we already have a guest code in localStorage
    let code = localStorage.getItem('fixlo_guest_referral_code');
    if (!code) {
      code = generateGuestCode();
      localStorage.setItem('fixlo_guest_referral_code', code);
    }
    
    setGuestReferralCode(code);
    setGuestReferralUrl(`https://fixloapp.com/join?ref=${code}`);
  }, []);

  // Check feature flag at runtime from backend
  useEffect(() => {
    const checkFeature = async () => {
      try {
        console.log('[EarnPage] Fetching health check from:', `${API_BASE}/api/commission-referrals/health`);
        const response = await fetch(`${API_BASE}/api/commission-referrals/health`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        console.log('[EarnPage] Health check response status:', response.status, response.ok);
        
        if (!response.ok) {
          console.error('[EarnPage] Health check failed with status:', response.status);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[EarnPage] Health check data:', data);
        console.log('[EarnPage] Setting featureEnabled to:', data.enabled === true);
        setFeatureEnabled(data.enabled === true);
      } catch (err) {
        console.error('[EarnPage] Health check error:', err);
        // On network error, assume disabled for safety
        setFeatureEnabled(false);
      } finally {
        console.log('[EarnPage] Health check complete, setting loading to false');
        setLoading(false);
      }
    };
    
    checkFeature();
  }, []);

  // Check Stripe Connect status when dashboard is loaded
  useEffect(() => {
    if (registered && referrerData?.email) {
      checkStripeConnectStatus();
    }
  }, [registered, referrerData]);

  // Handle hash navigation on page load
  useEffect(() => {
    if (window.location.hash) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        const element = document.getElementById(window.location.hash.substring(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, []);

  const checkStripeConnectStatus = async () => {
    if (!referrerData?.email) return;
    
    setCheckingStripeStatus(true);
    try {
      const response = await fetch(`${API_BASE}/api/payouts/stripe-connect/status/${encodeURIComponent(referrerData.email)}`);
      const data = await response.json();
      
      if (data.ok) {
        setStripeConnected(data.connected);
      }
    } catch (err) {
      console.error('Error checking Stripe status:', err);
    } finally {
      setCheckingStripeStatus(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch(`${API_BASE}/api/commission-referrals/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, country: 'US' })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setRegistered(true);
        setReferrerData(data.referrer);
        setDashboardData(data.stats);
        setSuccess('Registration successful! Your referral link is ready.');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Failed to register. Please try again.');
      console.error('Registration error:', err);
    }
  };

  const handleLoadDashboard = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/api/commission-referrals/dashboard/${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.ok) {
        setRegistered(true);
        setReferrerData(data.referrer);
        setDashboardData(data.stats);
      } else {
        setError(data.error || 'Referrer not found');
      }
    } catch (err) {
      setError('Failed to load dashboard. Please try again.');
      console.error('Dashboard error:', err);
    }
  };

  const copyReferralLink = () => {
    const linkToCopy = registered && referrerData?.referralUrl 
      ? referrerData.referralUrl 
      : guestReferralUrl;
    
    if (linkToCopy) {
      navigator.clipboard.writeText(linkToCopy);
      setSuccess('Referral link copied!');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  const shareViaWhatsApp = () => {
    const linkToShare = registered && referrerData?.referralUrl 
      ? referrerData.referralUrl 
      : guestReferralUrl;
    
    const message = encodeURIComponent(
      `Join Fixlo and get access to local jobs. Sign up using my referral link: ${linkToShare}`
    );
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const shareViaSMS = () => {
    const linkToShare = registered && referrerData?.referralUrl 
      ? referrerData.referralUrl 
      : guestReferralUrl;
    
    const message = encodeURIComponent(
      `Join Fixlo and get access to local jobs. Sign up using my referral link: ${linkToShare}`
    );
    
    window.location.href = `sms:?body=${message}`;
  };

  const handleStripeConnect = async () => {
    if (!referrerData?.email) return;
    
    setError('');
    try {
      const clientUrl = window.location.origin;
      const response = await fetch(`${API_BASE}/api/payouts/stripe-connect/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrerEmail: referrerData.email,
          refreshUrl: `${clientUrl}/earn?refresh=true`,
          returnUrl: `${clientUrl}/earn?connected=true`
        })
      });
      
      const data = await response.json();
      
      if (data.ok && data.onboardingUrl) {
        // Redirect to Stripe onboarding
        window.location.href = data.onboardingUrl;
      } else {
        setError(data.error || 'Failed to start Stripe Connect onboarding');
      }
    } catch (err) {
      setError('Failed to connect Stripe account. Please try again.');
      console.error('Stripe Connect error:', err);
    }
  };

  const handleRequestPayout = async () => {
    if (!referrerData?.email || !stripeConnected || !socialMediaUrl) {
      return;
    }
    
    setError('');
    setSuccess('');
    setPayoutProcessing(true);
    
    try {
      const availableBalance = dashboardData?.availableBalance || 0;
      
      const response = await fetch(`${API_BASE}/api/payouts/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrerEmail: referrerData.email,
          requestedAmount: availableBalance,
          socialMediaPostUrl: socialMediaUrl
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setSuccess('Payout request submitted! We will review and process it within 2-3 business days.');
        setSocialMediaUrl('');
        // Refresh dashboard data
        setTimeout(() => {
          handleLoadDashboard({ preventDefault: () => {} });
        }, 1000);
      } else {
        setError(data.error || 'Failed to request payout');
      }
    } catch (err) {
      setError('Failed to request payout. Please try again.');
      console.error('Payout request error:', err);
    } finally {
      setPayoutProcessing(false);
    }
  };

  const faqItems = [
    {
      question: 'Who can participate?',
      answer: 'Anyone. You do not need to be a professional or a Fixlo user.'
    },
    {
      question: 'How much can I earn?',
      answer: 'There is no limit. You earn 15–20% of the Pro\'s monthly subscription, depending on country.'
    },
    {
      question: 'When do I get paid?',
      answer: 'After the referred Pro remains active for 30 days, your commission becomes eligible for payout.'
    },
    {
      question: 'Is there a minimum payout amount?',
      answer: 'Yes. The minimum payout is $25 USD (or the local currency equivalent).'
    },
    {
      question: 'How do payouts work?',
      answer: 'Fixlo uses Stripe Connect to send earnings directly to your bank account. Fixlo never sees your banking information.'
    },
    {
      question: 'Are there any fees?',
      answer: 'Stripe processing fees apply and are deducted from your payout.'
    },
    {
      question: 'Do I have to share on social media?',
      answer: 'Yes. At least one public social media post is required before payouts are unlocked.'
    },
    {
      question: 'Can I refer unlimited Pros?',
      answer: 'Yes. There is no cap on referrals or earnings.'
    },
    {
      question: 'What happens if a Pro cancels early?',
      answer: 'If the Pro cancels before 30 days, the referral does not qualify.'
    },
    {
      question: 'Is this a job or employment?',
      answer: 'No. This is not employment. It is an independent commission opportunity.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container-xl py-12 md:py-16">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-4">
            Earn Cash by Referring Professionals to Fixlo
          </h1>
          <p className="text-xl md:text-2xl text-slate-700 mb-6 max-w-3xl mx-auto">
            Anyone can earn money by referring new professionals to Fixlo.
            This is a commission-based opportunity with no limits.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="max-w-2xl mx-auto text-center mb-12 bg-white rounded-2xl shadow-lg p-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand mb-4"></div>
            <p className="text-slate-600">Loading referral program status...</p>
          </div>
        )}

        {/* Active Program Content */}
        {!loading && featureEnabled && (
          <>
            {/* Success Message */}
            {success && (
              <div className="max-w-4xl mx-auto mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-center">
                {success}
              </div>
            )}

            {/* Your Referral Link (Primary Action) */}
            <section id="referral-start" className="max-w-4xl mx-auto mb-12 bg-white rounded-2xl shadow-lg p-8 md:p-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4 text-center">
                Your Referral Link
              </h2>
              <p className="text-slate-600 mb-6 text-center">
                Share this link with professionals you know. When they sign up, you earn commission!
              </p>
              
              {/* Referral Link Display */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Referral Link
                </label>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <input
                    type="text"
                    value={registered && referrerData?.referralUrl ? referrerData.referralUrl : guestReferralUrl}
                    readOnly
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm"
                  />
                  <button
                    onClick={copyReferralLink}
                    className="px-6 py-3 bg-brand hover:bg-brand-dark text-white font-semibold rounded-lg transition-all whitespace-nowrap"
                  >
                    Copy Link
                  </button>
                </div>
              </div>

              {/* Referral Code Display (optional, smaller) */}
              <div className="mb-6 text-center">
                <p className="text-sm text-slate-600">
                  Referral Code: <span className="font-mono font-bold text-brand">{registered && referrerData?.referralCode ? referrerData.referralCode : guestReferralCode}</span>
                </p>
              </div>

              {/* Share Buttons */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 text-center">Share Your Link</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={shareViaWhatsApp}
                    className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-md"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Share via WhatsApp
                  </button>
                  <button
                    onClick={shareViaSMS}
                    className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-md"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
                    </svg>
                    Share via SMS
                  </button>
                </div>
              </div>

              {/* How Professionals Use Your Referral (Required Instruction) */}
              <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  How professionals use your referral
                </h3>
                <p className="text-slate-700 text-lg leading-relaxed">
                  Professionals must sign up using your referral link or enter your referral code during Fixlo Pro registration.
                </p>
              </div>
            </section>

            {/* Dashboard Section - Only shown if registered */}
            {registered && referrerData && (
              <div className="max-w-4xl mx-auto mb-12">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">
                    Your Referral Dashboard
                  </h2>
                  
                  {/* Stats */}
                  <div className="grid md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-brand">
                        ${((dashboardData?.availableBalance || 0) / 100).toFixed(2)}
                      </div>
                      <div className="text-sm text-slate-600 mt-1">Available Balance</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-brand">
                        {dashboardData?.totalReferrals || 0}
                      </div>
                      <div className="text-sm text-slate-600 mt-1">Total Referrals</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-brand">
                        {dashboardData?.eligibleReferrals || 0}
                      </div>
                      <div className="text-sm text-slate-600 mt-1">Eligible for Payout</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-brand">
                        ${((dashboardData?.totalEarnings || 0) / 100).toFixed(2)}
                      </div>
                      <div className="text-sm text-slate-600 mt-1">Total Earnings</div>
                    </div>
                  </div>
                  
                  {/* Payout Section */}
                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Stripe Connect & Payouts</h3>
                    
                    {/* Stripe Connect Status */}
                    <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-700">Stripe Connect Status:</span>
                        {checkingStripeStatus ? (
                          <span className="text-slate-600 text-sm">Checking...</span>
                        ) : stripeConnected ? (
                          <span className="text-green-600 font-semibold flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Connected
                          </span>
                        ) : (
                          <span className="text-amber-600 font-semibold">Not Connected</span>
                        )}
                      </div>
                      
                      {!stripeConnected && (
                        <div>
                          <p className="text-sm text-slate-600 mb-3">
                            Connect your bank account via Stripe to receive payouts securely.
                            Fixlo never sees your banking information.
                          </p>
                          <button
                            onClick={handleStripeConnect}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all"
                          >
                            Connect Stripe Account
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Payout Request */}
                    <p className="text-sm text-slate-600 mb-4">
                      <strong>Minimum payout: $25</strong> • Payouts are reviewed and processed within 2-3 business days.
                    </p>
                    
                    {(dashboardData?.availableBalance || 0) < 2500 ? (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-amber-900 text-sm">
                          You need at least $25 available to request a payout.
                          Current balance: ${((dashboardData?.availableBalance || 0) / 100).toFixed(2)}
                        </p>
                      </div>
                    ) : !stripeConnected ? (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-900 text-sm">
                          Please connect your Stripe account above before requesting a payout.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Social Media Post URL *
                          </label>
                          <input
                            type="url"
                            value={socialMediaUrl}
                            onChange={(e) => setSocialMediaUrl(e.target.value)}
                            placeholder="https://instagram.com/p/..."
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
                            required
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Link to a public social media post where you shared your Fixlo referral link
                          </p>
                        </div>
                        
                        <button
                          onClick={handleRequestPayout}
                          disabled={payoutProcessing || !socialMediaUrl.trim()}
                          className={`w-full px-6 py-3 font-semibold rounded-lg transition-all ${
                            payoutProcessing || !socialMediaUrl.trim()
                              ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                              : 'bg-brand hover:bg-brand-dark text-white'
                          }`}
                        >
                          {payoutProcessing ? 'Processing...' : `Request Payout ($${((dashboardData?.availableBalance || 0) / 100).toFixed(2)})`}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Registration Prompt - Only shown if NOT registered */}
            {!registered && (
              <div className="max-w-4xl mx-auto mb-12 bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 text-center">
                  Want to Track Your Earnings?
                </h2>
                <p className="text-slate-600 mb-6 text-center">
                  Register with your email to track referrals, earnings, and request payouts when you reach $25.
                </p>
                
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
                      placeholder="your@email.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Your Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full px-6 py-4 bg-brand hover:bg-brand-dark text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-md"
                  >
                    Register to Track Earnings
                  </button>
                </form>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-600 mb-3">Already registered?</p>
                  <button
                    onClick={handleLoadDashboard}
                    className="text-brand font-semibold hover:underline"
                  >
                    Load My Dashboard
                  </button>
                </div>
              </div>
            )}

            {/* How It Works */}
            <div className="max-w-5xl mx-auto mb-12 bg-white rounded-2xl shadow-lg p-8 md:p-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
                How It Works
              </h2>
              <div className="grid md:grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-brand rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                    1
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Get your referral link</h3>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-brand rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                    2
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Share your unique Fixlo referral link</h3>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-brand rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                    3
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">A new Pro joins and stays active for 30 days</h3>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-brand rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                    4
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">You earn 15–20% commission</h3>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-brand rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                    5
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Get paid securely via Stripe</h3>
                </div>
              </div>
            </div>

            {/* Trust Disclaimer */}
            <div className="max-w-4xl mx-auto mb-12 bg-amber-50 border-l-4 border-amber-500 rounded-lg p-6">
              <p className="text-amber-900 font-medium">
                <strong>Important:</strong> This is an independent, commission-based opportunity.
                Referrers are not employees of Fixlo.
              </p>
            </div>
          </>
        )}

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mb-12 bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left bg-slate-50 hover:bg-slate-100 transition-colors flex justify-between items-center"
                >
                  <span className="font-semibold text-slate-900">{item.question}</span>
                  <svg
                    className={`w-5 h-5 text-slate-600 transition-transform ${expandedFaq === index ? 'transform rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {expandedFaq === index && (
                  <div className="px-6 py-4 bg-white">
                    <p className="text-slate-700">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
