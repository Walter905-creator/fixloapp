import React, { useState, useEffect } from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { detectUserCountry } from '../utils/countryDetection';
import { API_BASE } from '../utils/config';

export default function PricingPage(){
  const [countryInfo, setCountryInfo] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [pricingStatus, setPricingStatus] = useState(null);
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
        
        // Fetch early access pricing status
        const statusResponse = await fetch(`${API_BASE}/api/pricing-status?countryCode=${country.countryCode}`);
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          if (statusData.success) {
            setPricingStatus(statusData.data);
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

  const getProPrice = () => pricingStatus?.proPriceFormatted || pricing?.prices?.proMonthlySubscription?.formatted || '$59.99';
  const getPremiumPrice = () => pricingStatus?.premiumPriceFormatted || pricing?.prices?.premiumMonthlySubscription?.formatted || '$179.99';

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
        <>
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="card p-5">
              <h3 className="font-semibold">Homeowners</h3>
              <strong className="mt-2 block text-3xl">$49.99</strong>
              <p className="text-sm text-slate-600 mt-1">one-time matching fee</p>
              <p className="text-sm text-slate-500 mt-2">
                Get matched with trusted local professionals for only $49.99. Nationwide — all cities, all services.
              </p>
            </div>
            <div className="card p-5 border-2 border-slate-200">
              <h3 className="font-semibold text-lg">Fixlo Pro</h3>
              <strong className="mt-2 block text-3xl">{getProPrice()}<span className="text-base font-medium">/month</span></strong>
              <p className="text-sm text-slate-600 mt-3">
                Get matched with homeowners in your trade within 30 miles.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li>✓ Pro receives leads for their trade</li>
                <li>✓ 30-mile matching radius</li>
                <li>✓ Active subscription required</li>
              </ul>
              <a href="/pros/signup" className="btn-primary mt-5 inline-block">Join Fixlo Pro</a>
            </div>
            <div className="card p-5 border-2 border-slate-900 bg-slate-900 text-white">
              <h3 className="font-semibold text-lg">Fixlo Premium</h3>
              <strong className="mt-2 block text-3xl">{getPremiumPrice()}<span className="text-base font-medium">/month</span></strong>
              <p className="text-sm text-slate-200 mt-3">
                Get priority access to new leads before regular pros. One exclusive lead at a time with a 1-hour response window.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-100">
                <li>✓ Premium pros get first access</li>
                <li>✓ 1-hour exclusive response window</li>
                <li>✓ Falls back to Fixlo Pro after premium expires</li>
              </ul>
              <a href="/pros/signup" className="mt-5 inline-block rounded-lg bg-white px-4 py-2 font-semibold text-slate-900">Get Priority Leads</a>
            </div>
          </div>
        </>
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
          <li>✓ Professional dashboard access</li>
          <li>✓ Direct messaging with homeowners</li>
          <li>✓ Profile listing in search results</li>
          <li>✓ Customer review system</li>
          <li>✓ Mobile app access</li>
          <li>✓ Plan-based lead routing with premium priority options</li>
        </ul>
      </div>

      <div className="mt-6 text-center">
        <a 
          href="/pros/signup" 
          className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Compare Plans
        </a>
      </div>
    </div>
  </>);
}
