import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { Link } from 'react-router-dom';

export default function HowItWorksPage(){
  return (<>
    <HelmetSEO 
      title="How Fixlo Works – Connect with Trusted Home Service Professionals" 
      description="Learn how Fixlo connects homeowners with verified professionals for home services. Simple, transparent, and designed to save you time and money."
      canonicalPathname="/how-it-works" 
    />
    <div className="container-xl py-8">
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">How Fixlo Works</h1>
      
      <div className="prose prose-slate max-w-none mb-8">
        <p className="text-lg text-slate-700">
          Fixlo makes it easy to find trusted home service professionals in your area. Whether you need plumbing, electrical work, cleaning, or any other home service, we connect you with background-checked professionals who are ready to help.
        </p>
      </div>
      
      {/* How Fixlo Works Process */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Simple, Transparent Process</h2>
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
      
      {/* For Homeowners */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">For Homeowners</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center text-2xl font-bold text-brand mb-4">1</div>
            <h3 className="font-semibold text-lg mb-2">Tell us what you need</h3>
            <p className="text-sm text-slate-600">Pick a service, share your location and project details. The more information you provide, the better we can match you.</p>
          </div>
          <div className="card p-6">
            <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center text-2xl font-bold text-brand mb-4">2</div>
            <h3 className="font-semibold text-lg mb-2">We match vetted pros</h3>
            <p className="text-sm text-slate-600">Background-checked contractors in your area receive your request and can respond with quotes and availability.</p>
          </div>
          <div className="card p-6">
            <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center text-2xl font-bold text-brand mb-4">3</div>
            <h3 className="font-semibold text-lg mb-2">You choose & book</h3>
            <p className="text-sm text-slate-600">Compare quotes, review profiles, and select the professional that best fits your needs and budget.</p>
          </div>
          <div className="card p-6">
            <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center text-2xl font-bold text-brand mb-4">4</div>
            <h3 className="font-semibold text-lg mb-2">Get updates by SMS</h3>
            <p className="text-sm text-slate-600">We keep you posted through every step with text message notifications about your project status.</p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <Link to="/services" className="btn-primary inline-block">
            Get Started – Find a Pro
          </Link>
        </div>
      </section>
      
      {/* For Professionals */}
      <section className="mb-12 bg-slate-50 -mx-4 px-4 py-8 md:rounded-2xl">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">For Professionals</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="font-semibold text-lg mb-2">No Lead Fees</h3>
            <p className="text-sm text-slate-600">Unlike other platforms, we don't charge per lead. Pay one flat monthly subscription and receive unlimited job opportunities.</p>
          </div>
          <div className="card p-6">
            <div className="text-3xl mb-3">📱</div>
            <h3 className="font-semibold text-lg mb-2">Instant Job Alerts</h3>
            <p className="text-sm text-slate-600">Get notified immediately via SMS when new jobs match your services and location. Respond fast to win more work.</p>
          </div>
          <div className="card p-6">
            <div className="text-3xl mb-3">✓</div>
            <h3 className="font-semibold text-lg mb-2">Build Your Reputation</h3>
            <p className="text-sm text-slate-600">Collect reviews, showcase your work, and grow your business with our professional profile features.</p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <Link to="/join" className="btn-primary inline-block">
            Join as a Professional
          </Link>
        </div>
      </section>
      
      {/* Why Fixlo Is Different */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Why Fixlo Is Different</h2>
        <p className="text-center text-slate-600 mb-8 max-w-3xl mx-auto">
          Fixlo improves on traditional lead marketplaces with a fair, transparent structure.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-3 text-emerald-700">✓ No pay-per-lead pressure</h3>
            <p className="text-sm text-slate-700">
              One flat monthly subscription gives professionals unlimited access to job leads. We don't sell the same job to multiple pros.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-3 text-emerald-700">✓ No public bidding wars</h3>
            <p className="text-sm text-slate-700">
              Requests are routed privately to nearby professionals based on trade and location, not who pays more.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-3 text-emerald-700">✓ 30-mile radius matching</h3>
            <p className="text-sm text-slate-700">
              Jobs are matched by trade and distance to ensure homeowners get nearby professionals and pros get relevant work.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-3 text-emerald-700">✓ Quality through capacity limits</h3>
            <p className="text-sm text-slate-700">
              We limit the number of active professionals per area to protect response times and service quality for everyone.
            </p>
          </div>
        </div>
      </section>
      
      {/* Why Choose Fixlo */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Why Choose Fixlo</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-3 text-emerald-700">✓ Background-Checked Professionals</h3>
            <p className="text-sm text-slate-700">
              Every professional in our network undergoes thorough background screening to ensure your safety and peace of mind.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-3 text-emerald-700">✓ Transparent Pricing</h3>
            <p className="text-sm text-slate-700">
              No hidden fees for homeowners. For professionals, one flat monthly rate gives you unlimited job leads.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-3 text-emerald-700">✓ Fast Response Times</h3>
            <p className="text-sm text-slate-700">
              Most service requests receive responses within 24 hours, helping you get your project done quickly.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-3 text-emerald-700">✓ Nationwide Coverage</h3>
            <p className="text-sm text-slate-700">
              Serving homeowners and professionals across the United States in major cities and surrounding areas.
            </p>
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <div className="card p-8 bg-gradient-to-r from-emerald-50 to-blue-50 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Get Started?</h2>
        <p className="text-slate-700 mb-6 max-w-2xl mx-auto">
          Join thousands of homeowners and professionals who trust Fixlo for their home service needs.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/services" className="btn-primary">
            Find a Professional
          </Link>
          <Link to="/join" className="btn-ghost">
            Join as a Pro
          </Link>
        </div>
      </div>
    </div>
  </>);
}
