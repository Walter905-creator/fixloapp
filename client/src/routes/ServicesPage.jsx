import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import { Link } from 'react-router-dom';
import list from '../data/services.json';
import StickyProCTA from '../components/StickyProCTA';
import { IS_HOLIDAY_SEASON } from '../utils/config';

const pageTitle = IS_HOLIDAY_SEASON 
  ? "Holiday Home Services | Christmas Repairs & Seasonal Maintenance | Fixlo"
  : "Services | Fixlo";

const pageDescription = IS_HOLIDAY_SEASON
  ? "Browse holiday home services: Christmas cleaning, light installation, winter repairs, seasonal maintenance, and emergency services. Servicios del hogar para la temporada navideña."
  : "Browse all available home services on Fixlo";

export default function ServicesPage(){
  return (<>
    <HelmetSEO title={pageTitle} description={pageDescription} canonicalPathname="/services" />
    <div className="container-xl py-8">
      <h1 className="text-2xl font-extrabold">
        {IS_HOLIDAY_SEASON ? 'Holiday Home Services' : 'Services'}
      </h1>
      {IS_HOLIDAY_SEASON && (
        <p className="mt-3 text-lg text-slate-700">
          Get your home ready for the holidays! Browse our professional services for Christmas preparations, 
          winter maintenance, and seasonal repairs. 
          <span className="italic text-slate-600"> Servicios para la temporada navideña.</span>
        </p>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {list.map(name => (
          <div key={name} className="card p-5">
            <div className="text-lg font-semibold">{name}</div>
            <div className="mt-3"><Link to={`/services/${name.toLowerCase().replace(/\s+/g,'-')}`} className="btn btn-primary">Open</Link></div>
          </div>
        ))}
      </div>
    </div>
    <StickyProCTA />
  </>);
}
