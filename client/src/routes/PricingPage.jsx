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

  const getProPrice = () => {
    // Use pricing status to determine current price
    if (pricingStatus) {
      return pricingStatus.currentPriceFormatted;
    }
    
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
        <>
          {/* Early Access Banner */}
          {pricingStatus?.earlyAccessAvailable && (
            <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  🎯
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-blue-900 mb-1">Early Access Pricing</h3>
                  <p className="text-sm text-blue-800 mb-2">
                    {pricingStatus.message}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="px-3 py-1 bg-white border border-blue-300 rounded-lg">
                      <span className="text-xs text-slate-600 font-medium">Early Access Spots</span>
                      <div className="text-2xl font-bold text-blue-600">{pricingStatus.earlyAccessSpotsRemaining}</div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-blue-700 font-semibold">
                        Price locked for life while subscription remains active
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="card p-5">
              <h3 className="font-semibold">Homeowners</h3>
              <p className="text-sm text-slate-400">
                Free to request quotes. Pay pros directly after the job.
              </p>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold">Pros</h3>
              <div className="flex items-baseline gap-2">
                <strong className="text-xl">{getProPrice()}/month</strong>
                {pricingStatus?.earlyAccessAvailable && (
                  <span className="text-xs text-slate-500 line-through">{pricingStatus.nextPriceFormatted}/month</span>
                )}
              </div>
              <p className="text-sm text-slate-600 mt-1">
                subscription for job leads & dashboard access
              </p>
              
              {/* Price lock badge */}
              {pricingStatus?.earlyAccessAvailable && (
                <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                  🔒 Price Locked
                </div>
              )}
              
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
