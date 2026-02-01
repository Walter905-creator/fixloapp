import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
 * HomePricingBlock - Displays Fixlo Pro pricing on homepage
 * Fetches pricing data from /api/pricing-status and conditionally displays
 * early access or standard pricing
 */
export default function HomePricingBlock() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pricingData, setPricingData] = useState(null);

  const fetchPricingStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/api/pricing-status`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch pricing: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setPricingData(result.data);
      } else {
        throw new Error(result.error || 'Invalid pricing data');
      }
    } catch (err) {
      console.error('Error fetching pricing status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPricingStatus();
  }, [fetchPricingStatus]);

  // Loading state
  if (loading) {
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
        <p className="text-red-600 text-sm">{error}</p>
        <button 
          onClick={fetchPricingStatus}
          className="mt-4 text-sm text-red-700 hover:text-red-900 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // No data state (fallback)
  if (!pricingData) {
    return null;
  }

  const { 
    earlyAccessAvailable, 
    earlyAccessSpotsRemaining, 
    currentPriceFormatted, 
    nextPriceFormatted 
  } = pricingData;

  return (
    <div className="card p-8 bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-200">
      <div className="max-w-2xl mx-auto text-center">
        {/* Early Access Available */}
        {earlyAccessAvailable ? (
          <>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-semibold mb-4">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Early Access Price
            </div>

            {/* Heading */}
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Join Fixlo Pro
            </h3>

            {/* Early Access Price */}
            <div className="mb-4">
              <div className="text-5xl md:text-6xl font-extrabold text-emerald-700">
                {currentPriceFormatted}
                <span className="text-2xl md:text-3xl font-semibold text-slate-600">/month</span>
              </div>
            </div>

            {/* Spots Remaining */}
            <div className="inline-block px-4 py-2 bg-amber-100 border-2 border-amber-400 rounded-lg mb-4">
              <p className="text-amber-900 font-bold text-lg">
                Only {earlyAccessSpotsRemaining} spots left!
              </p>
            </div>

            {/* Future Price Warning */}
            <p className="text-slate-700 mb-6">
              Lock in this price forever. <span className="font-semibold text-slate-900">Then {nextPriceFormatted}/month</span> for new members.
            </p>

            {/* CTA Button */}
            <button
              onClick={() => navigate('/join')}
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-emerald-600 rounded-lg shadow-lg hover:bg-emerald-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Lock My Price
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
            {/* Standard Pricing (Early Access Ended) */}
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-full text-sm font-semibold mb-4">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Current Pricing
            </div>

            {/* Heading */}
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Join Fixlo Pro
            </h3>

            {/* Standard Price */}
            <div className="mb-4">
              <div className="text-5xl md:text-6xl font-extrabold text-slate-900">
                {currentPriceFormatted}
                <span className="text-2xl md:text-3xl font-semibold text-slate-600">/month</span>
              </div>
            </div>

            {/* Status Message */}
            <div className="inline-block px-4 py-2 bg-slate-100 border-2 border-slate-300 rounded-lg mb-4">
              <p className="text-slate-900 font-semibold text-lg">
                Pro pricing now in effect
              </p>
            </div>

            {/* Description */}
            <p className="text-slate-700 mb-6">
              Get unlimited job leads with no per-lead charges. Join our network of verified professionals today.
            </p>

            {/* CTA Button */}
            <button
              onClick={() => navigate('/join')}
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-slate-900 rounded-lg shadow-lg hover:bg-slate-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Join Now
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
