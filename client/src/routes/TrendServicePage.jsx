import React from 'react';
import { useParams, Link } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';
import { getTrendBySlug, TREND_SERVICE_BENEFITS } from '../data/trends';
import { getCityBySlug, formatCityName } from '../data/top100cities';
import { 
  shouldUseSpanish, 
  generateSpanishTitle, 
  generateSpanishDescription,
  getSpanishServiceName,
  getSpanishFAQ 
} from '../data/spanish';
import { slugify, titleCase } from '../utils/seo';

// Content variations to prevent duplicate content
const INTRO_VARIATIONS = [
  (trend, service, city) => 
    `Looking for ${service} services in ${city}? Our network of verified professionals specializes in ${trend} ${service} solutions tailored to your specific needs.`,
  (trend, service, city) => 
    `When you need reliable ${service} for ${trend} in ${city}, Fixlo connects you with background-checked professionals who deliver quality results.`,
  (trend, service, city) => 
    `Find trusted ${service} experts in ${city} for ${trend} projects. All professionals are verified, licensed, and ready to help.`
];

const PROBLEM_VARIATIONS = [
  (trend) => `Many homeowners struggle to find reliable professionals for ${trend} situations. Traditional methods can be time-consuming and risky.`,
  (trend) => `During ${trend} periods, finding qualified professionals quickly becomes critical. That's where Fixlo makes the difference.`,
  (trend) => `The challenge with ${trend} services is ensuring quality while meeting urgent timelines. Fixlo solves this problem.`
];

const SOLUTION_VARIATIONS = [
  'Fixlo eliminates the guesswork by connecting you only with verified, background-checked professionals.',
  'Our platform ensures every professional undergoes rigorous verification before they can serve homeowners.',
  'With Fixlo, you get peace of mind knowing all professionals are thoroughly vetted and qualified.'
];

// Generate unique FAQ based on trend, service, and city
function generateFAQ({ trend, service, city, isSpanish }) {
  const trendObj = getTrendBySlug(trend);
  const trendName = trendObj?.name || titleCase(trend);
  const serviceName = titleCase(service);
  const cityName = city ? formatCityName(city) : 'your area';

  if (isSpanish) {
    return getSpanishFAQ({ service, trend, city });
  }

  const faqs = [
    {
      question: `What ${serviceName} services are available for ${trendName} in ${cityName}?`,
      answer: `Fixlo offers comprehensive ${serviceName.toLowerCase()} services for ${trendName.toLowerCase()} in ${cityName}. Our verified professionals handle everything from routine maintenance to emergency repairs, all backed by our quality guarantee.`
    },
    {
      question: `How quickly can I get ${serviceName} service in ${cityName}?`,
      answer: `Response times vary by professional availability, but many of our ${serviceName.toLowerCase()} pros in ${cityName} offer same-day or next-day service, especially for ${trendName.toLowerCase()} situations. You'll see estimated response times when you request quotes.`
    },
    {
      question: `Are ${serviceName} professionals in ${cityName} background-checked?`,
      answer: `Yes, every professional on Fixlo undergoes comprehensive background verification including criminal checks, license verification (where applicable), and insurance verification. Your safety is our top priority.`
    },
    {
      question: `How much does ${serviceName} cost in ${cityName}?`,
      answer: `Pricing varies based on the specific work needed. Request free quotes from multiple verified ${serviceName.toLowerCase()} professionals in ${cityName} to compare rates and find the best value for your ${trendName.toLowerCase()} project.`
    },
    {
      question: `Is Fixlo free for homeowners in ${cityName}?`,
      answer: `Yes, Fixlo is completely free for homeowners. There are no membership fees, no hidden charges, and no service fees when you book professionals in ${cityName}.`
    }
  ];

  return faqs;
}

// Generate FAQPage schema
function generateFAQSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer
      }
    }))
  };
}

// Generate LocalBusiness and Service schemas
function generateSchemas({ trend, service, city }) {
  const trendObj = getTrendBySlug(trend);
  const cityObj = getCityBySlug(city);
  const trendName = trendObj?.name || titleCase(trend);
  const serviceName = titleCase(service);
  const cityName = cityObj ? formatCityName(cityObj) : titleCase(city);

  const localBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    'name': `Fixlo – ${trendName} ${serviceName} in ${cityName}`,
    'description': `Professional ${serviceName.toLowerCase()} services for ${trendName.toLowerCase()} in ${cityName}`,
    'url': `https://www.fixloapp.com/${trend}/${service}-in-${city}`,
    'image': 'https://www.fixloapp.com/cover.png',
    'priceRange': '$$',
    'telephone': '+1-256-488-1814',
    'areaServed': cityName
  };

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    'name': `${trendName} ${serviceName}`,
    'description': `Professional ${serviceName.toLowerCase()} for ${trendName.toLowerCase()} situations`,
    'areaServed': cityName,
    'provider': {
      '@type': 'Organization',
      'name': 'Fixlo'
    }
  };

  return [localBusiness, serviceSchema];
}

