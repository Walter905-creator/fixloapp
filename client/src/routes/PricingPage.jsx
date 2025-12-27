import React, { useState, useEffect } from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { detectUserCountry } from '../utils/countryDetection';
import { API_BASE } from '../utils/config';

export default function PricingPage(){
  const [countryInfo, setCountryInfo] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPricing() {
      try {
        // Detect user's country
        const country = await detectUserCountry();
        setCountryInfo(country);

        // Fetch pricing for the detected country
        const response = await fetch(`${API_BASE}/api/pricing/${country.countryCode}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setPricing(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to load pricing:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPricing();
  }, []);

  const getProPrice = () => {
    if (pricing?.prices?.proMonthlySubscription) {
      return pricing.prices.proMonthlySubscription.formatted;
    }
    return '$59.99';
  };

  const getCountryName = () => {
    return countryInfo?.countryName || 'your country';
  };

  return (<>
    <HelmetSEO title="Pricing | Fixlo" canonicalPathname="/pricing" />
    <div className="container-xl py-8">
      <h1 className="text-2xl font-extrabold">Pricing</h1>
      
      {countryInfo && !countryInfo.fallback && (
        <div className="mt-2 text-sm text-slate-400">
          Showing pricing for {getCountryName()} in {countryInfo.currency}
        </div>
      )}
      
      {loading ? (
        <div className="mt-8 text-center text-slate-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading pricing...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="card p-5">
            <h3 className="font-semibold">Homeowners</h3>
            <p className="text-sm text-slate-400">
              Free to request quotes. Pay pros directly after the job.
            </p>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold">Pros</h3>
            <p>
              <strong className="text-xl">{getProPrice()}/month</strong> subscription for job leads & dashboard access.
            </p>
            {pricing?.prices?.proMonthlySubscription && (
              <div className="mt-3 text-xs text-slate-400">
                {pricing.prices.proMonthlySubscription.baseAmount !== pricing.prices.proMonthlySubscription.amount && (
                  <div>Base price: ${pricing.prices.proMonthlySubscription.baseAmount.toFixed(2)} USD</div>
                )}
                <div className="mt-1">Currency: {pricing.country.currency}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {!countryInfo?.supported && countryInfo && !countryInfo.fallback && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          <p className="font-semibold">⚠️ Service Availability</p>
          <p className="text-sm mt-1">
            Fixlo is not yet available in {getCountryName()}. We're working on expanding to your region. 
            Pricing is shown for reference only.
          </p>
        </div>
      )}

      <div className="mt-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
        <h2 className="text-xl font-bold mb-4">What's Included</h2>
        <ul className="space-y-2 text-slate-700">
          <li>✓ Unlimited job lead notifications</li>
          <li>✓ Professional dashboard access</li>
          <li>✓ Direct messaging with homeowners</li>
          <li>✓ Profile listing in search results</li>
          <li>✓ Customer review system</li>
          <li>✓ Mobile app access</li>
        </ul>
      </div>

      <div className="mt-6 text-center">
        <a 
          href="/pro/signup" 
          className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Get Started
        </a>
      </div>
    </div>
  </>);
}
