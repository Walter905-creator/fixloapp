import React, { useState } from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { Link } from 'react-router-dom';

import heroPro from '../assets/hero-pro.jpg';
import howItWorks from '../assets/how-it-works.jpg';
import svcPlumbing from '../assets/service-plumbing.jpg';
import svcElectrical from '../assets/service-electrical.jpg';
import svcCleaning from '../assets/service-cleaning.jpg';
import svcRoofing from '../assets/service-roofing.jpg';
import svcHVAC from '../assets/service-hvac.jpg';
import svcCarpentry from '../assets/service-carpentry.jpg';
import svcPainting from '../assets/service-painting.jpg';
import svcLandscaping from '../assets/service-landscaping.jpg';
import svcJunk from '../assets/service-junk-removal.jpg';
import svcDecks from '../assets/service-decks.jpg';
import svcHandyman from '../assets/service-handyman.jpg';

const SERVICES = [
  { to:'/services/plumbing', title:'Plumbing', desc:'Faucets, pipes, drains, and more', img:svcPlumbing },
  { to:'/services/electrical', title:'Electrical', desc:'Lighting, wiring, outlets, and more', img:svcElectrical },
  { to:'/services/cleaning', title:'Cleaning', desc:'Housekeeping, carpets, windows', img:svcCleaning },
  { to:'/services/roofing', title:'Roofing', desc:'Repairs, replacements, inspections', img:svcRoofing },
  { to:'/services/hvac', title:'HVAC', desc:'Heating, cooling, vents', img:svcHVAC },
  { to:'/services/carpentry', title:'Carpentry', desc:'Framing, trim, installs', img:svcCarpentry },
  { to:'/services/painting', title:'Painting', desc:'Interior and exterior painting', img:svcPainting },
  { to:'/services/landscaping', title:'Landscaping', desc:'Lawn, garden, hardscape', img:svcLandscaping },
  { to:'/services/junk-removal', title:'Junk Removal', desc:'Haul away unwanted items', img:svcJunk },
  { to:'/services/decks', title:'Decks', desc:'Build, repair, staining', img:svcDecks },
  { to:'/services/handyman', title:'Handyman', desc:'Small jobs, quick fixes', img:svcHandyman },
];

export default function HomePage(){
  const [query, setQuery] = useState('');
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
              <p className="mt-4 text-slate-600">
                Discover vetted pros, compare quotes, and book with confidence.
              </p>
              <div className="mt-6">
                <div className="flex items-center gap-3 bg-white rounded-2xl p-2 shadow-md border border-slate-200">
                  <input
                    value={query}
                    onChange={(e)=>setQuery(e.target.value)}
                    placeholder="What service do you need?"
                    className="flex-1 bg-transparent px-4 py-3 rounded-xl text-slate-900 placeholder-slate-500 outline-none"
                  />
                  {/* Green Search button */}
                  <Link to="/services" className="btn-accent px-5 py-3 rounded-xl">Search</Link>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-4 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1">⭐ <b className="text-slate-900">Trusted pros</b></span>
                <span className="inline-flex items-center gap-1">🛡️ <b className="text-slate-900">Background checks</b></span>
                <span className="inline-flex items-center gap-1">💬 <b className="text-slate-900">Fast quotes</b></span>
              </div>
            </div>
            <div>
              <img src={heroPro} alt="Fixlo professional at work" className="rounded-3xl shadow-xl border border-slate-200 w-full h-auto object-cover" />
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-6 md:py-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <Link key={s.to} to={s.to} className="group card overflow-hidden">
                <div className="grid grid-cols-5">
                  <div className="col-span-3 p-5">
                    <h3 className="text-xl font-semibold">{s.title}</h3>
                    <p className="mt-2 text-slate-600">{s.desc}</p>
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
        <section className="py-10 md:py-14 bg-white">
          <div className="grid md:grid-cols-2 gap-8 items-center text-slate-900">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">How it works</h2>
              <p className="mt-3 text-slate-600">
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
                    <div className="mt-2 text-slate-800">{i.t}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <img src={howItWorks} alt="How Fixlo works" className="rounded-3xl shadow-xl border border-slate-200 w-full h-auto object-cover" />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
