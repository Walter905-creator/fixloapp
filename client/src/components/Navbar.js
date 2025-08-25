import React from 'react';
import { Link } from 'react-router-dom';
import { BUILD_STAMP } from '../utils/buildInfo';

export default function Navbar() {
  return (
    <header className="w-full" style={{borderBottom:'1px solid #e5e7eb'}}>
      <div className="container" style={{height:'64px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <Link to="/" className="flex items-center gap-2">
          <img 
            src={`/assets/brand/fixlo-logo-2025.svg?v=${BUILD_STAMP}`} 
            alt="Fixlo logo" 
            style={{height:'32px'}}
          />
          <span style={{fontWeight:600}}>Fixlo</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link to="/services">Home&nbsp;Services</Link>
          <Link to="/signup" className="btn btn-primary">Sign up</Link>
          <Link to="/pro/signup" className="btn">Pro signup</Link>
          <Link to="/pro/gallery" className="btn">Pro gallery</Link>
        </nav>
      </div>
    </header>
  );
}