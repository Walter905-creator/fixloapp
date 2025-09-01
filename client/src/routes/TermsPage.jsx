import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
export default function TermsPage(){
  return (<>
    <HelmetSEO title="Terms | Fixlo" canonicalPathname="/terms" />
    <div className="container-xl py-8">
      <h1 className="text-2xl font-extrabold">Terms</h1>
      <div className="card p-5"><p className="text-sm text-slate-400">Add your terms here.</p></div>
    </div>
  </>);
}
