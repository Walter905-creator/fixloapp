import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';
import Schema from '../seo/Schema';
import { IS_HOLIDAY_SEASON } from '../utils/config';

const SERVICES = [
  { to: '/us/services/plumbing', title: 'Plumbing', desc: 'Leaks, clogs, and repairs' },
  { to: '/us/services/electrical', title: 'Electrical', desc: 'Outlets, wiring, and lighting' },
  { to: '/us/services/hvac', title: 'HVAC', desc: 'Heating and cooling service' },
  { to: '/us/services/house-cleaning', title: 'House Cleaning', desc: 'Trusted home cleaning help' },
  { to: '/us/services/roofing', title: 'Roofing', desc: 'Roof repair and replacement' },
  { to: '/us/services/landscaping', title: 'Landscaping', desc: 'Yard and outdoor projects' }
];

const TESTIMONIALS = [
  { quote: 'I found a trusted pro fast and got my issue fixed the same day.', name: 'Sarah', location: 'Austin' },
  { quote: 'The request process was simple and the pro was professional and on time.', name: 'Daniel', location: 'Charlotte' },
  { quote: 'Easy to use and no pressure. I got help exactly when I needed it.', name: 'Maria', location: 'Phoenix' }
];

const pageTitle = IS_HOLIDAY_SEASON
  ? 'Fixlo – Book Holiday Home Services Near You'
  : 'Fixlo – Book Trusted Home Services Near You';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      <HelmetSEO title={pageTitle} canonicalPathname="/" />
      <Schema />

      <section className="bg-slate-900 text-white py-16 md:py-20">
        <div className="container-xl">
          <h1 className="text-4xl md:text-5xl font-extrabold">Get trusted home service help fast.</h1>
          <p className="mt-4 text-lg text-slate-200 max-w-3xl">
            Request a service, get matched with nearby pros, and solve your home problem quickly.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button onClick={() => navigate('/request')} className="btn-primary">Get Help Now</button>
            <Link to="/services" className="px-5 py-3 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors">Select a Service Category</Link>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-white">
        <div className="container-xl">
          <h2 className="text-3xl font-bold text-slate-900 text-center">Select your service category</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <Link key={service.to} to={service.to} className="card p-5 hover:border-brand hover:shadow-md transition">
                <h3 className="text-xl font-semibold text-slate-900">{service.title}</h3>
                <p className="mt-2 text-slate-600">{service.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-slate-50">
        <div className="container-xl">
          <h2 className="text-3xl font-bold text-slate-900 text-center">How Fixlo works for homeowners</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900">1. Request service</h3>
              <p className="mt-2 text-slate-600">Tell us your home problem, location, and preferred timing.</p>
            </div>
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900">2. Get matched</h3>
              <p className="mt-2 text-slate-600">We match you with qualified professionals near your area.</p>
            </div>
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900">3. Book with confidence</h3>
              <p className="mt-2 text-slate-600">Connect directly and schedule service with the pro you choose.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-white border-y border-slate-200">
        <div className="container-xl">
          <h2 className="text-3xl font-bold text-slate-900 text-center">Trust and safety</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900">Verified professionals</h3>
              <p className="mt-2 text-slate-600">Pros are vetted before receiving homeowner requests.</p>
            </div>
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900">Local matching</h3>
              <p className="mt-2 text-slate-600">Service requests are routed to nearby professionals.</p>
            </div>
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900">Secure platform</h3>
              <p className="mt-2 text-slate-600">Built with secure infrastructure and reliable communication flow.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-slate-50">
        <div className="container-xl">
          <h2 className="text-3xl font-bold text-slate-900 text-center">Reviews from homeowners</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((item, idx) => (
              <div key={idx} className="card p-6">
                <p className="text-slate-700">"{item.quote}"</p>
                <p className="mt-4 font-semibold text-slate-900">{item.name}</p>
                <p className="text-sm text-slate-600">{item.location}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-900 text-center">
        <div className="container-xl">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">Need help now?</h2>
          <p className="mt-3 text-slate-300">Request your service in minutes.</p>
          <button onClick={() => navigate('/request')} className="btn-primary mt-7">Get Help Now</button>
        </div>
      </section>
    </>
  );
}
