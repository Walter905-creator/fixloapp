import React, { useState } from 'react';

export default function ServiceRequestModal({ service, onClose }) {
  const [submitted, setSubmitted] = useState(false);
  const [optIn, setOptIn] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', description: '' });
  const [gettingLocation, setGettingLocation] = useState(false);

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
      const res = await fetch('https://fixloapp.onrender.com/api/homeowner-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, service: service.name })
      });
      if (res.ok) setSubmitted(true);
    } catch (err) {
      console.error("Error submitting form", err);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use reverse geocoding to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'Fixlo-App/1.0 (https://www.fixloapp.com)'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            const address = data.address;
            const formattedAddress = `${address.house_number || ''} ${address.road || ''}, ${address.city || address.town || ''}, ${address.state || ''} ${address.postcode || ''}`.trim().replace(/^,\s*/, '');
            
            setForm({ ...form, address: formattedAddress });
          } else {
            alert("Could not get your address automatically. Please enter it manually.");
          }
        } catch (error) {
          console.error("Error getting address:", error);
          alert("Could not get your address automatically. Please enter it manually.");
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        setGettingLocation(false);
        let message = "Could not get your location. Please enter your address manually.";
        
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location access denied. Please enter your address manually.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Location information unavailable. Please enter your address manually.";
        }
        
        alert(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-xl">
        <h2 className="text-xl font-bold mb-4">Request {service.name}</h2>

        {submitted ? (
          <p className="text-green-600 text-center">
            ✅ Thanks! We received your {service.name} request.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
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
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Your Address or ZIP Code"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full border border-gray-300 p-2 rounded"
              />
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
          onClick={onClose}
          className="text-sm text-gray-600 mt-4 block mx-auto"
        >
          Close
        </button>
      </div>
    </div>
  );
}
