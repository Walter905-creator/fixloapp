import React from 'react';
import { useParams } from 'react-router-dom';
import Seo from '../components/Seo';

export default function ProProfile() {
  const { slug } = useParams();
  const title = `${slug} | Professional Profile | Fixlo`;

  return (
    <main style={{maxWidth:960,margin:'32px auto',padding:'0 16px'}}>
      <Seo 
        path={`/pro/${slug}`}
        title={title}
        description={`View ${slug}'s professional profile, reviews, and portfolio on Fixlo. Book trusted home services from verified professionals.`}
      />
      <h1>Pro Profile: {slug}</h1>
      <p>Photos, reviews, and shareable links appear here.</p>
      {/* Your existing gallery/reviews can be integrated here; left minimal to avoid breaking */}
    </main>
  );
}