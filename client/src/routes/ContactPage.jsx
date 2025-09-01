import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
export default function ContactPage(){
  return (<>
    <HelmetSEO title="Contact | Fixlo" canonicalPathname="/contact" />
    <div className="container">
      <h1>Contact</h1>
      <div className="card">
        <p>Email: support@fixloapp.com</p>
        <p>SMS: +1 256-488-1814</p>
        <p className="small">Response within 1 business day.</p>
      </div>
    </div>
  </>);
}
