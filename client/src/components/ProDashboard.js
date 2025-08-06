import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PhotoGallery from './PhotoGallery';
import ReviewList from './ReviewList';

const ProDashboard = () => {
  const [proData, setProData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingProfile, setUploadingProfile] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('proToken');
    if (!token) {
      window.location.href = '/pro/signin';
      return;
    }

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('proToken');
      const response = await axios.get('/api/pros/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setProData(response.data.pro);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('proToken');
        localStorage.removeItem('proData');
        window.location.href = '/pro/signin';
      } else {
        setError('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingProfile(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const token = localStorage.getItem('proToken');
      const response = await axios.post('/api/pros/upload/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      setProData({
        ...proData,
        profileImage: response.data.profileImage
      });
    } catch (error) {
      setError('Failed to upload profile image');
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleGalleryUpdate = (newGallery) => {
    setProData({
      ...proData,
      gallery: newGallery
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('proToken');
    localStorage.removeItem('proData');
    window.location.href = '/';
  };

  const getTradeDisplayName = (trade) => {
    return trade.charAt(0).toUpperCase() + trade.slice(1).replace('_', ' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img
                className="h-8 w-auto"
                src="./assets/fixlo-logo.png"
                alt="Fixlo"
              />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">
                Professional Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {proData?.name}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Profile Overview */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-6">
            <div className="flex items-center">
              <div className="relative">
                {proData?.profileImage ? (
                  <img
                    className="h-20 w-20 rounded-full object-cover"
                    src={proData.profileImage}
                    alt="Profile"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center">
                    <svg className="h-8 w-8 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 cursor-pointer hover:bg-blue-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageUpload}
                    disabled={uploadingProfile}
                    className="sr-only"
                  />
                </label>
              </div>
              <div className="ml-6">
                <h2 className="text-xl font-semibold text-gray-900">{proData?.name}</h2>
                <p className="text-gray-600">{getTradeDisplayName(proData?.trade || '')}</p>
                <p className="text-sm text-gray-500">{proData?.location?.address}</p>
                <div className="flex items-center mt-2">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }, (_, index) => (
                      <svg
                        key={index}
                        className={`h-4 w-4 ${
                          index < Math.floor(proData?.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-1 text-sm text-gray-600">
                      {proData?.rating || 0} ({proData?.completedJobs || 0} jobs)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 bg-blue-500 rounded-md">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completed Jobs
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {proData?.completedJobs || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 bg-yellow-500 rounded-md">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Average Rating
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {proData?.rating ? proData.rating.toFixed(1) : '0.0'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`flex items-center justify-center h-8 w-8 rounded-md ${
                  proData?.isActive ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Account Status
                  </dt>
                  <dd className={`text-lg font-medium ${
                    proData?.isActive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {proData?.isActive ? 'Active' : 'Inactive'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PhotoGallery 
            gallery={proData?.gallery} 
            onUpdate={handleGalleryUpdate}
          />
          <ReviewList proId={proData?.id} />
        </div>
      </div>
    </div>
  );
};

export default ProDashboard;