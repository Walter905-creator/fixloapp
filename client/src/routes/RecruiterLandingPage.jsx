import React from 'react';
import { Link } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';

export default function RecruiterLandingPage() {
  return (
    <>
      <HelmetSEO
        title="Fixlo Recruiter Network | Earn Weekly Commissions"
        description="Recruit pros to Fixlo and earn direct and second-level commissions with weekly Stripe Connect payouts."
        canonicalPathname="/recruiter"
      />

      <section className="bg-slate-950 text-white py-16 md:py-20">
        <div className="container-xl">
          <p className="text-blue-300 font-semibold uppercase tracking-wider text-sm">For Recruiters</p>
          <h1 className="mt-3 text-4xl md:text-5xl font-extrabold">Recruit pros to Fixlo. Earn weekly payouts.</h1>
          <p className="mt-4 text-lg text-slate-200 max-w-3xl">
            Build your network by inviting professionals and recruiters to Fixlo and get paid through Stripe Connect.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/recruiter/signup" className="btn-primary">Become a Recruiter</Link>
            <Link to="/recruiter/login" className="px-5 py-3 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors">Recruiter Login</Link>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-white">
        <div className="container-xl grid gap-6 md:grid-cols-2">
          <div className="card p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">How you earn</h2>
            <ul className="space-y-2 text-slate-700">
              <li>• Earn <strong>50% of the first month</strong> for direct pros you refer.</li>
              <li>• Earn <strong>10% of the first month</strong> from pros signed by recruiters you referred.</li>
              <li>• Payouts run <strong>weekly</strong>.</li>
              <li>• Commissions include a <strong>one-week hold/reserve</strong> before release.</li>
              <li>• Payouts are sent through <strong>Stripe Connect</strong>.</li>
            </ul>
          </div>
          <div className="card p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">What you get</h2>
            <ul className="space-y-2 text-slate-700">
              <li>• Personal recruiter code and shareable links.</li>
              <li>• Referral tools for pros and recruiter invites.</li>
              <li>• Dashboard tracking for pending, held, available, and paid commissions.</li>
              <li>• Stripe Connect status and payout visibility.</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/recruiter/signup" className="btn-primary">Start Recruiting</Link>
              <Link to="/recruiter/login" className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">Login</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
