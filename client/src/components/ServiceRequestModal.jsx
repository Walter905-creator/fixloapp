import React, { useState, useEffect, useRef } from 'react';
import geolocationService from '../utils/geolocationService';

export default function ServiceRequestModal({ service, onClose }) {
  const [submitted, setSubmitted] = useState(false);
  const [optIn, setOptIn] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', description: '' });
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  // Handle modal animation and focus management
  useEffect(() => {
    // Clear any previous location error when modal opens
    setLocationError(null);
    
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    
    // Focus first input when modal opens
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }

    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleEscape);
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      clearTimeout(timer);
    };
  }, []);

  // Handle closing with animation
  const handleClose = () => {
    setIsVisible(false);
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      onClose();
    }, 200);
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!optIn) {
      alert("Please opt in to receive SMS updates.");
      return;
    }

    if (!form.address.trim()) {
      alert("Please provide your address or ZIP code so we can find nearby professionals.");
      return;
    }

    try {
      // Use environment variable for API URL, with better fallback handling
      const API_BASE = process.env.REACT_APP_API_URL || 
                      (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://fixloapp.onrender.com');
      
      console.log('Submitting service request to:', `${API_BASE}/api/service-request`);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const res = await fetch(`${API_BASE}/api/service-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          serviceType: service.name,
          name: form.name,
          phone: form.phone,
          email: form.email || '',
          address: form.address,
          description: form.description,
          urgency: 'medium'
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (res.ok) {
        setSubmitted(true);
        console.log('Service request submitted successfully');
      } else {
        const errorText = await res.text();
        console.error('Server error response:', errorText);
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err) {
      console.error("Error submitting form", err);
      if (err.name === 'AbortError') {
        alert("Request timed out. Please check your connection and try again.");
      } else {
        alert("There was an error submitting your request. Please try again or contact support.");
      }
    }
  };

  const getCurrentLocation = async () => {
    if (!geolocationService.isGeolocationSupported()) {
      const message = geolocationService.getErrorMessage({ message: 'GEOLOCATION_NOT_SUPPORTED' });
      setLocationError(message);
      return;
    }

    // Check permission status first
    const shouldRequest = await geolocationService.shouldRequestLocation();
    if (!shouldRequest) {
      const message = 'Location access not available. Please enter your address manually.';
      setLocationError(message);
      return;
    }

    setGettingLocation(true);
    setLocationError(null); // Clear any previous error when starting location request
    
    try {
      console.log('🗺️ Getting current location with address...');
      const result = await geolocationService.getCurrentLocationWithAddress();
      
      // Format the address for the form
      const address = result.addressDetails;
      const formattedAddress = `${address.house_number || ''} ${address.road || ''}, ${address.city || address.town || ''}, ${address.state || ''} ${address.postcode || ''}`.trim().replace(/^,\s*/, '');
      
      setForm({ ...form, address: formattedAddress });
      setLocationError(null); // Clear error on successful location get
      console.log(`✅ Location set: ${formattedAddress}`);
      
    } catch (error) {
      console.error('❌ Location error:', error);
      const message = geolocationService.getErrorMessage(error);
      setLocationError(message);
      // Remove intrusive alert - just show in UI
    } finally {
      setGettingLocation(false);
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 bg-black transition-opacity duration-200 flex items-center justify-center px-4 ${
        isVisible ? 'bg-opacity-50' : 'bg-opacity-0'
      }`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className={`bg-white p-6 rounded-lg max-w-md w-full shadow-xl transform transition-all duration-200 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title" className="text-xl font-bold mb-4">Request {service.name}</h2>

        {submitted ? (
          <p className="text-green-600 text-center">
            ✅ Thanks! We received your {service.name} request.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              ref={firstInputRef}
              type="text"
              placeholder="Your Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded"
            />
            <input
              type="tel"
              placeholder="Your Phone Number"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded"
            />
            <input
              type="email"
              placeholder="Your Email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded"
            />
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Your Address or ZIP Code"
                required
                value={form.address}
                onChange={(e) => {
                  setForm({ ...form, address: e.target.value });
                  // Clear location error when user starts typing manually
                  if (locationError) {
                    setLocationError(null);
                  }
                }}
                className="w-full border border-gray-300 p-2 rounded"
              />
              {locationError && (
                <div className="text-red-600 text-sm">
                  ⚠️ {locationError}
                </div>
              )}
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                {gettingLocation ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Getting your location...
                  </>
                ) : (
                  <>
                    📍 Use My Current Location
                  </>
                )}
              </button>
              {!geolocationService.isSecureContext() && (
                <div className="text-amber-600 text-xs">
                  ⚠️ Location services work best on secure (HTTPS) connections
                </div>
              )}
            </div>
            <textarea
              placeholder="What do you need?"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded"
            />
            <label className="text-sm flex items-center space-x-2">
              <input
                type="checkbox"
                checked={optIn}
                onChange={(e) => setOptIn(e.target.checked)}
              />
              <span>
                I agree to receive SMS updates about my request. Reply STOP to unsubscribe.
              </span>
            </label>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
            >
              Submit Request
            </button>
          </form>
        )}

        <button
          onClick={handleClose}
          className="text-sm text-gray-600 mt-4 block mx-auto hover:text-gray-800 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
