import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * HomeReferralSection - Referral program section for homepage (logged-out users)
 * 
 * Displays motivational copy about being your own boss and supporting local economy.
 * Shows CTA to join and start earning free months through referrals.
 */
export default function HomeReferralSection() {
  const navigate = useNavigate();

  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-brand/5 to-brand/10">
      <div className="container-xl">
        <div className="max-w-4xl mx-auto text-center">
          {/* Headline */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4">
            Be Your Own Boss. Support Local Jobs.
          </h2>

          {/* Supporting text */}
          <p className="text-lg md:text-xl text-slate-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            Share Fixlo with other professionals and earn a <strong>FREE month</strong> for every pro who joins.
            Help grow local businesses and strengthen your community.
          </p>

          {/* CTA Button */}
          <button
            onClick={() => navigate('/join')}
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-brand hover:bg-brand-dark rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          >
            Join Fixlo & Start Earning Free Months
          </button>

          {/* Additional motivational copy */}
          <div className="mt-12 grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl mb-3">💼</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Your Own Schedule
              </h3>
              <p className="text-sm text-slate-600">
                Choose which jobs you want. Work when you want. Build your business your way.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl mb-3">🤝</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Support Your Community
              </h3>
              <p className="text-sm text-slate-600">
                Keep work local. Help other pros grow. Build a stronger local economy together.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No Lead Fees or Commissions
              </h3>
              <p className="text-sm text-slate-600">
                Keep 100% of what you earn. No hidden fees. Just straightforward pricing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
