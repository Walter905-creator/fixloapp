import React from 'react';
import { useNavigate } from 'react-router-dom';
import { isJulyPromoActive, JULY_PROMO } from '../config/julyPromo';
import JulyCountdown from './JulyCountdown';

/**
 * HomePricingBlock - Displays Fixlo pricing for homeowners and professionals
 */
export default function HomePricingBlock() {
  const navigate = useNavigate();
  const julyActive = isJulyPromoActive();

  return (
    <div className="card p-8 bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-200">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
          Simple, transparent pricing.
        </h2>

        {julyActive && (
          <div className="mb-6 rounded-2xl border border-orange-300 bg-orange-50 p-4 text-left">
            <p className="text-sm font-bold text-orange-700">🎉 {JULY_PROMO.label}</p>
            <p className="mt-1 text-sm text-orange-600">
              Fixlo Pro Membership: <span className="line-through">{JULY_PROMO.originalPriceFormatted}</span>{' '}
              <strong>{JULY_PROMO.promoPriceFormatted}/month</strong> — Save {JULY_PROMO.savingsFormatted} this month.{' '}
              Regular price resumes automatically August 1.
            </p>
            <JulyCountdown compact className="mt-2 text-xs text-orange-600" />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3 text-left">
          <div className="rounded-2xl border-2 border-emerald-400 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-emerald-600">Homeowners</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">Free<span className="text-base font-medium"> quote</span></p>
            <p className="mt-3 text-slate-700">Get a free quote from verified local professionals. No upfront fees, no obligations. Nationwide — all cities, all services.</p>
            <button
              onClick={() => navigate('/services')}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Get Free Quote
            </button>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Fixlo Pro</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">$59.99<span className="text-base font-medium">/month</span></p>
            <p className="mt-3 text-slate-700">Get matched with homeowners in your trade within 30 miles.</p>
            <button
              onClick={() => navigate('/join')}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Join Fixlo Pro
            </button>
          </div>
          <div className="rounded-2xl border border-slate-900 bg-slate-900 p-6 text-white shadow-lg">
            <p className="text-sm font-semibold text-slate-200">Fixlo Verified Plus</p>
            {julyActive ? (
              <div className="mt-2">
                <p className="text-xl font-extrabold text-orange-300 line-through">{JULY_PROMO.originalPriceFormatted}<span className="text-base font-medium">/month</span></p>
                <p className="text-3xl font-extrabold text-white">{JULY_PROMO.promoPriceFormatted}<span className="text-base font-medium">/month</span></p>
                <span className="mt-1 inline-block rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-bold text-orange-300">50% OFF — July Only</span>
              </div>
            ) : (
              <p className="mt-2 text-3xl font-extrabold">{JULY_PROMO.originalPriceFormatted}<span className="text-base font-medium">/month</span></p>
            )}
            <p className="mt-3 text-slate-100">Get priority access to new leads before regular pros with a 1-hour exclusive window.</p>
            <button
              onClick={() => navigate('/pro/signup')}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 font-semibold text-slate-900 transition-colors hover:bg-slate-100"
            >
              {julyActive ? 'Claim 50% Off' : 'Get Priority Leads'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
