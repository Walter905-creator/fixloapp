import React, { lazy, Suspense } from 'react';
import { useParams, Navigate } from 'react-router-dom';

/**
 * SEO Page Loader with Vite Dynamic Imports
 * Dynamically loads generated SEO pages based on service, city, and language
 */

// Generate all possible SEO page imports using Vite's glob import
const seoPages = import.meta.glob('../pages/services/**/*.jsx');

export default function SEOPageLoader({ lang }) {
  const { service, city } = useParams();
  
  // Validation
  if (!service || !city) {
    return <Navigate to="/services" replace />;
  }
  
  // Build the path to the SEO page component
  const pagePath = lang === 'es'
    ? `../pages/services/${service}/${city}/es.jsx`
    : `../pages/services/${service}/${city}/index.jsx`;
  
  // Check if the SEO page exists
  const pageLoader = seoPages[pagePath];
  
  if (!pageLoader) {
    // SEO page doesn't exist, fall back to generic ServicePage
    console.log('SEO page not found, using fallback:', pagePath);
    return <Navigate to={`/services/${service}/${city || ''}`} replace />;
  }
  
  // Lazy load the component
  const PageComponent = lazy(pageLoader);
  
  return (
    <Suspense fallback={<LoadingFallback service={service} city={city} />}>
      <PageComponent />
    </Suspense>
  );
}

/**
 * Loading fallback component
 */
function LoadingFallback({ service, city }) {
  const serviceName = service?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Service';
  const cityName = city?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'City';
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-slate-50">
      <div className="text-center max-w-md">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Loading {serviceName} in {cityName}
        </h2>
        <p className="text-slate-600">Please wait...</p>
      </div>
    </div>
  );
}
