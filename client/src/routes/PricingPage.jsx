import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
export default function PricingPage(){
  return (<>
    <HelmetSEO title="Pricing | Fixlo" canonicalPathname="/pricing" />
    <div className="container">
      <h1>Pricing</h1>
      <div className="grid">
        <div className="card">
          <h3>Homeowners</h3>
          <p className="small">Free to request quotes. Pay pros directly after the job.</p>
        </div>
        <div className="card">
          <h3>Pros</h3>
          <p><strong>$59.99/month</strong> subscription for job leads & dashboard access.</p>
          <button className="btn" onClick={()=>alert('Connect Stripe Checkout URL here')}>Subscribe</button>
        </div>
      </div>
    </div>
  </>);
}
