import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * HomeReferralSection - Commission-based referral program section for homepage (logged-out users)
 * 
 * Promotes the new commission-based referral program at /earn.
 * Anyone can earn cash for referring professionals to Fixlo.
 */
export default function HomeReferralSection() {
  const navigate = useNavigate();

  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-emerald-50 to-emerald-100">
      <div className="container-xl">
        <div className="max-w-4xl mx-auto text-center">
          {/* Headline */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4">
            Earn Cash for Referring Professionals to Fixlo
          </h2>

          {/* Supporting text */}
          <p className="text-lg md:text-xl text-slate-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            Get paid for every professional you bring to Fixlo. <strong>Unlimited earnings.</strong> Anyone can participate—no account required.
          </p>

          {/* CTA Button */}
          <button
            onClick={() => navigate('/earn#referral-start')}
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          >
            Get Started
          </button>

          {/* Additional motivational copy */}
          <div className="mt-12 grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl mb-3">💸</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Earn 15-20% Commission
              </h3>
              <p className="text-sm text-slate-600">
                Earn recurring commission for every professional who signs up and stays active.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl mb-3">🚀</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No Limits on Earnings
              </h3>
              <p className="text-sm text-slate-600">
                Refer as many professionals as you want. There's no cap on your earning potential.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl mb-3">✅</div>
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
