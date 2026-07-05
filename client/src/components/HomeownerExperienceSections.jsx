import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SERVICE_CATEGORIES = [
  { to: '/us/services/plumbing', title: 'Emergency Plumbing', icon: '🚨' },
  { to: '/us/services/electrical', title: 'Electrical Service', icon: '⚡' },
  { to: '/us/services/hvac', title: 'AC Repair', icon: '❄️' },
  { to: '/us/services/house-cleaning', title: 'House Cleaning', icon: '🧼' },
  { to: '/us/services/junk-removal', title: 'Junk Removal', icon: '🗑️' },
  { to: '/us/services/landscaping', title: 'Landscaping', icon: '🌿' },
  { to: '/us/services/carpentry', title: 'Carpentry', icon: '🪚' },
  { to: '/us/services/remodeling', title: 'Remodeling', icon: '🏡' },
  { to: '/us/services/roofing', title: 'Roofing', icon: '🏠' },
  { to: '/us/services/painting', title: 'Painting', icon: '🎨' },
];

const QUICK_SERVICE_NEEDS = [
  'My AC stopped working',
  'I have a water leak',
  'I need junk removed',
  'I need a cleaner',
  'I need landscaping',
];

const EASY_EXPERIENCE_FEATURES = [
  'One-click service request flow',
  'Auto-detect location',
  'Photo upload',
  'Video upload',
  'Save favorite pros',
  'Repeat previous services',
  'SMS notifications',
  'Push notification placeholders',
];

const PROGRESS_STEPS = [
  'Request submitted',
  'Pro assigned',
  'Pro on the way',
  'Service in progress',
  'Service completed',
];

export default function HomeownerExperienceSections() {
  const navigate = useNavigate();

  return (
    <>
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="container-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 text-center">Home service categories</h2>
          <p className="text-center text-slate-600 mb-8 max-w-2xl mx-auto">Fast service, verified professionals, instant matching, and multiple categories in one place.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {SERVICE_CATEGORIES.map((service) => (
              <Link key={service.title} to={service.to} className="card p-5 text-center hover:border-emerald-400 hover:shadow-md transition">
                <div className="text-3xl mb-2" aria-hidden="true">{service.icon}</div>
                <p className="font-semibold text-slate-900 text-sm">{service.title}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-xl">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 text-center">Pick your service need in one click</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {QUICK_SERVICE_NEEDS.map((serviceNeed) => (
              <button key={serviceNeed} onClick={() => navigate(`/request?problem=${encodeURIComponent(serviceNeed)}`)} className="card p-4 text-left hover:border-brand hover:shadow-md transition">
                <span className="text-sm font-semibold text-slate-900">{serviceNeed}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-slate-50">
        <div className="container-xl grid gap-8 lg:grid-cols-2">
          <div className="card p-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Simple process that feels effortless</h3>
            <ul className="grid gap-2 text-sm text-slate-700">
              {EASY_EXPERIENCE_FEATURES.map((item) => (
                <li key={item} className="flex items-start gap-2"><span className="text-emerald-600">✓</span><span>{item}</span></li>
              ))}
            </ul>
          </div>
          <div className="card p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <h3 className="text-2xl font-bold mb-4">Live progress tracker</h3>
            <div className="space-y-3">
              {PROGRESS_STEPS.map((step, idx) => (
                <div key={step} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${idx === 2 ? 'bg-emerald-500 animate-pulse' : 'bg-white/20'}`}>{idx + 1}</div>
                  <p className="text-sm">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-white">
        <div className="container-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8 text-center">Trusted homeowner experience</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              'Professional onboarding flow',
              'Animated status indicators',
              'Real-time updates UI',
              'Review submission flow',
              'Favorite contractor system',
              'Referral rewards section',
            ].map((feature) => (
              <div key={feature} className="card p-5 bg-white/70 backdrop-blur border border-slate-200">
                <p className="font-semibold text-slate-900">{feature}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="card p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Before/After gallery</h3>
              <div className="grid grid-cols-2 gap-3">
                <img src="/images/service-painting.jpg" alt="Before service" className="rounded-lg h-32 w-full object-cover" loading="lazy" />
                <img src="/images/service-landscaping.jpg" alt="After service" className="rounded-lg h-32 w-full object-cover" loading="lazy" />
              </div>
            </div>
            <div className="card p-4 bg-emerald-50 border-emerald-200">
              <h3 className="font-semibold text-slate-900 mb-2">Referral rewards</h3>
              <p className="text-sm text-slate-700 mb-4">Invite neighbors and unlock reward credits after completed services.</p>
              <button onClick={() => navigate('/signup')} className="btn-primary px-5 py-2 text-sm">Invite & Earn Rewards</button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
