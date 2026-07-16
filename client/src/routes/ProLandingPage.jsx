import React from 'react';
import { Link } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';
import JulyCountdown from '../components/JulyCountdown';
import { isJulyPromoActive, JULY_PROMO } from '../config/julyPromo';

export default function ProLandingPage() {
  const julyActive = isJulyPromoActive();

  return (
    <>
      <HelmetSEO
        title="For Pros | Fixlo"
        description={julyActive
          ? `Join Fixlo Pro — Limited-Time July Offer: 50% off Fixlo Pro Membership. ${JULY_PROMO.promoPriceFormatted}/month this July. Join before July 31.`
          : 'Join Fixlo Pro or Fixlo Verified Plus and get matched with nearby homeowner leads.'}
        canonicalPathname="/pros"
      />

      {julyActive && (
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 px-4">
          <div className="container-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">🎉 {JULY_PROMO.label} — {JULY_PROMO.subHeadLine || 'Join before July 31 and save 50% on your first month.'}</p>
              <p className="text-xs text-white/80 mt-0.5">Regular price resumes automatically August 1.</p>
            </div>
            <JulyCountdown className="text-white shrink-0" />
          </div>
        </div>
      )}

      <section className="bg-slate-900 text-white py-16 md:py-20">
        <div className="container-xl">
          <p className="text-emerald-300 font-semibold uppercase tracking-wider text-sm">For Pros</p>
          <h1 className="mt-3 text-4xl md:text-5xl font-extrabold">Grow your business with Fixlo</h1>
          <p className="mt-4 text-lg text-slate-200 max-w-3xl">
            Choose the plan that fits your growth goals and start receiving qualified homeowner requests.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/pros/signup" className="btn-primary">Join as Pro</Link>
            <Link to="/pros/login" className="px-5 py-3 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors">Pro Login</Link>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-white">
        <div className="container-xl grid gap-6 md:grid-cols-2">
          <div className="card p-6">
            <p className="text-sm font-semibold text-slate-500">Fixlo Pro</p>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2">$59.99/month</h2>
            <p className="mt-3 text-slate-700">
              Get matched with homeowner leads in your trade within a 30-mile radius.
            </p>
            <ul className="mt-4 space-y-2 text-slate-700">
              <li>• 30-mile lead matching</li>
              <li>• Leads by trade and location</li>
              <li>• Pro dashboard access</li>
            </ul>
            <Link to="/pros/signup" className="btn-primary mt-5 inline-block">Join as Pro</Link>
          </div>

          <div className="card p-6 border-slate-900 bg-slate-900 text-white">
            <p className="text-sm font-semibold text-slate-300">Fixlo Verified Plus</p>
            {julyActive ? (
              <div className="mt-2">
                <p className="text-xl font-extrabold text-orange-300 line-through">{JULY_PROMO.originalPriceFormatted}/month</p>
                <h2 className="text-3xl font-extrabold text-white">{JULY_PROMO.promoPriceFormatted}/month</h2>
                <span className="mt-1 inline-block rounded-full bg-orange-500/25 px-2 py-0.5 text-xs font-bold text-orange-300">50% OFF — July Only • Save {JULY_PROMO.savingsFormatted}</span>
              </div>
            ) : (
              <h2 className="text-3xl font-extrabold mt-2">{JULY_PROMO.originalPriceFormatted}/month</h2>
            )}
            <p className="mt-3 text-slate-100">
              Verified leads are routed to you first with a 1-hour exclusive lead priority window.
            </p>
            <ul className="mt-4 space-y-2 text-slate-100">
              <li>• Verified 1-hour exclusive lead priority</li>
              <li>• Verified-first lead routing</li>
              <li>• Priority response opportunities</li>
            </ul>
            <Link to="/pros/signup" className="mt-5 inline-block rounded-lg bg-white px-4 py-2 font-semibold text-slate-900">
              {julyActive ? 'Claim 50% Off' : 'Get Priority Leads'}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
