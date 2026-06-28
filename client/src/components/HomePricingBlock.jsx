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
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
          Choose the Fixlo plan that fits how you want to win leads.
        </h2>

        <div className="grid gap-4 md:grid-cols-2 text-left">
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
            <p className="text-sm font-semibold text-slate-200">Fixlo Premium</p>
            <p className="mt-2 text-3xl font-extrabold">$179.99<span className="text-base font-medium">/month</span></p>
            <p className="mt-3 text-slate-100">Get priority access to new leads before regular pros with a 1-hour exclusive window.</p>
            <button
              onClick={() => navigate('/pro/signup')}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 font-semibold text-slate-900 transition-colors hover:bg-slate-100"
            >
              Get Priority Leads
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
