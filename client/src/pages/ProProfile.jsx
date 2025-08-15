import React from 'react';
import { useParams } from 'react-router-dom';
import SEO from '../utils/seo';

export default function ProProfile() {
  const { slug } = useParams();
  const title = `Pro Profile – ${slug} | Fixlo`;
  const canonical = `https://www.fixloapp.com/pro/${slug}`;

  return (
    <main style={{maxWidth:960,margin:'32px auto',padding:'0 16px'}}>
      <SEO title={title} canonical={canonical} url={canonical} />
      <h1>Pro Profile: {slug}</h1>
      <p>Photos, reviews, and shareable links appear here.</p>
      {/* Your existing gallery/reviews can be integrated here; left minimal to avoid breaking */}
    </main>
  );
}