import React from 'react';
import { Helmet } from 'react-helmet-async';
import { buildCanonical } from '../utils/seo';
export default function HelmetSEO({ title, description='Fixlo connects homeowners with trusted pros—plumbing, electrical, junk removal & more.', canonicalPathname, robots='index, follow', image=`${typeof window!=='undefined'?window.location.origin:'https://www.fixloapp.com'}/cover.png`, structuredData }){
  const canonical = buildCanonical(canonicalPathname || (typeof window!=='undefined'?window.location.pathname:'/'));
  return (<Helmet>
    {title && <title>{title}</title>}
    {description && <meta name="description" content={description} />}
    <meta name="robots" content={robots} />
    <link rel="canonical" href={canonical} />
    {title && <meta property="og:title" content={title} />}
    {description && <meta property="og:description" content={description} />}
    <meta property="og:url" content={canonical} />
    <meta property="og:type" content="website" />
    {image && <meta property="og:image" content={image} />}
    <meta name="twitter:card" content="summary_large_image" />
    {title && <meta name="twitter:title" content={title} />}
    {description && <meta name="twitter:description" />}
    {image && <meta name="twitter:image" content={image} />}
    {structuredData && <script type="application/ld+json">{JSON.stringify(structuredData)}</script>}
  </Helmet>);
}
