import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../lib/api';

export default function ReviewCapture() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewContext, setReviewContext] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    rating: 0,
    text: '',
    homeownerName: ''
  });

  useEffect(() => {
    if (token) {
      loadReviewContext();
    }
  }, [token]);

  const loadReviewContext = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/reviews/magic/${token}`);
      setReviewContext(response.data);
      setFormData(prev => ({
        ...prev,
        homeownerName: response.data.customer?.name || ''
      }));
    } catch (error) {
      console.error('Failed to load review context:', error);
      setError(error.response?.data?.error || 'Failed to load review page');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      alert('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post('/api/reviews/submit-magic', {
        token,
        rating: formData.rating,
        text: formData.text,
        homeownerName: formData.homeownerName
      });
      
      if (response.data.success) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Review submission failed:', error);
      alert(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRatingClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading review page...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <Helmet>
          <title>Review Link - Fixlo</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-6xl mb-4">😞</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Not Found</h1>
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

  if (submitted) {
    return (
      <>
        <Helmet>
          <title>Review Submitted - Thank You!</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
            <p className="text-gray-600 mb-6">
              Your review has been submitted successfully. It helps other homeowners find trusted professionals.
            </p>
            <div className="space-y-3">
              <a 
                href={`/pro/${reviewContext?.pro?.slug}`}
                className="block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View {reviewContext?.pro?.name}'s Profile
              </a>
              <a 
                href="/" 
                className="block px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Return Home
              </a>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!reviewContext) return null;

  return (
    <>
      <Helmet>
        <title>Leave a Review for {reviewContext.pro.name} - Fixlo</title>
        <meta name="description" content={`Share your experience with ${reviewContext.pro.name}, a ${reviewContext.pro.service} professional in ${reviewContext.pro.location}.`} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Leave a Review
              </h1>
              <p className="text-lg text-gray-600">
                How was your experience with <strong>{reviewContext.pro.name}</strong>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {reviewContext.pro.service} • {reviewContext.pro.location}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Overall Rating *
                </label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingClick(star)}
                      className="text-3xl hover:scale-110 transition-transform"
                    >
                      {star <= formData.rating ? (
                        <span className="text-yellow-400">★</span>
                      ) : (
                        <span className="text-gray-300">☆</span>
                      )}
                    </button>
                  ))}
                </div>
                {formData.rating > 0 && (
                  <p className="text-center text-sm text-gray-600 mt-2">
                    {formData.rating === 1 && "Poor"}
                    {formData.rating === 2 && "Fair"}
                    {formData.rating === 3 && "Good"}
                    {formData.rating === 4 && "Very Good"}
                    {formData.rating === 5 && "Excellent"}
                  </p>
                )}
              </div>

              {/* Review Text */}
              <div>
                <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review
                </label>
                <textarea
                  id="text"
                  rows={5}
                  value={formData.text}
                  onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Tell other homeowners about your experience..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Name */}
              <div>
                <label htmlFor="homeownerName" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name (optional)
                </label>
                <input
                  type="text"
                  id="homeownerName"
                  value={formData.homeownerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, homeownerName: e.target.value }))}
                  placeholder="How should we display your name?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank to show as "Verified Customer"
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || formData.rating === 0}
                className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Submitting Review...' : 'Submit Review'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-gray-500">
              Your review will help other homeowners make informed decisions
            </div>
          </div>
        </div>
      </div>
    </>
  );
}