import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';

const BENEFITS = [
  {
    icon: '📬',
    title: 'Exclusive local leads',
    desc: 'Receive service requests from homeowners within 30 miles of your location — matched to your trade.',
  },
  {
    icon: '💰',
    title: 'Flat monthly pricing',
    desc: 'One simple fee. No per-lead charges. No bidding wars. Keep every dollar you earn from every job.',
  },
  {
    icon: '✅',
    title: 'No competition on your leads',
    desc: 'Leads are routed privately to nearby pros. You are not competing against 10 others for the same job.',
  },
  {
    icon: '📱',
    title: 'Instant SMS notifications',
    desc: 'Get notified the moment a matching homeowner submits a request so you can respond fast.',
  },
  {
    icon: '⭐',
    title: 'Build your reputation',
    desc: 'Collect verified reviews, showcase your past work, and grow your profile in your local market.',
  },
  {
    icon: '🛡️',
    title: 'Background check included',
    desc: 'Show homeowners you are a trusted professional. Background check is included with your membership.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Create your profile',
    desc: 'Sign up, complete your professional profile, pick your trade and service area, and get verified.',
  },
  {
    step: '2',
    title: 'Receive job leads',
    desc: 'When a homeowner in your area submits a request matching your trade, you get an instant SMS notification.',
  },
  {
    step: '3',
    title: 'Win the job & get paid',
    desc: 'Connect directly with the homeowner, agree on details, do the work, and get paid — no middlemen.',
  },
];

const TESTIMONIALS = [
  {
    quote: "I've been getting consistent leads since day one. No more chasing work or paying crazy fees per job.",
    name: 'Mike T.',
    trade: 'Plumber',
    location: 'Denver, CO',
  },
  {
    quote: 'Best decision for my painting business. The flat monthly fee means I can actually plan my budget.',
    name: 'Carlos R.',
    trade: 'Painter',
    location: 'Phoenix, AZ',
  },
  {
    quote: 'The quality of leads is way better than other platforms. These are real homeowners who are ready to hire.',
    name: 'James K.',
    trade: 'Electrician',
    location: 'Atlanta, GA',
  },
];

const TRADES = [
  'Plumbing', 'Electrical', 'HVAC', 'Roofing', 'Carpentry',
  'Painting', 'Landscaping', 'Cleaning', 'Junk Removal', 'Handyman',
];

export default function ProLandingPage() {
  const navigate = useNavigate();

  return (
    <>
      <HelmetSEO
        title="Grow Your Home Service Business with Fixlo | Join as a Pro"
        description="Get unlimited job leads, build your local reputation, and grow your trade business. Flat monthly fee — no per-lead charges. Join Fixlo Pro today."
        canonicalPathname="/for-pros"
      />

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: '520px' }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/images/service-handyman.jpg)' }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.80) 55%, rgba(15,23,42,0.45) 100%)',
          }}
          aria-hidden="true"
        />
        <div className="relative container-xl py-16 md:py-24">
          <div className="max-w-2xl text-white">
            <p className="text-emerald-400 font-semibold uppercase tracking-widest text-sm mb-3">
              For Professionals
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Get Unlimited Job Leads for Your Trade Business
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-200 max-w-xl">
              Find local homeowners who need your services. No bidding. No per-lead fees.
              One flat monthly subscription.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/pro/signup')}
                className="inline-block text-white font-semibold text-lg px-10 py-4 rounded-full shadow-lg transition-colors"
                style={{ backgroundColor: '#2ecc71' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27ae60')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2ecc71')}
              >
                Join Fixlo Pro
              </button>
              <Link
                to="/pro/sign-in"
                className="inline-block bg-white/10 hover:bg-white/20 text-white font-semibold text-lg px-10 py-4 rounded-full shadow-lg transition-colors border border-white/30"
              >
                Already a member? Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick stats */}
      <section className="bg-white border-y border-slate-200 py-8">
        <div className="container-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '$59.99/mo', label: 'Flat monthly fee' },
              { value: '30-mile', label: 'Lead radius' },
              { value: '0', label: 'Per-lead charges' },
              { value: '10+', label: 'Supported trades' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <p className="text-2xl font-extrabold text-emerald-600">{stat.value}</p>
                <p className="text-sm text-slate-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="container-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 text-center">
            Why pros choose Fixlo
          </h2>
          <p className="text-center text-slate-600 mb-10 max-w-2xl mx-auto">
            Everything you need to grow your home service business — in one simple platform.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b) => (
              <div key={b.title} className="card p-6 flex gap-4">
                <span className="text-3xl flex-shrink-0" aria-hidden="true">{b.icon}</span>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{b.title}</h3>
                  <p className="text-sm text-slate-600">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Trades */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 text-center">
            Supported trades
          </h2>
          <p className="text-center text-slate-600 mb-8 max-w-xl mx-auto">
            We connect homeowners with professionals across all major home service categories.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {TRADES.map((trade) => (
              <span
                key={trade}
                className="px-4 py-2 rounded-full border border-slate-200 bg-slate-50 text-slate-700 font-medium text-sm"
              >
                {trade}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="container-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 text-center">
            How it works for pros
          </h2>
          <p className="text-center text-slate-600 mb-10 max-w-xl mx-auto">
            Start getting leads in minutes.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="card p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-xl flex items-center justify-center mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container-xl max-w-2xl mx-auto">
          <div className="card p-8 bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-200 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Simple, transparent pricing
            </h2>
            <div className="my-6">
              <p className="text-5xl font-extrabold text-slate-900">
                $59.99<span className="text-xl font-normal text-slate-500">/mo</span>
              </p>
              <p className="text-slate-500 mt-2 text-sm">Lock in your price before it changes to $179.99/mo</p>
            </div>
            <ul className="space-y-3 text-sm text-slate-700 text-left max-w-xs mx-auto mb-8">
              {[
                'Unlimited job leads in your area',
                'No per-lead charges ever',
                'Instant SMS lead notifications',
                'Background check included',
                'Verified professional profile',
                'Direct homeowner contact',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/pro/signup')}
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-slate-900 rounded-lg shadow-lg hover:bg-slate-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Join Fixlo Pro Now
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="container-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-10 text-center">
            What pros are saying
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="card p-6">
                <p className="text-slate-700 mb-4 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{t.name}</p>
                    <p className="text-sm text-slate-500">{t.trade} • {t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-slate-900 text-center">
        <div className="container-xl">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Start Getting Job Leads Today
          </h2>
          <p className="mt-4 text-lg text-slate-300 max-w-xl mx-auto">
            Join pros already growing their business with Fixlo. No bidding. No per-lead fees.
          </p>
          <div className="mt-8">
            <button
              onClick={() => navigate('/pro/signup')}
              className="inline-block text-white font-semibold text-xl px-12 py-5 rounded-full shadow-xl transition-colors"
              style={{ backgroundColor: '#2ecc71' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27ae60')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2ecc71')}
            >
              Join Fixlo Pro
            </button>
          </div>
          <p className="mt-6 text-slate-400 text-sm">
            Looking for a home service professional?{' '}
            <Link to="/for-homeowners" className="text-emerald-400 hover:underline">
              Find a Pro near you →
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
