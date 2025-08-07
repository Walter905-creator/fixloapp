import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import ServiceRequestModal from './ServiceRequestModal';
import geolocationService from '../utils/geolocationService';

export default function DynamicLandingPage({ city, service }) {
  const [showModal, setShowModal] = useState(false);
  const [detectedCity, setDetectedCity] = useState(city || 'your area');

  // Auto-detect city if not provided
  useEffect(() => {
    if (!city && geolocationService.isGeolocationSupported()) {
      const detectLocation = async () => {
        try {
          console.log('🌍 Auto-detecting user location for personalization...');
          const result = await geolocationService.getCurrentLocationWithAddress();
          const locationName = result.addressDetails.city || 
                              result.addressDetails.town || 
                              result.addressDetails.village || 
                              'your area';
          setDetectedCity(locationName);
          console.log(`✅ Detected city: ${locationName}`);
        } catch (error) {
          console.log('ℹ️ Location detection failed (non-critical):', error.message);
          // Keep default "your area" if location fails - this is not critical for the landing page
        }
      };

      detectLocation();
    }
  }, [city]);

  const serviceData = {
    plumbing: {
      emoji: '🚰',
      title: 'Plumbing',
      description: 'Professional plumbing repairs, installations, and emergency services',
      services: ['Leak repairs', 'Drain cleaning', 'Water heater installation', 'Emergency plumbing'],
      avgPrice: '$150-$350'
    },
    electrical: {
      emoji: '💡',
      title: 'Electrical',
      description: 'Licensed electrical work and repairs by certified electricians',
      services: ['Outlet installation', 'Panel upgrades', 'Lighting fixtures', 'Electrical troubleshooting'],
      avgPrice: '$200-$500'
    },
    hvac: {
      emoji: '❄️',
      title: 'HVAC',
      description: 'Heating, ventilation, and air conditioning services',
      services: ['AC repair', 'Furnace maintenance', 'Duct cleaning', 'System installation'],
      avgPrice: '$250-$800'
    },
    carpentry: {
      emoji: '🪚',
      title: 'Carpentry',
      description: 'Custom carpentry and woodworking services',
      services: ['Custom cabinets', 'Deck building', 'Furniture repair', 'Trim installation'],
      avgPrice: '$100-$400'
    },
    painting: {
      emoji: '🎨',
      title: 'Painting',
      description: 'Interior and exterior painting by professional painters',
      services: ['Interior painting', 'Exterior painting', 'Cabinet painting', 'Pressure washing'],
      avgPrice: '$300-$1,200'
    },
    roofing: {
      emoji: '🏠',
      title: 'Roofing',
      description: 'Professional roofing repairs and installations',
      services: ['Roof repair', 'Shingle replacement', 'Gutter installation', 'Roof inspection'],
      avgPrice: '$500-$2,000'
    },
    'junk-removal': {
      emoji: '🗑️',
      title: 'Junk Removal',
      description: 'Professional junk removal and hauling services',
      services: ['Furniture removal', 'Appliance disposal', 'Construction debris', 'Estate cleanouts'],
      avgPrice: '$150-$600'
    }
  };

  const currentService = serviceData[service] || serviceData.plumbing;
  const capitalizedCity = detectedCity.charAt(0).toUpperCase() + detectedCity.slice(1);

  // Generate proper URLs and SEO metadata
  const baseUrl = 'https://www.fixloapp.com';
  const currentUrl = city 
    ? `${baseUrl}/services/${service}/${city.toLowerCase()}`
    : `${baseUrl}/services/${service}`;
  
  const pageTitle = city 
    ? `${currentService.title} Services in ${capitalizedCity} | Fixlo`
    : `${currentService.title} Services | Fixlo`;
    
  const pageDescription = city
    ? `Professional ${currentService.title.toLowerCase()} services in ${capitalizedCity}. ${currentService.description} Licensed, insured professionals ready to help.`
    : `Professional ${currentService.title.toLowerCase()} services nationwide. ${currentService.description} Connect with licensed professionals today.`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={`${currentService.title.toLowerCase()}, ${city || 'nationwide'}, home services, ${currentService.services.join(', ')}`} />
        <link rel="canonical" href={currentUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": `${currentService.title} Services${city ? ` in ${capitalizedCity}` : ''}`,
            "description": pageDescription,
            "provider": {
              "@type": "Organization",
              "name": "Fixlo",
              "url": baseUrl
            },
            "areaServed": city ? {
              "@type": "City",
              "name": capitalizedCity
            } : {
              "@type": "Country", 
              "name": "United States"
            },
            "serviceType": currentService.title
          })}
        </script>
      </Helmet>
      {/* SEO-optimized Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {currentService.emoji} {currentService.title} Services in {capitalizedCity}
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            {currentService.description} in {capitalizedCity}. 
            Licensed, insured professionals ready to help with your project.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-8">
            <button
              onClick={() => setShowModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200 shadow-lg"
            >
              Get Free Quote in {capitalizedCity}
            </button>
            <div className="text-lg">
              <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
              <span className="ml-2">4.9/5 from 200+ customers in {capitalizedCity}</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl font-bold">50+</div>
              <div className="text-blue-200">Verified Pros in {capitalizedCity}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl font-bold">{currentService.avgPrice}</div>
              <div className="text-blue-200">Average Project Cost</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-blue-200">Emergency Services</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            {currentService.title} Services We Offer in {capitalizedCity}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {currentService.services.map((serviceItem, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-lg">
                <div className="text-3xl mb-3">{currentService.emoji}</div>
                <h3 className="font-semibold mb-2">{serviceItem}</h3>
                <p className="text-gray-600 text-sm">
                  Professional {serviceItem.toLowerCase()} services in {capitalizedCity}
                </p>
              </div>
            ))}
          </div>

          {/* Location-specific content */}
          <div className="bg-blue-50 rounded-lg p-8 mb-12">
            <h3 className="text-2xl font-bold mb-4">
              Why Choose Fixlo for {currentService.title} in {capitalizedCity}?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Licensed and insured professionals in {capitalizedCity}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Same-day service available in {capitalizedCity}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Background-checked contractors</span>
                </li>
              </ul>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Free estimates for {capitalizedCity} residents</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>24/7 emergency services</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>100% satisfaction guarantee</span>
                </li>
              </ul>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Get Started in {capitalizedCity}?
            </h3>
            <p className="text-gray-600 mb-6">
              Connect with top-rated {currentService.title.toLowerCase()} professionals in {capitalizedCity} today.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200 shadow-lg"
            >
              Get Your Free Quote Now
            </button>
          </div>
        </div>
      </section>

      {/* Service Request Modal */}
      {showModal && (
        <ServiceRequestModal
          service={currentService}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}