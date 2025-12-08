import React from 'react';
import { Helmet } from 'react-helmet-async';
import { buildCanonical } from '../utils/seo';
import { IS_HOLIDAY_SEASON } from '../utils/config';

const defaultDescription = IS_HOLIDAY_SEASON 
  ? 'Fixlo connects homeowners with trusted pros for holiday home services—plumbing, electrical, Christmas light installation, holiday cleaning, seasonal repairs & more. Get your home ready for the holidays!'
  : 'Fixlo connects homeowners with trusted pros—plumbing, electrical, junk removal & more.';

export default function HelmetSEO({ 
  title, 
  description = defaultDescription, 
  canonicalPathname, 
  robots = 'index, follow', 
  image = 'https://www.fixloapp.com/cover.png',
  structuredData 
}) {
  const canonical = buildCanonical(canonicalPathname || (typeof window !== 'undefined' ? window.location.pathname : '/'));
  
  return (
    <Helmet>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} />
      {title && <meta property="og:title" content={title} />}
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Fixlo" />
      {image && <meta property="og:image" content={image} />}
      {image && <meta property="og:image:width" content="1200" />}
      {image && <meta property="og:image:height" content="630" />}
      <meta name="twitter:card" content="summary_large_image" />
      {title && <meta name="twitter:title" content={title} />}
      {description && <meta name="twitter:description" content={description} />}
      {image && <meta name="twitter:image" content={image} />}
      {structuredData && <script type="application/ld+json">{JSON.stringify(structuredData)}</script>}
    </Helmet>
  );
}
