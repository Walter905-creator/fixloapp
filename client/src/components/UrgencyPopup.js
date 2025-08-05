import React, { useEffect, useState } from 'react';

export default function UrgencyPopup() {
  const [show, setShow] = useState(false);
  const [city, setCity] = useState('your area');

  useEffect(() => {
    // Get user's location to personalize the message
    const getUserLocation = async () => {
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 300000 // Cache for 5 minutes
            });
          });

          const { latitude, longitude } = position.coords;
          
          // Use reverse geocoding to get city name
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
            const locationName = address.city || address.town || address.village || address.county || 'your area';
            setCity(locationName);
          }
        } catch (error) {
          console.log('Location detection failed, using fallback:', error);
          // Keep default "your area" if location fails
        }
      }
    };

    getUserLocation();
    const timer = setTimeout(() => setShow(true), 5000); // show popup after 5 seconds
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#ff4444',
      color: 'white',
      padding: '16px',
      borderRadius: '12px',
      zIndex: 9999,
      maxWidth: '300px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
    }}>
      🚨 Only 14 pro spots left in {city}!<br />
      <strong>Join Fixlo now</strong> to claim your area.
      <button
        onClick={() => setShow(false)}
        style={{
          float: 'right',
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontSize: '16px',
          marginTop: '-10px'
        }}
        aria-label="Close popup"
      >
        ×
      </button>
    </div>
  );
}
