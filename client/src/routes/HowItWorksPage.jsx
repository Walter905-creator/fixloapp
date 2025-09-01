import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
export default function HowItWorksPage(){
  return (<>
    <HelmetSEO title="How Fixlo Works" canonicalPathname="/how-it-works" />
    <div className="container-xl py-8">
      <h1 className="text-2xl font-extrabold">How It Works</h1>
      <div className="grid md:grid-cols-4 gap-4 mt-4">
        {[
          {t:'Tell us what you need', d:'Pick a service, share your zip & details.'},
          {t:'We match vetted pros', d:'Background-checked contractors get your request.'},
          {t:'You choose & book', d:'Compare quotes, pick the best fit, and schedule.'},
          {t:'Get updates by SMS', d:'We keep you posted through every step.'}
        ].map(step => (
          <div key={step.t} className="card p-5">
            <h3 className="font-semibold">{step.t}</h3>
            <p className="text-sm text-slate-400">{step.d}</p>
          </div>
        ))}
      </div>
    </div>
  </>);
}
