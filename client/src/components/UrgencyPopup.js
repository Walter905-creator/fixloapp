import React, { useEffect, useState } from 'react';
import geolocationService from '../utils/geolocationService';

export default function UrgencyPopup() {
  const [show, setShow] = useState(false);
  const [city, setCity] = useState('Charlotte');
  const [state, setState] = useState('NC');

  useEffect(() => {
    // Get user's location to personalize the message
    const getUserLocation = async () => {
      if (geolocationService.isGeolocationSupported()) {
        try {
          console.log('🗺️ Getting location for urgency popup personalization...');
          const result = await geolocationService.getCurrentLocationWithAddress();
          const locationName = result.addressDetails.city || 
                              result.addressDetails.town || 
                              result.addressDetails.village || 
                              result.addressDetails.county || 
                              'your area';
          setCity(locationName);
          console.log(`✅ Urgency popup personalized for: ${locationName}`);
        } catch (error) {
          // Handle geolocation errors more gracefully
          console.warn('Geolocation failed, using fallback:', error);
          setCity('Charlotte'); // fallback default
          setState('NC');
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
      {city && (
        <div style={{ fontSize: '14px', color: '#ffcccc', marginTop: '8px' }}>
          Homeowners in <strong>{city}</strong> need your service!
        </div>
      )}
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
