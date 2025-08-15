import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginModal from './LoginModal';
import UploadWork from './UploadWork';
import ProReviews from './ProReviews';
import ProUpload from './ProUpload';
import ShareProfileModal from './share/ShareProfileModal';
import Badges from './profile/Badges';
import BoostPill from './profile/BoostPill';
import api from '../lib/api';
import { ReactComponent as FixloLogo } from '../assets/brand/fixlo-logo.svg';

const ProDashboard = () => {
  const [professional, setProfessional] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [stats, setStats] = useState({ 
    clicksLast30: 0, 
    byMedium: {}, 
    boostActiveUntil: null, 
    badges: [] 
  });
  const navigate = useNavigate();

  const loadShareStats = async () => {
    if (!professional?._id) return;
    
    try {
      const { data } = await api.get(`/api/profiles/${professional._id}/share-stats`);
      if (data?.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load share stats:', error);
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('proToken');
    const proData = localStorage.getItem('proData');
    
    if (token && proData) {
      try {
        const parsedPro = JSON.parse(proData);
        setProfessional(parsedPro);
      } catch (error) {
        // If data is corrupted, remove it
        localStorage.removeItem('proToken');
        localStorage.removeItem('proData');
      }
    }
    setLoading(false);
  }, []);

  // Load share stats when professional data is available
  useEffect(() => {
    if (professional?._id) {
      loadShareStats();
    }
  }, [professional]);

  const handleLogin = (proData) => {
    setProfessional(proData);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('proToken');
    localStorage.removeItem('proData');
    setProfessional(null);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <img 
            src="/assets/brand/fixlo-logo-primary.png" 
            alt="Fixlo Logo" 
            className="mx-auto mb-6 h-16 w-auto"
          />

          <FixloLogo 
            aria-label="Fixlo"
            className="fixlo-logo mx-auto mb-6"
          />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Professional Dashboard
          </h1>
          <p className="text-gray-600 mb-6">
            Sign in to access your professional dashboard and manage your work portfolio.
          </p>
          <button
            onClick={() => setShowLoginModal(true)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Sign In / Sign Up
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full mt-3 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Back to Home
          </button>
        </div>

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
        />
      </div>
    );
  }

  const tabButtons = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'upload', label: 'Upload Work', icon: '📸' },
    { id: 'reviews', label: 'Reviews', icon: '⭐' },
    { id: 'profile', label: 'Profile', icon: '👤' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img 
                src="/assets/brand/fixlo-logo-primary.png" 
                alt="Fixlo Logo" 
                className="h-8 w-auto mr-4"
              />

              <FixloLogo 
                aria-label="Fixlo"
                className="fixlo-logo mr-4"
              />
              <h1 className="text-xl font-semibold text-gray-800">
                Professional Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {professional.name}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {tabButtons.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {activeTab === 'overview' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
                  <div className="flex items-center gap-2">
                    <BoostPill boostActiveUntil={stats.boostActiveUntil} />
                    <Badges badges={stats.badges} />
                  </div>
                </div>
                <button 
                  onClick={() => setShowShare(true)} 
                  className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 transition-opacity"
                >
                  Share My Profile
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Rating</h3>
                  <div className="text-3xl font-bold text-blue-600">
                    {professional.rating || 0}/5
                  </div>
                  <p className="text-sm text-blue-600">
                    Based on {professional.reviewCount || 0} reviews
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Services</h3>
                  <div className="text-3xl font-bold text-green-600">
                    {professional.services?.length || 0}
                  </div>
                  <p className="text-sm text-green-600">Active services</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-800 mb-2">Location</h3>
                  <div className="text-lg font-bold text-purple-600">
                    {professional.location || 'Not set'}
                  </div>
                </div>
              </div>

              {/* Share Performance Section */}
              <div className="border border-gray-200 rounded-2xl p-4 mb-6">
                <div className="font-medium mb-2">Share Performance (Last 30 Days)</div>
                <div className="text-sm text-gray-700 mb-2">
                  Total clicks: <b>{stats.clicksLast30}</b>
                </div>
                {Object.keys(stats.byMedium).length > 0 && (
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="font-medium">By platform:</div>
                    {Object.entries(stats.byMedium).map(([platform, count]) => (
                      <div key={platform} className="flex justify-between">
                        <span className="capitalize">{platform}:</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                )}
                {stats.clicksLast30 === 0 && (
                  <div className="text-xs text-gray-500 italic">
                    No shares yet. Click "Share My Profile" to start earning boosts!
                  </div>
                )}
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Upload New Work
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    View Reviews
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'upload' && <UploadWork professional={professional} />}
          
          {activeTab === 'reviews' && <ProReviews professional={professional} />}
          
          {activeTab === 'profile' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile Information</h2>
              
              {/* Profile Photo Section */}
              <div className="mb-8 flex items-start gap-6">
                <div className="flex-shrink-0">
                  {professional.profilePhotoUrl || professional.profileImage ? (
                    <img 
                      src={professional.profilePhotoUrl || professional.profileImage} 
                      alt="Profile" 
                      className="rounded-full w-32 h-32 object-cover border-2 border-gray-200" 
                    />
                  ) : (
                    <div className="rounded-full w-32 h-32 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-2xl">👤</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <ProUpload />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <div className="text-lg text-gray-900">{professional.name}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="text-lg text-gray-900">{professional.email}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <div className="text-lg text-gray-900">{professional.phone}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trade</label>
                  <div className="text-lg text-gray-900">{professional.trade || 'Not specified'}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Services</label>
                  <div className="flex flex-wrap gap-2">
                    {professional.services?.map((service, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        {service}
                      </span>
                    )) || <span className="text-gray-500">No services listed</span>}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <div className="text-lg text-gray-900">{professional.location || 'Not set'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Profile Modal */}
      {showShare && (
        <ShareProfileModal
          isOpen={showShare}
          onClose={() => { 
            setShowShare(false); 
            loadShareStats(); // Reload stats after sharing
          }}
          pro={professional}
          api={api}
        />
      )}
    </div>
  );
};

export default ProDashboard;