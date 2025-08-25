import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ExitIntentModal from "../components/ExitIntentModal";
import ReviewsFeed from "../components/ReviewsFeed";
import useExitIntent from "../hooks/useExitIntent";
import "../styles/home.css";

export default function Home() {
  const { showExitIntent, closeModal } = useExitIntent();
  const BUILD_STAMP = process.env.REACT_APP_BUILD_ID || Date.now();

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
    },
    {
      id: "house-cleaning",
      name: "House Cleaning",
      description: "Professional home cleaning services",
      icon: "🧽"
    },
    {
      id: "junk-removal",
      name: "Junk Removal",
      description: "Efficient junk and debris removal",
      icon: "🗑️"
    },
    {
      id: "landscaping",
      name: "Landscaping",
      description: "Lawn care, gardening, and outdoor design",
      icon: "🌿"
    }
  ];

  // Popular cities data
  const cities = [
    { id: "miami", name: "Miami" },
    { id: "new-york", name: "New York" },
    { id: "los-angeles", name: "Los Angeles" },
    { id: "chicago", name: "Chicago" },
    { id: "houston", name: "Houston" },
    { id: "phoenix", name: "Phoenix" }
  ];

  const keyServices = ["plumbing", "electrical", "hvac"];

  // Smooth scroll to service section
  const scrollToServices = () => {
    const element = document.getElementById("select-a-service");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Fixlo – Book Trusted Home Services Near You</title>
        <meta 
          name="description" 
          content="Connect with verified home service professionals. Book plumbing, electrical, HVAC, carpentry, and more. Trusted local experts for all your home maintenance needs." 
        />
        <link rel="canonical" href="https://www.fixloapp.com/" />
      </Helmet>
      {/* Hero Section */}
      <section className="hero container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-3 sm:mb-4 flex justify-center">
            <img
              src={`/assets/brand/fixlo-logo-2025.svg?v=${BUILD_STAMP}`}
              alt="Fixlo"
              className="h-16 sm:h-20 md:h-24 w-auto"
            />
          </div>
          <p className="max-w-prose text-slate-600 mb-4 sm:mb-6 text-xl text-gray-600 mx-auto">
            Your one-stop hub for connecting with trusted home service professionals. 
            From plumbing to electrical, we've got you covered.
          </p>
          <div className="cta-row flex flex-wrap gap-2 sm:gap-3 justify-center">
            <button
              onClick={scrollToServices}
              className="inline-flex items-center rounded-md bg-indigo-600 text-white px-3 py-2 text-xs sm:text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Select a Service
            </button>
            <Link
              to="/request-service"
              className="inline-flex items-center rounded-md bg-white text-blue-600 border-2 border-blue-600 px-3 py-2 text-xs sm:text-sm font-semibold hover:bg-blue-50 transition-colors"
            >
              Request Service
            </Link>
          </div>
        </div>
      </section>

      {/* Select a Service Grid */}
      <section id="select-a-service" className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Select a Service
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
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

      {/* Popular Service Areas */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Popular Service Areas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cities.map((city) => (
              <div key={city.id} className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {city.name}
                </h3>
                <div className="space-y-2">
                  {keyServices.map((service) => (
                    <Link
                      key={`${city.id}-${service}`}
                      to={`/services/${service}/${city.id}`}
                      className="block text-blue-600 hover:text-blue-800 hover:underline capitalize"
                    >
                      {service} in {city.name}
                    </Link>
                  ))}
                </div>
              </div>
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

      {/* Reviews Feed */}
      <ReviewsFeed/>

      {/* Exit Intent Modal */}
      <ExitIntentModal 
        isOpen={showExitIntent}
        onClose={closeModal}
      />
    </div>
  );
}