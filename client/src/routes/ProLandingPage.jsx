import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';
import ConversionGrowthWidgets from '../components/ConversionGrowthWidgets';

const BENEFIT_CARDS = [
  'More Leads',
  'More Revenue',
  'Less Time Searching',
  'Business Growth',
  'Recurring Customers',
];

const PILLARS = [
  {
    icon: '💰',
    title: 'Earn More',
    items: ['More leads', 'More revenue'],
  },
  {
    icon: '⏱',
    title: 'Work Smarter',
    items: ['Less searching', 'Automated notifications'],
  },
  {
    icon: '🚀',
    title: 'Grow Faster',
    items: ['Reviews', 'Reputation', 'Repeat customers'],
  },
];

const DASHBOARD_WIDGETS = [
  'Nearby leads',
  'Estimated earnings',
  'New jobs today',
  'Response rate',
  'Monthly revenue',
  'One-click lead acceptance',
  'SMS alerts',
  'Saved responses',
  'Calendar integration placeholders',
  'Quick customer contact buttons',
];

const BADGES = ['⭐ Top Pro', '🛡 Verified Pro', '🏆 Elite Contractor', '🔥 Fast Response'];

export default function ProLandingPage() {
  const navigate = useNavigate();

  return (
    <>
      <HelmetSEO
        title="Fixlo is your sales department working 24/7"
        description="Get customers ready to hire, build a steady stream of jobs, and grow your business with Fixlo."
        canonicalPathname="/for-pros"
      />

      <section className="relative overflow-hidden" style={{ minHeight: '520px' }}>
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/images/service-handyman.jpg)' }} aria-hidden="true" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.80) 55%, rgba(15,23,42,0.45) 100%)' }} aria-hidden="true" />
        <div className="relative container-xl py-16 md:py-24 text-white">
          <div className="max-w-3xl">
            <p className="text-emerald-400 font-semibold uppercase tracking-widest text-sm mb-3">For Professionals</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Fixlo is your sales department working 24/7.
            </h1>
            <p className="mt-5 text-lg md:text-xl text-slate-200">Get more customers and grow your business.</p>
            <p className="mt-3 text-lg text-slate-200">Get customers ready to hire. Build a steady stream of jobs. Grow your business with Fixlo.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button onClick={() => navigate('/pro/signup')} className="inline-block text-white font-semibold text-lg px-10 py-4 rounded-full shadow-lg transition-colors" style={{ backgroundColor: '#2ecc71' }}>
                Start Getting Customers
              </button>
              <Link to="/pro/sign-in" className="inline-block bg-white/10 hover:bg-white/20 text-white font-semibold text-lg px-10 py-4 rounded-full shadow-lg transition-colors border border-white/30">
                Already a member? Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ConversionGrowthWidgets audience="pro" ctaText="Start Getting Customers" ctaLink="/pro/signup" />

      <section className="py-12 md:py-16 bg-slate-50">
        <div className="container-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-8">Result-focused benefits</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {BENEFIT_CARDS.map((card) => (
              <div key={card} className="card p-5 text-center bg-white/80 backdrop-blur">
                <p className="text-emerald-700 font-bold">✓ {card}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-white">
        <div className="container-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8 text-center">The 3 growth pillars</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {PILLARS.map((pillar) => (
              <div key={pillar.title} className="card p-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{pillar.icon} {pillar.title}</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  {pillar.items.map((item) => (
                    <li key={item} className="flex items-start gap-2"><span className="text-emerald-600">•</span><span>{item}</span></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-slate-50">
        <div className="container-xl grid gap-8 lg:grid-cols-2">
          <div className="card p-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Pro dashboard growth widgets</h3>
            <div className="grid gap-2 text-sm text-slate-700">
              {DASHBOARD_WIDGETS.map((item) => (
                <p key={item} className="flex gap-2"><span className="text-emerald-600">✓</span><span>{item}</span></p>
              ))}
            </div>
          </div>
          <div className="card p-6 bg-slate-900 text-white">
            <h3 className="text-2xl font-bold mb-4">Premium pro experience badges</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {BADGES.map((badge) => (
                <div key={badge} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-semibold text-sm">{badge}</div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              {['Lifetime earnings', 'Monthly earnings', 'Leads received', 'Leads won', 'Customer rating', 'Repeat customer rate'].map((metric) => (
                <div key={metric} className="rounded-lg bg-white/10 px-3 py-2">{metric}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-slate-900 text-center">
        <div className="container-xl">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">Start Getting Customers</h2>
          <p className="mt-4 text-lg text-slate-300 max-w-xl mx-auto">More leads. More revenue. Less guesswork.</p>
          <div className="mt-8">
            <button onClick={() => navigate('/pro/signup')} className="inline-block text-white font-semibold text-xl px-12 py-5 rounded-full shadow-xl transition-colors" style={{ backgroundColor: '#2ecc71' }}>
              Start Getting Customers
            </button>
          </div>
          <p className="mt-6 text-slate-400 text-sm">Looking for service help? <Link to="/for-homeowners" className="text-emerald-400 hover:underline">Fix your home problem today →</Link></p>
        </div>
      </section>
    </>
  );
}
