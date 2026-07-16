import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';
import { STRIPE_CHECKOUT_URL, API_BASE } from '../utils/config';
import ProValueBanner from '../components/ProValueBanner';
import StickyProCTA from '../components/StickyProCTA';
import JulyCountdown from '../components/JulyCountdown';
import { isJulyPromoActive, JULY_PROMO } from '../config/julyPromo';
import { captureReferralCode, getStoredReferralCode, isValidReferralCode } from '../utils/referralCapture';

export default function ProSignupPage(){
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState('');
  const [referralValid, setReferralValid] = useState(false);
  const [referrerName, setReferrerName] = useState('');
  const [referralCodeFromLink, setReferralCodeFromLink] = useState(false);
  const [pricingStatus, setPricingStatus] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Invitation code state (Fixlo internal invite codes)
  const [inviteCode, setInviteCode] = useState('');
  const [inviteCodeStatus, setInviteCodeStatus] = useState(''); // '' | 'valid' | 'invalid' | 'checking'
  const [inviteCodeMsg, setInviteCodeMsg] = useState('');
  // Minimum length before attempting to validate a Fixlo invite code (e.g. FIXLO-XXXXXX = 12 chars)
  const MIN_INVITE_CODE_LENGTH = 8;
  
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

  // Validate a Fixlo invitation code
  const validateInviteCode = async (code) => {
    if (!code) {
      setInviteCodeStatus('');
      setInviteCodeMsg('');
      return;
    }
    setInviteCodeStatus('checking');
    setInviteCodeMsg('');
    try {
      const response = await fetch(`${API_BASE}/api/invite-codes/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          setInviteCodeStatus('valid');
          setInviteCodeMsg('Invitation code accepted. Your member benefits have been applied.');
        } else {
          setInviteCodeStatus('invalid');
          setInviteCodeMsg('This invitation code is invalid, expired, revoked, or already used.');
        }
      } else {
        setInviteCodeStatus('invalid');
        setInviteCodeMsg('Could not validate code. Please try again.');
      }
    } catch {
      setInviteCodeStatus('invalid');
      setInviteCodeMsg('Could not validate code. Please try again.');
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
    try{
      setCheckoutLoading(true);
      const response = await fetch(`${API_BASE}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone: (form.get('phone') || '').trim(),
          plan: selectedPlan,
          referralCode: referralCode && referralValid ? referralCode : '',
          tier: 'PRO'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.sessionUrl) {
          window.location.href = data.sessionUrl;
          return;
        }
      }

      const target = resolveCheckoutURL(stripeUrlRaw);
      if(!target){
        alert('Stripe checkout is unavailable right now. Please contact support.');
        return;
      }

      const url = new URL(target);
      if(email) url.searchParams.set('prefilled_email', email);
      window.location.href = url.toString();
    }catch(err){
      console.error('Stripe redirect error:', err);
      alert('Could not start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (<>
    <HelmetSEO title="Professional Sign Up | Fixlo" canonicalPathname="/pros/signup" />
    <ProValueBanner dense />
    <div className="container-xl py-8">
      <h1 className="text-2xl font-extrabold">Join Fixlo as a Professional</h1>

      {/* July Promotion Banner */}
      {isJulyPromoActive() && (
        <div className="mt-4 rounded-2xl border border-orange-300 bg-orange-50 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-orange-700">🎉 {JULY_PROMO.label} — {JULY_PROMO.subHeadLine || 'Join before July 31 and save 50% on your first month.'}</p>
              <p className="mt-1 text-sm text-orange-600">
                Fixlo Pro Membership: <span className="line-through">{JULY_PROMO.originalPriceFormatted}</span>{' '}
                <strong>{JULY_PROMO.promoPriceFormatted}/month</strong> — Save {JULY_PROMO.savingsFormatted}. Regular price resumes automatically August 1.
              </p>
            </div>
            <JulyCountdown className="text-orange-700 shrink-0" />
          </div>
        </div>
      )}
      
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {[
          {
            id: 'pro',
            title: 'Fixlo Pro',
            price: pricingStatus?.proPriceFormatted || '$59.99',
            cta: 'Join Fixlo Pro',
            copy: 'Get matched with homeowners in your trade within 30 miles.',
            benefits: ['Leads for your trade', '30-mile lead matching', 'Dashboard access']
          },
          {
            id: 'premium',
            title: 'Fixlo Verified Plus',
            price: pricingStatus?.premiumPriceFormatted || '$179.99',
            cta: 'Get Priority Leads',
            copy: 'Get priority access to new leads before regular pros. One exclusive lead at a time with a 1-hour response window.',
            benefits: ['Verified-first routing', '1-hour exclusive response window', 'One active exclusive lead at a time']
          }
        ].map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => setSelectedPlan(plan.id)}
            className={`rounded-2xl border p-5 text-left transition ${selectedPlan === plan.id ? 'border-slate-900 bg-slate-900 text-white shadow-lg' : 'border-slate-200 bg-white hover:border-slate-400'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">{plan.title}</h3>
                <div className="mt-2 text-3xl font-extrabold">{plan.price}<span className="text-base font-medium">/month</span></div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedPlan === plan.id ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-700'}`}>
                {plan.cta}
              </span>
            </div>
            <p className={`mt-3 text-sm ${selectedPlan === plan.id ? 'text-slate-200' : 'text-slate-600'}`}>{plan.copy}</p>
            <ul className={`mt-4 space-y-2 text-sm ${selectedPlan === plan.id ? 'text-slate-100' : 'text-slate-700'}`}>
              {plan.benefits.map((benefit) => (
                <li key={benefit}>✓ {benefit}</li>
              ))}
            </ul>
          </button>
        ))}
      </div>
      
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
        <p className="text-slate-700 mb-6">
          Start getting quality leads in your area. Background check and onboarding included.
          <span className="block mt-2 font-semibold text-slate-900">
            Selected plan: {selectedPlan === 'premium' ? 'Fixlo Verified Plus' : 'Fixlo Pro'}
          </span>
        </p>
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

          {/* Invitation Code Field — for Fixlo internal member codes */}
          <div className="pt-2 border-t border-slate-200">
            <label className="block text-sm text-slate-800 mb-1">
              Invitation Code <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <input
              name="inviteCode"
              value={inviteCode}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setInviteCode(val);
                // Reset status while typing; validation fires on blur or on paste of a complete code
                if (inviteCodeStatus) {
                  setInviteCodeStatus('');
                  setInviteCodeMsg('');
                }
              }}
              onBlur={(e) => {
                // Validate when user leaves the field if there's a meaningful code entered
                const val = e.target.value.trim().toUpperCase();
                if (val.length >= MIN_INVITE_CODE_LENGTH) {
                  validateInviteCode(val);
                }
              }}
              className={`mt-1 w-full rounded-xl ${
                inviteCodeStatus === 'valid' ? 'border-green-500 ring-1 ring-green-500'
                : inviteCodeStatus === 'invalid' ? 'border-red-400 ring-1 ring-red-400'
                : ''
              }`}
              placeholder="Enter your one-time Fixlo code"
              maxLength="30"
              autoComplete="off"
            />
            {inviteCodeStatus === 'checking' && (
              <p className="text-xs text-slate-500 mt-1">Checking code…</p>
            )}
            {inviteCodeStatus === 'valid' && (
              <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                {inviteCodeMsg}
              </p>
            )}
            {inviteCodeStatus === 'invalid' && (
              <p className="text-xs text-red-600 mt-1">{inviteCodeMsg}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Have a personal Fixlo invitation? Enter your code here for member benefits.
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
          
          <button type="submit" className="btn-primary w-full" disabled={checkoutLoading}>
            {checkoutLoading
              ? 'Starting Checkout...'
              : selectedPlan === 'premium'
                ? 'Get Priority Leads'
                : 'Join Fixlo Pro'}
          </button>
        </form>
        {pricingStatus && (
          <p className="text-xs text-slate-600 mt-4 text-center">
            {(selectedPlan === 'premium' ? pricingStatus.premiumPriceFormatted : pricingStatus.proPriceFormatted) || (selectedPlan === 'premium' ? '$179.99' : '$59.99')}
            /month includes background check, lead notifications, and platform access.
          </p>
        )}
      </div>
    </div>
    <StickyProCTA />
  </>);
}