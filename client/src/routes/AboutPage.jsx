import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (<>
    <HelmetSEO 
      title="About Fixlo – Connecting Homeowners with Trusted Home Service Professionals" 
      description="Learn about Fixlo's mission to revolutionize home services by connecting homeowners with verified, background-checked professionals across the United States."
      canonicalPathname="/about" 
    />
    <div className="container-xl py-8">
      {/* Breadcrumb Navigation */}
      <nav className="mb-4 text-sm text-slate-600" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <Link to="/" className="hover:text-brand">Home</Link>
          </li>
          <li>&rsaquo;</li>
          <li className="text-slate-900 font-medium">About</li>
        </ol>
      </nav>
      
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">About Fixlo</h1>
      
      {/* Mission Statement */}
      <div className="prose prose-slate max-w-none mb-8">
        <div className="card p-8 bg-gradient-to-r from-emerald-50 to-blue-50">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h2>
          <p className="text-lg text-slate-700">
            Fixlo is revolutionizing the home services industry by creating a transparent, fair marketplace 
            that connects homeowners with trusted professionals across the United States. We believe in 
            empowering both homeowners and contractors with a platform that eliminates hidden fees, reduces 
            friction, and builds lasting relationships based on trust and quality work.
          </p>
        </div>
      </div>
      
      {/* What We Do */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">What We Do</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="text-3xl mb-3">🏠</div>
            <h3 className="text-xl font-semibold mb-3">For Homeowners</h3>
            <p className="text-slate-700">
              We connect you with verified, background-checked professionals for all your home service needs. 
              Whether you need emergency plumbing, electrical work, HVAC repair, cleaning, landscaping, or any 
              other home service, Fixlo makes it easy to find qualified contractors in your area. Our platform 
              is completely free for homeowners – no hidden fees, no obligations.
            </p>
          </div>
          
          <div className="card p-6">
            <div className="text-3xl mb-3">🔧</div>
            <h3 className="text-xl font-semibold mb-3">For Professionals</h3>
            <p className="text-slate-700">
              We provide contractors with unlimited job leads for one flat monthly subscription. Unlike other 
              platforms that charge per lead or take commissions from each job, Fixlo offers predictable costs 
              so you can focus on growing your business. Get instant SMS notifications when new jobs match your 
              services and location, respond quickly, and build your reputation with customer reviews.
            </p>
          </div>
        </div>
      </section>
      
      {/* Our Values */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Our Values</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card p-6 text-center">
            <div className="text-4xl mb-3">✓</div>
            <h3 className="text-lg font-semibold mb-2 text-emerald-700">Trust & Safety</h3>
            <p className="text-sm text-slate-700">
              Every professional undergoes thorough background screening. We prioritize your safety and peace of mind above all else.
            </p>
          </div>
          
          <div className="card p-6 text-center">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="text-lg font-semibold mb-2 text-emerald-700">Fair & Transparent</h3>
            <p className="text-sm text-slate-700">
              No hidden fees for homeowners. One flat rate for professionals. We believe in honest, transparent pricing.
            </p>
          </div>
          
          <div className="card p-6 text-center">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold mb-2 text-emerald-700">Fast & Reliable</h3>
            <p className="text-sm text-slate-700">
              Most service requests receive responses within 24 hours. We use SMS notifications to keep everyone connected and informed.
            </p>
          </div>
        </div>
      </section>
      
      {/* Services Coverage */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Services We Cover</h2>
        <div className="card p-6">
          <p className="text-slate-700 mb-4">
            Fixlo connects homeowners with professionals across all major home service categories:
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            <Link to="/services/plumbing" className="text-brand hover:underline">• Plumbing</Link>
            <Link to="/services/electrical" className="text-brand hover:underline">• Electrical</Link>
            <Link to="/services/hvac" className="text-brand hover:underline">• HVAC</Link>
            <Link to="/services/carpentry" className="text-brand hover:underline">• Carpentry</Link>
            <Link to="/services/painting" className="text-brand hover:underline">• Painting</Link>
            <Link to="/services/roofing" className="text-brand hover:underline">• Roofing</Link>
            <Link to="/services/cleaning" className="text-brand hover:underline">• House Cleaning</Link>
            <Link to="/services/junk-removal" className="text-brand hover:underline">• Junk Removal</Link>
            <Link to="/services/landscaping" className="text-brand hover:underline">• Landscaping</Link>
            <Link to="/services/handyman" className="text-brand hover:underline">• Handyman Services</Link>
          </div>
          <div className="mt-4">
            <Link to="/services" className="text-brand hover:underline font-medium">
              View All Services →
            </Link>
          </div>
        </div>
      </section>
      
      {/* Geographic Coverage */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Where We Operate</h2>
        <div className="card p-6 bg-slate-50">
          <p className="text-slate-700 mb-4">
            Fixlo serves homeowners and professionals across the United States, with active coverage in major 
            metropolitan areas and surrounding regions including:
          </p>
          <div className="grid sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm text-slate-700">
            <span>• New York, NY</span>
            <span>• Los Angeles, CA</span>
            <span>• Chicago, IL</span>
            <span>• Houston, TX</span>
            <span>• Phoenix, AZ</span>
            <span>• Philadelphia, PA</span>
            <span>• San Antonio, TX</span>
            <span>• San Diego, CA</span>
            <span>• Dallas, TX</span>
            <span>• Austin, TX</span>
            <span>• Miami, FL</span>
            <span>• Seattle, WA</span>
            <span>• Denver, CO</span>
            <span>• Atlanta, GA</span>
            <span>• Boston, MA</span>
            <span>• Charlotte, NC</span>
          </div>
          <p className="text-slate-700 mt-4">
            ...and many more cities across all 50 states.
          </p>
        </div>
      </section>
      
      {/* Founder Story */}
      <section className="mb-12">
        <div className="card p-8 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Founder</h2>
          <p className="text-slate-700 mb-4">
            Fixlo was founded by Walter Arevalo, an entrepreneur passionate about improving the home services 
            experience for both homeowners and contractors. Having witnessed firsthand the frustrations of 
            unreliable contractors, hidden fees, and poor communication, Walter set out to create a better way.
          </p>
          <Link to="/about-walter-arevalo" className="text-brand hover:underline font-medium">
            Learn more about Walter's story →
          </Link>
        </div>
      </section>
      
      {/* Call to Action */}
      <div className="card p-8 text-center bg-gradient-to-r from-emerald-50 to-blue-50">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Join the Fixlo Community</h2>
        <p className="text-slate-700 mb-6 max-w-2xl mx-auto">
          Whether you're a homeowner looking for reliable help or a professional contractor seeking steady work, 
          Fixlo is here to help you succeed.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/services" className="btn-primary">
            Find a Professional
          </Link>
          <Link to="/join" className="btn-ghost">
            Join as a Pro
          </Link>
          <Link to="/contact" className="btn-ghost">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  </>);
}
