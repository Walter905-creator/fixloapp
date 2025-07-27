import React from 'react';

export const Card = ({ children, className = "", ...props }) => {
  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardContent = ({ children, className = "", ...props }) => {
  return (
    <div 
      className={`p-6 ${className}`}
      style={{
        padding: '1.5rem',
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
};