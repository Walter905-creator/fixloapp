import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
export default function JoinPage(){
  const stripeUrl = import.meta.env.VITE_STRIPE_CHECKOUT_URL;
  async function onSubmit(e){
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get('email') || '';
    if (stripeUrl){
      const url = new URL(stripeUrl);
      if(email) url.searchParams.set('prefilled_email', email);
      window.location.href = url.toString();
    } else {
      alert('Stripe URL not set. Add VITE_STRIPE_CHECKOUT_URL env.');
    }
  }
  return (<>
    <HelmetSEO title="Join Fixlo – Pros" canonicalPathname="/join" />
    <div className="container-xl py-8">
      <h1 className="text-2xl font-extrabold">Join as a Professional</h1>
      <div className="card p-5">
        <form onSubmit={onSubmit} className="space-y-3">
          <div><label className="block text-sm text-slate-300">Full Name</label><input name="name" className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2" required/></div>
          <div><label className="block text-sm text-slate-300">Email</label><input name="email" className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2" type="email" required/></div>
          <div><label className="block text-sm text-slate-300">Phone</label><input name="phone" className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2" required/></div>
          <div><label className="block text-sm text-slate-300">Trade</label>
            <select name="trade" className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2" required>
              {['plumbing','electrical','carpentry','painting','hvac','roofing','landscaping','house-cleaning','junk-removal'].map(t=>(
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div><label className="block text-sm text-slate-300">Date of Birth</label><input name="dob" className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2" type="date" required/></div>
          <div className="flex items-center gap-2">
            <input id="sms" type="checkbox" className="h-4 w-4" required/>
            <label htmlFor="sms" className="text-xs text-slate-400">I agree to receive SMS about job leads. Reply STOP to unsubscribe.</label>
          </div>
          <button className="btn btn-primary">Continue to Stripe</button>
        </form>
      </div>
    </div>
  </>);
}
