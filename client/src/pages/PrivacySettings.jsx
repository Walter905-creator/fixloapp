import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * Privacy Settings Page
 * Allows users to manage their privacy preferences and data rights
 */
const PrivacySettings = () => {
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState('pro');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'https://fixloapp.onrender.com';

  const handleDataAccess = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/privacy/data-access-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userType })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Data access request successful. Check your console for the data.',
          data: data.data
        });
        console.log('Your Data:', data.data);
      } else {
        setError(data.error || 'Failed to access data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDataExport = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/privacy/data-export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userType, format: 'json' })
      });

      const data = await response.json();

      if (response.ok) {
        // Download the data as a JSON file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fixlo-data-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        setMessage({
          type: 'success',
          text: 'Data exported successfully! Your file is downloading.'
        });
      } else {
        setError(data.error || 'Failed to export data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDataDeletion = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/privacy/data-deletion-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userType, confirmDeletion: true })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: data.message || 'Data deletion request processed successfully.'
        });
        setShowConfirmDelete(false);
      } else {
        setError(data.error || 'Failed to delete data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4">
      <Helmet>
        <title>Privacy Settings | Fixlo</title>
        <meta name="description" content="Manage your privacy settings and data rights on Fixlo" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Privacy Settings</h1>
        <p className="text-gray-400 mb-8">
          Exercise your data rights under GDPR and CCPA. Access, export, or delete your personal information.
        </p>

        {/* Account Information Form */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Your Account Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Account Type</label>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="pro">Professional</option>
                <option value="homeowner">Homeowner</option>
              </select>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-900 text-green-100' : 'bg-blue-900 text-blue-100'}`}>
            <p>{message.text}</p>
            {message.data && (
              <p className="mt-2 text-sm">Data has been logged to the console for your review.</p>
            )}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-900 text-red-100">
            <p>{error}</p>
          </div>
        )}

        {/* Data Rights Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Access Your Data */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">🔍</span>
              <h3 className="text-xl font-semibold">Access Your Data</h3>
            </div>
            <p className="text-gray-400 mb-4">
              View all personal information we have collected about you.
            </p>
            <button
              onClick={handleDataAccess}
              disabled={loading || !email}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition"
            >
              {loading ? 'Processing...' : 'Access My Data'}
            </button>
          </div>

          {/* Export Your Data */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">📥</span>
              <h3 className="text-xl font-semibold">Export Your Data</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Download a copy of your data in portable JSON format.
            </p>
            <button
              onClick={handleDataExport}
              disabled={loading || !email}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition"
            >
              {loading ? 'Processing...' : 'Export My Data'}
            </button>
          </div>
        </div>

        {/* Delete Your Data */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <span className="text-3xl mr-3">🗑️</span>
            <h3 className="text-xl font-semibold">Delete Your Data</h3>
          </div>
          <p className="text-gray-400 mb-4">
            Request permanent deletion of your personal information. This action is irreversible.
          </p>
          
          {!showConfirmDelete ? (
            <button
              onClick={() => setShowConfirmDelete(true)}
              disabled={loading || !email}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition"
            >
              Request Data Deletion
            </button>
          ) : (
            <div className="border border-red-600 rounded-lg p-4 bg-red-900/20">
              <p className="text-red-300 mb-4 font-semibold">
                ⚠️ Warning: This action cannot be undone. Are you sure you want to delete all your data?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDataDeletion}
                  disabled={loading}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg transition"
                >
                  {loading ? 'Processing...' : 'Yes, Delete My Data'}
                </button>
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  disabled={loading}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Additional Information */}
        <div className="mt-8 p-6 bg-gray-800 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Your Privacy Rights</h3>
          <ul className="space-y-2 text-gray-400">
            <li>✓ <strong>Right to Access:</strong> You can request access to your personal data</li>
            <li>✓ <strong>Right to Portability:</strong> You can export your data in a portable format</li>
            <li>✓ <strong>Right to Deletion:</strong> You can request deletion of your personal data</li>
            <li>✓ <strong>Right to Correction:</strong> You can update inaccurate information in your account settings</li>
            <li>✓ <strong>Right to Object:</strong> You can object to certain types of data processing</li>
          </ul>
          
          <p className="mt-4 text-sm text-gray-500">
            For more information about how we handle your data, please read our{' '}
            <a href="/privacy" className="text-purple-400 hover:text-purple-300 underline">
              Privacy Policy
            </a>.
            If you have questions, contact us at{' '}
            <a href="mailto:pro4u.improvements@gmail.com" className="text-purple-400 hover:text-purple-300 underline">
              pro4u.improvements@gmail.com
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
