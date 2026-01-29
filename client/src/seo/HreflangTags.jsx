import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * HreflangTags Component
 * Generates hreflang alternate tags for international SEO
 * 
 * Supports 5 countries:
 * - US (en-us) - Default
 * - CA (en-ca) - Canada
 * - UK (en-gb) - United Kingdom
 * - AU (en-au) - Australia
 * - AR (es-ar) - Argentina
 */

// Country configuration for international SEO
const COUNTRIES = [
  { code: 'us', hreflang: 'en-us', pathPrefix: 'us', servicesPath: 'services' },
  { code: 'ca', hreflang: 'en-ca', pathPrefix: 'ca', servicesPath: 'services' },
  { code: 'uk', hreflang: 'en-gb', pathPrefix: 'uk', servicesPath: 'services' },
  { code: 'au', hreflang: 'en-au', pathPrefix: 'au', servicesPath: 'services' },
  { code: 'ar', hreflang: 'es-ar', pathPrefix: 'ar', servicesPath: 'servicios' }
];

/**
 * Generate hreflang alternate URLs for a service page
 * @param {string} service - Service slug (e.g., 'plumbing')
 * @param {string} city - City slug (e.g., 'austin-tx')
 * @returns {Array} Array of hreflang alternate objects
 */
function generateServiceAlternates(service, city) {
  const baseUrl = 'https://www.fixloapp.com';
  const alternates = [];

  COUNTRIES.forEach(country => {
    if (city) {
      // Service + city page: /:country/services/:service/:city
      alternates.push({
        hreflang: country.hreflang,
        href: `${baseUrl}/${country.pathPrefix}/${country.servicesPath}/${service}/${city}`
      });
    } else {
      // Service only page: /:country/services/:service
      alternates.push({
        hreflang: country.hreflang,
        href: `${baseUrl}/${country.pathPrefix}/${country.servicesPath}/${service}`
      });
    }
  });

  // Add x-default (points to US version or homepage)
  alternates.push({
    hreflang: 'x-default',
    href: `${baseUrl}/`
  });

  return alternates;
}

/**
 * HreflangTags component for service pages
 * @param {object} props
 * @param {string} props.service - Service slug
 * @param {string} props.city - City slug (optional)
 */
export default function HreflangTags({ service, city }) {
  // Only generate hreflang for service pages
  if (!service) {
    return null;
  }

  const alternates = generateServiceAlternates(service, city);

  return (
    <Helmet>
      {alternates.map(({ hreflang, href }) => (
        <link
          key={hreflang}
          rel="alternate"
          hrefLang={hreflang}
          href={href}
        />
      ))}
    </Helmet>
  );
}

/**
 * Export helper function for use in other components
 */
export { generateServiceAlternates, COUNTRIES };
