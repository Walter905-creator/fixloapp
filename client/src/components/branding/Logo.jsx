import React from 'react';

export default function Logo({ width = 160 }) {
  // Gradient text "FIXLO", with screw for I and hammer for L, subtle network grid background
  // Scales crisply (pure SVG).
  return (
    <svg width={width} viewBox="0 0 680 160" role="img" aria-label="Fixlo">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="#833ab4" offset="0%"/>
          <stop stopColor="#fd1d1d" offset="50%"/>
          <stop stopColor="#fcb045" offset="100%"/>
        </linearGradient>
        <pattern id="mesh" width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 0L12 0M0 0L0 12" stroke="rgba(0,0,0,0.06)" strokeWidth="0.7"/>
        </pattern>
        <clipPath id="clip">
          <rect x="0" y="0" width="680" height="160" rx="16"/>
        </clipPath>
      </defs>

      <rect x="0" y="0" width="680" height="160" fill="white" clipPath="url(#clip)"/>
      <rect x="0" y="0" width="680" height="160" fill="url(#mesh)" clipPath="url(#clip)"/>

      {/* F */}
      <text x="40" y="110" fontFamily="Inter, ui-sans-serif, system-ui" fontWeight="800" fontSize="96" fill="url(#g)">F</text>

      {/* I as screw */}
      <g transform="translate(115,28)">
        <rect x="18" y="18" width="12" height="86" rx="6" fill="url(#g)"/>
        <circle cx="24" cy="16" r="12" fill="url(#g)"/>
        <path d="M16 16 L32 16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <path d="M20 12 L28 20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </g>

      {/* X */}
      <text x="160" y="110" fontFamily="Inter, ui-sans-serif, system-ui" fontWeight="800" fontSize="96" fill="url(#g)">X</text>

      {/* L as hammer */}
      <g transform="translate(250,20)">
        <path d="M10 18 h45 a6 6 0 0 1 6 6 v8 h-20 v-4 h-31 z" fill="url(#g)"/>
        <rect x="25" y="32" width="12" height="88" rx="6" fill="url(#g)"/>
      </g>

      {/* O */}
      <text x="320" y="110" fontFamily="Inter, ui-sans-serif, system-ui" fontWeight="800" fontSize="96" fill="url(#g)">O</text>

      {/* wordmark extension "Fixlo" to balanced width */}
      <text x="410" y="110" fontFamily="Inter, ui-sans-serif, system-ui" fontWeight="700" fontSize="32" fill="#333">Home Services</text>
    </svg>
  );
}