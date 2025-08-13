import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Badges from '../components/profile/Badges';
import BoostPill from '../components/profile/BoostPill';
import ReviewsBlock from '../components/reviews/ReviewsBlock';
import ShareProfileButton from '../components/share/ShareProfileButton';
import { useFeatureFlags } from '../utils/featureFlags';
import api from '../lib/api';

export default function PublicProfile({ slug }) {
  const [pro, setPro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const featureFlags = useFeatureFlags();

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError(null);
      
      try {
        const { data } = await api.get(`/api/profiles/slug/${slug}`);
        setPro(data);
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError(err.response?.status === 404 ? 'Profile not found' : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    
    if (slug) {
      loadProfile();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{error}</h1>
          <p className="text-gray-600 mb-6">
            {error === 'Profile not found' 
              ? 'This professional profile could not be found.' 
              : 'Please try again later.'}
          </p>
          <a 
            href="/" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  if (!pro) return null;

  const displayName = pro.businessName || `${pro.firstName || ''} ${pro.lastName || ''}`.trim() || pro.name;
  const location = [pro.city, pro.state].filter(Boolean).join(', ');
  const service = pro.primaryService || pro.trade;

  return (
    <>
      <Helmet>
        <title>{displayName} - Professional on Fixlo</title>
        <meta name="description" content={`${displayName} is a verified ${service} professional in ${location}. Book trusted home services on Fixlo.`} />
        <meta property="og:title" content={`${displayName} - Professional on Fixlo`} />
        <meta property="og:description" content={`${displayName} is a verified ${service} professional in ${location}. Book trusted home services on Fixlo.`} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={`https://www.fixloapp.com/pro/${slug}`} />
        <meta property="og:image" content={`https://www.fixloapp.com/api/og?slug=${encodeURIComponent(slug)}`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${displayName} - Professional on Fixlo`} />
        <meta name="twitter:description" content={`${displayName} is a verified ${service} professional in ${location}. Book trusted home services on Fixlo.`} />
        <meta name="twitter:image" content={`https://www.fixloapp.com/api/og?slug=${encodeURIComponent(slug)}`} />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
          {/* Header Section */}
          <header className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                    {displayName}
                  </h1>
                  {location && (
                    <p className="text-lg text-gray-600 mt-2">
                      {service && `${service} • `}{location}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <Badges badges={pro.badges || []} featureFlags={featureFlags} />
                  {featureFlags.boostIndicator && <BoostPill boostActiveUntil={pro.boostActiveUntil} />}
                </div>

                {(pro.avgRating > 0 || pro.reviewCount > 0) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${
                            star <= (pro.avgRating || 0) ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="font-medium">
                      {(pro.avgRating || 0).toFixed(1)} 
                    </span>
                    <span>({pro.reviewCount || 0} reviews)</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {featureFlags.shareProfile && (
                  <ShareProfileButton 
                    pro={pro} 
                    onShareSuccess={(data) => {
                      // Update the boost status when share is successful
                      setPro(prev => ({
                        ...prev,
                        boostActiveUntil: data.boostActiveUntil,
                        badges: data.badges
                      }));
                    }}
                  />
                )}
                <a 
                  href="/request" 
                  className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Request a Quote
                </a>
                <a 
                  href="/contact" 
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Contact
                </a>
              </div>
            </div>
          </header>

          {/* Services/Portfolio Section - Placeholder */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Services</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-2">{service}</h3>
                <p className="text-sm text-gray-600">
                  Professional {service} services in {location || 'your area'}.
                </p>
              </div>
              {/* Future: Add more service cards, portfolio images, etc. */}
            </div>
          </section>

          {/* Reviews Section */}
          <ReviewsBlock pro={pro} />

          {/* CTA Section */}
          <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Ready to work with {displayName}?
            </h2>
            <p className="text-lg text-blue-100 mb-6">
              Get a free quote for your {service} project today.
            </p>
            <a 
              href="/request" 
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            >
              Get Your Free Quote
            </a>
          </section>
        </div>
      </div>
    </>
  );
}