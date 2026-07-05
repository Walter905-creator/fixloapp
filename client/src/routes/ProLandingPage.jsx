import React from 'react';
import { Link } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';

export default function ProLandingPage() {
  return (
    <>
      <HelmetSEO
        title="For Pros | Fixlo"
        description="Join Fixlo Pro or Fixlo Verified Plus and get matched with nearby homeowner leads."
        canonicalPathname="/pros"
      />

      <section className="bg-slate-900 text-white py-16 md:py-20">
        <div className="container-xl">
          <p className="text-emerald-300 font-semibold uppercase tracking-wider text-sm">For Pros</p>
          <h1 className="mt-3 text-4xl md:text-5xl font-extrabold">Grow your business with Fixlo</h1>
          <p className="mt-4 text-lg text-slate-200 max-w-3xl">
            Choose the plan that fits your growth goals and start receiving qualified homeowner requests.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/pros/signup" className="btn-primary">Join as Pro</Link>
            <Link to="/pros/login" className="px-5 py-3 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors">Pro Login</Link>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-white">
        <div className="container-xl grid gap-6 md:grid-cols-2">
          <div className="card p-6">
            <p className="text-sm font-semibold text-slate-500">Fixlo Pro</p>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2">$59.99/month</h2>
            <p className="mt-3 text-slate-700">
              Get matched with homeowner leads in your trade within a 30-mile radius.
            </p>
            <ul className="mt-4 space-y-2 text-slate-700">
              <li>• 30-mile lead matching</li>
              <li>• Leads by trade and location</li>
              <li>• Pro dashboard access</li>
            </ul>
            <Link to="/pros/signup" className="btn-primary mt-5 inline-block">Join as Pro</Link>
          </div>

          <div className="card p-6 border-slate-900 bg-slate-900 text-white">
            <p className="text-sm font-semibold text-slate-300">Fixlo Verified Plus</p>
            <h2 className="text-3xl font-extrabold mt-2">$179.99/month</h2>
            <p className="mt-3 text-slate-100">
              Verified leads are routed to you first with a 1-hour exclusive lead priority window.
            </p>
            <ul className="mt-4 space-y-2 text-slate-100">
              <li>• Verified 1-hour exclusive lead priority</li>
              <li>• Verified-first lead routing</li>
              <li>• Priority response opportunities</li>
            </ul>
            <Link to="/pros/signup" className="mt-5 inline-block rounded-lg bg-white px-4 py-2 font-semibold text-slate-900">Get Priority Leads</Link>
          </div>
        </div>
      </section>
    </>
  );
}
