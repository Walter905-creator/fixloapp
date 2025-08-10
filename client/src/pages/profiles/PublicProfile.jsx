import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Badges from '../../components/profile/Badges';
import BoostPill from '../../components/profile/BoostPill';
import Stars from '../../components/reviews/Stars';
import ReviewFormModal from '../../components/reviews/ReviewFormModal';
import api from '../../lib/api';

export default function PublicProfile() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [pro, setPro] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!slug) return;
      
      try {
        setLoading(true);
        
        // Load professional profile
        const { data: proData } = await api.get(`/api/profiles/slug/${slug}`);
        setPro(proData);
        
        // Load reviews for this professional
        try {
          const { data: reviewData } = await api.get(`/api/profiles/${proData._id}/reviews`);
          if (reviewData.ok) {
            setReviews(reviewData.items || []);
          }
        } catch (reviewError) {
          console.error('Failed to load reviews:', reviewError);
          // Continue without reviews
        }
        
      } catch (error) {
        console.error('Failed to load profile:', error);
        setError('Professional profile not found');
      } finally {
        setLoading(false);
      }
    }
    
    loadProfile();
  }, [slug]);

  const handleReviewSubmitted = () => {
    // Reload reviews after new review is submitted
    if (pro?._id) {
      api.get(`/api/profiles/${pro._id}/reviews`)
        .then(({ data }) => {
          if (data.ok) {
            setReviews(data.items || []);
          }
        })
        .catch(console.error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Profile Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!pro) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {pro.businessName || `${pro.firstName || ''} ${pro.lastName || ''}`.trim() || pro.name}
              </h1>
              
              <div className="text-lg text-gray-600 mb-3">
                {pro.primaryService || pro.trade} Professional
              </div>
              
              {pro.city && pro.state && (
                <div className="text-gray-500 mb-3">
                  📍 {pro.city}, {pro.state}
                </div>
              )}
              
              <div className="flex items-center gap-2 mb-4">
                <Stars value={pro.avgRating || pro.rating || 0} size={20} />
                <span className="text-lg font-semibold">
                  {(pro.avgRating || pro.rating || 0).toFixed(1)}
                </span>
                <span className="text-gray-500">
                  ({pro.reviewCount || 0} reviews)
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Badges badges={pro.badges} />
                <BoostPill boostActiveUntil={pro.boostActiveUntil} />
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => setShowReviewForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Leave a Review
              </button>
              <a 
                href="/pro-dashboard" 
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                I'm the pro
              </a>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Reviews</h2>
          
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-gray-900">
                        {review.homeownerName || 'Anonymous'}
                      </div>
                      {review.homeownerCity && (
                        <div className="text-sm text-gray-500">{review.homeownerCity}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Stars value={review.rating} size={16} />
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {review.text && (
                    <p className="text-gray-700 text-sm">{review.text}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No reviews yet.</p>
              <button
                onClick={() => setShowReviewForm(true)}
                className="mt-2 text-blue-600 hover:text-blue-800 underline"
              >
                Be the first to leave a review!
              </button>
            </div>
          )}
        </div>

        {/* Contact/Booking Section */}
        <div className="bg-blue-50 rounded-lg p-6 text-center">
          <h3 className="text-xl font-bold text-blue-900 mb-2">
            Ready to book {pro.businessName || pro.firstName || pro.name}?
          </h3>
          <p className="text-blue-700 mb-4">
            Get in touch to discuss your {pro.primaryService || pro.trade} needs.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Book Now
          </button>
        </div>
      </div>

      {/* Review Form Modal */}
      <ReviewFormModal
        isOpen={showReviewForm}
        onClose={() => setShowReviewForm(false)}
        onSubmitted={handleReviewSubmitted}
        proId={pro._id}
      />
    </div>
  );
}