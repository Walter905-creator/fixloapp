import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
export default function JoinPage(){
  const stripeUrlRaw = import.meta.env.VITE_STRIPE_CHECKOUT_URL;

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
    <HelmetSEO title="Join Fixlo – Pros" canonicalPathname="/join" />
    <div className="container-xl py-8">
      <h1 className="text-2xl font-extrabold">Join as a Professional</h1>
      <div className="card p-6">
        <form onSubmit={onSubmit} className="space-y-3">
          <div><label className="block text-sm text-slate-800">Full Name</label><input name="name" className="mt-1 w-full rounded-xl" required/></div>
          <div><label className="block text-sm text-slate-800">Email</label><input name="email" className="mt-1 w-full rounded-xl" type="email" required/></div>
          <div><label className="block text-sm text-slate-800">Phone</label><input name="phone" className="mt-1 w-full rounded-xl" required/></div>
          <div><label className="block text-sm text-slate-800">Trade</label>
            <select name="trade" className="mt-1 w-full rounded-xl" required>
              {['plumbing','electrical','carpentry','painting','hvac','roofing','landscaping','house-cleaning','junk-removal'].map(t=>(
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div><label className="block text-sm text-slate-800">Date of Birth</label><input name="dob" className="mt-1 w-full rounded-xl" type="date" required/></div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input id="sms" type="checkbox" className="rounded" required/>
            I agree to receive SMS about job leads. Reply STOP to unsubscribe.
          </label>
          <button className="btn-primary w-full">Continue to Stripe</button>
        </form>
      </div>
    </div>
  </>);
}
