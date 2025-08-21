import React from "react";
import { Link } from "react-router-dom";

export default function HomeSimple() {
  // Service data for the grid
  const services = [
    {
      id: "plumbing",
      name: "Plumbing",
      description: "Fix leaks, install fixtures, and drain cleaning",
      icon: "🔧"
    },
    {
      id: "electrical",
      name: "Electrical", 
      description: "Safe wiring, outlets, and lighting installation",
      icon: "⚡"
    },
    {
      id: "carpentry",
      name: "Carpentry",
      description: "Custom builds, repairs, and woodworking",
      icon: "🔨"
    },
    {
      id: "painting",
      name: "Painting",
      description: "Interior and exterior painting services",
      icon: "🎨"
    },
    {
      id: "hvac",
      name: "HVAC",
      description: "Heating, cooling, and ventilation services",
      icon: "❄️"
    },
    {
      id: "roofing",
      name: "Roofing",
      description: "Roof repairs, installation, and inspection",
      icon: "🏠"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to Fixlo
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your one-stop hub for connecting with trusted home service professionals. 
            From plumbing to electrical, we've got you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              Select a Service
            </button>
            <Link
              to="/signup"
              className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </section>

      {/* Select a Service Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Select a Service
          </h2>
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
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Join Fixlo's Professional Network */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-6">
              Join Fixlo's Professional Network
            </h2>
            <Link
              to="/pro/signup"
              className="inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Join Now
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl mb-2">✅</div>
              <h3 className="font-semibold mb-2">Background Checked</h3>
              <p className="text-blue-100 text-sm">
                Verified professionals you can trust
              </p>
            </div>
            <div>
              <div className="text-2xl mb-2">📱</div>
              <h3 className="font-semibold mb-2">Real-time SMS</h3>
              <p className="text-blue-100 text-sm">
                Instant notifications for new jobs
              </p>
            </div>
            <div>
              <div className="text-2xl mb-2">🤖</div>
              <h3 className="font-semibold mb-2">AI Assistant</h3>
              <p className="text-blue-100 text-sm">
                Smart tools to grow your business
              </p>
            </div>
            <div>
              <div className="text-2xl mb-2">💳</div>
              <h3 className="font-semibold mb-2">Secure Payments</h3>
              <p className="text-blue-100 text-sm">
                Fast, secure payment processing
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}