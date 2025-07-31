import React, { useEffect, useState } from 'react';

export default function UrgencyPopup() {
  const [show, setShow] = useState(false);
  const [city, setCity] = useState('your city');

  useEffect(() => {
    fetch('/api/ipinfo')
      .then(res => res.json())
      .then(data => setCity(data.city || 'your city'));

    const timer = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '20px', right: '20px',
      background: '#ff4444', color: 'white', padding: '16px',
      borderRadius: '12px', zIndex: 9999
    }}>
      🚨 Only 14 pro spots left in {city}!<br />
      <strong>Join Fixlo now</strong> to claim your area.
    </div>
  );
}
