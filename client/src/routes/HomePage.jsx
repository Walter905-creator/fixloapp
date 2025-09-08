
import React, { useState } from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { Link } from 'react-router-dom';

export default function HomePage(){
  const [query, setQuery] = useState("");
  return (
    <>
      <HelmetSEO title="Fixlo – Book Trusted Home Services Near You" />
      <div className="container-xl">
        {/* Hero */}
        <section className="py-10 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Search services<br/>near you
              </h1>
              <p className="mt-4 text-slate-300">
                Discover vetted pros, compare quotes, and book with confidence.
              </p>
              <div className="mt-6">
                <div className="flex items-center gap-3 bg-white/95 rounded-2xl p-2 shadow-xl">
                  <input
                    value={query}
                    onChange={(e)=>setQuery(e.target.value)}
                    placeholder="What service do you need?"
                    className="flex-1 bg-transparent px-4 py-3 rounded-xl text-slate-900 placeholder-slate-500 outline-none"
                  />
                  <Link to="/services" className="btn btn-primary px-5 py-3 rounded-xl">Search</Link>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3 text-sm text-slate-400">
                <span className="inline-flex items-center gap-1">⭐ <b className="text-slate-200">Trusted pros</b></span>
                <span className="inline-flex items-center gap-1">🛡️ <b className="text-slate-200">Background checks</b></span>
                <span className="inline-flex items-center gap-1">💬 <b className="text-slate-200">Fast quotes</b></span>
              </div>
            </div>
            <div>
              <img src="/images/hero-pro.jpg" alt="Fixlo professional at work" className="rounded-3xl shadow-2xl border border-white/10 w-full h-auto object-cover" />
            </div>
          </div>
        </section>

        {/* Services grid */}
        <section className="py-6 md:py-8">
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {to:'/services/plumbing', title:'Plumbing', desc:'Faucets, pipes, drains, and more', img:'/images/service-plumbing.jpg'},
              {to:'/services/electrical', title:'Electrical', desc:'Lighting, wiring, outlets, and more', img:'/images/service-electrical.jpg'},
              {to:'/services/cleaning', title:'Cleaning', desc:'Housekeeping, carpets, windows', img:'/images/service-cleaning.jpg'},
              {to:'/services/roofing', title:'Roofing', desc:'Repairs, replacements, inspections', img:'/images/service-roofing.jpg'},
            ].map((s) => (
              <Link key={s.to} to={s.to} className="group card overflow-hidden">
                <div className="grid grid-cols-5 gap-0">
                  <div className="col-span-3 p-5">
                    <h3 className="text-xl font-semibold">{s.title}</h3>
                    <p className="mt-2 text-slate-300">{s.desc}</p>
                    <div className="mt-4 inline-flex items-center gap-2 text-brand group-hover:text-brand-dark transition-colors">
                      <span>Explore</span>
                      <span>→</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <img src={s.img} alt={s.title} className="w-full h-full object-cover" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="py-10 md:py-14">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold">How it works</h2>
              <p className="mt-3 text-slate-300">
                Tell us what you need, get matched to vetted pros, and compare quotes. Book the one that fits your project and budget.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
                {[
                  {icon:'📝', t:'Post your job'},
                  {icon:'⚡', t:'Get quick quotes'},
                  {icon:'✅', t:'Hire with confidence'}
                ].map((i)=>(
                  <div key={i.t} className="card p-4 text-center">
                    <div className="text-2xl">{i.icon}</div>
                    <div className="mt-2">{i.t}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <img src="/images/how-it-works.jpg" alt="How Fixlo works" className="rounded-3xl shadow-2xl border border-white/10 w-full h-auto object-cover" />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
