import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './branding/Logo';

export default function Header() {
  return (
    <header style={{display:'flex',alignItems:'center',gap:'16px',padding:'14px 18px',borderBottom:'1px solid #eee'}}>
      <Link to="/" aria-label="Fixlo Home" style={{display:'flex',alignItems:'center',gap:'10px',textDecoration:'none'}}>
        <Logo width={150} />
      </Link>
      <nav style={{marginLeft:'auto',display:'flex',gap:'16px'}}>
        <Link to="/signup">Sign Up</Link>
        {/* Do NOT alter your existing Request-a-Service buttons/popups elsewhere */}
      </nav>
    </header>
  );
}