import React from 'react';

export const Input = ({ className = "", ...props }) => {
  return (
    <input
      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
      style={{
        width: '100%',
        padding: '0.5rem 0.75rem',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        fontSize: '16px',
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        ...props.style
      }}
      onFocus={(e) => {
        e.target.style.borderColor = '#3b82f6';
        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        if (props.onFocus) props.onFocus(e);
      }}
      onBlur={(e) => {
        e.target.style.borderColor = '#d1d5db';
        e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
        if (props.onBlur) props.onBlur(e);
      }}
      {...props}
    />
  );
};