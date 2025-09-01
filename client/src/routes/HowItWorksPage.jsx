import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
export default function HowItWorksPage(){
  return (<>
    <HelmetSEO title="How Fixlo Works" canonicalPathname="/how-it-works" />
    <div className="container">
      <h1>How It Works</h1>
      <div className="grid">
        {[
          {t:'Tell us what you need', d:'Pick a service, share your zip & details.'},
          {t:'We match vetted pros', d:'Background-checked contractors get your request.'},
          {t:'You choose & book', d:'Compare quotes, pick the best fit, and schedule.'},
          {t:'Get updates by SMS', d:'We keep you posted through every step.'}
        ].map(step => (
          <div className="card" key={step.t}>
            <h3>{step.t}</h3>
            <p className="small">{step.d}</p>
          </div>
        ))}
      </div>
    </div>
  </>);
}
