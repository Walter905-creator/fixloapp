import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../utils/config';
import HelmetSEO from '../seo/HelmetSEO';
import { useReferralAuth } from '../context/ReferralAuthContext';

/**
 * EarnDashboardPage - Referral Dashboard for Non-Pro Referrers
 * 
 * CRITICAL: This is NOT for Pros
 * - Shows referral link with copy button
 * - Share buttons (SMS/WhatsApp)
 * - Earnings and payout status
 * - Referral statistics
 */

export default function EarnDashboardPage() {
  const navigate = useNavigate();
  const { referralUser, isReferralAuthenticated, loading: authLoading, logoutReferral } = useReferralAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && !isReferralAuthenticated) {
      // No referral session found, redirect to sign in
      navigate('/earn/sign-in');
    }
  }, [authLoading, isReferralAuthenticated, navigate]);

  const handleLogout = () => {
    logoutReferral();
    navigate('/earn');
  };
  const copyReferralLink = () => {
    const referralUrl = `${window.location.origin}/join?commission_ref=${referralUser.referralCode}`;
    
    navigator.clipboard.writeText(referralUrl);
    setSuccess('Referral link copied!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const shareViaWhatsApp = () => {
    const referralUrl = `${window.location.origin}/join?commission_ref=${referralUser.referralCode}`;
    const message = encodeURIComponent(
      `Join Fixlo and get access to local jobs as a professional. Sign up using my referral link: ${referralUrl}`
    );
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const shareViaSMS = () => {
    const referralUrl = `${window.location.origin}/join?commission_ref=${referralUser.referralCode}`;
    const message = encodeURIComponent(
      `Join Fixlo and get access to local jobs as a professional. Sign up using my referral link: ${referralUrl}`
    );
    
    window.location.href = `sms:?body=${message}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand mb-4"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isReferralAuthenticated || !referralUser) {
    return null; // Will redirect in useEffect
  }

  const referralUrl = `${window.location.origin}/join?commission_ref=${referralUser.referralCode}`;

  return (
    <>
      <HelmetSEO 
        title="Referral Dashboard | Fixlo Earn" 
        canonicalPathname="/earn/dashboard"
        description="Manage your referral link and track your earnings"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="container-xl">
          {/* Header */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">
                  Your Referral Dashboard
                </h1>
                <p className="text-lg text-slate-600">
                  Welcome back, {referralUser.name}!
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-6 py-2 text-slate-600 hover:text-slate-900 font-medium border border-slate-300 rounded-lg hover:border-slate-400 transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="max-w-4xl mx-auto mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-center">
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              {error}
            </div>
          )}

          <div className="max-w-4xl mx-auto space-y-6">
            {/* Referral Link Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Referral Link</h2>
              
              {/* Referral Code Display */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Your Referral Code
                </label>
                <div className="text-center mb-4">
                  <span className="text-3xl font-mono font-bold text-brand">
                    {referralUser.referralCode}
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
                    value={referralUrl}
                    readOnly
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm"
                  />
                  <button
                    onClick={copyReferralLink}
                    className="px-6 py-3 bg-brand hover:bg-brand-dark text-white font-semibold rounded-lg transition-all whitespace-nowrap"
                  >
                    📋 Copy Link
                  </button>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Share Your Link</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    onClick={shareViaWhatsApp}
                    className="flex items-center justify-center gap-3 px-6 py-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-md"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Share via WhatsApp
                  </button>
                  <button
                    onClick={shareViaSMS}
                    className="flex items-center justify-center gap-3 px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-md"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
                    </svg>
                    Share via SMS
                  </button>
                </div>
              </div>

              {/* How It Works */}
              <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  How professionals use your referral
                </h3>
                <p className="text-slate-700 text-lg leading-relaxed">
                  Professionals must sign up using your referral link or enter your referral code <strong>{referralUser.referralCode}</strong> during Fixlo Pro registration. You'll earn commission when they stay active for 30 days.
                </p>
              </div>
            </div>

            {/* Earnings Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Earnings Overview</h2>
              
              <div className="grid sm:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-6 bg-blue-50 rounded-xl">
                  <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
                  <div className="text-sm font-medium text-slate-600">Total Referrals</div>
                </div>
                <div className="text-center p-6 bg-green-50 rounded-xl">
                  <div className="text-3xl font-bold text-green-600 mb-2">$0.00</div>
                  <div className="text-sm font-medium text-slate-600">Total Earned</div>
                </div>
                <div className="text-center p-6 bg-amber-50 rounded-xl">
                  <div className="text-3xl font-bold text-amber-600 mb-2">$0.00</div>
                  <div className="text-sm font-medium text-slate-600">Pending</div>
                </div>
              </div>

              <div className="p-6 bg-amber-50 border-l-4 border-amber-500 rounded-lg">
                <p className="text-amber-900 font-medium">
                  <strong>Commission Rate:</strong> You earn 15-20% of each Pro's monthly subscription after they stay active for 30 days. Minimum payout is $25 USD.
                </p>
              </div>
            </div>

            {/* Payout Status Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Payout Status</h2>
              
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Payouts Yet</h3>
                <p className="text-slate-600 mb-4">
                  Start referring professionals to earn your first commission!
                </p>
                <p className="text-sm text-slate-500">
                  Payouts are processed via Stripe Connect once you reach the $25 minimum.
                </p>
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-gradient-to-r from-brand to-blue-600 rounded-2xl shadow-lg p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
              <p className="text-lg mb-6 opacity-90">
                Have questions about the referral program or need assistance? We're here to help!
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/earn#referral-start"
                  className="flex-1 px-6 py-3 bg-white text-brand font-semibold rounded-lg text-center hover:bg-slate-100 transition-all"
                >
                  View FAQ
                </a>
                <a
                  href="/contact"
                  className="flex-1 px-6 py-3 bg-white bg-opacity-20 backdrop-blur font-semibold rounded-lg text-center hover:bg-opacity-30 transition-all"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
