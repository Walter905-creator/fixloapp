import React, { useState, useEffect } from 'react';
import { API_BASE } from '../utils/config';

/**
 * Commission Referral Dashboard Component
 * 
 * For anyone to earn cash commissions by referring Pros to Fixlo.
 * Feature-flagged with REFERRALS_ENABLED environment variable.
 * 
 * COMPLIANCE:
 * - Independent commission-based opportunity (not employment)
 * - No income guarantees
 * - Social verification required before payouts
 * - Clear terms and conditions
 */

export default function CommissionReferralDashboard() {
  const [referrer, setReferrer] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showSocialVerification, setShowSocialVerification] = useState(false);
  const [showPayoutRequest, setShowPayoutRequest] = useState(false);
  
  // Registration form state
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    country: 'US',
    currency: 'USD'
  });
  
  // Social verification state
  const [socialForm, setSocialForm] = useState({
    platform: 'facebook',
    postUrl: ''
  });
  
  // Payout request state
  const [payoutForm, setPayoutForm] = useState({
    amount: '',
    payoutMethod: 'stripe_connect'
  });

  useEffect(() => {
    // Check if feature is enabled
    checkFeatureEnabled();
  }, []);

  const checkFeatureEnabled = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/commission-referrals/health`);
      const data = await response.json();
      
      if (!data.ok || !data.enabled) {
        setError('Referral system is not currently available');
        setLoading(false);
        return;
      }
      
      // Try to load existing referrer data from localStorage
      const savedReferrerId = localStorage.getItem('commission_referrer_id');
      if (savedReferrerId) {
        loadDashboard(savedReferrerId);
      } else {
        setShowRegisterForm(true);
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to connect to referral system');
      setLoading(false);
    }
  };

  const loadDashboard = async (referrerId) => {
    try {
      const response = await fetch(`${API_BASE}/api/commission-referrals/dashboard/${referrerId}`);
      const data = await response.json();
      
      if (data.ok) {
        setReferrer(data.referrer);
        setReferrals(data.referrals || []);
        localStorage.setItem('commission_referrer_id', data.referrer.id);
      } else {
        setError('Failed to load dashboard');
      }
    } catch (err) {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/commission-referrals/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.ok) {
        localStorage.setItem('commission_referrer_id', data.referrer.id);
        await loadDashboard(data.referrer.id);
        setShowRegisterForm(false);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/commission-referrals/social-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrerId: referrer.id,
          ...socialForm
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        alert('Social verification submitted! We will review it within 24 hours.');
        setShowSocialVerification(false);
        // Reload dashboard
        await loadDashboard(referrer.id);
      } else {
        setError(data.error || 'Verification submission failed');
      }
    } catch (err) {
      setError('Verification submission failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/commission-referrals/request-payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrerId: referrer.id,
          amount: parseFloat(payoutForm.amount),
          payoutMethod: payoutForm.payoutMethod
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        alert(`Payout request submitted! Net amount after fees: ${referrer.currency} ${data.payout.netAmount}`);
        setShowPayoutRequest(false);
        // Reload dashboard
        await loadDashboard(referrer.id);
      } else {
        setError(data.error || 'Payout request failed');
      }
    } catch (err) {
      setError('Payout request failed');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (referrer?.referralUrl) {
      navigator.clipboard.writeText(referrer.referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOnSocial = (platform) => {
    if (!referrer?.referralUrl) return;
    
    const message = `Earn money by becoming a Fixlo Pro! Join using my referral link: ${referrer.referralUrl}`;
    
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referrer.referralUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referrer.referralUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`
    };
    
    window.open(urls[platform], '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-2xl font-bold text-brand mb-2">Loading...</div>
          <div className="text-slate-500">Please wait</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 mb-2">Error</div>
          <div className="text-slate-700">{error}</div>
        </div>
      </div>
    );
  }

  // Registration Form
  if (showRegisterForm) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">💰 Earn Money with Fixlo</h1>
          <p className="text-slate-600 mb-6">
            Refer professionals to Fixlo and earn cash commissions for every successful signup!
          </p>
          
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone (Optional)</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="US">United States (USD)</option>
                <option value="CA">Canada (CAD)</option>
                <option value="GB">United Kingdom (GBP)</option>
                <option value="AU">Australia (AUD)</option>
                <option value="NZ">New Zealand (NZD)</option>
              </select>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
              <p className="font-medium mb-2">How it works:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Get your unique referral link</li>
                <li>Share it with professionals</li>
                <li>Earn commissions when they sign up and subscribe</li>
                <li>Request payouts after 30-day verification</li>
              </ul>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-white py-3 rounded-lg font-medium hover:bg-brand/90 transition disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Get Started'}
            </button>
          </form>
          
          <div className="mt-6 text-xs text-slate-500 text-center">
            This is an independent commission-based opportunity. Not an employment offer.
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand to-brand/80 text-white rounded-2xl p-8 mb-6">
        <h1 className="text-3xl font-bold mb-2">💰 Earn Money Dashboard</h1>
        <p className="text-brand-light">Welcome back, {referrer.name}!</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-sm text-slate-500 mb-1">Total Referrals</div>
          <div className="text-3xl font-bold text-slate-900">{referrer.totalReferrals}</div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-sm text-slate-500 mb-1">Pending</div>
          <div className="text-3xl font-bold text-yellow-600">{referrer.pendingReferrals}</div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-sm text-slate-500 mb-1">Approved</div>
          <div className="text-3xl font-bold text-green-600">{referrer.approvedReferrals}</div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-sm text-slate-500 mb-1">Total Earned</div>
          <div className="text-3xl font-bold text-brand">{referrer.currency} {referrer.totalEarned.toFixed(2)}</div>
        </div>
      </div>
      
      {/* Balance and Payout */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Available Balance</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold text-brand mb-1">
              {referrer.currency} {referrer.availableBalance.toFixed(2)}
            </div>
            <div className="text-sm text-slate-500">
              Pending: {referrer.currency} {referrer.pendingBalance.toFixed(2)}
            </div>
          </div>
          
          {referrer.socialVerified ? (
            <button
              onClick={() => setShowPayoutRequest(true)}
              disabled={referrer.availableBalance <= 0}
              className="bg-brand text-white px-6 py-3 rounded-lg font-medium hover:bg-brand/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Request Payout
            </button>
          ) : (
            <button
              onClick={() => setShowSocialVerification(true)}
              className="bg-yellow-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-yellow-600 transition"
            >
              Complete Social Verification
            </button>
          )}
        </div>
        
        {!referrer.socialVerified && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ Social verification required before requesting payouts. Please share your referral link on social media and submit the post URL for verification.
            </p>
          </div>
        )}
      </div>
      
      {/* Referral Link */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Your Referral Link</h2>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={referrer.referralUrl}
            readOnly
            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-sm"
          />
          <button
            onClick={copyReferralLink}
            className="px-6 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition"
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
        
        <div className="flex gap-2">
          <button onClick={() => shareOnSocial('facebook')} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
            Facebook
          </button>
          <button onClick={() => shareOnSocial('twitter')} className="flex-1 bg-sky-500 text-white py-2 rounded-lg hover:bg-sky-600 transition">
            Twitter
          </button>
          <button onClick={() => shareOnSocial('linkedin')} className="flex-1 bg-blue-700 text-white py-2 rounded-lg hover:bg-blue-800 transition">
            LinkedIn
          </button>
          <button onClick={() => shareOnSocial('whatsapp')} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
            WhatsApp
          </button>
        </div>
      </div>
      
      {/* Recent Referrals */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">Recent Referrals</h2>
        
        {referrals.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No referrals yet. Start sharing your link to earn commissions!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2 font-medium text-slate-700">Pro Name</th>
                  <th className="pb-2 font-medium text-slate-700">Status</th>
                  <th className="pb-2 font-medium text-slate-700">Commission</th>
                  <th className="pb-2 font-medium text-slate-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((ref) => (
                  <tr key={ref.id} className="border-b last:border-0">
                    <td className="py-3">{ref.proName}</td>
                    <td className="py-3">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        ref.status === 'paid' ? 'bg-green-100 text-green-800' :
                        ref.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        ref.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {ref.status}
                      </span>
                    </td>
                    <td className="py-3 font-medium">
                      {ref.commissionAmount ? `${ref.currency} ${ref.commissionAmount.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3 text-slate-600">
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Social Verification Modal */}
      {showSocialVerification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold mb-4">Social Verification</h3>
            <form onSubmit={handleSocialVerification} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Platform</label>
                <select
                  value={socialForm.platform}
                  onChange={(e) => setSocialForm({...socialForm, platform: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="twitter">Twitter</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Public Post URL</label>
                <input
                  type="url"
                  required
                  value={socialForm.postUrl}
                  onChange={(e) => setSocialForm({...socialForm, postUrl: e.target.value})}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                Post your referral link publicly and paste the URL here. We'll verify it within 24 hours.
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSocialVerification(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Payout Request Modal */}
      {showPayoutRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold mb-4">Request Payout</h3>
            <form onSubmit={handlePayoutRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount ({referrer.currency})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={referrer.availableBalance}
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm({...payoutForm, amount: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
                <div className="text-xs text-slate-500 mt-1">
                  Available: {referrer.currency} {referrer.availableBalance.toFixed(2)}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payout Method</label>
                <select
                  value={payoutForm.payoutMethod}
                  onChange={(e) => setPayoutForm({...payoutForm, payoutMethod: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="stripe_connect">Stripe (Bank Transfer)</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800">
                ⚠️ All payout fees are paid by you. Payouts require manual approval and may take 3-5 business days.
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutRequest(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Request Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
