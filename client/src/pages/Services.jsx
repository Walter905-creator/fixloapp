import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export default function Services() {
  const services = [
    {
      id: "plumbing",
      name: "Plumbing",
      description: "Fix leaks, install fixtures, drain cleaning, and emergency repairs",
      icon: "🔧",
      popular: true
    },
    {
      id: "electrical",
      name: "Electrical", 
      description: "Safe wiring, outlets, lighting installation, and electrical repairs",
      icon: "⚡",
      popular: true
    },
    {
      id: "hvac",
      name: "HVAC",
      description: "Heating, cooling, ventilation services, and system maintenance",
      icon: "❄️",
      popular: true
    },
    {
      id: "carpentry",
      name: "Carpentry",
      description: "Custom builds, repairs, woodworking, and furniture assembly",
      icon: "🔨"
    },
    {
      id: "painting",
      name: "Painting",
      description: "Interior and exterior painting, touch-ups, and color consultation",
      icon: "🎨"
    },
    {
      id: "roofing",
      name: "Roofing",
      description: "Roof repairs, installation, inspection, and gutter services",
      icon: "🏠"
    },
    {
      id: "house-cleaning",
      name: "House Cleaning",
      description: "Professional home cleaning, deep cleaning, and maintenance",
      icon: "🧽"
    },
    {
      id: "junk-removal",
      name: "Junk Removal",
      description: "Efficient junk and debris removal, hauling, and disposal",
      icon: "🗑️"
    },
    {
      id: "landscaping",
      name: "Landscaping",
      description: "Lawn care, gardening, outdoor design, and maintenance",
      icon: "🌿"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Home Services - Fixlo</title>
        <meta 
          name="description" 
          content="Find trusted professionals for all your home service needs. Plumbing, electrical, HVAC, carpentry, painting, and more." 
        />
        <link rel="canonical" href="https://www.fixloapp.com/services" />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Home Services</h1>
          <p className="text-xl text-gray-600">Professional services for every home maintenance need</p>
        </div>

        {/* Popular Services */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Most Popular Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {services.filter(service => service.popular).map((service) => (
              <Link
                key={service.id}
                to={`/services/${service.id}`}
                className="bg-blue-50 border border-blue-200 rounded-lg p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {service.name}
                </h3>
                <p className="text-gray-600">
                  {service.description}
                </p>
                <div className="mt-4 text-blue-600 font-medium">
                  View Service →
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* All Services */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">All Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Link
                key={service.id}
                to={`/services/${service.id}`}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {service.name}
                </h3>
                <p className="text-gray-600">
                  {service.description}
                </p>
                <div className="mt-4 text-blue-600 font-medium">
                  Find Professionals →
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-blue-600 rounded-lg p-8 text-center text-white">
          <h2 className="text-3xl font-semibold mb-4">Need a service not listed?</h2>
          <p className="text-xl mb-6">
            We work with professionals across many specialties. Contact us to find the right expert for your project.
          </p>
          <Link
            to="/contact"
            className="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}