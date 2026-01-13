import React, { useState, useEffect } from 'react';
import { API_BASE } from '../utils/config';

/**
 * COMPLIANCE: Referral Section Component
 * 
 * CRITICAL RULES:
 * - Emphasizes independence and community support
 * - No income guarantees or misleading claims
 * - Clear, transactional messaging
 * - Country-based share method (WhatsApp for non-USA, SMS for USA)
 */

export default function ReferralSection({ proId, country = 'US' }) {
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!proId) {
      setLoading(false);
      return;
    }

    fetchReferralData();
  }, [proId]);

  const fetchReferralData = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/referrals/info/${proId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setReferralData(data);
        } else {
          setError('Failed to load referral information');
        }
      } else {
        setError('Failed to load referral information');
      }
    } catch (err) {
      console.error('Error fetching referral data:', err);
      setError('Failed to load referral information');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (referralData?.referralUrl) {
      navigator.clipboard.writeText(referralData.referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareViaWhatsApp = () => {
    if (!referralData?.referralUrl) return;

    const message = encodeURIComponent(
      `Join Fixlo and be your own boss.\n\nSign up using my link and grow your business:\n${referralData.referralUrl}`
    );

    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const shareViaSMS = () => {
    if (!referralData?.referralUrl) return;

    const message = encodeURIComponent(
      `Join Fixlo and be your own boss. Sign up using my link and grow your business: ${referralData.referralUrl}`
    );

    window.location.href = `sms:?body=${message}`;
  };

  if (loading) {
    return (
      <div className="w-full bg-gradient-to-br from-brand/5 to-brand/10 rounded-2xl p-8">
        <div className="text-center text-slate-500">Loading referral information...</div>
      </div>
    );
  }

  if (error || !referralData) {
    // Render visible error state instead of returning null
    return (
      <div className="w-full bg-red-50 border-2 border-red-200 rounded-2xl p-8 shadow-sm">
        <div className="text-center">
          <h3 className="text-xl font-bold text-red-900 mb-2">
            ⚠️ Referral Section Error
          </h3>
          <p className="text-red-700 mb-2">
            {error || 'Unable to load referral information'}
          </p>
          <p className="text-sm text-red-600">
            Component: ReferralSection | ProId: {proId || 'Not provided'}
          </p>
          <button
            onClick={fetchReferralData}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isUSA = country.toUpperCase() === 'US';
  const freeMonths = referralData.stats?.freeMonthsEarned || 0;

  return (
    <div className="w-full bg-gradient-to-br from-brand/5 to-brand/10 rounded-2xl p-8 shadow-sm border border-brand/20">
      {/* Headline */}
      <div className="text-center mb-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">
          Be Your Own Boss. Support Local Jobs.
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Invite friends to join Fixlo and earn a FREE month for every pro who signs up. 
          Help your community grow by supporting local work.
        </p>
      </div>

      {/* Stats Card */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="text-3xl font-bold text-brand">{freeMonths}</div>
            <div className="text-sm text-slate-600 mt-1">Free Months Earned</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="text-3xl font-bold text-brand">
              {referralData.stats?.completedReferrals || 0}
            </div>
            <div className="text-sm text-slate-600 mt-1">Successful Referrals</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="text-3xl font-bold text-brand">
              {referralData.stats?.pendingReferrals || 0}
            </div>
            <div className="text-sm text-slate-600 mt-1">Pending Referrals</div>
          </div>
        </div>
      </div>

      {/* Referral Code Display */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Your Referral Code
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={referralData.referralCode || ''}
            readOnly
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-lg font-semibold text-brand text-center"
          />
          <button
            onClick={copyReferralLink}
            className="px-6 py-3 bg-brand hover:bg-brand-dark text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-md"
          >
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        {isUSA ? (
          <>
            <button
              onClick={shareViaSMS}
              className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-md"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
              </svg>
              Share via SMS
            </button>
            <button
              onClick={copyReferralLink}
              className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-md"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
              Copy Link
            </button>
          </>
        ) : (
          <>
            <button
              onClick={shareViaWhatsApp}
              className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-md"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Share on WhatsApp
            </button>
            <button
              onClick={copyReferralLink}
              className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-md"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
              Copy Link
            </button>
          </>
        )}
      </div>

      {/* Compliance Disclaimer */}
      <div className="mt-6 text-xs text-slate-500 text-center">
        Referral rewards are issued after your friend completes their paid subscription. 
        Each successful referral earns you one free month to apply on your next billing cycle.
      </div>
    </div>
  );
}
