import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
export default function AdminPage(){
  return (<>
    <HelmetSEO title="Admin | Fixlo" canonicalPathname="/admin" robots="noindex, nofollow" />
    <div className="container">
      <h1>Admin</h1>
      <div className="card">
        <p className="small">Admin UI placeholder. Protect behind auth in production.</p>
      </div>
    </div>
  </>);
}
