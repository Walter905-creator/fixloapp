// src/components/HomePage.js
import React from 'react';
import UrgencyPopup from './UrgencyPopup';
import ExitIntentModal from './ExitIntentModal';
import StickyCTA from './StickyCTA';
import ServiceSelector from './ServiceSelector';

function HomePage() {
  return (
    <>
      <UrgencyPopup />
      <ExitIntentModal />
      <StickyCTA />
      <div className="app">
        <header className="header">
          <img src="/assets/fixlo-logo.png" alt="Fixlo Logo" className="logo" />
          <h1>Welcome to Fixlo</h1>
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
            ✅ Latest Build: {process.env.REACT_APP_BUILD_ID || 'dev'} | {new Date().toLocaleString()}
          </div>
        </header>

        <section className="services">
          <h2>Select a Service</h2>
          <ServiceSelector />
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