import React from 'react';

export default function StickyCTA() {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#28a745', color: 'white', padding: '12px',
      textAlign: 'center', zIndex: 9998, fontSize: '16px',
      borderTop: '2px solid #fff'
    }}>
      🏠 Ready to connect with customers in your area? <a 
        href="/signup" 
        style={{ 
          color: '#00ffcc', 
          textDecoration: 'none', 
          fontWeight: 'bold',
          marginLeft: '8px'
        }}
      >
        Join Fixlo's Professional Network →
      </a>
    </div>
  );
}