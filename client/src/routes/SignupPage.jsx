import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { Link } from 'react-router-dom';

export default function SignupPage(){
  return (<>
    <HelmetSEO title="Sign Up | Fixlo" canonicalPathname="/signup" />
    <div className="container-xl py-8">
      <h1 className="text-2xl font-extrabold">Sign Up for Fixlo</h1>
      <div className="grid md:grid-cols-2 gap-8 mt-6">
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">For Homeowners</h2>
          <p className="text-slate-300 mb-4">Get matched with trusted professionals for your home service needs.</p>
          <ul className="space-y-2 text-sm text-slate-300 mb-6">
            <li>✅ Background-checked professionals</li>
            <li>✅ Real-time SMS updates</li>
            <li>✅ Secure payment processing</li>
            <li>✅ AI assistant guidance</li>
          </ul>
          <Link to="/" className="btn btn-primary">Get Started</Link>
        </div>
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">For Professionals</h2>
          <p className="text-slate-300 mb-4">Join our network of trusted home service professionals.</p>
          <ul className="space-y-2 text-sm text-slate-300 mb-6">
            <li>✅ Get quality leads in your area</li>
            <li>✅ Background check included</li>
            <li>✅ Flexible scheduling</li>
            <li>✅ Secure payment processing</li>
          </ul>
          <Link to="/join" className="btn btn-primary">Join as Pro</Link>
        </div>
      </div>
    </div>
  </>);
}