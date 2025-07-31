import React, { useEffect, useState } from 'react';

export default function UrgencyPopup() {
  const [show, setShow] = useState(false);
  const [city, setCity] = useState('your area');

  useEffect(() => {
    // Use a static fallback instead of external API to avoid CORS issues
    setCity('your area');

    const timer = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '20px', right: '20px',
      background: '#ff4444', color: 'white', padding: '16px',
      borderRadius: '12px', zIndex: 9999, maxWidth: '300px'
    }}>
      🚨 Only 14 pro spots left in {city}!<br />
      <strong>Join Fixlo now</strong> to claim your area.
      <button 
        onClick={() => setShow(false)}
        style={{
          float: 'right', background: 'none', border: 'none', 
          color: 'white', cursor: 'pointer', fontSize: '16px',
          marginTop: '-10px'
        }}
      >
        ×
      </button>
    </div>
  );
}