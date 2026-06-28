import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';
import ConversionGrowthWidgets from '../components/ConversionGrowthWidgets';
import HomeownerExperienceSections from '../components/HomeownerExperienceSections';

export default function HomeownerLandingPage() {
  const navigate = useNavigate();

  return (
    <>
      <HelmetSEO
        title="Fixlo solves your home problems fast | Verified local pros"
        description="Solve your home problem today. Get help in minutes with verified professionals and instant matching across all major home service categories."
        canonicalPathname="/for-homeowners"
      />

      <section className="relative overflow-hidden" style={{ minHeight: '540px' }}>
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/images/how-it-works.jpg)' }} aria-hidden="true" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.80) 55%, rgba(15,23,42,0.45) 100%)' }} aria-hidden="true" />
        <div className="relative container-xl py-16 md:py-24 text-white">
          <div className="max-w-3xl">
            <p className="text-emerald-400 font-semibold uppercase tracking-widest text-sm mb-3">For Homeowners</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Fixlo solves your home problems fast.
            </h1>
            <p className="mt-4 text-lg md:text-xl text-slate-200">Find verified professionals in minutes.</p>
            <p className="mt-4 text-lg text-slate-200">
              Solve your home problem today. Get help in minutes. One place for every home service.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['Fast', 'Trusted', 'Local', 'Easy'].map((item) => (
                <span key={item} className="pill border-white/40 text-white bg-white/10">✓ {item}</span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <button onClick={() => navigate('/request')} className="inline-block text-white font-semibold text-lg px-10 py-4 rounded-full shadow-lg transition-colors" style={{ backgroundColor: '#2ecc71' }}>
                Get Started
              </button>
              <Link to="/services" className="inline-block bg-white/10 hover:bg-white/20 text-white font-semibold text-lg px-10 py-4 rounded-full shadow-lg transition-colors border border-white/30">
                Browse Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ConversionGrowthWidgets audience="homeowner" ctaText="Get Started" ctaLink="/request" />
      <HomeownerExperienceSections />
    </>
  );
}
