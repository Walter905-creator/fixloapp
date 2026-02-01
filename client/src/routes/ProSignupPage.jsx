import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';
import { STRIPE_CHECKOUT_URL, API_BASE } from '../utils/config';
import ProValueBanner from '../components/ProValueBanner';
import StickyProCTA from '../components/StickyProCTA';
import { captureReferralCode, getStoredReferralCode, isValidReferralCode } from '../utils/referralCapture';

export default function ProSignupPage(){
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState('');
  const [referralValid, setReferralValid] = useState(false);
  const [referrerName, setReferrerName] = useState('');
  const [referralCodeFromLink, setReferralCodeFromLink] = useState(false);
  const [pricingStatus, setPricingStatus] = useState(null);
  
  const stripeUrlRaw = STRIPE_CHECKOUT_URL;
  const [country, setCountry] = React.useState('US'); // Default to US

  // Detect user's country on mount
  React.useEffect(() => {
    async function detectCountry() {
      try {
        const res = await fetch('/api/country/detect');
        if (res.ok) {
          const data = await res.json();
          if (data.countryCode) {
            setCountry(data.countryCode);
          }
        }
      } catch (error) {
        // Silently handle country detection failures - this is non-blocking
        console.info('Country detection failed — defaulting to US');
      }
    }
    detectCountry();
  }, []);
  
  // Fetch pricing status
  React.useEffect(() => {
    async function loadPricingStatus() {
      try {
        const response = await fetch(`${API_BASE}/api/pricing-status?countryCode=${country}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setPricingStatus(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to load pricing status:', error);
      }
    }
    loadPricingStatus();
  }, [country]);

  const isUSUser = country === 'US';

  // Auto-apply referral code from URL or storage
  useEffect(() => {
    // Priority 1: Check URL for referral code
    const refCodeFromUrl = searchParams.get('ref');
    
    if (refCodeFromUrl && isValidReferralCode(refCodeFromUrl)) {
      const normalizedCode = refCodeFromUrl.trim().toUpperCase();
      // Capture and store the referral code
      captureReferralCode(searchParams);
      setReferralCode(normalizedCode);
      setReferralCodeFromLink(true);
      validateReferralCode(normalizedCode);
      trackReferralClick(normalizedCode);
      return;
    }
    
    // Priority 2: Check localStorage for stored referral code
    const storedCode = getStoredReferralCode();
    if (storedCode) {
      setReferralCode(storedCode);
      setReferralCodeFromLink(true);
      validateReferralCode(storedCode);
      // Don't track click again if coming from storage
    }
  }, [searchParams]);

  const validateReferralCode = async (code) => {
    try {
      const response = await fetch(`${API_BASE}/api/referrals/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: code })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.valid) {
          setReferralValid(true);
          setReferrerName(data.referrerName || 'a Fixlo pro');
        }
      }
    } catch (err) {
      console.error('Error validating referral code:', err);
    }
  };

  const trackReferralClick = async (code) => {
    try {
      await fetch(`${API_BASE}/api/referrals/track-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralCode: code,
          ip: null, // IP will be captured on backend
          deviceFingerprint: navigator.userAgent
        })
      });
    } catch (err) {
      console.error('Error tracking referral click:', err);
    }
  };

  function resolveCheckoutURL(raw){
    const s = (raw || '').trim();
    if(!s) return null;
    const hasScheme = /^https?:\/\//i.test(s);
    const looksLikeDomain = /\.[a-z]{2,}/i.test(s.split('/')[0]);
    const candidate = hasScheme ? s : (looksLikeDomain ? `https://${s}` : s);
    try { return new URL(candidate, window.location.origin).toString(); } catch { return null; }
  }

  async function onSubmit(e){
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = (form.get('email') || '').trim();
    const target = resolveCheckoutURL(stripeUrlRaw);
    if(!target){
      alert('Stripe checkout URL is missing or invalid. Set VITE_STRIPE_CHECKOUT_URL to a full https:// link (Payment Link or Checkout Session URL).');
      return;
    }
    try{
      const url = new URL(target);
      if(email) url.searchParams.set('prefilled_email', email);
      
      // Add referral code to metadata if present
      if (referralCode && referralValid) {
        url.searchParams.set('client_reference_id', referralCode);
      }
      
      window.location.href = url.toString();
    }catch(err){
      console.error('Stripe redirect error:', err);
      alert('Could not build a valid Stripe URL. Please check VITE_STRIPE_CHECKOUT_URL.');
    }
  }

  return (<>
    <HelmetSEO title="Professional Sign Up | Fixlo" canonicalPathname="/pro/signup" />
    <ProValueBanner dense />
    <div className="container-xl py-8">
      <h1 className="text-2xl font-extrabold">Join Fixlo as a Professional</h1>
      
      {/* Early Access Pricing Banner */}
      {pricingStatus?.earlyAccessAvailable && (
        <div className="mt-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              🎯
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-green-900 mb-1">Early Access Special</h3>
              <p className="text-sm text-green-800 mb-2">
                {pricingStatus.message}
              </p>
              <div className="mt-3 p-3 bg-white border border-green-300 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-600 font-medium">Your Price Today</div>
                    <div className="text-3xl font-bold text-green-600">{pricingStatus.currentPriceFormatted}/month</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-600 font-medium">Regular Price</div>
                    <div className="text-2xl font-bold text-slate-400 line-through">{pricingStatus.nextPriceFormatted}/month</div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-green-700 font-semibold">
                  <span className="inline-block px-2 py-1 bg-green-100 rounded">🔒 Price locked for life</span>
                  <span>•</span>
                  <span>{pricingStatus.earlyAccessSpotsRemaining} spots remaining</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Standard Pricing (when early access is full) */}
      {pricingStatus && !pricingStatus.earlyAccessAvailable && (
        <div className="mt-6 p-5 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="text-lg font-bold text-blue-900 mb-1">Fixlo Pro Membership</h3>
          <p className="text-sm text-blue-800 mb-2">
            Early access has ended. Join at the standard price.
          </p>
          <div className="text-3xl font-bold text-blue-600">{pricingStatus.currentPriceFormatted}/month</div>
        </div>
      )}
      
      {/* Referral Banner - Subtle confirmation */}
      {referralValid && referralCode && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg" role="status" aria-live="polite">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <div>
              <p className="text-sm font-semibold text-green-900">
                Joining with a referral code
              </p>
              <p className="text-xs text-green-700">
                Your referral will be credited after signup. No action needed.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="card p-6 max-w-lg">
        <p className="text-slate-700 mb-6">Start getting quality leads in your area. Background check and onboarding included.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-800 mb-1">Full Name</label>
            <input name="name" className="mt-1 w-full rounded-xl" required/>
          </div>
          <div>
            <label className="block text-sm text-slate-800 mb-1">Email</label>
            <input name="email" className="mt-1 w-full rounded-xl" type="email" required/>
          </div>
          <div>
            <label className="block text-sm text-slate-800 mb-1">Phone</label>
            <input name="phone" className="mt-1 w-full rounded-xl" required/>
          </div>
          <div>
            <label className="block text-sm text-slate-800 mb-1">Trade/Service</label>
            <select name="trade" className="mt-1 w-full rounded-xl" required>
              <option value="">Select your trade...</option>
              {['Plumbing','Electrical','Carpentry','Painting','HVAC','Roofing','Landscaping','House Cleaning','Junk Removal'].map(t=>(
                <option key={t} value={t.toLowerCase()}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-800 mb-1">City</label>
            <input name="city" className="mt-1 w-full rounded-xl" placeholder="City, State" required/>
          </div>
          <div>
            <label className="block text-sm text-slate-800 mb-1">Date of Birth</label>
            <input name="dob" className="mt-1 w-full rounded-xl" type="date" required/>
          </div>
          
          {/* Referral Code Field - Optional but visible */}
          <div className="pt-2 border-t border-slate-200">
            <label className="block text-sm text-slate-800 mb-1">
              Referral Code <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <input 
              name="referralCode"
              value={referralCode}
              onChange={(e) => {
                const newCode = e.target.value.trim().toUpperCase();
                setReferralCode(newCode);
                if (newCode && isValidReferralCode(newCode)) {
                  validateReferralCode(newCode);
                } else {
                  setReferralValid(false);
                  setReferrerName('');
                }
              }}
              className="mt-1 w-full rounded-xl" 
              placeholder="Enter referral code if you have one"
              maxLength="20"
            />
            {referralCodeFromLink && referralCode && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span>Referral code applied</span>
              </p>
            )}
            {referralValid && referrerName && (
              <p className="text-xs text-slate-600 mt-1">
                Referred by {referrerName}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Have a referral code? Enter it here to support your referrer.
            </p>
          </div>
          
          {/* Conditional opt-in based on country */}
          {isUSUser ? (
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input id="sms-consent" type="checkbox" className="rounded mt-0.5" required/>
              I agree to receive SMS notifications about job leads and account updates. Reply STOP to unsubscribe at any time.
            </label>
          ) : (
            <>
              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input id="whatsapp-consent" name="whatsappOptIn" type="checkbox" className="rounded mt-0.5"/>
                I agree to receive WhatsApp notifications about new job leads and service updates from Fixlo. Reply STOP to unsubscribe.
              </label>
              <p className="text-xs text-slate-600 italic">
                You will receive email notifications about job leads. WhatsApp notifications are optional.
              </p>
            </>
          )}
          
          <button type="submit" className="btn-primary w-full">
            Continue to Payment & Background Check
          </button>
        </form>
        {pricingStatus && (
          <p className="text-xs text-slate-600 mt-4 text-center">
            {pricingStatus.currentPriceFormatted}/month subscription includes background check, lead notifications, and platform access.
            {pricingStatus.earlyAccessAvailable && (
              <span className="block mt-1 text-green-600 font-semibold">
                🔒 Price locked for life while subscription remains active
              </span>
            )}
          </p>
        )}
      </div>
    </div>
    <StickyProCTA />
  </>);
}