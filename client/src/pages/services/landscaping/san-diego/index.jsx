import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function LandscapingSanDiegoPage() {
  return (
    <>
      <Helmet>
        <title>Landscaping in San Diego — Fast & Trusted — No Cap | Fixlo</title>
        <meta name="description" content="Find verified landscaping pros in San Diego. Book in 6-7 minutes. The GOAT of home services. No cap! 🏠✨" />
        <link rel="canonical" href="https://fixloapp.com/services/landscaping/san-diego" />
        <script type="application/ld+json">
          {{"@context":"https://schema.org","@type":"LocalBusiness","name":"Fixlo Landscaping - San Diego","description":"Professional landscaping services in San Diego","url":"https://fixloapp.com/services/landscaping/san-diego","telephone":"+1-855-FIXLO-GO","priceRange":"$$","address":{"@type":"PostalAddress","addressLocality":"San Diego","addressCountry":"US"},"aggregateRating":{"@type":"AggregateRating","ratingValue":"4.8","reviewCount":"2847"},"areaServed":{"@type":"City","name":"San Diego"}}}
        </script>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        {/* Hero Section */}
        <div className="container-xl py-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
            Landscaping in San Diego, CA — Fast & Trusted — No Cap
          </h1>
          
          <div className="prose prose-lg max-w-none mb-8">
            <p className="text-xl text-slate-700 leading-relaxed">
              Looking for landscaping pros in San Diego who bring that <span className="font-semibold">main character</span> energy? 
              We've got you covered. Fixlo connects you with verified professionals — no <span className="font-semibold">mid</span> pros here, 
              just the <span className="font-semibold">GOAT</span> of home services. Book in <span className="font-semibold">6-7 minutes</span> flat, 
              and trust us when we say: <span className="font-semibold">it's giving</span> reliable, fast, and professional.
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex flex-wrap gap-4 mb-12">
            <a 
              href="#request-service" 
              className="btn btn-primary btn-lg px-8 py-4 text-lg font-semibold"
            >
              Get Matched with Top Pros
            </a>
            <a 
              href="/how-it-works" 
              className="btn btn-outline btn-lg px-8 py-4 text-lg font-semibold"
            >
              How It Works
            </a>
          </div>
        </div>

        {/* Trusted Pros Section */}
        <div className="bg-white py-12">
          <div className="container-xl">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Trusted Landscaping Professionals in San Diego
            </h2>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-slate-700 mb-4">
                Our landscaping pros in San Diego? They <span className="font-semibold">ate and left no crumbs</span>. 
                Seriously. Every contractor in our network is background-checked, verified, and ready to handle your project 
                with <span className="font-semibold">aesthetic</span>-level craftsmanship.
              </p>
              
              <ul className="space-y-3 text-slate-700">
                <li>✅ <strong>Mogging the competition</strong> — Our pros outperform, every time</li>
                <li>✅ <strong>Looksmaxxing your home</strong> — Professional results that elevate your space</li>
                <li>✅ <strong>No ghosting</strong> — Real-time updates via SMS, every step of the way</li>
                <li>✅ <strong>Adulting made easy</strong> — We handle the hard part so you don't have to</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Vibe Check Section */}
        <div className="bg-slate-50 py-12">
          <div className="container-xl">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Vibe Check: Why San Diego Homeowners Choose Fixlo
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-3">Fast Response</h3>
                <p className="text-slate-700">
                  Get matched in <strong>6-7 minutes</strong>. No waiting around. 
                  Our pros have that <strong>rizz</strong> — they respond fast and deliver faster.
                </p>
              </div>
              
              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-3">Quality Sleep Guaranteed</h3>
                <p className="text-slate-700">
                  Once you book, you can start <strong>sleepmaxxing</strong>. We've got your landscaping 
                  needs covered so you can rest easy.
                </p>
              </div>
              
              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-3">Aesthetic-Core Results</h3>
                <p className="text-slate-700">
                  Our pros deliver work that's pure <strong>aesthetic-core</strong>. Your home will look so good, 
                  it'll be the <strong>main character</strong> of the block.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Local Services List */}
        <div className="bg-white py-12">
          <div className="container-xl">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Landscaping Services We Offer in San Diego, CA
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-500 transition-colors">
                <span className="text-slate-700 font-medium">Emergency Landscaping</span>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-500 transition-colors">
                <span className="text-slate-700 font-medium">Residential Landscaping</span>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-500 transition-colors">
                <span className="text-slate-700 font-medium">Commercial Landscaping</span>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-500 transition-colors">
                <span className="text-slate-700 font-medium">Landscaping Repair</span>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-500 transition-colors">
                <span className="text-slate-700 font-medium">Landscaping Installation</span>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-500 transition-colors">
                <span className="text-slate-700 font-medium">Landscaping Maintenance</span>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-500 transition-colors">
                <span className="text-slate-700 font-medium">24/7 Landscaping</span>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-500 transition-colors">
                <span className="text-slate-700 font-medium">Licensed Landscaping</span>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-500 transition-colors">
                <span className="text-slate-700 font-medium">Affordable Landscaping</span>
              </div>
            </div>
          </div>
        </div>

        {/* Girl/Boy Dinner Reset */}
        <div className="bg-slate-900 text-white py-12">
          <div className="container-xl">
            <h2 className="text-3xl font-bold mb-6">
              If Your Space Still Looks Like a <span className="italic">Girl Dinner</span> or <span className="italic">Boy Dinner</span> Moment…
            </h2>
            
            <p className="text-lg text-slate-200 mb-6">
              Let's be real — <strong>adulting</strong> is hard, and sometimes your place needs more than a quick fix. 
              Whether it's your kitchen, bathroom, or entire home, our landscaping pros in San Diego 
              will transform it from <strong>mid</strong> to <strong>GOAT</strong>-level gorgeous.
            </p>
            
            <p className="text-xl font-semibold">
              No <strong>delulu</strong> expectations. Just real professionals doing real work. <strong>Bet</strong>.
            </p>
          </div>
        </div>

        {/* Service Request Form */}
        <div id="request-service" className="bg-white py-12">
          <div className="container-xl">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                Request Landscaping Service in San Diego
              </h2>
              
              <div className="card p-8">
                <p className="text-slate-700 mb-6">
                  Describe your landscaping needs and get matched with verified pros in San Diego, CA.
                </p>
                
                {/* Form would go here - reuse existing ServiceLeadForm component */}
                <div className="text-center py-8">
                  <a 
                    href="/services/landscaping/san-diego" 
                    className="btn btn-primary btn-lg"
                  >
                    Submit Service Request
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
          <div className="container-xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              It's Giving Upgraded.
            </h2>
            <p className="text-xl mb-6">
              Book the <strong>GOAT</strong> of landscaping in San Diego today — <strong>no cap</strong>.
            </p>
            <a 
              href="#request-service" 
              className="btn btn-white btn-lg px-8 py-4"
            >
              Get Started Now
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
