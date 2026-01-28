import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AIExpertSection - Professional, premium section for Fixlo AI Home Expert
 * 
 * Clean, minimal SaaS design aesthetic (Stripe/Apple-like)
 * - Neutral color palette
 * - Professional typography
 * - Subtle shadows, soft corners
 * - Trust-focused copy (no hype language)
 */
export default function AIExpertSection() {
  const navigate = useNavigate();

  const handleCTA = () => {
    // Navigate to contact page for AI Expert inquiries
    navigate('/contact');
  };

  return (
    <section className="py-8 md:py-10">
      <div className="container-xl">
        <div className="bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200 rounded-lg shadow-sm p-8 md:p-10 max-w-4xl mx-auto">
          <div className="max-w-2xl mx-auto text-center">
            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-3">
              Fixlo AI Home Expert
            </h2>
            
            {/* Description */}
            <p className="text-base md:text-lg text-slate-600 mb-6 leading-relaxed">
              Get expert guidance on home repairs, maintenance scheduling, and project planning. 
              Professional insights to help you make informed decisions about your home.
            </p>

            {/* CTA Button */}
            <button
              onClick={handleCTA}
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-professional hover:bg-professional-dark rounded-md shadow-sm transition-colors duration-200 mb-3"
            >
              Start with Expert Guidance
            </button>

            {/* Pricing */}
            <p className="text-sm text-slate-500">
              $19.99/month • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
