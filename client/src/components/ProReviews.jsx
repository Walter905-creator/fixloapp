import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProReviews = ({ professional }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchReviews();
  }, [professional.id, sortBy, page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/reviews/professional/${professional.id}`, {
        params: { page, sortBy }
      });

      if (response.data.success) {
        setReviews(response.data.reviews);
        setStats(response.data.stats);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      setError('Failed to fetch reviews');
      console.error('Reviews fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setPage(1); // Reset to first page when sorting changes
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`text-lg ${
          index < rating ? 'text-yellow-400' : 'text-gray-300'
        }`}
      >
        ★
      </span>
    ));
  };

  const renderRatingBar = (rating, count) => {
    const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
    
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600 w-8">{rating}★</span>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-yellow-400 h-2 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 w-8">{count}</span>
      </div>
    );
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-lg">Loading reviews...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Customer Reviews</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Reviews Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <div className="text-4xl font-bold text-gray-800 mb-2">
              {stats.averageRating || 0}
            </div>
            <div className="flex justify-center mb-2">
              {renderStars(Math.round(stats.averageRating || 0))}
            </div>
            <div className="text-sm text-gray-600">
              Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => 
              renderRatingBar(rating, stats.ratingBreakdown[rating] || 0)
            )}
          </div>
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          All Reviews ({stats.totalReviews})
        </h3>
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Rating</option>
          <option value="lowest">Lowest Rating</option>
        </select>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">No reviews yet</div>
          <p className="text-gray-400">
            Complete some projects and ask your satisfied customers to leave reviews!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review._id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center mb-2">
                    <span className="font-semibold text-gray-800 mr-3">
                      {review.homeownerName}
                    </span>
                    <div className="flex">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(review.createdAt)}
                    {review.serviceType && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {review.serviceType}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{review.reviewText}</p>

              {review.professionalResponse && (
                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                  <div className="text-sm font-semibold text-gray-800 mb-2">
                    Response from {professional.name}:
                  </div>
                  <p className="text-gray-700 text-sm">{review.professionalResponse}</p>
                  <div className="text-xs text-gray-500 mt-2">
                    {formatDate(review.responseDate)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-2 text-sm rounded-md ${
                  page === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            ))}
            
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.totalPages}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">💡 Getting More Reviews</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Ask satisfied customers to leave reviews after completing work</li>
          <li>• Provide excellent customer service and quality workmanship</li>
          <li>• Follow up with customers a few days after project completion</li>
          <li>• Share your Fixlo profile link with customers</li>
          <li>• Respond professionally to all reviews, including negative ones</li>
        </ul>
      </div>
    </div>
  );
};

export default ProReviews;