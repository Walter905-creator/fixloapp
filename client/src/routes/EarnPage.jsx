import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../utils/config';
import { useAuth } from '../context/AuthContext';

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
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [featureEnabled, setFeatureEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [success, setSuccess] = useState('');
  const [authReferralData, setAuthReferralData] = useState(null);
  const [loadingAuthReferral, setLoadingAuthReferral] = useState(false);

  // Fetch authenticated user's referral data
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchAuthenticatedReferralData();
    }
  }, [isAuthenticated, authLoading]);

  const fetchAuthenticatedReferralData = async () => {
    setLoadingAuthReferral(true);
    try {
      // Get token from localStorage where AuthContext stores it
      // This is safe as we've already verified isAuthenticated via AuthContext
      const token = localStorage.getItem('fixlo_token');
      const response = await fetch(`${API_BASE}/api/commission-referrals/referrer/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setAuthReferralData({
            referralCode: data.referralCode,
            referralUrl: data.referralUrl
          });
        }
      } else {
        console.error('Failed to fetch authenticated referral data:', response.status);
      }
    } catch (err) {
      console.error('Error fetching authenticated referral data:', err);
    } finally {
      setLoadingAuthReferral(false);
    }
  };

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

  const copyReferralLink = () => {
    const linkToCopy = authReferralData?.referralUrl;
    
    if (linkToCopy) {
      navigator.clipboard.writeText(linkToCopy);
      setSuccess('Referral link copied!');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  const shareViaWhatsApp = () => {
    const linkToShare = authReferralData?.referralUrl;
    
    if (!linkToShare) return;
    
    const message = encodeURIComponent(
      `Join Fixlo and get access to local jobs. Sign up using my referral link: ${linkToShare}`
    );
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const shareViaSMS = () => {
    const linkToShare = authReferralData?.referralUrl;
    
    if (!linkToShare) return;
    
    const message = encodeURIComponent(
      `Join Fixlo and get access to local jobs. Sign up using my referral link: ${linkToShare}`
    );
    
    window.location.href = `sms:?body=${message}`;
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

            {/* ALWAYS RENDER REFERRAL SECTION FIRST - BEFORE FAQs */}
            {/* Your Referral Link Section */}
            <section id="referral-start" className="max-w-4xl mx-auto mb-12 bg-white rounded-2xl shadow-lg p-8 md:p-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4 text-center">
                Get Your Referral Code
              </h2>
              
              {/* NOT AUTHENTICATED - Show Referral Welcome Gate (NOT Pro Sign In) */}
              {!isAuthenticated && !authLoading && (
                <>
                  <div className="mb-8 text-center">
                    <div className="mb-6 p-6 bg-emerald-50 border-l-4 border-emerald-500 rounded-lg">
                      <p className="text-lg text-slate-900 font-semibold mb-2">
                        ✨ Anyone can earn by referring professionals
                      </p>
                      <p className="text-slate-700 mb-3">
                        Get your unique referral link in minutes. No Pro account required!
                      </p>
                      <p className="text-sm text-slate-600">
                        Referral accounts are <strong>free and separate</strong> from Fixlo Pro subscriptions.
                      </p>
                    </div>
                    
                    <div className="space-y-4 max-w-md mx-auto">
                      <button
                        onClick={() => navigate('/earn/start')}
                        className="w-full px-8 py-4 bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-md text-lg"
                      >
                        Create Free Referral Account
                      </button>
                      
                      <div className="text-center">
                        <p className="text-slate-600 text-sm">
                          Already have a referral account?{' '}
                          <button 
                            onClick={() => navigate('/earn/sign-in')} 
                            className="text-brand hover:underline font-medium"
                          >
                            Sign in here
                          </button>
                        </p>
                      </div>
                      
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-500 italic">
                          Note: If you're a Fixlo Pro looking for your Pro dashboard,{' '}
                          <a href="/pro/sign-in" className="text-brand hover:underline">
                            click here to sign in
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {/* AUTHENTICATED - Show Referral Link */}
              {isAuthenticated && !authLoading && (
                <>
                  {loadingAuthReferral ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand mb-4"></div>
                      <p className="text-slate-600">Loading your referral link...</p>
                    </div>
                  ) : authReferralData ? (
                    <>
                      <p className="text-slate-600 mb-6 text-center">
                        Share this link with professionals you know. When they sign up, you earn commission!
                      </p>
                      
                      {/* Referral Code Display */}
                      <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Your Referral Code
                        </label>
                        <div className="text-center mb-4">
                          <span className="text-2xl font-mono font-bold text-brand">
                            {authReferralData.referralCode}
                          </span>
                        </div>
                      </div>

                      {/* Referral Link Display */}
                      <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Your Referral Link
                        </label>
                        <div className="flex gap-2 flex-col sm:flex-row">
                          <input
                            type="text"
                            value={authReferralData.referralUrl}
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
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-red-600 mb-4">Failed to load referral data. Please try refreshing the page.</p>
                      <button
                        onClick={fetchAuthenticatedReferralData}
                        className="px-6 py-3 bg-brand hover:bg-brand-dark text-white font-semibold rounded-lg"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </>
              )}
              
              {/* Loading auth state */}
              {authLoading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand mb-4"></div>
                  <p className="text-slate-600">Checking authentication...</p>
                </div>
              )}
            </section>

            {/* How It Works - AFTER referral section */}
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

            {/* FAQ Section - ALWAYS RENDER AFTER REFERRAL SECTION */}
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
          </>
        )}
      </div>
    </div>
  );
}
