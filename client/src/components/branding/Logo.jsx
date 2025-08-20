import React from 'react';
import logo from '../../assets/logo.svg';

export default function Logo({ width = 160 }) {
  return (
    <img
      src={logo}
      alt="Fixlo"
      width={width}
      style={{ height: 'auto' }}
    />
  );
}