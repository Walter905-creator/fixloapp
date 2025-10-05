import React from 'react';
import { Helmet } from 'react-helmet-async';

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
    "logo": "https://www.fixloapp.com/cover.png"
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
export function ServiceSchema({ service, city }) {
  const serviceName = service ? service.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Home Services';
  const cityName = city ? city.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Your Area';
  
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `Fixlo ${serviceName} Services`,
    "description": `Professional ${serviceName.toLowerCase()} services in ${cityName}`,
    "url": `https://www.fixloapp.com/services/${service}${city ? '/' + city : ''}`,
    "areaServed": {
      "@type": "City",
      "name": cityName
    }
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": serviceName,
    "provider": {
      "@type": "Organization",
      "name": "Fixlo"
    },
    "areaServed": {
      "@type": "City",
      "name": cityName
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