export default function TrendServicePage() {
  const { trend, service, city } = useParams();
  
  // Normalize parameters
  const trendSlug = slugify(trend || '');
  const serviceSlug = slugify(service?.replace(/-in$/, '') || '');
  const citySlug = slugify(city || '');

  // Get data objects
  const trendObj = getTrendBySlug(trendSlug);
  const cityObj = getCityBySlug(citySlug);
  
  // Check if Spanish content needed
  const isSpanish = shouldUseSpanish(trendSlug);

  // Format display names
  const trendName = trendObj?.name || titleCase(trendSlug);
  const serviceName = titleCase(serviceSlug);
  const cityName = cityObj ? formatCityName(cityObj) : titleCase(citySlug);

  // Generate SEO metadata
  const title = isSpanish 
    ? generateSpanishTitle({ trend: trendSlug, service: serviceSlug, city: citySlug })
    : `${trendName} ${serviceName} in ${cityName} | Fixlo`;
  
  const description = isSpanish
    ? generateSpanishDescription({ trend: trendSlug, service: serviceSlug, city: citySlug })
    : `Find verified ${serviceName.toLowerCase()} professionals for ${trendName.toLowerCase()} in ${cityName}. Background-checked, fast quotes, easy booking.`;

  const canonical = `/${trendSlug}/${serviceSlug}-in-${citySlug}`;

  // Get trend-specific benefits
  const benefit = TREND_SERVICE_BENEFITS[trendSlug]?.[serviceSlug] || 
    `Professional ${serviceName.toLowerCase()} service for ${trendName.toLowerCase()} in ${cityName}`;

  // Generate FAQ
  const faqs = generateFAQ({ trend: trendSlug, service: serviceSlug, city: citySlug, isSpanish });
  const faqSchema = generateFAQSchema(faqs);

  // Generate schemas
  const schemas = generateSchemas({ trend: trendSlug, service: serviceSlug, city: citySlug });

  // Select content variation based on hash of parameters (for consistency)
  const hash = (trendSlug + serviceSlug + citySlug).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const introIndex = Math.abs(hash) % INTRO_VARIATIONS.length;
  const problemIndex = Math.abs(hash >> 8) % PROBLEM_VARIATIONS.length;
  const solutionIndex = Math.abs(hash >> 16) % SOLUTION_VARIATIONS.length;

  return (
    <>
      <HelmetSEO 
        title={title} 
        description={description} 
        canonicalPathname={canonical}
      />
      <script type="application/ld+json">
        {JSON.stringify(schemas[0])}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(schemas[1])}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>

      <div className="container-xl py-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-4 text-sm text-slate-600" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 flex-wrap">
            <li><Link to="/" className="hover:text-brand">Home</Link></li>
            <li>&rsaquo;</li>
            <li><Link to="/services" className="hover:text-brand">Services</Link></li>
            <li>&rsaquo;</li>
            <li><Link to={`/services/${serviceSlug}`} className="hover:text-brand">{serviceName}</Link></li>
            <li>&rsaquo;</li>
            <li className="text-slate-900 font-medium">{trendName} in {cityName}</li>
          </ol>
        </nav>

        {/* Main Heading */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
          {trendName} {serviceName} in {cityName}
        </h1>

        {/* Trend Banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-brand rounded-lg">
          <p className="text-lg text-slate-800 font-medium">
            {benefit}
          </p>
        </div>

        {/* Introduction Section */}
        <div className="prose prose-slate max-w-none mb-8">
          <p className="text-lg">
            {INTRO_VARIATIONS[introIndex](trendName.toLowerCase(), serviceName.toLowerCase(), cityName)}
          </p>
        </div>

        {/* Why This Trend Matters */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Why {trendName} {serviceName} Matters in {cityName}
          </h2>
          <p className="text-slate-700 mb-4">
            {PROBLEM_VARIATIONS[problemIndex](trendName.toLowerCase())}
          </p>
          <p className="text-slate-700">
            {SOLUTION_VARIATIONS[solutionIndex]}
          </p>
        </section>

        {/* How Fixlo Solves It */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            How Fixlo Delivers {trendName} {serviceName} in {cityName}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-white border border-slate-200 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-2">🔍 Verified Professionals</h3>
              <p className="text-sm text-slate-700">
                Every {serviceName.toLowerCase()} professional undergoes background checks, license verification, and insurance validation.
              </p>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-2">⚡ Fast Response</h3>
              <p className="text-sm text-slate-700">
                Get quotes quickly from {serviceName.toLowerCase()} pros in {cityName} ready to handle your {trendName.toLowerCase()} needs.
              </p>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-2">💰 Transparent Pricing</h3>
              <p className="text-sm text-slate-700">
                Compare quotes from multiple professionals. No hidden fees, no surprises.
              </p>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-2">✅ Quality Guaranteed</h3>
              <p className="text-sm text-slate-700">
                All work is backed by our quality commitment and professional accountability standards.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <div className="mb-8 p-6 bg-brand text-white rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-3">
            Ready to Book {trendName} {serviceName} in {cityName}?
          </h2>
          <p className="mb-4 text-slate-100">
            Connect with verified professionals in minutes. Free for homeowners.
          </p>
          <Link 
            to={`/services/${serviceSlug}/${citySlug}`}
            className="inline-block px-6 py-3 bg-white text-brand font-semibold rounded-lg hover:bg-slate-100 transition"
          >
            Get Free Quotes
          </Link>
        </div>

        {/* FAQ Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-slate-700 text-sm">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Services */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Related Services in {cityName}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['plumbing', 'electrical', 'hvac', 'cleaning'].map(s => (
              s !== serviceSlug && (
                <Link
                  key={s}
                  to={`/${trendSlug}/${s}-in-${citySlug}`}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-center text-sm font-medium text-slate-700 hover:text-brand transition"
                >
                  {titleCase(s)}
                </Link>
              )
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
