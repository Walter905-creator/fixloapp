import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { Link } from 'react-router-dom';
import list from '../data/services.json';
import StickyProCTA from '../components/StickyProCTA';
import { IS_HOLIDAY_SEASON } from '../utils/config';
import '../services-page.css';

const pageTitle = IS_HOLIDAY_SEASON
  ? 'Holiday Home Services | Christmas Repairs & Seasonal Maintenance | Fixlo'
  : 'Services | Fixlo';

const pageDescription = IS_HOLIDAY_SEASON
  ? 'Browse holiday home services: Christmas cleaning, light installation, winter repairs, seasonal maintenance, and emergency services. Servicios del hogar para la temporada navideña.'
  : 'Browse all available home services on Fixlo';

export default function ServicesPage() {
  return (
    <>
      <HelmetSEO title={pageTitle} description={pageDescription} canonicalPathname="/services" />
      <div className="fixlo-services-page">
        <div className="container-xl py-8">
          <nav className="mb-4 text-sm text-slate-600" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <Link to="/" className="font-semibold hover:text-amber-600">Home</Link>
              </li>
              <li>&rsaquo;</li>
              <li className="font-medium text-slate-900">Services</li>
            </ol>
          </nav>

          <section className="services-hero mb-8 px-6 py-8 md:px-10 md:py-11">
            <p className="services-gold text-sm font-black uppercase tracking-[0.22em]">Trusted home services</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight md:text-5xl">
              {IS_HOLIDAY_SEASON ? 'Holiday Home Services' : 'Professional Home Services Across the United States'}
            </h1>
            <p className="mt-5 max-w-4xl text-lg leading-8 text-white/80">
              {IS_HOLIDAY_SEASON ? (
                <>
                  Get your home ready for the holidays. Browse professional services for Christmas preparations,
                  winter maintenance, and seasonal repairs.
                </>
              ) : (
                <>
                  Fixlo connects homeowners with trusted, background-checked professionals for repairs,
                  maintenance, cleaning, landscaping, renovations, and more.
                </>
              )}
            </p>
          </section>

          <div className="services-trust mb-9 grid gap-4 rounded-2xl p-6 md:grid-cols-3">
            <div className="text-center">
              <div className="services-gold mb-2 text-3xl">✓</div>
              <div className="font-bold text-slate-900">Background Checked</div>
              <div className="text-sm text-slate-600">All professionals screened</div>
            </div>
            <div className="text-center">
              <div className="services-gold mb-2 text-3xl">⌂</div>
              <div className="font-bold text-slate-900">Nationwide Coverage</div>
              <div className="text-sm text-slate-600">Serving all 50 states</div>
            </div>
            <div className="text-center">
              <div className="services-gold mb-2 text-3xl">$</div>
              <div className="font-bold text-slate-900">Clear Service Options</div>
              <div className="text-sm text-slate-600">Know what happens next</div>
            </div>
          </div>

          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="services-gold text-sm font-black uppercase tracking-[0.18em]">Choose your project</p>
              <h2 className="mt-1 text-3xl font-black text-slate-900">Browse All Services</h2>
            </div>
            <Link to="/request" className="hidden text-sm font-bold text-amber-700 hover:text-black md:inline">
              Request a Service →
            </Link>
          </div>

          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((name) => (
              <article key={name} className="services-card p-6">
                <div className="text-xl font-black text-slate-950">{name}</div>
                <div className="mt-2 min-h-[3rem] text-base leading-7 text-slate-600">
                  Find trusted {name.toLowerCase()} professionals near you
                </div>
                <div className="mt-5">
                  <Link
                    to={`/services/${name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="services-button"
                  >
                    View Service <span className="ml-2" aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <section className="services-card mt-12 p-6 md:p-8">
            <p className="services-gold text-sm font-black uppercase tracking-[0.18em]">Local professionals</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">Popular Service Locations</h2>
            <p className="mb-6 mt-2 text-slate-600">
              Find home service professionals in major cities across the United States.
            </p>
            <div className="grid gap-3 text-sm sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[
                'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
                'San Antonio', 'San Diego', 'Dallas', 'Austin', 'Miami', 'Seattle',
                'Denver', 'Atlanta', 'Boston', 'Charlotte'
              ].map((city) => (
                <Link
                  key={city}
                  to={`/services/plumbing/${city.toLowerCase().replace(/\s+/g, '-')}`}
                  className="services-city-link rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 hover:bg-amber-100"
                >
                  {city}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
      <StickyProCTA />
    </>
  );
}
