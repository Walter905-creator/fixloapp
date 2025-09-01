import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { Link } from 'react-router-dom';
import list from '../data/services.json';
export default function ServicesPage(){
  return (<>
    <HelmetSEO title="Services | Fixlo" canonicalPathname="/services" />
    <div className="container-xl py-8">
      <h1 className="text-2xl font-extrabold">Services</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {list.map(name => (
          <div key={name} className="card p-5">
            <div className="text-lg font-semibold">{name}</div>
            <div className="mt-3"><Link to={`/services/${name.toLowerCase().replace(/\s+/g,'-')}`} className="btn btn-primary">Open</Link></div>
          </div>
        ))}
      </div>
    </div>
  </>);
}
