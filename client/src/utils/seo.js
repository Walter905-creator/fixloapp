import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

export default function SEO({ title, description, image, url, canonical }) {
  const location = useLocation();
  
  const t = title || 'Fixlo – Book Trusted Home Services Near You';
  const d = description || 'Fixlo connects homeowners with trusted pros. Fast, easy, nationwide.';
  const img = image || '/cover.png';
  const u = url || 'https://www.fixloapp.com/';
  
  // Generate canonical URL based on current route if not explicitly provided
  const getCurrentCanonical = () => {
    if (canonical) return canonical;
    
    const pathname = location.pathname;
    // Remove trailing slash except for root
    const cleanPath = pathname.endsWith('/') && pathname !== '/' 
      ? pathname.slice(0, -1) 
      : pathname;
    return `https://www.fixloapp.com${cleanPath}`;
  };
  
  const canonicalUrl = getCurrentCanonical();

  return (
    <Helmet>
      <title>{t}</title>
      <meta name="description" content={d} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:title" content={t} />
      <meta property="og:description" content={d} />
      <meta property="og:image" content={img} />
      <meta property="og:url" content={u} />
      <meta property="og:type" content="website" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={t} />
      <meta name="twitter:description" content={d} />
      <meta name="twitter:image" content={img} />
    </Helmet>
  );
}