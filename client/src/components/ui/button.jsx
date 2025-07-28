import React from 'react';

export const Button = ({ children, className = "", variant = "default", ...props }) => {
  const baseStyles = {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontWeight: '500',
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s, box-shadow 0.2s',
    outline: 'none'
  };

  const variants = {
    default: {
      backgroundColor: '#3b82f6',
      color: 'white'
    },
    secondary: {
      backgroundColor: '#f3f4f6',
      color: '#374151',
      border: '1px solid #d1d5db'
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#3b82f6',
      border: '1px solid #3b82f6'
    }
  };

  return (
    <button
      className={className}
      style={{
        ...baseStyles,
        ...variants[variant],
        ...props.style
      }}
      onMouseOver={(e) => {
        if (variant === 'default') {
          e.target.style.backgroundColor = '#2563eb';
        } else if (variant === 'secondary') {
          e.target.style.backgroundColor = '#e5e7eb';
        }
      }}
      onMouseOut={(e) => {
        if (variant === 'default') {
          e.target.style.backgroundColor = '#3b82f6';
        } else if (variant === 'secondary') {
          e.target.style.backgroundColor = '#f3f4f6';
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
};