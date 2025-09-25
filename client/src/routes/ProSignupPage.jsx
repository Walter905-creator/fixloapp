import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { STRIPE_CHECKOUT_URL } from '../utils/config';
import ProValueBanner from '../components/ProValueBanner';
import StickyProCTA from '../components/StickyProCTA';

export default function ProSignupPage(){
  const stripeUrlRaw = STRIPE_CHECKOUT_URL;

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
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input id="sms-consent" type="checkbox" className="rounded mt-0.5" required/>
            I agree to receive SMS notifications about job leads and account updates. Reply STOP to unsubscribe at any time.
          </label>
          <button type="submit" className="btn-primary w-full">
            Continue to Payment & Background Check
          </button>
        </form>
        <p className="text-xs text-slate-600 mt-4 text-center">
          $29.99/month subscription includes background check, lead notifications, and platform access.
        </p>
      </div>
    </div>
    <StickyProCTA />
  </>);
}