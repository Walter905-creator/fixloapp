import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AIHomeExpertHero - Primary hero section for Fixlo AI Home Expert
 * 
 * Design Requirements:
 * - Professional, minimal, non-cartoon design
 * - Clean SaaS look (Stripe / Apple-style)
 * - Neutral colors, single accent color
 * - Professional typography
 * - No animations, no gradients, no cartoon icons
 */
export default function AIHomeExpertHero() {
  const navigate = useNavigate();

  const handleExpertGuidance = () => {
    navigate('/assistant');
  };

  const handleFindPro = () => {
    navigate('/services');
  };

  return (
    <section className="bg-white border-b border-slate-200">
      <div className="container-xl py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight mb-6">
            Fix Your Home With Confidence
          </h1>
          
          {/* Subheadline */}
          <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed">
            Get expert guidance to do it yourself — or instantly connect with a trusted local pro when it's not DIY-safe.
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <button
              onClick={handleExpertGuidance}
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white text-lg font-semibold rounded-lg hover:bg-slate-800 transition-colors"
            >
              Start with Expert Guidance
            </button>
            
            {/* Helper text under primary CTA */}
            <p className="text-sm text-slate-500">
              $19.99/month • Cancel anytime
            </p>
          </div>

          {/* Secondary CTA */}
          <div className="flex justify-center">
            <button
              onClick={handleFindPro}
              className="px-6 py-3 text-base font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              Find a Pro
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
