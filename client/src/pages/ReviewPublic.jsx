import React from 'react';
import { useParams } from 'react-router-dom';
import SEO from '../utils/seo';

export default function ReviewPublic() {
  const { reviewId } = useParams();
  const canonical = `https://www.fixloapp.com/review/public/${reviewId}`;
  return (
    <main style={{maxWidth:720,margin:'32px auto',padding:'0 16px'}}>
      <SEO title="Customer Review – Fixlo" canonical={canonical} url={canonical} />
      <h1>Customer Review</h1>
      <p>Review ID: {reviewId}</p>
      {/* Render structured data if you have it */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
        "@context":"https://schema.org",
        "@type":"Review",
        "itemReviewed":{"@type":"LocalBusiness","name":"Fixlo Pro"},
        "reviewRating":{"@type":"Rating","ratingValue":"5","bestRating":"5"},
        "author":{"@type":"Person","name":"Verified Customer"}
      })}} />
    </main>
  );
}