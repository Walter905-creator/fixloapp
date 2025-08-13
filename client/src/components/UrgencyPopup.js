import React, { useEffect, useState } from 'react';
import geolocationService from '../utils/geolocationService';

export default function UrgencyPopup() {
  const [show, setShow] = useState(false);
  const [city, setCity] = useState('Charlotte');
  const [state, setState] = useState('NC');

  useEffect(() => {
    // Disable intrusive urgency popup for better UX
    // This was identified as unwanted "SMS campaign" style messaging
    
    // Keep the location detection code but don't show the popup
    const getUserLocation = async () => {
      if (!geolocationService.isGeolocationSupported()) {
        return;
      }

      // Check if we should request location (not denied)
      const shouldRequest = await geolocationService.shouldRequestLocation();
      if (!shouldRequest) {
        return;
      }

      try {
        const result = await geolocationService.getCurrentLocationWithAddress();
        const locationName = result.addressDetails.city || 
                            result.addressDetails.town || 
                            result.addressDetails.village || 
                            result.addressDetails.county || 
                            'your area';
        setCity(locationName);
      } catch (error) {
        // Handle geolocation errors gracefully - keep default "your area"
      }
    };

    getUserLocation();
    // Disabled popup timer for better UX
    // const timer = setTimeout(() => setShow(true), 5000);
    // return () => clearTimeout(timer);
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
      🚨 Limited professional spots available in {city}!<br />
      <strong>Join Fixlo's trusted network</strong> to serve your community.
      {city && (
        <div style={{ fontSize: '14px', color: '#ffcccc', marginTop: '8px' }}>
          Connect with homeowners in <strong>{city}</strong> who need your expertise.
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
