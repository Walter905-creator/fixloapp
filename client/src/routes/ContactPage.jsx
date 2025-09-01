import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
export default function ContactPage(){
  return (<>
    <HelmetSEO title="Contact | Fixlo" canonicalPathname="/contact" />
    <div className="container-xl py-8">
      <h1 className="text-2xl font-extrabold">Contact</h1>
      <div className="card p-5">
        <p>Email: support@fixloapp.com</p>
        <p>SMS: +1 256-488-1814</p>
        <p className="text-sm text-slate-400">Response within 1 business day.</p>
      </div>
    </div>
  </>);
}
