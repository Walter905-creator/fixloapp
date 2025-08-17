import React from 'react';
import { useParams } from 'react-router-dom';
import Seo from '../components/Seo';

export default function ReviewPublic() {
  const { reviewId } = useParams();
  return (
    <main style={{maxWidth:720,margin:'32px auto',padding:'0 16px'}}>
      <Seo 
        path={`/review/public/${reviewId}`}
        title="Customer Review | Fixlo"
        description="Read verified customer reviews for Fixlo home service professionals. Real feedback from real customers."
      />
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