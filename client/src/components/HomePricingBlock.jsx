import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * HomePricingBlock - Displays Fixlo Pro static pricing on homepage
 */
export default function HomePricingBlock() {
  const navigate = useNavigate();

  return (
    <div className="card p-8 bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-200">
      <div className="max-w-2xl mx-auto text-center">
        {/* Static Pricing Block */}
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Join Now Fixlo Pro for only $59.99 — lock your price before it changes to $179.99
        </h2>

        <p className="text-lg text-slate-700 mb-3">
          Get unlimited job leads with no per-lead charges.
        </p>
        <p className="text-lg text-slate-700 mb-6">
          Join our network of verified professionals today.
        </p>

        {/* CTA Button */}
        <button
          onClick={() => navigate('/join')}
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-slate-900 rounded-lg shadow-lg hover:bg-slate-800 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Join Fixlo Pro
        </button>
      </div>
    </div>
  );
}
