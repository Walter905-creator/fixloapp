import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import Stars from './Stars';
import ReviewFormModal from './ReviewFormModal';

export default function ReviewsBlock({ pro }) {
  const [modal, setModal] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  const load = async (p = page) => {
    if (!pro?._id) return;
    
    setLoading(true);
    try {
      const { data } = await api.get(`/api/profiles/${pro._id}/reviews?page=${p}&pageSize=${pageSize}`);
      if (data?.ok) {
        setItems(data.items);
        setTotal(data.total);
        setPage(data.page);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pro?._id) {
      load(1);
    }
  }, [pro?._id]);

  const handleReviewSubmitted = () => {
    // Reload reviews after submission
    load(1);
    setModal(false);
  };

  if (!pro) return null;

  return (
    <div className="rounded-2xl border border-gray-200 p-6 space-y-6 bg-white">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="text-xl font-semibold text-gray-900">Reviews</div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Stars value={pro.avgRating || 0} size={18} />
            <span className="font-medium">
              {(pro.avgRating ?? 0).toFixed ? pro.avgRating.toFixed(1) : (pro.avgRating || 0)} stars
            </span>
            <span>•</span>
            <span>{pro.reviewCount || 0} reviews</span>
          </div>
        </div>
        <button 
          onClick={() => setModal(true)} 
          className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
        >
          Write a Review
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading reviews...</div>
      ) : (
        <div className="space-y-4">
          {items.map((review, idx) => (
            <div key={review._id || idx} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="font-medium text-gray-900">
                    {review.homeownerName || 'Homeowner'}
                  </div>
                  {review.homeownerCity && (
                    <>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{review.homeownerCity}</span>
                    </>
                  )}
                </div>
                <Stars value={review.rating} size={16} />
              </div>
              
              {review.text && (
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mb-3">
                  {review.text}
                </p>
              )}
              
              <div className="text-xs text-gray-500">
                {new Date(review.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          ))}

          {!items.length && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-lg mb-2">No reviews yet</div>
              <div className="text-sm">Be the first to leave a review!</div>
            </div>
          )}
        </div>
      )}

      {total > pageSize && (
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <button 
            disabled={page <= 1 || loading} 
            onClick={() => load(page - 1)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {Math.ceil(total / pageSize)}
          </span>
          <button 
            disabled={page * pageSize >= total || loading} 
            onClick={() => load(page + 1)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {modal && (
        <ReviewFormModal 
          proId={pro._id} 
          onClose={() => setModal(false)} 
          onSubmitted={handleReviewSubmitted}
          isOpen={modal}
        />
      )}
    </div>
  );
}