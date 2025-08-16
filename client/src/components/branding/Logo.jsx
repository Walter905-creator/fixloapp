import React from 'react';

export default function Logo({ width = 160 }) {
  return (
    <img
      src="/brand/fixlo-logo-2025.svg"
      alt="Fixlo"
      width={width}
      style={{ height: 'auto' }}
    />
  );
}