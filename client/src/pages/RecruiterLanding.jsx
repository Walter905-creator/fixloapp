import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';
import StickyMobileCTA from '../components/StickyMobileCTA';
import UrgencyPopup from '../components/UrgencyPopup';
import SocialProofNotification from '../components/SocialProofNotification';
import ExitIntentModal from '../components/ExitIntentModal';
import { useRecruiterAuth } from '../context/RecruiterAuthContext';
import { API_BASE } from '../utils/config';

const BENEFITS = [
  '50% direct commission',
  '10% second-level commission',
  'Weekly payouts',
  'Work remotely',
  'No experience required'
];

const SOCIAL_PROOF = [
  'A new recruiter referral was approved this morning.',
  'Weekly payouts are being prepared for active recruiter accounts.',
  'Pros from Charlotte and Atlanta joined through recruiter links today.'
];

const BenefitCard = React.memo(function BenefitCard({ text }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-base font-bold text-slate-950">{text}</p>
    </div>
  );
});

function RecruiterSignupForm() {
  const navigate = useNavigate();
  const { login } = useRecruiterAuth();
  const [form, setForm] = React.useState({
    name: '',
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
      const response = await fetch(`${API_BASE}/api/auth/signup/recruiter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, smsOptIn })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed.');
      }

      login(data.token, data.recruiter);
      navigate('/dashboard/recruiter');
    } catch (submitError) {
      setError(
        submitError instanceof TypeError
          ? 'We could not reach Fixlo right now. Please check your connection and try again.'
          : (submitError.message || 'Signup failed.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form id="recruiter-signup-form" onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">Start earning remotely</p>
      <h2 className="mt-2 text-2xl font-extrabold text-slate-950">Create your recruiter account</h2>

      {error ? <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="mt-5 grid gap-4">
        <input value={form.name} onChange={(e) => updateField('name', e.target.value)} required placeholder="Full name" className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
        <input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} required placeholder="Phone number" className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
        <input value={form.email} onChange={(e) => updateField('email', e.target.value)} required type="email" placeholder="Email" className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
        <input value={form.password} onChange={(e) => updateField('password', e.target.value)} required minLength={6} type="password" placeholder="Password" className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
        <input value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} required minLength={6} type="password" placeholder="Confirm password" className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
      </div>

      <label className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <input type="checkbox" checked={smsOptIn} onChange={(e) => setSmsOptIn(e.target.checked)} className="mt-1 h-4 w-4 rounded accent-blue-500" />
        <span>I agree to receive SMS notifications from Fixlo regarding referrals, commissions, and account updates. Reply STOP to unsubscribe or HELP for assistance.</span>
      </label>

      <button type="submit" disabled={loading} className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60">
        {loading ? 'Creating account…' : 'Start earning now'}
      </button>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <Link to="/recruiter/login" className="font-semibold text-blue-600 hover:text-blue-500">Already have an account?</Link>
        <Link to="/terms" className="font-semibold text-slate-700 hover:text-slate-950">Terms</Link>
      </div>
    </form>
  );
}

export default function RecruiterLanding() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Earn Money Referring Contractors',
    description: 'Join the Fixlo recruiter network and earn direct and second-level commissions with weekly payouts.',
    url: 'https://www.fixloapp.com/recruiters',
    mainEntity: {
      '@type': 'OrganizationRole',
      roleName: 'Recruiter Partner',
      memberOf: {
        '@type': 'Organization',
        name: 'Fixlo'
      }
    }
  };

  return (
    <>
      <HelmetSEO
        title="Earn Money Referring Contractors | Fixlo Recruiters"
        description="Earn money referring contractors with 50% direct commission, 10% second-level commission, weekly payouts, remote flexibility, and no experience required."
        canonicalPathname="/recruiters"
        structuredData={structuredData}
      />

      <UrgencyPopup enabled message="Recruiter partner spots are expanding in active contractor markets this week." />
      <SocialProofNotification enabled items={SOCIAL_PROOF} />
      <ExitIntentModal
        enabled
        title="Start building referral income"
        description="Create your recruiter account now and start sharing Fixlo with contractors in your network."
        ctaHref="#recruiter-signup-form"
        ctaLabel="Create recruiter account"
      />
      <StickyMobileCTA enabled href="#recruiter-signup-form" label="Start earning now" sublabel="Weekly payouts" />

      <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
        <div className="container-xl grid gap-12 py-16 md:py-24 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-300">For recruiters</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
              Earn Money Referring Contractors
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-200 md:text-xl">
              Share Fixlo with contractors, earn recurring-style referral upside, and work from anywhere.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {BENEFITS.map((benefit) => (
                <div key={benefit} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white">
                  {benefit}
                </div>
              ))}
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ['50%', 'direct commission'],
                ['10%', 'second-level'],
                ['Weekly', 'payout cycle']
              ].map(([value, label]) => (
                <div key={label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-3xl font-extrabold text-white">{value}</p>
                  <p className="mt-2 text-sm text-slate-300">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <RecruiterSignupForm />
        </div>
      </section>

      <section className="bg-slate-50 py-16 md:py-20">
        <div className="container-xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">Why recruiters join</p>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-950 md:text-4xl">A simple referral funnel with clear commissions and weekly visibility</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {BENEFITS.map((text) => (
              <BenefitCard key={text} text={text} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
