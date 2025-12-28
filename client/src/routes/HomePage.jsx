import React, { useState, useEffect } from "react";
import HelmetSEO from "../seo/HelmetSEO";
import Schema from "../seo/Schema";
import { Link, useNavigate } from "react-router-dom";
import StickyProCTA from "../components/StickyProCTA";
import ServiceIntakeButton from "../components/ServiceIntakeButton";
import HomeReferralSection from "../components/HomeReferralSection";
import ReferralSection from "../components/ReferralSection";
import { useAuth } from "../context/AuthContext";
import { detectUserCountry } from "../utils/countryDetection";
import { IS_HOLIDAY_SEASON } from "../utils/config";

/**
 * Local images from /public/images
 */
const HERO_IMG = "/images/hero-pro.jpg";

const SERVICES = [
  { to: "/services/plumbing",     title: "Plumbing",      desc: "Faucets, pipes, drains, and more",       benefit: "Fast response from verified local professionals", img: "/images/service-plumbing.jpg" },
  { to: "/services/electrical",   title: "Electrical",    desc: "Lighting, wiring, outlets, and more",    benefit: "Licensed electricians ready to help you today", img: "/images/service-electrical.jpg" },
  { to: "/services/cleaning",     title: "Cleaning",      desc: "Housekeeping, carpets, windows",         benefit: "Trusted cleaners for your home or office", img: "/images/service-cleaning.jpg" },
  { to: "/services/roofing",      title: "Roofing",       desc: "Repairs, replacements, inspections",     benefit: "Expert roofers protecting your investment", img: "/images/service-roofing.jpg" },
  { to: "/services/hvac",         title: "HVAC",          desc: "Heating, cooling, vents",                benefit: "Keep your home comfortable year-round", img: "/images/service-hvac.jpg" },
  { to: "/services/carpentry",    title: "Carpentry",     desc: "Framing, trim, installs",                benefit: "Skilled carpenters for quality craftsmanship", img: "/images/service-carpentry.jpg" },
  { to: "/services/painting",     title: "Painting",      desc: "Interior and exterior painting",         benefit: "Transform your space with professional painters", img: "/images/service-painting.jpg" },
  { to: "/services/landscaping",  title: "Landscaping",   desc: "Lawn, garden, hardscape",                benefit: "Beautiful outdoor spaces by local experts", img: "/images/service-landscaping.jpg" },
  { to: "/services/junk-removal", title: "Junk Removal",  desc: "Haul away unwanted items",               benefit: "Quick and easy removal service near you", img: "/images/service-junk-removal.jpg" },
  { to: "/services/decks",        title: "Decks",         desc: "Build, repair, staining",                benefit: "Quality deck work from experienced builders", img: "/images/service-decks.jpg" },
  { to: "/services/handyman",     title: "Handyman",      desc: "Small jobs, quick fixes",                benefit: "Reliable handymen for all your home repairs", img: "/images/service-handyman.jpg" }
];

const TESTIMONIALS = [
  {
    quote: "I've been getting consistent leads since day one. No more chasing work or paying crazy fees for each job.",
    name: "Mike",
    location: "Denver",
    role: "Plumber"
  },
  {
    quote: "Found a trusted electrician in minutes. He showed up on time and the price was exactly what we agreed on.",
    name: "Sarah",
    location: "Austin",
    role: "Homeowner"
  },
  {
    quote: "Best decision for my painting business. The flat monthly fee means I can actually plan my budget.",
    name: "Carlos",
    location: "Phoenix",
    role: "Painter"
  }
];

const pageTitle = IS_HOLIDAY_SEASON 
  ? "Fixlo – Book Holiday Home Services & Christmas Repairs Near You"
  : "Fixlo – Book Trusted Home Services Near You";

export default function HomePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [countryCode, setCountryCode] = useState('US');

  useEffect(() => {
    // Only detect country if we might need it for the referral section
    const shouldDetectCountry = !isAuthenticated || (user?.role === 'pro' && user?.id);
    
    if (shouldDetectCountry) {
      // Detect user country for share button behavior
      detectUserCountry().then(info => {
        if (info && info.countryCode) {
          setCountryCode(info.countryCode);
        }
      }).catch(err => {
        console.error('Failed to detect country, using default US settings:', err);
      });
    }
  }, [isAuthenticated, user]);

  return (
    <>
      <HelmetSEO title={pageTitle} canonicalPathname="/" />
      <Schema />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-slate-50 to-white overflow-hidden">
        <div className="container-xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center py-12 md:py-16 lg:py-20">
            {/* Hero Content */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-slate-900">
                Trusted Local Pros.
                <br />
                Real Jobs.
                <br />
                <span className="text-brand">No Lead Fees.</span>
              </h1>
              
              <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0">
                Fixlo connects homeowners with verified professionals and helps pros get unlimited job leads — all on one simple platform.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-col gap-4 justify-center lg:justify-start">
                {/* Charlotte Service Intake Button */}
                <div className="w-full">
                  <ServiceIntakeButton />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => navigate("/join")}
                    className="btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Get Jobs Near Me
                  </button>
                  <button
                    onClick={() => navigate("/services")}
                    className="btn-ghost text-lg px-8 py-4 hover:bg-slate-100"
                  >
                    Book a Trusted Pro
                  </button>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="order-1 lg:order-2">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={HERO_IMG}
                  alt="Professional tradesperson at work"
                  className="w-full h-auto object-cover"
                  width="600"
                  height="600"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Referral Program Section */}
      {isAuthenticated && user?.role === 'pro' && user?.id ? (
        <section className="py-12 md:py-16">
          <div className="container-xl">
            <ReferralSection proId={user.id} country={countryCode} />
          </div>
        </section>
      ) : (
        <HomeReferralSection />
      )}

      {/* Trust Signal Strip */}
      <section className="bg-white border-y border-slate-200 py-6">
        <div className="container-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">
                ✓
              </div>
              <p className="text-sm font-medium text-slate-700">Background-Checked Professionals</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">
                💰
              </div>
              <p className="text-sm font-medium text-slate-700">No Lead Fees or Commissions</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">
                🇺🇸
              </div>
              <p className="text-sm font-medium text-slate-700">Serving Homeowners Across the U.S.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="container-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-10 text-center">
            What people are saying
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial, idx) => (
              <div key={idx} className="card p-6">
                <p className="text-slate-700 mb-4 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.name}</p>
                    <p className="text-sm text-slate-600">{testimonial.role} • {testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container-xl">
        {/* Services Section */}
        <section className="py-12 md:py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 text-center">
            Book trusted home services
          </h2>
          <p className="text-center text-slate-600 mb-10 max-w-2xl mx-auto">
            Plumbing, electrical, junk removal, cleaning & more
          </p>
          
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <Link key={s.to} to={s.to} className="group card overflow-hidden">
                <div className="grid grid-cols-5">
                  <div className="col-span-3 p-5">
                    <h3 className="text-xl font-semibold">{s.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{s.desc}</p>
                    <p className="mt-3 text-sm font-medium text-emerald-700">
                      {s.benefit}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 text-brand group-hover:text-brand-dark transition-colors">
                      <span>Explore</span>
                      <span>→</span>
                    </div>
                  </div>
                  <div className="col-span-2 aspect-[4/3]">
                    <img
                      src={s.img}
                      alt={s.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Popular near you */}
          <div className="mt-10 p-6 bg-white rounded-2xl border border-slate-200">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Popular services near you</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              <Link to="/services/plumbing/new-york" className="text-brand hover:underline">
                Plumbing in New York
              </Link>
              <Link to="/services/electrical/los-angeles" className="text-brand hover:underline">
                Electrical in Los Angeles
              </Link>
              <Link to="/services/cleaning/chicago" className="text-brand hover:underline">
                Cleaning in Chicago
              </Link>
              <Link to="/services/hvac/houston" className="text-brand hover:underline">
                HVAC in Houston
              </Link>
              <Link to="/services/plumbing/phoenix" className="text-brand hover:underline">
                Plumbing in Phoenix
              </Link>
              <Link to="/services/roofing/philadelphia" className="text-brand hover:underline">
                Roofing in Philadelphia
              </Link>
              <Link to="/services/junk-removal/san-antonio" className="text-brand hover:underline">
                Junk Removal in San Antonio
              </Link>
              <Link to="/services/painting/san-diego" className="text-brand hover:underline">
                Painting in San Diego
              </Link>
              <Link to="/services/landscaping/dallas" className="text-brand hover:underline">
                Landscaping in Dallas
              </Link>
            </div>
          </div>
        </section>

        {/* Urgency & Momentum Section */}
        <section className="py-12 md:py-16 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white -mx-4 px-4 md:rounded-2xl">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              Join thousands of pros and homeowners
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="text-5xl mb-3">📋</div>
                <p className="text-lg font-semibold">New job requests posted daily</p>
              </div>
              <div>
                <div className="text-5xl mb-3">📱</div>
                <p className="text-lg font-semibold">Pros receive job alerts instantly by SMS</p>
              </div>
              <div>
                <div className="text-5xl mb-3">🗺️</div>
                <p className="text-lg font-semibold">Available in cities nationwide</p>
              </div>
            </div>
            <div className="mt-10">
              <button
                onClick={() => navigate("/join")}
                className="inline-flex items-center rounded-2xl px-8 py-4 text-lg font-semibold bg-white text-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Get Started Today
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Mobile Sticky CTA */}
      <StickyProCTA />
    </>
  );
}
