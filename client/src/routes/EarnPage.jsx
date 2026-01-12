import React, { useState, useEffect } from 'react';
import { API_BASE } from '../utils/config';

/**
 * EarnPage - Public Commission Referral Page
 * 
 * COMPLIANCE RULES:
 * - Feature flag VITE_REFERRALS_ENABLED must be true
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

  // Check feature flag
  useEffect(() => {
    const checkFeature = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/commission-referrals/health`);
        const data = await response.json();
        setFeatureEnabled(data.enabled);
      } catch (err) {
        console.error('Error checking feature flag:', err);
        setFeatureEnabled(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkFeature();
  }, []);

  // If feature is disabled, show nothing
  if (loading) {
    return null;
  }

  if (!featureEnabled) {
    return null; // Feature flag disabled - render nothing
  }

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
    if (referrerData?.referralUrl) {
      navigator.clipboard.writeText(referrerData.referralUrl);
      setSuccess('Referral link copied!');
      setTimeout(() => setSuccess(''), 2000);
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
              <h3 className="font-semibold text-slate-900 mb-2">Sign up as a referrer</h3>
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

        {/* Registration / Dashboard */}
        {!registered ? (
          <div className="max-w-2xl mx-auto mb-12 bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
              Get Started
            </h2>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                {success}
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
                Create My Referral Link
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600 mb-3">Already have a referral link?</p>
              <button
                onClick={handleLoadDashboard}
                className="text-brand font-semibold hover:underline"
              >
                Load My Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto mb-12">
            {/* Dashboard */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Your Referral Dashboard
              </h2>
              
              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                  {success}
                </div>
              )}
              
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
              
              {/* Referral Link */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Your Referral Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referrerData?.referralUrl || ''}
                    readOnly
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm"
                  />
                  <button
                    onClick={copyReferralLink}
                    className="px-6 py-3 bg-brand hover:bg-brand-dark text-white font-semibold rounded-lg transition-all"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              {/* Payout Section */}
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Request Payout</h3>
                <p className="text-sm text-slate-600 mb-4">
                  <strong>Minimum payout: $25</strong>
                </p>
                
                {(dashboardData?.availableBalance || 0) < 2500 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-900 text-sm">
                      You need at least $25 available to request a payout.
                      Current balance: ${((dashboardData?.availableBalance || 0) / 100).toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <button
                    disabled
                    className="px-6 py-3 bg-slate-300 text-slate-600 font-semibold rounded-lg cursor-not-allowed"
                  >
                    Payout Request (Coming Soon)
                  </button>
                )}
              </div>
            </div>
          </div>
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
