import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
export default function ProDashboardPage(){
  return (<>
    <HelmetSEO title="Pro Dashboard | Fixlo" canonicalPathname="/pro/dashboard" />
    <div className="container-xl py-8">
      <h1 className="text-2xl font-extrabold">Pro Dashboard</h1>
      <div className="card p-5">
        <p className="text-sm text-slate-400">View leads, manage subscription, update profile. (Demo)</p>
      </div>
    </div>
  </>);
}
