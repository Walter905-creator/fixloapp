import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';
import StickyMobileCTA from '../components/StickyMobileCTA';
import UrgencyPopup from '../components/UrgencyPopup';
import SocialProofNotification from '../components/SocialProofNotification';
import ExitIntentModal from '../components/ExitIntentModal';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/config';

const TRADES = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'painting', label: 'Painting' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'cleaning', label: 'House Cleaning' },
  { value: 'junk_removal', label: 'Junk Removal' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'handyman', label: 'Handyman' },
  { value: 'appliance_repair', label: 'Appliance Repair' }
];

const BENEFITS = [
  'Real-time leads',
  'Flexible work area',
  'Build your reputation',
  'Manage jobs from anywhere',
  'First 3 months FREE'
];

const TESTIMONIALS = [
  {
    quote: 'Fixlo helped us turn local requests into booked jobs without chasing low-quality leads.',
    name: 'Marcus T.',
    role: 'Plumbing Pro'
  },
  {
    quote: 'I can review new opportunities from my phone and decide which neighborhoods fit my schedule.',
    name: 'Elena R.',
    role: 'HVAC Contractor'
  },
  {
    quote: 'The onboarding flow was easy, and the lead alerts started coming in right away.',
    name: 'David C.',
    role: 'Electrical Pro'
  }
];

const SOCIAL_PROOF = [
  '247 professionals joined this week.',
  'New homeowner request unlocked in Charlotte just now.',
  'Pros in Atlanta responded to 18 new leads today.'
];

const CounterCard = React.memo(function CounterCard({ label, target, suffix = '' }) {
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    const duration = 1200;
    const frames = 40;
    const increment = target / frames;
    let current = 0;
    const timer = window.setInterval(() => {
      current += increment;
      if (current >= target) {
        setValue(target);
        window.clearInterval(timer);
        return;
      }
      setValue(Math.round(current));
    }, duration / frames);

    return () => window.clearInterval(timer);
  }, [target]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-4xl font-extrabold text-white">{value.toLocaleString()}{suffix}</p>
      <p className="mt-2 text-sm text-slate-300">{label}</p>
    </div>
  );
});

const TestimonialCard = React.memo(function TestimonialCard({ quote, name, role }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-base font-medium leading-7 text-slate-700">“{quote}”</p>
      <p className="mt-6 font-bold text-slate-950">{name}</p>
      <p className="text-sm text-slate-500">{role}</p>
    </div>
  );
});

function ProSignupForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = React.useState({
    name: '',
    trade: '',
    location: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [smsOptIn, setSmsOptIn] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/signup/pro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, smsOptIn })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed.');
      }

      login(data.token, {
        role: 'pro',
        id: data.pro.id,
        name: data.pro.name,
        email: data.pro.email,
        trade: data.pro.trade,
        phone: data.pro.phone
      });

      navigate(data.pro.requiresSubscription ? '/pricing' : '/dashboard/pro');
    } catch (submitError) {
      setError(submitError.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form id="pro-signup-form" onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">Join Fixlo Today</p>
          <h2 className="mt-2 text-2xl font-extrabold text-white">Create your pro account</h2>
        </div>
        <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">First 3 months FREE</span>
      </div>

      {error ? <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">{error}</p> : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <input value={form.name} onChange={(e) => updateField('name', e.target.value)} required placeholder="Full name" className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-white placeholder:text-slate-400 outline-none focus:border-emerald-400" />
        <select value={form.trade} onChange={(e) => updateField('trade', e.target.value)} required className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-white outline-none focus:border-emerald-400">
          <option value="" className="bg-slate-950">Select your trade</option>
          {TRADES.map((trade) => (
            <option key={trade.value} value={trade.value} className="bg-slate-950">{trade.label}</option>
          ))}
        </select>
        <input value={form.location} onChange={(e) => updateField('location', e.target.value)} required placeholder="City, State" className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-white placeholder:text-slate-400 outline-none focus:border-emerald-400 sm:col-span-2" />
        <input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} required placeholder="Phone number" className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-white placeholder:text-slate-400 outline-none focus:border-emerald-400" />
        <input value={form.email} onChange={(e) => updateField('email', e.target.value)} required type="email" placeholder="Email" className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-white placeholder:text-slate-400 outline-none focus:border-emerald-400" />
        <input value={form.password} onChange={(e) => updateField('password', e.target.value)} required minLength={6} type="password" placeholder="Password" className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-white placeholder:text-slate-400 outline-none focus:border-emerald-400" />
        <input value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} required minLength={6} type="password" placeholder="Confirm password" className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-white placeholder:text-slate-400 outline-none focus:border-emerald-400" />
      </div>

      <label className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/25 p-4 text-sm text-slate-200">
        <input type="checkbox" checked={smsOptIn} onChange={(e) => setSmsOptIn(e.target.checked)} className="mt-1 h-4 w-4 rounded accent-emerald-500" />
        <span>I agree to receive SMS notifications from Fixlo about job leads and account updates. Reply STOP to unsubscribe.</span>
      </label>

      <button type="submit" disabled={loading} className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60">
        {loading ? 'Creating account…' : 'Join Fixlo Today'}
      </button>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
        <Link to="/pros/login" className="font-semibold text-white hover:text-emerald-200">Already a pro? Sign in</Link>
        <Link to="/pricing" className="font-semibold text-emerald-200 hover:text-white">View pricing</Link>
      </div>
    </form>
  );
}

export default function ProLanding() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Get More Local Jobs With Fixlo',
    description: 'Grow your business with verified local leads and sign up as a Fixlo pro.',
    url: 'https://www.fixloapp.com/pros',
    mainEntity: {
      '@type': 'Offer',
      name: 'Fixlo Pro Signup',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Fixlo'
      }
    }
  };

  return (
    <>
      <HelmetSEO
        title="Get More Local Jobs With Fixlo | Fixlo Pro"
        description="Grow your business with verified local leads. Join Fixlo to access real-time leads, flexible service areas, mobile job management, and a free first 3 months offer."
        canonicalPathname="/pros"
        structuredData={structuredData}
      />

      <UrgencyPopup enabled message="High-intent homeowner leads are available now in top Fixlo markets." />
      <SocialProofNotification enabled items={SOCIAL_PROOF} />
      <ExitIntentModal
        enabled
        title="Keep local jobs coming in"
        description="Start your Fixlo pro account now and secure your first 3 free months before today’s campaigns end."
        ctaHref="#pro-signup-form"
        ctaLabel="Join Fixlo Today"
      />
      <StickyMobileCTA enabled href="#pro-signup-form" label="Join Fixlo Today" sublabel="First 3 months FREE" />

      <section className="bg-slate-950 text-white">
        <div className="container-xl grid gap-12 py-16 md:py-24 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">For professionals</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
              Get More Local Jobs With Fixlo
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-200 md:text-xl">
              Grow your business with verified local leads.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {BENEFITS.map((benefit) => (
                <div key={benefit} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white">
                  {benefit}
                </div>
              ))}
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <CounterCard label="Active homeowners" target={1840} />
              <CounterCard label="Leads generated" target={12650} suffix="+" />
              <CounterCard label="Contractors joined" target={940} suffix="+" />
            </div>
          </div>

          <ProSignupForm />
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="container-xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">What pros like most</p>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-950 md:text-4xl">Built to help you respond faster and book more work</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((item) => (
              <TestimonialCard key={item.name} {...item} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
