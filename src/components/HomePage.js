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
        </header>

        <section className="services">
          <h2>Select a Service</h2>
          <ServiceSelector />
        </section>

        <footer className="footer">
          <p>&copy; {new Date().getFullYear()} Fixlo. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}

export default HomePage;