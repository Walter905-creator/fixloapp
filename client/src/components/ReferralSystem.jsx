import React, { useState } from 'react';

export default function ReferralSystem() {
  const [referralCode, setReferralCode] = useState('FIXLO-REF-' + Math.random().toString(36).substr(2, 6).toUpperCase());
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const referralUrl = `https://www.fixloapp.com/?ref=${referralCode}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleSendReferral = async (e) => {
    e.preventDefault();
    // Here you would typically send the referral email
    console.log('Sending referral to:', email);
    alert('Referral sent successfully!');
    setEmail('');
    setShowModal(false);
  };

  return (
    <>
      {/* Referral Button - can be placed anywhere */}
      <button
        onClick={() => setShowModal(true)}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors duration-200 flex items-center space-x-2"
      >
        <span>💰</span>
        <span>Refer Friends & Get 1 Month Free</span>
      </button>

      {/* Referral Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">💰 Refer Friends & Get 1 Month Free</h2>
              <p className="text-gray-600">
                Get 1 month of Fixlo Pro free when your friend joins as a professional!
              </p>
            </div>

            <div className="space-y-4">
              {/* Referral Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Referral Code
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={referralCode}
                    readOnly
                    className="flex-1 border border-gray-300 rounded-l px-3 py-2 bg-gray-50"
                  />
                  <button
                    onClick={handleCopyCode}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r transition-colors"
                  >
                    {copySuccess ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Referral URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Referral Link
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={referralUrl}
                    readOnly
                    className="flex-1 border border-gray-300 rounded-l px-3 py-2 bg-gray-50 text-sm"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r transition-colors"
                  >
                    {copySuccess ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Send Referral */}
              <form onSubmit={handleSendReferral} className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Send Referral Directly
                </label>
                <input
                  type="email"
                  placeholder="Friend's email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded transition-colors"
                >
                  Send Referral Email
                </button>
              </form>

              {/* How it works */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Share your referral code or link</li>
                  <li>• Friend signs up as a Fixlo professional</li>
                  <li>• They complete their first paid job</li>
                  <li>• You both get 1 month of Fixlo Pro free!</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-6 w-full text-gray-600 hover:text-gray-800 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}