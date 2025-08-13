import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ServiceRequestModal from './ServiceRequestModal';

const services = [
  { name: 'Plumbing', emoji: '🚰', slug: 'plumbing' },
  { name: 'Electrical', emoji: '💡', slug: 'electrical' },
  { name: 'Carpentry', emoji: '🪚', slug: 'carpentry' },
  { name: 'Painting', emoji: '🎨', slug: 'painting' },
  { name: 'HVAC', emoji: '❄️', slug: 'hvac' },
  { name: 'Roofing', emoji: '🏠', slug: 'roofing' },
  { name: 'House Cleaning', emoji: '🧹', slug: 'house-cleaning' },
  { name: 'Junk Removal', emoji: '🗑️', slug: 'junk-removal' },
  { name: 'Landscaping', emoji: '🌿', slug: 'landscaping' },
];

const popularCities = [
  'miami', 'new-york', 'los-angeles', 'chicago', 'houston', 'phoenix'
];

export default function ServiceSelector() {
  const [selectedService, setSelectedService] = useState(null);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {services.map(service => (
          <div key={service.name} className="relative group">
            <button
              onClick={() => setSelectedService(service)}
              className="w-full border border-gray-300 p-4 rounded-lg text-center hover:bg-blue-100 transition"
            >
              <div className="text-3xl mb-2">{service.emoji}</div>
              <div className="font-medium">{service.name}</div>
            </button>
            
            {/* Service page link */}
            <Link 
              to={`/services/${service.slug}`}
              className="absolute top-2 right-2 text-xs text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
              title={`View ${service.name} services`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          </div>
        ))}
      </div>

      {/* Popular Cities Section for Internal Linking */}
      <div className="mt-12 bg-gray-50 rounded-xl p-6">
        <h3 className="text-xl font-bold text-center mb-6 text-gray-900">
          Popular Service Areas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {popularCities.map(city => (
            <div key={city} className="text-center">
              <div className="text-sm font-medium text-gray-700 mb-2 capitalize">
                {city.replace('-', ' ')}
              </div>
              <div className="space-y-1">
                <Link 
                  to={`/services/plumbing/${city}`}
                  className="block text-xs text-blue-600 hover:text-blue-800"
                >
                  Plumbing
                </Link>
                <Link 
                  to={`/services/electrical/${city}`}
                  className="block text-xs text-blue-600 hover:text-blue-800"
                >
                  Electrical
                </Link>
                <Link 
                  to={`/services/hvac/${city}`}
                  className="block text-xs text-blue-600 hover:text-blue-800"
                >
                  HVAC
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedService && (
        <ServiceRequestModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}
    </>
  );
}
