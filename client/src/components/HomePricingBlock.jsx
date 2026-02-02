import React from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { API_BASE } from '../utils/config';

/**
 * Benefits list shared between early access and standard pricing
 */
const PRICING_BENEFITS = [
  {
    icon: (
      <svg className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    title: 'Unlimited leads',
    description: 'No per-lead charges'
  },
  {
    icon: (
      <svg className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    title: 'Local matching',
    description: '30-mile radius'
  },
  {
    icon: (
      <svg className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    title: 'No bidding wars',
    description: 'Direct connections'
  }
];

/**
 * Fetcher function for SWR
 */
const fetcher = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch pricing: ${response.status}`);
  }
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Invalid pricing data');
  }
  return result.data;
};

/**
 * HomePricingBlock - Displays Fixlo Pro pricing on homepage
 * Fetches pricing data from /api/pricing-status and conditionally displays
 * early access or standard pricing using SWR for client-side fetching
 */
export default function HomePricingBlock() {
  const navigate = useNavigate();
  
  // Use SWR for client-side data fetching
  const { data: pricingData, error, isLoading } = useSWR(
    `${API_BASE}/api/pricing-status`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 60000 // Refresh every 60 seconds
    }
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="card p-8 text-center bg-gradient-to-br from-emerald-50 to-blue-50">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <p className="mt-4 text-slate-600">Loading pricing...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="card p-8 text-center bg-red-50 border-red-200">
        <svg className="w-12 h-12 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-800 font-semibold mb-2">Unable to load pricing</p>
        <p className="text-red-600 text-sm">{error.message || error}</p>
      </div>
    );
  }

  // No data state (fallback)
  if (!pricingData) {
    return null;
  }

  const { 
    earlyAccessAvailable, 
    currentPriceFormatted,
    nextPriceFormatted
  } = pricingData;

  return (
    <div className="card p-8 bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-200">
      <div className="max-w-2xl mx-auto text-center">
        {/* Early Access Available */}
        {earlyAccessAvailable ? (
          <>
            {/* Heading with price */}
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Join Now Fixlo Pro for only {currentPriceFormatted} — lock your price before it changes to {nextPriceFormatted}
            </h3>

            {/* Description */}
            <p className="text-lg text-slate-700 mb-3">
              Get unlimited job leads with no per-lead charges.
            </p>
            <p className="text-lg text-slate-700 mb-6">
              Join our network of verified professionals today.
            </p>

            {/* CTA Button */}
            <button
              onClick={() => navigate('/join')}
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-emerald-600 rounded-lg shadow-lg hover:bg-emerald-700 transition-colors mb-6"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Join Fixlo Pro
            </button>

            {/* Benefits */}
            <div className="mt-8 grid md:grid-cols-3 gap-4 text-left">
              {PRICING_BENEFITS.map((benefit) => (
                <div key={benefit.title} className="flex items-start gap-3">
                  {benefit.icon}
                  <div>
                    <p className="font-semibold text-slate-900">{benefit.title}</p>
                    <p className="text-sm text-slate-600">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Standard Pricing */}
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Fixlo Pro – {currentPriceFormatted}
            </h3>

            {/* Description */}
            <p className="text-lg text-slate-700 mb-3">
              Get unlimited job leads with no per-lead charges.
            </p>
            <p className="text-lg text-slate-700 mb-6">
              Join our network of verified professionals today.
            </p>

            {/* CTA Button */}
            <button
              onClick={() => navigate('/join')}
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-slate-900 rounded-lg shadow-lg hover:bg-slate-800 transition-colors mb-6"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Join Fixlo Pro
            </button>

            {/* Benefits */}
            <div className="mt-8 grid md:grid-cols-3 gap-4 text-left">
              {PRICING_BENEFITS.map((benefit) => (
                <div key={benefit.title} className="flex items-start gap-3">
                  {benefit.icon}
                  <div>
                    <p className="font-semibold text-slate-900">{benefit.title}</p>
                    <p className="text-sm text-slate-600">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
