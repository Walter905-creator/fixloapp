import React from 'react';
import { Helmet } from 'react-helmet-async';
import { IS_HOLIDAY_SEASON } from '../utils/config';

/**
 * Schema component for JSON-LD structured data
 * Provides WebSite and Organization schemas for the home page
 */
export default function Schema() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Fixlo",
    "url": "https://www.fixloapp.com/",
    "description": IS_HOLIDAY_SEASON 
      ? "Book trusted professionals for holiday home services, Christmas repairs, seasonal cleaning, and winter emergency services. Servicios del hogar para Navidad."
      : "Book trusted home service professionals for all your repair and maintenance needs.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.fixloapp.com/search?q={query}",
      "query-input": "required name=query"
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Fixlo",
    "url": "https://www.fixloapp.com/",
    "logo": "https://www.fixloapp.com/cover.png",
    "description": IS_HOLIDAY_SEASON
      ? "Professional home services marketplace connecting homeowners with vetted contractors for holiday repairs, Christmas preparations, and seasonal maintenance."
      : "Professional home services marketplace connecting homeowners with vetted contractors."
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
    </Helmet>
  );
}

/**
 * ServiceSchema component for service pages
 * Provides LocalBusiness and Service JSON-LD for service/city pages
 */
export function ServiceSchema({ service, city, country = 'us' }) {
  const serviceName = service ? service.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Home Services';
  const cityName = city ? city.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Your Area';
  
  // Country-specific URL path
  const servicesPath = country === 'ar' ? 'servicios' : 'services';
  
  // Extract state if part of city (e.g., "new-york-ny" -> "New York, NY")
  let displayCity = cityName;
  let state = '';
  
  const serviceDescription = IS_HOLIDAY_SEASON
    ? `Professional ${serviceName.toLowerCase()} services for the holiday season in ${displayCity}. Christmas home repairs, winter emergency services, and seasonal maintenance. Servicios navideños del hogar.`
    : `Professional ${serviceName.toLowerCase()} services in ${displayCity}`;
  
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `Fixlo – ${serviceName} in ${displayCity}${state ? ', ' + state : ''}${IS_HOLIDAY_SEASON ? ' – Holiday Services' : ''}`,
    "description": serviceDescription,
    "url": `https://www.fixloapp.com/${country}/${servicesPath}/${service}${city ? '/' + city : ''}`,
    "image": "https://www.fixloapp.com/cover.png",
    "priceRange": "$$",
    "telephone": "+1-256-488-1814",
    "areaServed": displayCity
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": IS_HOLIDAY_SEASON ? `${serviceName} – Holiday & Seasonal Services` : serviceName,
    "description": serviceDescription,
    "areaServed": displayCity,
    "provider": {
      "@type": "Organization",
      "name": "Fixlo"
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(localBusinessSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(serviceSchema)}
      </script>
    </Helmet>
  );
}
