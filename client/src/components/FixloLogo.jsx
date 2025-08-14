// src/components/FixloLogo.jsx
import React from 'react';

const FixloLogo = () => (
  <svg width="300" height="90" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#667eea', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#764ba2', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    
    {/* Background rounded rectangle */}
    <rect x="2" y="8" width="44" height="44" rx="8" ry="8" fill="url(#logoGradient)" stroke="#fff" strokeWidth="2" />
    
    {/* Tool icon (wrench + hammer) */}
    <g transform="translate(24, 30)">
      {/* Wrench */}
      <path d="M-12,-10 L-8,-6 L-4,-10 L-2,-8 L2,-4 L0,-2 L-4,-6 L-8,-2 L-12,-6 Z" fill="white" opacity="0.9"/>
      {/* Hammer */}
      <path d="M4,-8 L8,-4 L12,-8 L10,-10 L6,-6 L8,-4 L4,-8 Z" fill="white" opacity="0.9"/>
      {/* Handle */}
      <rect x="-1" y="-2" width="2" height="12" fill="white" opacity="0.8"/>
    </g>

    {/* Text "Fixlo" */}
    <text x="55" y="35" fontFamily="Arial, sans-serif" fontSize="36" fontWeight="bold" fill="#667eea">
      Fixlo
    </text>
  </svg>
);

export default FixloLogo;