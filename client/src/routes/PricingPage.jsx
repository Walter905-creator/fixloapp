import React, { useState, useEffect } from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { detectUserCountry } from '../utils/countryDetection';
import { API_BASE } from '../utils/config';
import JulyCountdown from '../components/JulyCountdown';
import { isJulyPromoActive, JULY_PROMO } from '../config/julyPromo';

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
  const getVerifiedPlusPrice = () => pricingStatus?.premiumPriceFormatted || pricing?.prices?.premiumMonthlySubscription?.formatted || '$179.99';

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

      {/* July Promotion Banner */}
      {isJulyPromoActive() && (
        <div className="mt-4 rounded-2xl border border-orange-300 bg-orange-50 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-base font-bold text-orange-700">🎉 {JULY_PROMO.label}</p>
              <p className="mt-1 text-sm text-orange-600">
                {JULY_PROMO.subHeadLine || 'Join before July 31 and save 50% on your first month.'}{' '}
                Fixlo Pro Membership: <span className="line-through">{JULY_PROMO.originalPriceFormatted}</span>{' '}
                <strong>{JULY_PROMO.promoPriceFormatted}/month</strong> — Save {JULY_PROMO.savingsFormatted}.
              </p>
              <p className="mt-1 text-xs text-orange-500">Regular price resumes automatically August 1. No manual action required.</p>
            </div>
            <JulyCountdown className="text-orange-700 shrink-0" />
          </div>
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
              <strong className="mt-2 block text-3xl text-emerald-600">Free</strong>
              <p className="text-sm text-slate-600 mt-1">free quote, no upfront fees</p>
              <p className="text-sm text-slate-500 mt-2">
                Get a free quote from verified local professionals. No upfront fees, no obligations. Nationwide — all cities, all services.
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
              <h3 className="font-semibold text-lg">Fixlo Verified Plus</h3>
              {isJulyPromoActive() ? (
                <div className="mt-2">
                  <p className="text-xl font-extrabold text-orange-300 line-through">{JULY_PROMO.originalPriceFormatted}<span className="text-base font-medium">/month</span></p>
                  <p className="text-3xl font-extrabold text-white">{JULY_PROMO.promoPriceFormatted}<span className="text-base font-medium">/month</span></p>
                  <span className="mt-1 inline-block rounded-full bg-orange-500/25 px-2 py-0.5 text-xs font-bold text-orange-300">50% OFF — July Only</span>
                </div>
              ) : (
                <strong className="mt-2 block text-3xl">{getVerifiedPlusPrice()}<span className="text-base font-medium">/month</span></strong>
              )}
              <p className="text-sm text-slate-200 mt-3">
                Get priority access to new leads before regular pros. One exclusive lead at a time with a 1-hour response window.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-100">
                <li>✓ Verified Plus pros get first access</li>
                <li>✓ 1-hour exclusive response window</li>
                <li>✓ Falls back to Fixlo Pro after Verified Plus access expires</li>
              </ul>
              <a href="/pros/signup" className="mt-5 inline-block rounded-lg bg-white px-4 py-2 font-semibold text-slate-900">
                {isJulyPromoActive() ? 'Claim 50% Off' : 'Get Priority Leads'}
              </a>
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
          <li>✓ Plan-based lead routing with verified priority options</li>
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
