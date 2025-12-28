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
      {/* Breadcrumb Navigation */}
      <nav className="mb-4 text-sm text-slate-600" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <Link to="/" className="hover:text-brand">Home</Link>
          </li>
          <li>&rsaquo;</li>
          <li className="text-slate-900 font-medium">Services</li>
        </ol>
      </nav>
      
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
        {IS_HOLIDAY_SEASON ? 'Holiday Home Services' : 'Professional Home Services Across the United States'}
      </h1>
      
      <div className="prose prose-slate max-w-none mb-8">
        <p className="text-lg text-slate-700">
          {IS_HOLIDAY_SEASON ? (
            <>
              Get your home ready for the holidays! Browse our professional services for Christmas preparations, 
              winter maintenance, and seasonal repairs. 
              <span className="italic text-slate-600"> Servicios para la temporada navideña.</span>
            </>
          ) : (
            <>
              Fixlo connects homeowners with trusted, background-checked professionals for all your home service needs. 
              From emergency repairs to routine maintenance and major projects, find qualified contractors in your area 
              ready to help with plumbing, electrical work, HVAC, cleaning, landscaping, and more.
            </>
          )}
        </p>
      </div>
      
      {/* Trust Indicators */}
      <div className="grid md:grid-cols-3 gap-4 mb-8 p-6 bg-slate-50 rounded-2xl">
        <div className="text-center">
          <div className="text-3xl mb-2">✓</div>
          <div className="font-semibold text-slate-900">Background Checked</div>
          <div className="text-sm text-slate-600">All professionals screened</div>
        </div>
        <div className="text-center">
          <div className="text-3xl mb-2">🇺🇸</div>
          <div className="font-semibold text-slate-900">Nationwide Coverage</div>
          <div className="text-sm text-slate-600">Serving all 50 states</div>
        </div>
        <div className="text-center">
          <div className="text-3xl mb-2">💰</div>
          <div className="font-semibold text-slate-900">No Hidden Fees</div>
          <div className="text-sm text-slate-600">Free for homeowners</div>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Browse All Services</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {list.map(name => (
          <div key={name} className="card p-5">
            <div className="text-lg font-semibold">{name}</div>
            <div className="text-sm text-slate-600 mt-2">
              Find trusted {name.toLowerCase()} professionals near you
            </div>
            <div className="mt-3"><Link to={`/services/${name.toLowerCase().replace(/\s+/g,'-')}`} className="btn btn-primary">View Service</Link></div>
          </div>
        ))}
      </div>
      
      {/* Popular Cities Section */}
      <div className="mt-12 card p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Popular Service Locations</h2>
        <p className="text-slate-600 mb-6">
          Find home service professionals in major cities across the United States
        </p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
          {['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 
            'San Antonio', 'San Diego', 'Dallas', 'Austin', 'Miami', 'Seattle', 
            'Denver', 'Atlanta', 'Boston', 'Charlotte'].map(city => (
            <Link 
              key={city} 
              to={`/services/plumbing/${city.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-brand hover:underline"
            >
              {city}
            </Link>
          ))}
        </div>
      </div>
    </div>
    <StickyProCTA />
  </>);
}
