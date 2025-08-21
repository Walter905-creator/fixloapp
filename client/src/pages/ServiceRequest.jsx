import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';

export default function ServiceRequest() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    trade: '',
    address: '',
    description: '',
    smsConsent: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const services = [
    { id: 'plumbing', name: 'Plumbing' },
    { id: 'electrical', name: 'Electrical' },
    { id: 'hvac', name: 'HVAC' },
    { id: 'carpentry', name: 'Carpentry' },
    { id: 'painting', name: 'Painting' },
    { id: 'roofing', name: 'Roofing' },
    { id: 'cleaning', name: 'House Cleaning' },
    { id: 'junk_removal', name: 'Junk Removal' },
    { id: 'landscaping', name: 'Landscaping' },
    { id: 'handyman', name: 'Handyman' },
    { id: 'flooring', name: 'Flooring' },
    { id: 'appliance_repair', name: 'Appliance Repair' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  async function submitLead(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Immediately show confirmation UI once the API 200s
      const payload = { 
        name: formData.name, 
        email: formData.email, 
        phone: formData.phone, 
        trade: formData.trade, 
        address: formData.address, 
        description: formData.description 
      };
      
      const res = await fetch('/api/homeowner-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || 'Submission failed');
      }

      setSubmitted(true); // ← flip your local UI to confirmation
      // Optionally clear the form:
      // setFormData({ name: '', email: '', phone: '', trade: '', address: '', description: '', smsConsent: false });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Request Service - Fixlo</title>
        <meta 
          name="description" 
          content="Request home service professionals in your area. Get connected with verified experts for plumbing, electrical, HVAC, and more." 
        />
        <link rel="canonical" href="https://www.fixloapp.com/request-service" />
      </Helmet>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Request Service</h1>
          <p className="text-xl text-gray-600">
            Connect with verified professionals in your area
          </p>
        </div>

        {submitted ? (
          <div className="p-6 rounded-xl bg-green-50 border border-green-200">
            <h3 className="text-xl font-semibold mb-2">We received your request 🎉</h3>
            <p className="text-slate-600">
              Nearby <strong>{formData.trade}</strong> pros (within ~30 miles) are being notified right now.
              We'll update you as soon as someone accepts.
            </p>
            <div className="mt-4">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', phone: '', trade: '', address: '', description: '', smsConsent: false });
                }}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submitLead} className="space-y-6">
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label htmlFor="trade" className="block text-sm font-medium text-gray-700 mb-2">
                Service Type *
              </label>
              <select
                id="trade"
                name="trade"
                value={formData.trade}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a service type</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Service Address *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter the service address"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Project Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your project and what you need help with"
              />
            </div>

            <div>
              <label className="inline-flex items-start gap-2">
                <input
                  type="checkbox"
                  name="smsConsent"
                  checked={formData.smsConsent}
                  onChange={handleChange}
                />
                <span className="text-sm text-slate-600">
                  I expressly consent to receive automated SMS text messages from Fixlo.
                  Msg & data rates may apply. Reply STOP to opt out, HELP for help. Up to 20 msgs/mo.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting...' : 'Request Service'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              By submitting this form, you agree to our{' '}
              <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>{' '}
              and{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}