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
  : "Fixlo – Find Trusted Home Service Professionals Near You | Plumbing, Electrical, HVAC & More";

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
                Fixlo – Find Trusted Home Service Professionals Near You
              </h1>
              
              <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0">
                Fixlo is a trusted home services marketplace connecting homeowners across the United States with verified, background-checked professionals for plumbing, electrical, HVAC, cleaning, junk removal, roofing, carpentry, painting, landscaping, and handyman services. Get reliable help for any home project — fast, easy, and with no hidden fees.
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

      {/* System-Based Trust Stack */}
      <section className="bg-white border-y border-slate-200 py-8">
        <div className="container-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">
                ✓
              </div>
              <p className="text-sm font-semibold text-slate-900">Background-checked professionals</p>
              <p className="text-xs text-slate-600">Every pro undergoes thorough screening</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">
                📍
              </div>
              <p className="text-sm font-semibold text-slate-900">30-mile radius matching</p>
              <p className="text-xs text-slate-600">Jobs matched by trade and distance</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">
                🔒
              </div>
              <p className="text-sm font-semibold text-slate-900">No bidding wars, no reselling</p>
              <p className="text-xs text-slate-600">Requests routed privately to nearby pros</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">
                💬
              </div>
              <p className="text-sm font-semibold text-slate-900">Direct communication</p>
              <p className="text-xs text-slate-600">Homeowners and pros connect directly</p>
            </div>
          </div>
        </div>
      </section>

      {/* Real Social Proof Section */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="container-xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="text-5xl text-amber-500">⭐</span>
              <span className="text-4xl font-bold text-slate-900">4.9</span>
            </div>
            <p className="text-lg text-slate-700 mb-6">
              Average rating from early users
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-center">
              <div className="px-6 py-3 bg-white rounded-lg border border-slate-200">
                <p className="text-sm font-medium text-slate-600">🛠 Built for real local service professionals</p>
              </div>
              <div className="px-6 py-3 bg-white rounded-lg border border-slate-200">
                <p className="text-sm font-medium text-slate-600">📈 Expanding city by city</p>
              </div>
            </div>
          </div>
          
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
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Popular Services Near You</h3>
            <p className="text-sm text-slate-600 mb-4">
              Find trusted professionals in major cities across the United States
            </p>
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
              <Link to="/services/handyman/austin" className="text-brand hover:underline">
                Handyman in Austin
              </Link>
              <Link to="/services/electrical/miami" className="text-brand hover:underline">
                Electrical in Miami
              </Link>
              <Link to="/services/carpentry/seattle" className="text-brand hover:underline">
                Carpentry in Seattle
              </Link>
              <Link to="/services/plumbing/denver" className="text-brand hover:underline">
                Plumbing in Denver
              </Link>
              <Link to="/services/hvac/atlanta" className="text-brand hover:underline">
                HVAC in Atlanta
              </Link>
              <Link to="/services/painting/boston" className="text-brand hover:underline">
                Painting in Boston
              </Link>
              <Link to="/services/roofing/charlotte" className="text-brand hover:underline">
                Roofing in Charlotte
              </Link>
              <Link to="/services/landscaping/portland" className="text-brand hover:underline">
                Landscaping in Portland
              </Link>
              <Link to="/services/cleaning/nashville" className="text-brand hover:underline">
                Cleaning in Nashville
              </Link>
            </div>
          </div>
        </section>

        {/* Why Fixlo Is Different */}
        <section className="py-12 md:py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 text-center">
            Why Fixlo Is Different
          </h2>
          <p className="text-center text-slate-600 mb-10 max-w-3xl mx-auto">
            Fixlo improves on traditional lead marketplaces with a fair, transparent structure designed for both homeowners and professionals.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-3">No pay-per-lead pressure</h3>
              <p className="text-slate-700">
                Fixlo doesn't sell the same job to multiple pros. One flat monthly subscription gives professionals unlimited access to job leads in their area without paying for each individual lead.
              </p>
            </div>
            
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-3">No public bidding wars</h3>
              <p className="text-slate-700">
                Requests are routed privately to nearby professionals based on trade and location. Homeowners aren't flooded with competing quotes, and pros aren't pressured to lowball prices.
              </p>
            </div>
            
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Local-first matching</h3>
              <p className="text-slate-700">
                Jobs are matched by trade and distance within a 30-mile radius, not by who pays more for leads. This ensures homeowners get nearby professionals and pros get relevant work.
              </p>
            </div>
            
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Built for long-term businesses</h3>
              <p className="text-slate-700">
                Designed for professionals who want consistent, sustainable work. Predictable monthly costs help you plan and grow your business without chasing expensive leads.
              </p>
            </div>
            
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Fair to homeowners</h3>
              <p className="text-slate-700">
                Homeowners never pay to submit a request. Our platform is completely free for homeowners to use. You only pay the professional directly for completed work.
              </p>
            </div>
            
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Quality through capacity limits</h3>
              <p className="text-slate-700">
                To protect response times and service quality, we limit the number of active professionals per area. This ensures every job gets attention without overwhelming anyone.
              </p>
            </div>
          </div>
          
          {/* Comparison Table */}
          <div className="card p-8 bg-slate-50">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">
              How Fixlo Compares
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300">
                    <th className="py-3 px-4 text-slate-900 font-semibold">Feature</th>
                    <th className="py-3 px-4 text-slate-900 font-semibold text-center">Traditional Lead Sites</th>
                    <th className="py-3 px-4 text-emerald-700 font-semibold text-center">Fixlo</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-slate-200">
                    <td className="py-3 px-4 text-slate-900">Pay per lead</td>
                    <td className="py-3 px-4 text-center text-slate-600">Yes</td>
                    <td className="py-3 px-4 text-center font-semibold text-emerald-700">No</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-3 px-4 text-slate-900">Public bidding</td>
                    <td className="py-3 px-4 text-center text-slate-600">Yes</td>
                    <td className="py-3 px-4 text-center font-semibold text-emerald-700">No</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-3 px-4 text-slate-900">Lead reselling</td>
                    <td className="py-3 px-4 text-center text-slate-600">Common</td>
                    <td className="py-3 px-4 text-center font-semibold text-emerald-700">Never</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-3 px-4 text-slate-900">Local radius matching</td>
                    <td className="py-3 px-4 text-center text-slate-600">Limited</td>
                    <td className="py-3 px-4 text-center font-semibold text-emerald-700">Yes (30 miles)</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-3 px-4 text-slate-900">Background checks</td>
                    <td className="py-3 px-4 text-center text-slate-600">Sometimes</td>
                    <td className="py-3 px-4 text-center font-semibold text-emerald-700">Always</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-900">Capacity controls</td>
                    <td className="py-3 px-4 text-center text-slate-600">Unlimited</td>
                    <td className="py-3 px-4 text-center font-semibold text-emerald-700">Quality-focused</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* How Fixlo Works - 3 Steps */}
        <section className="py-12 md:py-16 bg-slate-50 -mx-4 px-4 md:rounded-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-10 text-center">
            How Fixlo Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl font-bold text-emerald-700 mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Homeowner submits a request</h3>
              <p className="text-slate-700">
                Tell us what you need, where you are, and when you need help. Takes just a few minutes.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl font-bold text-emerald-700 mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Request matched by trade + distance</h3>
              <p className="text-slate-700">
                We match your request to qualified professionals within 30 miles who specialize in your needed service.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl font-bold text-emerald-700 mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Local pro contacts homeowner directly</h3>
              <p className="text-slate-700">
                Matched professionals reach out to discuss your project, provide quotes, and schedule service.
              </p>
            </div>
          </div>
        </section>

        {/* Founder-Led Trust Section */}
        <section className="py-12 md:py-16">
          <div className="card p-8 bg-gradient-to-r from-blue-50 to-indigo-50 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 text-center">Built to Fix a Broken System</h2>
            <p className="text-slate-700 mb-4">
              Fixlo was created to solve the problems that plague traditional lead marketplaces: expensive pay-per-lead models that pressure professionals to compete on price alone, lead reselling that sends the same job to dozens of contractors, and bidding systems that create a race to the bottom.
            </p>
            <p className="text-slate-700 mb-4">
              We believe home service professionals deserve a sustainable business model with predictable costs and quality leads. We believe homeowners deserve transparent pricing and access to qualified, background-checked professionals without getting overwhelmed by aggressive sales tactics.
            </p>
            <p className="text-slate-700">
              Fixlo is designed to create fair, lasting relationships between homeowners and professionals—not extract maximum fees from every transaction.
            </p>
          </div>
        </section>

        {/* Community Growth Section */}
        <section className="py-12 md:py-16 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white -mx-4 px-4 md:rounded-2xl">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              Growing a better home services community
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="text-5xl mb-3">📋</div>
                <p className="text-lg font-semibold">Daily service requests</p>
                <p className="text-sm text-white/80 mt-2">Homeowners submit requests every day</p>
              </div>
              <div>
                <div className="text-5xl mb-3">📱</div>
                <p className="text-lg font-semibold">Instant job alerts via SMS</p>
                <p className="text-sm text-white/80 mt-2">Pros notified immediately when matched</p>
              </div>
              <div>
                <div className="text-5xl mb-3">🗺️</div>
                <p className="text-lg font-semibold">Expanding nationwide</p>
                <p className="text-sm text-white/80 mt-2">Adding new cities and professionals regularly</p>
              </div>
            </div>
            <div className="mt-10">
              <button
                onClick={() => navigate("/join")}
                className="inline-flex items-center rounded-2xl px-8 py-4 text-lg font-semibold bg-white text-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Join as a Professional
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Trust & Info Links Section */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="container-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8 text-center">
            Why Choose Fixlo
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link to="/how-it-works" className="card p-6 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">📋</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">How It Works</h3>
              <p className="text-sm text-slate-600">
                Learn how Fixlo connects you with trusted professionals in minutes
              </p>
            </Link>
            <Link to="/join" className="card p-6 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">🔧</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">For Professionals</h3>
              <p className="text-sm text-slate-600">
                Join our network and get unlimited job leads with no commission fees
              </p>
            </Link>
            <Link to="/contact" className="card p-6 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">💬</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Contact Us</h3>
              <p className="text-sm text-slate-600">
                Have questions? Our support team is here to help you
              </p>
            </Link>
            <Link to="/about-walter-arevalo" className="card p-6 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">👤</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">About Fixlo</h3>
              <p className="text-sm text-slate-600">
                Learn about our mission to revolutionize home services
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Mobile Sticky CTA */}
      <StickyProCTA />
    </>
  );
}
