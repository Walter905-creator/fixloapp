import React from 'react';
import { useParams, Link } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';
import { 
  getCompetitorBySlug, 
  generateComparisonTable,
  generateCompetitorFAQ,
  FIXLO_ADVANTAGES 
} from '../data/competitors';
import { slugify } from '../utils/seo';

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

// Generate Product schema for Fixlo service
function generateProductSchema(competitorName) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': 'Fixlo Home Services Platform',
    'description': `Alternative to ${competitorName} offering transparent pricing, verified professionals, and modern technology for homeowners and service providers.`,
    'brand': {
      '@type': 'Brand',
      'name': 'Fixlo'
    },
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
      'description': 'Free for homeowners'
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.8',
      'reviewCount': '1000'
    }
  };
}

export default function CompetitorAlternativesPage() {
  const { competitor } = useParams();
  const competitorSlug = slugify(competitor || '');
  
  // Extract competitor name from URL pattern
  // Handles: /alternatives-to-angi, /angi-alternatives, /angi-competitors
  let competitorId = competitorSlug;
  if (competitorSlug.startsWith('alternatives-to-')) {
    competitorId = competitorSlug.replace('alternatives-to-', '');
  } else if (competitorSlug.endsWith('-alternatives')) {
    competitorId = competitorSlug.replace('-alternatives', '');
  } else if (competitorSlug.endsWith('-competitors')) {
    competitorId = competitorSlug.replace('-competitors', '');
  }

  const competitorData = getCompetitorBySlug(competitorId);
  
  // Fallback if competitor not found
  if (!competitorData) {
    return (
      <div className="container-xl py-8">
        <h1 className="text-3xl font-bold mb-4">Alternative Not Found</h1>
        <p className="text-slate-700 mb-4">
          We couldn't find information about this alternative. 
        </p>
        <Link to="/services" className="text-brand hover:underline">
          Explore Fixlo Services →
        </Link>
      </div>
    );
  }

  const comparisonTable = generateComparisonTable(competitorId);
  const faqs = generateCompetitorFAQ(competitorId);
  const faqSchema = generateFAQSchema(faqs);
  const productSchema = generateProductSchema(competitorData.name);

  // SEO metadata
  const title = `Best ${competitorData.name} Alternatives 2025 | Fixlo Comparison`;
  const description = `Comparing ${competitorData.name} alternatives? Discover why Fixlo offers better value with transparent pricing, verified professionals, and no hidden fees. See the honest comparison.`;
  const canonical = `/${competitorSlug}`;

  return (
    <>
      <HelmetSEO 
        title={title}
        description={description}
        canonicalPathname={canonical}
      />
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(productSchema)}
      </script>

      <div className="container-xl py-8">
        {/* Breadcrumb */}
        <nav className="mb-4 text-sm text-slate-600" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li><Link to="/" className="hover:text-brand">Home</Link></li>
            <li>&rsaquo;</li>
            <li className="text-slate-900 font-medium">
              {competitorData.name} Alternatives
            </li>
          </ol>
        </nav>

        {/* Main Heading */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
          Looking for {competitorData.name} Alternatives?
        </h1>

        {/* Disclaimer Banner - REQUIRED FOR LEGAL COMPLIANCE */}
        <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-lg">
          <p className="text-sm text-slate-700">
            <strong>Disclaimer:</strong> {comparisonTable.disclaimer}
          </p>
        </div>

        {/* Introduction */}
        <div className="prose prose-slate max-w-none mb-8">
          <p className="text-lg">
            If you're researching alternatives to {competitorData.name}, you're likely looking for 
            a home services platform that offers better value for both homeowners and professionals. 
            This comprehensive comparison will help you understand how Fixlo differs and why it might 
            be the right choice for your needs.
          </p>
        </div>

        {/* Why People Search for Alternatives */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Why Homeowners & Professionals Search for {competitorData.name} Alternatives
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-3">
                Common Concerns About {competitorData.name}
              </h3>
              <ul className="space-y-2 text-sm text-slate-700">
                {competitorData.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-3">
                What {competitorData.name} Does Well
              </h3>
              <ul className="space-y-2 text-sm text-slate-700">
                {competitorData.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Fixlo vs {competitorData.name}: Side-by-Side Comparison
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-3 text-left font-semibold text-slate-900 border-b border-slate-200">
                    Feature
                  </th>
                  <th className="p-3 text-left font-semibold text-brand border-b border-slate-200">
                    Fixlo
                  </th>
                  <th className="p-3 text-left font-semibold text-slate-900 border-b border-slate-200">
                    {competitorData.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonTable.features.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-3 font-medium text-slate-900 border-b border-slate-200">
                      {row.feature}
                    </td>
                    <td className="p-3 text-slate-700 border-b border-slate-200">
                      {row.fixlo}
                    </td>
                    <td className="p-3 text-slate-700 border-b border-slate-200">
                      {row.competitor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* How Fixlo is Different */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            How Fixlo Stands Out as a {competitorData.name} Alternative
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(FIXLO_ADVANTAGES).map(([key, advantage]) => (
              <div key={key} className="p-6 bg-white border border-slate-200 rounded-lg">
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {advantage.title}
                </h3>
                <p className="text-slate-700 mb-4">
                  {advantage.description}
                </p>
                <ul className="space-y-2">
                  {advantage.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-brand font-bold">✓</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Pro-Friendly Pricing Explanation */}
        <section className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Why Professionals Choose Fixlo Over {competitorData.name}
          </h2>
          <p className="text-slate-700 mb-4">
            Unlike platforms that charge expensive per-lead fees or take large commissions from each job, 
            Fixlo uses a transparent subscription model. This means:
          </p>
          <ul className="space-y-2 text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-brand font-bold">✓</span>
              <span>Professionals keep more of what they earn</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand font-bold">✓</span>
              <span>Predictable monthly costs instead of unpredictable lead fees</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand font-bold">✓</span>
              <span>More sustainable business model for service providers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand font-bold">✓</span>
              <span>Better quality service because pros aren't squeezed by high platform fees</span>
            </li>
          </ul>
        </section>

        {/* CTA */}
        <div className="mb-8 p-6 bg-brand text-white rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-3">
            Ready to Try the Fixlo Difference?
          </h2>
          <p className="mb-4 text-slate-100">
            Join thousands of homeowners who've switched to Fixlo for transparent pricing, 
            verified professionals, and better service.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link 
              to="/signup"
              className="inline-block px-6 py-3 bg-white text-brand font-semibold rounded-lg hover:bg-slate-100 transition"
            >
              Get Started Free
            </Link>
            <Link 
              to="/services"
              className="inline-block px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-brand transition"
            >
              Browse Services
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4 bg-white">
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

        {/* Other Alternatives */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Comparing Other Home Service Platforms
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {['angi', 'homeadvisor', 'thumbtack', 'taskrabbit', 'handy'].map(comp => (
              comp !== competitorId && (
                <Link
                  key={comp}
                  to={`/alternatives-to-${comp}`}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-center text-sm font-medium text-slate-700 hover:text-brand transition capitalize"
                >
                  {comp} Alternative
                </Link>
              )
            ))}
          </div>
        </section>

        {/* Final Disclaimer */}
        <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
          <p>
            <strong>Legal Notice:</strong> This page provides educational comparison information about 
            home service platforms. Fixlo is not affiliated with, endorsed by, or sponsored by {competitorData.name}
            {competitorData.formerName ? ` (formerly ${competitorData.formerName})` : ''} or any other 
            third-party brands mentioned. All trademarks and brand names are the property of their respective 
            owners and are used here for identification and comparison purposes only. Information is based on 
            publicly available data and user feedback as of 2025. Features and pricing of competing services 
            may change. We encourage users to verify current information directly with each service provider 
            before making decisions.
          </p>
        </div>
      </div>
    </>
  );
}
