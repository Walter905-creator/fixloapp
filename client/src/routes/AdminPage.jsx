import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
export default function AdminPage(){
  return (<>
    <HelmetSEO title="Admin | Fixlo" canonicalPathname="/admin" robots="noindex, nofollow" />
    <div className="container-xl py-8">
      <h1 className="text-2xl font-extrabold">Admin</h1>
      <div className="card p-5"><p className="text-sm text-slate-400">Admin UI placeholder. Protect behind auth in production.</p></div>
    </div>
  </>);
}
