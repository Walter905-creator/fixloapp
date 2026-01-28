import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * HomeReferralSection - Commission-based referral program section for homepage
 * 
 * Promotes the new commission-based referral program at /earn.
 * Detects authentication state and shows appropriate CTA.
 * Updated with professional, premium styling.
 */
export default function HomeReferralSection() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  // Don't render during auth loading to prevent flash
  if (loading) {
    return null;
  }

  // Determine CTA - ALWAYS redirect to /earn (PUBLIC route)
  // Users will see welcome gate on /earn if not authenticated
  const ctaText = isAuthenticated ? "View your referral link" : "Get your referral link";
  const ctaAction = () => {
    navigate('/earn');
  };

  return (
    <section className="py-12 md:py-16 bg-slate-50">
      <div className="container-xl">
        <div className="max-w-4xl mx-auto text-center">
          {/* Headline */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-900 mb-4">
            Earn Cash for Referring Professionals to Fixlo
          </h2>

          {/* Supporting text */}
          <p className="text-lg md:text-xl text-slate-700 mb-4 max-w-3xl mx-auto leading-relaxed">
            Get paid for every professional you bring to Fixlo. Unlimited earnings potential.
          </p>

          {/* Public participation message */}
          {!isAuthenticated && (
            <p className="text-base text-slate-600 mb-8 max-w-2xl mx-auto">
              No Pro account required. Anyone can participate and earn.
            </p>
          )}

          {/* CTA Button */}
          <button
            onClick={ctaAction}
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            {ctaText}
          </button>

          {/* Additional motivational copy */}
          <div className="mt-12 grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Earn 15-20% Commission
              </h3>
              <p className="text-sm text-slate-600">
                Earn recurring commission for every professional who signs up and stays active.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No Limits on Earnings
              </h3>
              <p className="text-sm text-slate-600">
                Refer as many professionals as you want. There's no cap on your earning potential.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Anyone Can Participate
              </h3>
              <p className="text-sm text-slate-600">
                You don't need to be a Fixlo user or professional. Just share your link and earn.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
