import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';

const SERVICES = [
  { to: '/services/plumbing',     title: 'Plumbing',      desc: 'Faucets, pipes, drains & more',          icon: '🔧' },
  { to: '/services/electrical',   title: 'Electrical',    desc: 'Lighting, wiring, outlets & more',       icon: '⚡' },
  { to: '/services/cleaning',     title: 'Cleaning',      desc: 'Housekeeping, carpets, windows',         icon: '🧹' },
  { to: '/services/roofing',      title: 'Roofing',       desc: 'Repairs, replacements, inspections',     icon: '🏠' },
  { to: '/services/hvac',         title: 'HVAC',          desc: 'Heating, cooling, vents',                icon: '❄️' },
  { to: '/services/carpentry',    title: 'Carpentry',     desc: 'Framing, trim, installs',                icon: '🪚' },
  { to: '/services/painting',     title: 'Painting',      desc: 'Interior and exterior painting',         icon: '🎨' },
  { to: '/services/landscaping',  title: 'Landscaping',   desc: 'Lawn, garden, hardscape',                icon: '🌿' },
  { to: '/services/junk-removal', title: 'Junk Removal',  desc: 'Haul away unwanted items',               icon: '🚛' },
  { to: '/services/handyman',     title: 'Handyman',      desc: 'Small jobs, quick fixes',                icon: '🔨' },
];

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Describe your project',
    desc: 'Tell us what home service you need and where you are located. It only takes a minute.',
  },
  {
    step: '2',
    title: 'Get matched instantly',
    desc: 'We connect you with background-checked professionals in your area who specialize in your service.',
  },
  {
    step: '3',
    title: 'Get the job done',
    desc: 'Confirm the details, schedule the visit, and get real-time SMS updates every step of the way.',
  },
];

const TESTIMONIALS = [
  {
    quote: 'Found a trusted plumber in under 10 minutes. He showed up on time and fixed the leak same day.',
    name: 'Jennifer M.',
    location: 'Austin, TX',
  },
  {
    quote: 'The process was so easy. I described what I needed, got a match, and had my electrical issue fixed by afternoon.',
    name: 'David R.',
    location: 'Denver, CO',
  },
  {
    quote: 'Background-checked pros gave me real peace of mind. I will only use Fixlo from now on.',
    name: 'Maria L.',
    location: 'Miami, FL',
  },
];

export default function HomeownerLandingPage() {
  const navigate = useNavigate();

  return (
    <>
      <HelmetSEO
        title="Find Trusted Home Service Professionals Near You | Fixlo"
        description="Get matched with background-checked plumbers, electricians, cleaners, roofers & more. Submit a request and hear back fast — no bidding, no hassle."
        canonicalPathname="/for-homeowners"
      />

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: '520px' }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/images/how-it-works.jpg)' }}
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
              For Homeowners
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Find Trusted Home Service Pros Near You
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-200 max-w-xl">
              Plumbing, electrical, HVAC, cleaning & more. Background-checked
              professionals ready to help — no bidding, no hassle.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/request')}
                className="inline-block text-white font-semibold text-lg px-10 py-4 rounded-full shadow-lg transition-colors"
                style={{ backgroundColor: '#2ecc71' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27ae60')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2ecc71')}
              >
                Get a Free Quote
              </button>
              <Link
                to="/services"
                className="inline-block bg-white/10 hover:bg-white/20 text-white font-semibold text-lg px-10 py-4 rounded-full shadow-lg transition-colors border border-white/30"
              >
                Browse Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-white border-y border-slate-200 py-8">
        <div className="container-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: '✅', label: 'Background-checked pros' },
              { icon: '⚡', label: 'Fast response times' },
              { icon: '💬', label: 'Real-time SMS updates' },
              { icon: '🔒', label: 'Secure & private' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2">
                <span className="text-2xl" aria-hidden="true">{item.icon}</span>
                <p className="text-sm font-semibold text-slate-800">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="container-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 text-center">
            What do you need help with?
          </h2>
          <p className="text-center text-slate-600 mb-10 max-w-2xl mx-auto">
            Choose a service below or submit a custom request and we'll match you with the right professional.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {SERVICES.map((s) => (
              <Link
                key={s.to}
                to={s.to}
                className="card p-5 hover:border-emerald-400 hover:shadow-md transition group flex flex-col items-center text-center gap-2"
              >
                <span className="text-3xl" aria-hidden="true">{s.icon}</span>
                <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-500">{s.desc}</p>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <button
              onClick={() => navigate('/request')}
              className="btn-primary px-8 py-3 text-base"
            >
              Request Any Service →
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 text-center">
            How it works for homeowners
          </h2>
          <p className="text-center text-slate-600 mb-10 max-w-xl mx-auto">
            Getting home services has never been simpler.
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

      {/* Testimonials */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="container-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-10 text-center">
            Homeowners love Fixlo
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
                    <p className="text-sm text-slate-500">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-20 bg-slate-900 text-center">
        <div className="container-xl">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-slate-300 max-w-xl mx-auto">
            Submit a free request and get matched with a verified local professional today.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/request')}
              className="inline-block text-white font-semibold text-xl px-12 py-5 rounded-full shadow-xl transition-colors"
              style={{ backgroundColor: '#2ecc71' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27ae60')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2ecc71')}
            >
              Get a Free Quote
            </button>
            <Link
              to="/services"
              className="inline-block bg-white/10 hover:bg-white/20 text-white font-semibold text-xl px-12 py-5 rounded-full shadow-xl transition-colors border border-white/30"
            >
              Browse All Services
            </Link>
          </div>
          <p className="mt-6 text-slate-400 text-sm">
            Are you a professional?{' '}
            <Link to="/for-pros" className="text-emerald-400 hover:underline">
              Join Fixlo as a Pro →
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
