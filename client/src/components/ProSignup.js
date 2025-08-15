import React, { useState } from 'react';
import axios from 'axios';
import { ReactComponent as FixloLogo } from '../assets/brand/fixlo-logo.svg';

const ProSignup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    trade: '',
    location: '',
    dob: '',
    termsConsent: false,
    smsConsent: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const trades = [
    'plumbing',
    'electrical',
    'landscaping',
    'cleaning',
    'junk_removal',
    'handyman',
    'hvac',
    'painting',
    'roofing',
    'flooring',
    'carpentry',
    'appliance_repair'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone || !formData.trade || !formData.location || !formData.dob) {
      setError('All required fields must be filled out.');
      setLoading(false);
      return;
    }

    // Validate terms consent
    if (!formData.termsConsent) {
      setError('You must agree to the Terms of Service and Privacy Policy.');
      setLoading(false);
      return;
    }

    // Validate SMS consent
    if (!formData.smsConsent) {
      setError('SMS consent is required.');
      setLoading(false);
      return;
    }

    // Validate age (18+)
    const birthDate = new Date(formData.dob);
    const today = new Date();
    const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
    
    if (age < 18) {
      setError('You must be 18 or older to join Fixlo as a professional.');
      setLoading(false);
      return;
    }

    try {
      console.log('Submitting professional signup:', formData);
      
      // Use relative URL for production safety (leverages Vercel rewrite)
      const apiUrl = '/api/pro-signup';
      
      let response;
      try {
        response = await axios.post(apiUrl, formData, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000 // 30 second timeout
        });
      } catch (primaryError) {
        console.warn('Primary API call failed:', primaryError);
        
        // If we get a 405 error, try the backend directly as fallback
        if (primaryError.response?.status === 405 && window.location.hostname !== 'localhost') {
          console.log('🔄 Trying backend directly as fallback...');
          response = await axios.post('https://fixloapp.onrender.com/api/pro-signup', formData, {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 30000 // 30 second timeout
          });
        } else {
          throw primaryError;
        }
      }
      
      console.log('Signup response:', response.data);
      
      // Redirect to Stripe payment page
      if (response.data.paymentUrl) {
        console.log('Redirecting to payment:', response.data.paymentUrl);
        window.location.href = response.data.paymentUrl;
      } else {
        // Fallback: redirect to success page
        window.location.href = '/payment-success.html';
      }
    } catch (error) {
      console.error('Signup error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.status === 405) {
        errorMessage = 'Service temporarily unavailable. Our team has been notified. Please try again in a few minutes.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your internet connection and try again.';
      } else if (error.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <FixloLogo
          aria-label="Fixlo"
          className="fixlo-logo mx-auto"
        />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Join as a Professional
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <a
            href="/pro/signin"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            sign in to your existing account
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address *
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <div className="mt-1">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="trade" className="block text-sm font-medium text-gray-700">
                Trade/Service *
              </label>
              <div className="mt-1">
                <select
                  id="trade"
                  name="trade"
                  required
                  value={formData.trade}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select your trade</option>
                  {trades.map((trade) => (
                    <option key={trade} value={trade}>
                      {trade.charAt(0).toUpperCase() + trade.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Service Location (City, State) *
              </label>
              <div className="mt-1">
                <input
                  id="location"
                  name="location"
                  type="text"
                  required
                  placeholder="e.g., New York, NY"
                  value={formData.location}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700">
                Date of Birth *
              </label>
              <div className="mt-1">
                <input
                  id="dob"
                  name="dob"
                  type="date"
                  required
                  value={formData.dob}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">Must be 18 or older</p>
            </div>

            {/* Terms and Conditions Agreement */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="termsConsent"
                  name="termsConsent"
                  type="checkbox"
                  required
                  checked={formData.termsConsent}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="termsConsent" className="text-gray-700">
                  By signing up, you agree to our{' '}
                  <a
                    href="/terms.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a
                    href="/privacy.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    Privacy Policy
                  </a>
                  . Background check and monthly subscription required.
                </label>
              </div>
            </div>

            {/* SMS Consent */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="smsConsent"
                  name="smsConsent"
                  type="checkbox"
                  required
                  checked={formData.smsConsent}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="smsConsent" className="text-gray-700">
                  I consent to receive SMS updates related to job leads and service updates. *
                  <br />
                  <span className="text-xs text-gray-500">Reply STOP to unsubscribe.</span>
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
              >
                {loading ? 'Processing...' : 'Continue to Payment'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-gray-600 hover:text-gray-500"
            >
              ← Back to home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProSignup;