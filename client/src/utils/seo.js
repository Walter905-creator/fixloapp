import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, image, url, canonical }) {
  const t = title || 'Fixlo – Book Trusted Home Services Near You';
  const d = description || 'Fixlo connects homeowners with trusted pros. Fast, easy, nationwide.';
  const img = image || '/cover.png';
  const u = url || 'https://www.fixloapp.com/';

  return (
    <Helmet>
      <title>{t}</title>
      <meta name="description" content={d} />
      {canonical && <link rel="canonical" href={canonical} />}

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