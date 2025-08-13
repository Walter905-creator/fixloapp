import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../lib/api';

export default function PublicReview() {
  const { reviewId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewData, setReviewData] = useState(null);

  useEffect(() => {
    if (reviewId) {
      loadReview();
    }
  }, [reviewId]);

  const loadReview = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/reviews/public/${reviewId}`);
      setReviewData(response.data);
    } catch (error) {
      console.error('Failed to load review:', error);
      setError(error.response?.data?.error || 'Review not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading review...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <Helmet>
          <title>Review Not Found - Fixlo</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-6xl mb-4">😞</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Review Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <a 
              href="/" 
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return Home
            </a>
          </div>
        </div>
      </>
    );
  }

  if (!reviewData) return null;

  const { review, pro, schema } = reviewData;

  return (
    <>
      <Helmet>
        <title>{review.authorName || 'Customer'} Review for {pro.name} - Fixlo</title>
        <meta name="description" content={`${review.rating}-star review: "${review.text}" - ${pro.name}, ${pro.service} professional in ${pro.location}.`} />
        <meta property="og:title" content={`Customer Review for ${pro.name}`} />
        <meta property="og:description" content={`${review.rating}-star review for ${pro.service} services in ${pro.location}`} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://www.fixloapp.com/review/public/${review.id}`} />
        
        {/* Schema.org structured data for search engines */}
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              <li><a href="/" className="hover:text-blue-600">Home</a></li>
              <li className="text-gray-400">/</li>
              <li><a href={`/pro/${pro.slug}`} className="hover:text-blue-600">{pro.name}</a></li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900">Customer Review</li>
            </ol>
          </nav>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Customer Review
              </h1>
              <p className="text-lg text-gray-600">
                Review for <a href={`/pro/${pro.slug}`} className="text-blue-600 hover:text-blue-800 font-semibold">{pro.name}</a>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {pro.service} • {pro.location}
              </p>
            </div>

            {/* Review Content */}
            <div className="space-y-6">
              {/* Rating */}
              <div className="flex items-center gap-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-6 h-6 ${
                        star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {review.rating}.0
                </span>
                <span className="text-sm text-gray-500">
                  out of 5 stars
                </span>
              </div>

              {/* Review Text */}
              {review.text && (
                <blockquote className="text-lg text-gray-700 italic border-l-4 border-blue-500 pl-4 py-2">
                  "{review.text}"
                </blockquote>
              )}

              {/* Author and Date */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {(review.authorName || 'C')[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {review.authorName || 'Verified Customer'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Verified customer
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Professional CTA */}
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 sm:p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">
              Work with {pro.name}
            </h2>
            <p className="text-lg text-blue-100 mb-6">
              Get your free quote for {pro.service} services today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href={`/pro/${pro.slug}`}
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                View Profile
              </a>
              <a 
                href="/request" 
                className="inline-flex items-center justify-center px-6 py-3 border border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
              >
                Get Quote
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}