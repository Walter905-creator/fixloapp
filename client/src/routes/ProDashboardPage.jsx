import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
export default function ProDashboardPage(){
  return (<>
    <HelmetSEO title="Pro Dashboard | Fixlo" canonicalPathname="/pro/dashboard" />
    <div className="container">
      <h1>Pro Dashboard</h1>
      <div className="card">
        <p className="small">View leads, manage subscription, update profile. (Demo)</p>
      </div>
    </div>
  </>);
}
