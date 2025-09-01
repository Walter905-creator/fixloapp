import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
export default function PricingPage(){
  return (<>
    <HelmetSEO title="Pricing | Fixlo" canonicalPathname="/pricing" />
    <div className="container-xl py-8">
      <h1 className="text-2xl font-extrabold">Pricing</h1>
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div className="card p-5">
          <h3 className="font-semibold">Homeowners</h3>
          <p className="text-sm text-slate-400">Free to request quotes. Pay pros directly after the job.</p>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold">Pros</h3>
          <p><strong>$59.99/month</strong> subscription for job leads & dashboard access.</p>
          <button className="btn btn-primary mt-2" onClick={()=>alert('Connect Stripe Checkout URL here')}>Subscribe</button>
        </div>
      </div>
    </div>
  </>);
}
