import React from 'react';
 copilot/fix-a7d5aeac-2da4-468f-9787-62ac277d583a
import logo from '../assets/brand/fixlo-logo-primary.png';

import { ReactComponent as FixloLogo } from '../assets/brand/fixlo-logo.svg';
 main

function Header() {
  return (
    <header style={{
      padding: '1rem',
      background: '#fff',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      position: 'fixed',
      width: '100%',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
 copilot/fix-a7d5aeac-2da4-468f-9787-62ac277d583a
          <img 
            src={logo} 
            alt="Fixlo Logo" 
            style={{ height: '32px', width: 'auto' }}
          />
          <span style={{
            fontSize: '1.8rem',
            fontWeight: '700',
            color: '#667eea'
          }}>
            Fixlo
          </span>

          <FixloLogo aria-label="Fixlo" className="fixlo-logo" />
 main
        </div>
        
        <nav>
          <ul style={{
            display: 'flex',
            gap: '30px',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            alignItems: 'center'
          }}>
            <li><a href="#home" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>Home</a></li>
            <li><a href="/terms" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>Terms</a></li>
            <li><a href="#pricing" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>Subscribe</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;
