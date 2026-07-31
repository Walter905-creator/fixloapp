import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';
import { PRO_CITIES, PRO_TRADES, PRO_CITY_SLUGS, PRO_TRADE_SLUGS } from '../seo/proSeoData';

function titleCase(value = '') {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function ProJobsSEOPage() {
  const { trade: tradeSlug, city: citySlug } = useParams();
  const trade = PRO_TRADES[tradeSlug];
  const city = citySlug ? PRO_CITIES[citySlug] : null;

  if (!trade || (citySlug && !city)) {
    return <Navigate to="/pros" replace />;
  }

  const locationLabel = city ? `${city.city}, ${city.state}` : 'your area';
  const canonicalPathname = city
    ? `/pro-jobs/${tradeSlug}/${citySlug}`
    : `/pro-jobs/${tradeSlug}`;
  const pageTitle = city
    ? `${trade.label} Jobs in ${city.city}, ${city.state} | Join Fixlo Pro`
    : `${trade.label} Jobs & Local Leads | Join Fixlo Pro`;
  const description = city
    ? `Grow your ${trade.label.toLowerCase()} business in ${city.city}. Join Fixlo Pro to receive local homeowner opportunities, manage leads, and choose the jobs that fit your service area.`
    : `Join Fixlo Pro to receive local ${trade.label.toLowerCase()} opportunities, manage homeowner leads, and grow your service business.`;

  const faq = [
    {
      question: `How do ${trade.label.toLowerCase()} professionals receive opportunities through Fixlo?`,
      answer: 'After creating a pro account and completing onboarding, eligible professionals can receive notifications when homeowner requests match their trade and selected service area.'
    },
    {
      question: `Can I choose the areas where I want ${trade.label.toLowerCase()} work?`,
      answer: 'Yes. Fixlo is designed to help professionals focus on the locations and project types that fit their business.'
    },
    {
      question: 'Is a Fixlo pro an employee of Fixlo?',
      answer: 'No. Professionals use Fixlo as independent service providers and remain responsible for their own business, licensing, insurance, pricing, and customer agreements.'
    }
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: pageTitle,
        description,
        url: `https://www.fixloapp.com${canonicalPathname}`,
        about: {
          '@type': 'Service',
          name: `${trade.label} lead-matching platform`,
          areaServed: city
            ? { '@type': 'City', name: `${city.city}, ${city.state}` }
            : { '@type': 'Country', name: 'United States' },
          provider: { '@type': 'Organization', name: 'Fixlo' }
        }
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer }
        }))
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Fixlo', item: 'https://www.fixloapp.com/' },
          { '@type': 'ListItem', position: 2, name: 'For Pros', item: 'https://www.fixloapp.com/pros' },
          { '@type': 'ListItem', position: 3, name: `${trade.label} Jobs`, item: `https://www.fixloapp.com/pro-jobs/${tradeSlug}` },
          ...(city ? [{ '@type': 'ListItem', position: 4, name: locationLabel, item: `https://www.fixloapp.com${canonicalPathname}` }] : [])
        ]
      }
    ]
  };

  const relatedTrades = PRO_TRADE_SLUGS.filter((slug) => slug !== tradeSlug).slice(0, 5);
  const nearbyMarkets = PRO_CITY_SLUGS.filter((slug) => slug !== citySlug).slice(0, 6);

  return (
    <>
      <HelmetSEO
        title={pageTitle}
        description={description}
        canonicalPathname={canonicalPathname}
        structuredData={structuredData}
      />

      <main className="bg-slate-950 text-white">
        <section className="container-xl grid gap-10 py-16 md:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-400">Fixlo for independent professionals</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-6xl">
              Get more {trade.label.toLowerCase()} opportunities in {locationLabel}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Connect with homeowners looking for dependable {trade.plural}. Choose the opportunities that match your trade, schedule, and service area.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/pros/signup" className="rounded-full bg-amber-400 px-7 py-3 font-bold text-slate-950 transition hover:bg-amber-300">
                Join Fixlo Pro
              </Link>
              <Link to="/pros" className="rounded-full border border-white/20 px-7 py-3 font-bold text-white transition hover:border-amber-400 hover:text-amber-300">
                See how Fixlo works
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-400">Independent professionals choose which opportunities to pursue. Availability varies by market and trade.</p>
          </div>

          <div className="rounded-3xl border border-amber-400/25 bg-white/5 p-7 shadow-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">Popular homeowner requests</p>
            <ul className="mt-5 space-y-3">
              {trade.services.map((service) => (
                <li key={service} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-slate-100">
                  <span className="text-amber-400">✓</span>
                  <span>{titleCase(service)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-white py-16 text-slate-950 md:py-20">
          <div className="container-xl grid gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-600">Grow locally</p>
              <h2 className="mt-3 text-3xl font-extrabold md:text-4xl">A simpler way to find homeowners who need your trade</h2>
              <p className="mt-5 leading-7 text-slate-600">
                Fixlo helps homeowners submit detailed service requests and helps pros discover opportunities that fit their business. Your account keeps lead details, notifications, and job activity in one place.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {['Local lead notifications', 'Flexible service area', 'Mobile-friendly dashboard', 'Control over the work you accept'].map((benefit) => (
                  <div key={benefit} className="rounded-2xl border border-slate-200 p-5 font-semibold shadow-sm">{benefit}</div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-slate-950 p-8 text-white">
              <h2 className="text-2xl font-extrabold">Start receiving matching opportunities</h2>
              <ol className="mt-6 space-y-5 text-slate-300">
                <li><strong className="text-white">1. Create your pro account.</strong> Add your trade and contact information.</li>
                <li><strong className="text-white">2. Set your service area.</strong> Focus on neighborhoods and markets that work for you.</li>
                <li><strong className="text-white">3. Complete onboarding.</strong> Finish the required account and verification steps.</li>
                <li><strong className="text-white">4. Review matching requests.</strong> Respond to opportunities that fit your business.</li>
              </ol>
              <Link to="/pros/signup" className="mt-8 inline-flex rounded-full bg-amber-400 px-6 py-3 font-bold text-slate-950 hover:bg-amber-300">
                Create a pro account
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-slate-100 py-16 text-slate-950">
          <div className="container-xl">
            <h2 className="text-3xl font-extrabold">Frequently asked questions</h2>
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {faq.map((item) => (
                <article key={item.question} className="rounded-3xl bg-white p-6 shadow-sm">
                  <h3 className="font-bold">{item.question}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-16 text-slate-950">
          <div className="container-xl grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-extrabold">Explore other trades</h2>
              <div className="mt-5 flex flex-wrap gap-3">
                {relatedTrades.map((slug) => (
                  <Link key={slug} to={`/pro-jobs/${slug}${city ? `/${citySlug}` : ''}`} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-amber-500">
                    {PRO_TRADES[slug].label} opportunities{city ? ` in ${city.city}` : ''}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold">Explore active markets</h2>
              <div className="mt-5 flex flex-wrap gap-3">
                {nearbyMarkets.map((slug) => (
                  <Link key={slug} to={`/pro-jobs/${tradeSlug}/${slug}`} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-amber-500">
                    {PRO_CITIES[slug].city}, {PRO_CITIES[slug].state}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
