import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function ServiceDetail() {
  const { service } = useParams();
  
  // Service data mapping
  const serviceData = {
    'plumbing': {
      name: 'Plumbing Services',
      description: 'Professional plumbing services including leak repairs, fixture installation, drain cleaning, and emergency plumbing solutions.',
      icon: '🔧',
      services: [
        'Leak detection and repair',
        'Fixture installation and replacement',
        'Drain cleaning and unclogging',
        'Water heater services',
        'Emergency plumbing repairs',
        'Pipe installation and repair'
      ]
    },
    'electrical': {
      name: 'Electrical Services',
      description: 'Safe and certified electrical services including wiring, outlet installation, lighting, and electrical repairs by licensed electricians.',
      icon: '⚡',
      services: [
        'Electrical wiring and rewiring',
        'Outlet and switch installation',
        'Lighting installation and repair',
        'Circuit breaker services',
        'Electrical safety inspections',
        'Emergency electrical repairs'
      ]
    },
    'hvac': {
      name: 'HVAC Services',
      description: 'Complete heating, ventilation, and air conditioning services including installation, maintenance, and emergency repairs.',
      icon: '❄️',
      services: [
        'AC installation and repair',
        'Heating system maintenance',
        'Ventilation system services',
        'HVAC system installation',
        'Emergency HVAC repairs',
        'Energy efficiency upgrades'
      ]
    },
    'carpentry': {
      name: 'Carpentry Services',
      description: 'Expert carpentry and woodworking services including custom builds, repairs, and home improvement projects.',
      icon: '🔨',
      services: [
        'Custom furniture building',
        'Cabinet installation and repair',
        'Trim and molding work',
        'Deck and patio construction',
        'Kitchen and bathroom remodeling',
        'General carpentry repairs'
      ]
    },
    'painting': {
      name: 'Painting Services',
      description: 'Professional interior and exterior painting services with quality materials and expert craftsmanship.',
      icon: '🎨',
      services: [
        'Interior painting',
        'Exterior painting',
        'Cabinet painting and refinishing',
        'Pressure washing',
        'Drywall repair and painting',
        'Commercial painting services'
      ]
    },
    'roofing': {
      name: 'Roofing Services',
      description: 'Complete roofing solutions including installation, repair, inspection, and maintenance by certified roofers.',
      icon: '🏠',
      services: [
        'Roof installation and replacement',
        'Roof repair and maintenance',
        'Gutter installation and cleaning',
        'Roof inspection services',
        'Emergency roof repairs',
        'Shingle and tile services'
      ]
    }
  };

  const currentService = serviceData[service] || {
    name: 'Service',
    description: 'Professional home service',
    icon: '🏠',
    services: ['Service not found']
  };

  const capitalizedServiceName = service ? service.charAt(0).toUpperCase() + service.slice(1) : 'Service';
  
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{currentService.name} - Fixlo</title>
        <meta 
          name="description" 
          content={`${currentService.description} Book trusted ${service} professionals in your area through Fixlo.`} 
        />
        <link rel="canonical" href={`https://www.fixloapp.com/services/${service}`} />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">{currentService.icon}</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{currentService.name}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{currentService.description}</p>
        </div>

        {/* Services List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {currentService.services.map((serviceItem, index) => (
            <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">{serviceItem}</h3>
              <p className="text-gray-600 text-sm">Professional and reliable service</p>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Book {capitalizedServiceName} Services?
          </h2>
          <p className="text-gray-600 mb-6">
            Connect with verified professionals in your area and get your project started today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/signup" 
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Book Service Now
            </Link>
            <Link 
              to="/services" 
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              View All Services
            </Link>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="mt-8 text-sm text-gray-500">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <span className="mx-2">›</span>
          <Link to="/services" className="hover:text-blue-600">Services</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900">{capitalizedServiceName}</span>
        </div>
      </div>
    </div>
  );
}