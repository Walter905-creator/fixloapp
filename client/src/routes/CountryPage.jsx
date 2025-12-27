import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { detectUserCountry, getSupportedCountries } from '../utils/countryDetection';
import { API_BASE } from '../utils/config';

/**
 * Country-specific landing page
 * Dynamically generates localized content for each supported country
 */
export default function CountryPage() {
  const { countryCode } = useParams();
  const navigate = useNavigate();
  const [countryInfo, setCountryInfo] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadCountryData() {
      try {
        setLoading(true);
        
        // Get country configuration
        const response = await fetch(`${API_BASE}/api/country/info/${countryCode.toUpperCase()}`);
        if (!response.ok) {
          throw new Error(`Country ${countryCode} not found`);
        }
        
        const countryResult = await response.json();
        if (!countryResult.success) {
          throw new Error('Failed to load country information');
        }
        
        setCountryInfo(countryResult.data);

        // Get pricing for this country
        const pricingResponse = await fetch(`${API_BASE}/api/pricing/${countryCode.toUpperCase()}`);
        if (pricingResponse.ok) {
          const pricingData = await pricingResponse.json();
          if (pricingData.success) {
            setPricing(pricingData.data);
          }
        }
      } catch (err) {
        console.error('Error loading country data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadCountryData();
  }, [countryCode]);

  if (loading) {
    return (
      <div className="container-xl py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-slate-400">Loading...</p>
      </div>
    );
  }

  if (error || !countryInfo) {
    return (
      <div className="container-xl py-16 text-center">
        <h1 className="text-3xl font-bold text-red-500">Country Not Found</h1>
        <p className="mt-4 text-slate-400">{error || 'The requested country is not available.'}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Return Home
        </button>
      </div>
    );
  }

  const getProPrice = () => {
    if (pricing?.prices?.proMonthlySubscription) {
      return pricing.prices.proMonthlySubscription.formatted;
    }
    return '$59.99';
  };

  return (
    <>
      <Helmet>
        <title>Fixlo in {countryInfo.name} - Home Services Marketplace</title>
        <meta
          name="description"
          content={`Find trusted home service professionals in ${countryInfo.name}. Connect with plumbers, electricians, handymen, and more. Subscription from ${getProPrice()}/month.`}
        />
        <link rel="canonical" href={`https://www.fixloapp.com/country/${countryCode.toLowerCase()}`} />
        <link rel="alternate" hrefLang="x-default" href="https://www.fixloapp.com/" />
        <link rel="alternate" hrefLang="en" href={`https://www.fixloapp.com/country/${countryCode.toLowerCase()}`} />
        {countryInfo.language === 'es' && (
          <link rel="alternate" hrefLang="es" href={`https://www.fixloapp.com/country/${countryCode.toLowerCase()}`} />
        )}
        {countryInfo.language === 'pt' && (
          <link rel="alternate" hrefLang="pt" href={`https://www.fixloapp.com/country/${countryCode.toLowerCase()}`} />
        )}
      </Helmet>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="container-xl">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
              Welcome to Fixlo in {countryInfo.name}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Connect with trusted home service professionals near you. From plumbing to painting, 
              we've got you covered.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/services"
                className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
              >
                Find Services
              </a>
              <a
                href="/pro/signup"
                className="px-8 py-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-400 transition-colors"
              >
                Join as a Pro
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Country Info */}
      <div className="container-xl py-12">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card p-6 text-center">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="font-bold text-lg mb-2">Local Pricing</h3>
            <p className="text-slate-400">
              Transparent pricing in {countryInfo.currency}
            </p>
          </div>
          <div className="card p-6 text-center">
            <div className="text-4xl mb-3">🌍</div>
            <h3 className="font-bold text-lg mb-2">Local Service</h3>
            <p className="text-slate-400">
              Operating in {countryInfo.region}
            </p>
          </div>
          <div className="card p-6 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="font-bold text-lg mb-2">Verified Pros</h3>
            <p className="text-slate-400">
              Trusted professionals in your area
            </p>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="bg-slate-50 dark:bg-slate-900 py-16">
        <div className="container-xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Available Services in {countryInfo.name}
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { name: 'Plumbing', icon: '🔧' },
              { name: 'Electrical', icon: '⚡' },
              { name: 'Carpentry', icon: '🔨' },
              { name: 'Painting', icon: '🎨' },
              { name: 'HVAC', icon: '❄️' },
              { name: 'Roofing', icon: '🏠' },
              { name: 'Landscaping', icon: '🌳' },
              { name: 'Cleaning', icon: '🧹' }
            ].map((service) => (
              <div key={service.name} className="card p-6 text-center hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-3">{service.icon}</div>
                <h3 className="font-semibold">{service.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      {pricing && (
        <div className="container-xl py-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Pricing for {countryInfo.name}
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="card p-8">
              <h3 className="text-2xl font-bold mb-4">For Homeowners</h3>
              <p className="text-3xl font-bold text-green-500 mb-4">FREE</p>
              <ul className="space-y-3 text-slate-300">
                <li>✓ Request unlimited quotes</li>
                <li>✓ Compare professionals</li>
                <li>✓ Direct messaging</li>
                <li>✓ Pay pros directly</li>
              </ul>
              <a
                href="/services"
                className="block mt-6 px-6 py-3 bg-green-600 text-white text-center font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                Get Started
              </a>
            </div>
            <div className="card p-8 border-2 border-blue-500">
              <h3 className="text-2xl font-bold mb-4">For Professionals</h3>
              <p className="text-3xl font-bold text-blue-500 mb-4">
                {getProPrice()}<span className="text-lg">/month</span>
              </p>
              <ul className="space-y-3 text-slate-300">
                <li>✓ Unlimited job leads</li>
                <li>✓ Professional dashboard</li>
                <li>✓ Customer reviews</li>
                <li>✓ Mobile app access</li>
              </ul>
              <a
                href="/pro/signup"
                className="block mt-6 px-6 py-3 bg-blue-600 text-white text-center font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Join as a Pro
              </a>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container-xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started in {countryInfo.name}?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of homeowners and professionals using Fixlo to connect and get work done.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/services"
              className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
            >
              Find a Pro
            </a>
            <a
              href="/pro/signup"
              className="px-8 py-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-400 transition-colors"
            >
              Become a Pro
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
