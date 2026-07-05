import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import MultiStepLeadForm from '../components/MultiStepLeadForm';
import StickyMobileCTA from '../components/StickyMobileCTA';
import UrgencyPopup from '../components/UrgencyPopup';
import SocialProofNotification from '../components/SocialProofNotification';
import ExitIntentModal from '../components/ExitIntentModal';

const TRUST_BADGES = [
  'Verified Professionals',
  'Fast Response',
  'Local Experts',
  'Satisfaction Focused'
];

const HOMEOWNER_SOCIAL_PROOF = [
  'John from Charlotte requested a plumber 3 minutes ago.',
  '14 homeowners requested quotes today.',
  'New HVAC quote request just opened in Raleigh.',
  'A homeowner in Dallas booked house cleaning this afternoon.'
];

const HIGHLIGHTS = [
  {
    title: 'Tell us what you need',
    text: 'Choose your service, ZIP code, and ideal date in a guided flow built for fast conversions.'
  },
  {
    title: 'Reach verified local pros',
    text: 'Your request is sent through the current Fixlo lead routing system so verified professionals can respond.'
  },
  {
    title: 'Compare up to 3 quotes',
    text: 'Get matched quickly and review responses without changing the current Fixlo request workflow.'
  }
];

const HighlightCard = React.memo(function HighlightCard({ title, text }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm text-slate-600">{text}</p>
    </div>
  );
});

export default function HomeownerLanding() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Find Trusted Local Professionals Near You',
    description: 'Get up to 3 quotes from verified professionals with Fixlo.',
    url: 'https://www.fixloapp.com/homeowners',
    mainEntity: {
      '@type': 'Service',
      name: 'Fixlo homeowner quote matching',
      provider: {
        '@type': 'Organization',
        name: 'Fixlo',
        url: 'https://www.fixloapp.com'
      },
      areaServed: 'United States'
    }
  };

  return (
    <>
      <HelmetSEO
        title="Find Trusted Local Professionals Near You | Fixlo"
        description="Get up to 3 quotes from verified professionals with Fixlo. Request plumbing, electrical, HVAC, cleaning, junk removal, landscaping, carpentry, and remodeling help in minutes."
        canonicalPathname="/homeowners"
        structuredData={structuredData}
      />

      <UrgencyPopup enabled message="Popular ZIP codes are filling quickly today. Submit now to reach professionals faster." />
      <SocialProofNotification enabled items={HOMEOWNER_SOCIAL_PROOF} />
      <ExitIntentModal
        enabled
        title="Get matched with trusted local professionals"
        description="Finish your request now and keep your spot in today’s response queue."
        ctaHref="#homeowner-lead-form"
        ctaLabel="Finish my request"
      />
      <StickyMobileCTA enabled href="#homeowner-lead-form" label="Get quotes now" sublabel="Verified local pros" />

      <section className="bg-slate-950 text-white">
        <div className="container-xl grid gap-12 py-16 md:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">For homeowners</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
              Find Trusted Local Professionals Near You
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-200 md:text-xl">
              Get up to 3 quotes from verified professionals.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {TRUST_BADGES.map((badge) => (
                <span key={badge} className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                  {badge}
                </span>
              ))}
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ['3', 'quotes available'],
                ['24/7', 'lead intake'],
                ['Fast', 'local matching']
              ].map(([value, label]) => (
                <div key={label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-3xl font-extrabold text-white">{value}</p>
                  <p className="mt-2 text-sm text-slate-300">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="homeowner-lead-form">
            <MultiStepLeadForm />
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16 md:py-20">
        <div className="container-xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">Why homeowners convert</p>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-950 md:text-4xl">A faster path from request to real local quotes</h2>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {HIGHLIGHTS.map((item) => (
              <HighlightCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
