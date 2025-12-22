import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function AboutWalterArevaloPage() {
  // JSON-LD Person schema with Organization reference
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Walter Arevalo",
    "jobTitle": "Founder & CEO",
    "worksFor": {
      "@type": "Organization",
      "name": "Fixlo",
      "url": "https://www.fixloapp.com"
    },
    "url": "https://www.fixloapp.com/about-walter-arevalo",
    "image": "https://www.fixloapp.com/images/walter-arevalo-founder-ceo-fixlo.jpg",
    "sameAs": [
      "https://www.linkedin.com/in/walter-arevalo-9b280939b"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Charlotte",
      "addressRegion": "NC",
      "addressCountry": "US"
    }
  };

  return (
    <>
      <Helmet>
        <title>Walter Arevalo | Founder & CEO of Fixlo</title>
        <meta 
          name="description" 
          content="Walter Arevalo is the Founder & CEO of Fixlo, a technology-driven home services marketplace operating across the United States." 
        />
        <link rel="canonical" href="https://www.fixloapp.com/about-walter-arevalo" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph / Social Media */}
        <meta property="og:title" content="Walter Arevalo | Founder & CEO of Fixlo" />
        <meta property="og:description" content="Walter Arevalo is the Founder & CEO of Fixlo, a technology-driven home services marketplace operating across the United States." />
        <meta property="og:url" content="https://www.fixloapp.com/about-walter-arevalo" />
        <meta property="og:type" content="profile" />
        <meta property="og:image" content="https://www.fixloapp.com/images/walter-arevalo-founder-ceo-fixlo.jpg" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Walter Arevalo | Founder & CEO of Fixlo" />
        <meta name="twitter:description" content="Walter Arevalo is the Founder & CEO of Fixlo, a technology-driven home services marketplace operating across the United States." />
        <meta name="twitter:image" content="https://www.fixloapp.com/images/walter-arevalo-founder-ceo-fixlo.jpg" />
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(personSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                Walter Arevalo – Founder & CEO of Fixlo
              </h1>
            </div>

            <div className="p-8">
              {/* Profile Image and Bio Section */}
              <div className="flex flex-col md:flex-row gap-8 mb-8">
                {/* Profile Image */}
                <div className="flex-shrink-0">
                  <div className="w-48 h-48 rounded-lg overflow-hidden shadow-md mx-auto md:mx-0">
                    <img
                      src="/images/walter-arevalo-founder-ceo-fixlo.jpg"
                      alt="Walter Arevalo, Founder and CEO of Fixlo"
                      className="w-full h-full object-cover"
                      loading="eager"
                    />
                  </div>
                </div>

                {/* Biography Text */}
                <div className="flex-1">
                  <p className="text-lg leading-relaxed text-slate-700">
                    Walter Arevalo is a technology entrepreneur and the Founder & CEO of Fixlo, 
                    a home services marketplace connecting homeowners with trusted local professionals 
                    across the United States. He focuses on building scalable, user-first platforms 
                    that leverage automation, transparency, and intelligent systems to modernize the 
                    home services industry.
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200 my-8"></div>

              {/* Founder Details Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Profile
                  </h2>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-slate-600">Name</dt>
                      <dd className="text-base text-slate-900">Walter Arevalo</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-600">Title</dt>
                      <dd className="text-base text-slate-900">Founder & CEO</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-600">Company</dt>
                      <dd className="text-base text-slate-900">
                        <a 
                          href="https://www.fixloapp.com" 
                          className="text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Fixlo
                        </a>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-600">Location</dt>
                      <dd className="text-base text-slate-900">Charlotte, North Carolina, United States</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Connect
                  </h2>
                  <div className="space-y-3">
                    <a
                      href="https://www.fixloapp.com"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span>Visit Fixlo</span>
                    </a>
                    <a
                      href="https://www.linkedin.com/in/walter-arevalo-9b280939b"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                      <span>Connect on LinkedIn</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Back to Home Link */}
          <div className="mt-8 text-center">
            <a 
              href="/" 
              className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Home</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
