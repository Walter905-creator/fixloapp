// src/components/HomePage.js
import React from 'react';
import UrgencyPopup from './UrgencyPopup';
import ExitIntentModal from './ExitIntentModal';
import StickyCTA from './StickyCTA';
import ServiceSelector from './ServiceSelector';
import { ReactComponent as FixloLogo } from '../assets/brand/fixlo-logo.svg';

function HomePage() {
  return (
    <>
      <UrgencyPopup />
      <ExitIntentModal />
      <StickyCTA />
      <div className="app">
        <header className="header">
          <img src="/assets/brand/fixlo-logo-primary.png" alt="Fixlo Logo" className="logo" />

          <FixloLogo aria-label="Fixlo" className="fixlo-logo" />
          <h1>Welcome to Fixlo 
            <span style={{
              marginLeft: '10px',
              fontSize: '12px',
              background: '#10b981',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontWeight: 'normal'
            }}>
              ✅ UPDATED
            </span>
          </h1>
          <p>Your one-stop hub for trusted professionals and home projects</p>
          <div className="build-info" style={{
            fontSize: '11px', 
            color: '#888', 
            marginTop: '8px',
            background: 'rgba(255,255,255,0.1)',
            padding: '4px 8px',
            borderRadius: '4px',
            display: 'inline-block'
          }}>
            🚀 Build: {process.env.REACT_APP_BUILD_ID || 'dev'} | {new Date().toLocaleString()}
          </div>
        </header>

        <section className="services">
          <h2>Select a Service</h2>
          <ServiceSelector />
          
          {/* Homepage CTA to signup */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <a 
              href="/signup" 
              style={{
                display: 'inline-block',
                background: '#f97316',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.background = '#ea580c'}
              onMouseOut={(e) => e.target.style.background = '#f97316'}
            >
              🧰 Join Fixlo Now – Claim Your Area
            </a>
          </div>
        </section>

        <footer className="footer">
          <p>&copy; {new Date().getFullYear()} Fixlo. All rights reserved.</p>
          <div className="version-info" style={{
            fontSize: '10px', 
            color: '#666', 
            marginTop: '8px',
            textAlign: 'center'
          }}>
            Build: {process.env.REACT_APP_BUILD_ID || 'dev'} | Updated: {new Date().toLocaleString()}
          </div>
        </footer>
      </div>
    </>
  );
}

export default HomePage;