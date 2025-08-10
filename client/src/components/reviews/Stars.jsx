import React from 'react';

export default function Stars({ value = 0, size = 16, className = "" }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  
  const Star = ({ type }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      className={`inline-block align-middle ${className}`}
    >
      <path 
        d="M12 2l3 7h7l-5.5 4.1L18 21l-6-4-6 4 1.5-7.9L2 9h7z" 
        fill={type === 'empty' ? 'none' : 'currentColor'} 
        stroke="currentColor"
        strokeWidth={type === 'empty' ? 1 : 0}
      />
      {type === 'half' && (
        <defs>
          <clipPath id={`half-${Math.random()}`}>
            <rect x="0" y="0" width="12" height="24" />
          </clipPath>
        </defs>
      )}
    </svg>
  );
  
  return (
    <span className="inline-flex gap-0.5 text-amber-500">
      {[...Array(full)].map((_, i) => <Star key={`f${i}`} type="full" />)}
      {half ? <Star key="half" type="half" /> : null}
      {[...Array(empty)].map((_, i) => <Star key={`e${i}`} type="empty" />)}
    </span>
  );
}