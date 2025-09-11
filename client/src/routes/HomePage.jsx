import React, { useState } from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { Link } from 'react-router-dom';

// Unsplash Source (bright residential photos, no hardhats)
// 1200x900 for service cards (4:3), 1200x675 for hero/how-it-works (16:9)
const U4x3 = (q) => `https://source.unsplash.com/1200x900/?${encodeURIComponent(q)}`;
const U16x9 = (q) => `https://source.unsplash.com/1200x675/?${encodeURIComponent(q)}`;

// Hero + How it Works
const HERO_IMG = U16x9('handyman, residential, inside home, friendly, bright, smiling, no hardhat');
const HOW_IMG  = U16x9('homeowner couple with contractor, living room, tablet, bright, residential');

// Services (keep your order exactly)
const SERVICES = [
  { to:'/services/plumbing',    title:'Plumbing',      desc:'Faucets, pipes, drains, and more',      img: U4x3('plumber fixing sink, kitchen, residential, bright, no hardhat') },
  { to:'/services/electrical',  title:'Electrical',    desc:'Lighting, wiring, outlets, and more',   img: U4x3('electrician at breaker panel, residential home, bright, no hardhat') },
  { to:'/services/cleaning',    title:'Cleaning',      desc:'Housekeeping, carpets, windows',        img: U4x3('house cleaner vacuum living room, residential, bright, tidy') },
  { to:'/services/roofing',     title:'Roofing',       desc:'Repairs, replacements, inspections',    img: U4x3('roofer installing shingles, small house, residential, daylight, no hardhat') },
  { to:'/services/hvac',        title:'HVAC',          desc:'Heating, cooling, vents',               img: U4x3('hvac technician checking outdoor ac unit, home exterior, residential') },
  { to:'/services/carpentry',   title:'Carpentry',     desc:'Framing, trim, installs',               img: U4x3('carpenter measuring wood, home garage workshop, residential') },
  { to:'/services/painting',    title:'Painting',      desc:'Interior and exterior painting',        img: U4x3('painter rolling paint on wall, interior, residential, bright') },
  { to:'/services/landscaping', title:'Landscaping',   desc:'Lawn, garden, hardscape',               img: U4x3('landscaper mowing front yard, trimming hedges, residential, sunny') },
  { to:'/services/junk-removal',title:'Junk Removal',  desc:'Haul away unwanted items',              img: U4x3('junk removal loading furniture into small truck, driveway, residential') },
  { to:'/services/decks',       title:'Decks',         desc:'Build, repair, staining',               img: U4x3('contractor building backyard deck, residential house, sunny') },
  { to:'/services/handyman',    title:'Handyman',      desc:'Small jobs, quick fixes',               img: U4x3('handyman using drill, fixing door hinge, inside house, residential') },
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
              <img
                src={HERO_IMG}
                alt="Fixlo professional at work"
                className="rounded-3xl shadow-xl border border-slate-200 w-full h-auto object-cover"
              />
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
                  {/* Image column with fixed aspect ratio to prevent collapse */}
                  <div className="col-span-2 aspect-[4/3]">
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
              <img
                src={HOW_IMG}
                alt="How Fixlo works"
                className="rounded-3xl shadow-xl border border-slate-200 w-full h-auto object-cover"
              />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
